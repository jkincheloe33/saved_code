import { CPC_STATUS, FEED_ITEM_STATUS, FEED_ITEM_TYPES, GROUP_ACCESS_LEVELS as levels, TRIGGERS, USER_NOTIFY_METHODS } from '@utils'
import { getSentimentScore } from '@serverHelpers/aws'
const { chunkDataset } = require('@serverHelpers/chunkData')
const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')
import { deleteFeedItemDraft } from '@serverHelpers/feedItemDraft/deleteFeedItemDraft'
const { getManagingGroups } = require('@serverHelpers/getManagingGroups')
const notification = require('@serverHelpers/notifications/newsfeed')
const { getUserGroups } = require('@serverHelpers/user/groups')
const { GROUP_ACCESS_LEVELS } = require('@utils/types')

import {
  sendGroupWambiFromManager_Email,
  sendGroupWambiFromTeamMember_Email,
  sendIndividualWambiFromManager_Email,
  sendIndividualWambiFromTeamMember_Email,
} from '@serverHelpers/email'
import {
  sendGroupWambiFromManager_SMS,
  sendGroupWambiFromTeamMember_SMS,
  sendIndividualWambiFromManager_SMS,
  sendIndividualWambiFromTeamMember_SMS,
} from '@serverHelpers/sms'
import { FEED_ITEM_SOURCE, removeDuplicates, USER_STATUS } from '@utils'

module.exports = {
  postWambi: async ({ authorId, clientAccount, cpcData, feedItemDraftId, isScheduled, req, scheduledAt, sentAsPeopleId }) => {
    let transaction

    try {
      const {
        host,
        id: clientAccountId,
        settings: {
          featureToggles: { notifications },
        },
      } = clientAccount

      let { content, excludedRecipients, groups = [], nominate, nominateComment, recipients = [], shareOnNewsfeed, type, values } = cpcData

      const { userGroups } = await getUserGroups({ clientAccountId, userId: authorId })

      // Run select function ahead of insert so write cluster doesn't block...CY
      let senderAndRecipients = [authorId, ...recipients.map(({ id }) => id)]

      const senderAndRecipientGroups = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT DISTINCT PG.groupId AS id
          FROM peopleGroups PG
          INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
          WHERE PG.peopleId IN (?)
        `,
        params: [senderAndRecipients],
      })

      if (groups.length) {
        const exclusionClause = excludedRecipients.length ? `AND PG.peopleId NOT IN (${wambiDB.escapeValue(excludedRecipients)})` : ''
        const groupsList = groups.filter(g => !g.isRealm).map(({ id }) => id)
        const realmGroupsList = groups.filter(g => g.isRealm).map(({ id }) => id)
        let recipientsFromGroups = [],
          recipientsFromRealmGroups = []

        if (groupsList.length) {
          recipientsFromGroups = await wambiDB.query({
            queryText: /*sql*/ `
              SELECT PG.peopleId AS id
              FROM peopleGroups PG
              INNER JOIN people P ON (PG.peopleId = P.id AND P.status = ${USER_STATUS.ACTIVE})
              INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
              WHERE PG.groupId IN (?)
                AND PG.peopleId <> ${authorId}
              ${exclusionClause}
            `,
            params: [groupsList],
          })
        }

        if (realmGroupsList.length) {
          // Check if user owns all realm groups...JC
          const { userOwnedRealmGroupsCount } = await wambiDB.querySingle({
            queryText: /*sql*/ `
              SELECT COUNT(DISTINCT G.id) AS userOwnedRealmGroupsCount
              FROM peopleGroups PG
              INNER JOIN groupIndex GI ON (PG.groupId = GI.groupId AND
                PG.peopleId = ${authorId} AND
                PG.level > ${levels.TEAM_MEMBER})
              INNER JOIN groups G ON (GI.fromGroupId = G.id AND
                G.accountId = ${clientAccountId} AND
                G.id IN (?))
            `,
            params: [realmGroupsList],
          })

          if (userOwnedRealmGroupsCount === realmGroupsList.length) {
            recipientsFromRealmGroups = await wambiDB.query({
              queryText: /*sql*/ `
                SELECT PG.peopleId AS id
                FROM peopleGroups PG
                INNER JOIN people P ON (PG.peopleId = P.id AND P.status = ${USER_STATUS.ACTIVE})
                INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
                INNER JOIN groupIndex GI ON (PG.groupid = GI.fromGroupId AND GI.groupId IN (?))
                WHERE PG.peopleId <> ${authorId}
                ${exclusionClause}
              `,
              params: [realmGroupsList],
            })
          }
        }

        recipients = [...recipients, ...recipientsFromGroups, ...recipientsFromRealmGroups]
      }

      recipients = removeDuplicates(recipients, 'id').map(({ id }) => id)

      const feedGroupsList = await getManagingGroups({
        // Pass in sender + direct recipient groups + groups selected.
        // But we don't get groups for group recipients to avoid linking to every group they belong to as well...JC
        groups: removeDuplicates([...senderAndRecipientGroups, ...groups], 'id'),
        onlyManaging: true,
      })

      const { sentiment } = await getSentimentScore({ content, req })

      transaction = await wambiDB.beginTransaction()
      const createdAtInsert = `, createdAt = ${wambiDB.escapeValue(scheduledAt)}`
      const cpcDateInsert = scheduledAt ? `${createdAtInsert}, updatedAt = ${wambiDB.escapeValue(scheduledAt)}` : ''

      // Save to cpc table, return cpc id
      const insertCpcRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO cpc
          SET ?
          ${cpcDateInsert}
        `,
        params: [
          {
            accountId: clientAccountId,
            content,
            cpcTypeId: type.id,
            delegateId: sentAsPeopleId ? authorId : null,
            senderId: authorId,
            sentiment,
            status: CPC_STATUS.APPROVED,
          },
        ],
      })

      const newCpcId = insertCpcRes.insertId

      // If user selected client values, save to cpcValues table...KA
      if (values?.length > 0) {
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO cpcValues (cpcId, clientValueId)
            VALUES ?
          `,
          params: [values.map(v => [newCpcId, v])],
        })
      }

      const feedDateInsert = scheduledAt ? `${createdAtInsert}, sortDate = ${wambiDB.escapeValue(scheduledAt)}` : ''
      const feedRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO feedItems
          SET ?
          ${feedDateInsert}
        `,
        params: [
          {
            accountId: clientAccountId,
            itemType: FEED_ITEM_TYPES.CPC,
            authorId,
            cpcId: newCpcId,
            content,
            source: scheduledAt ? FEED_ITEM_SOURCE.SCHEDULED : feedItemDraftId ? FEED_ITEM_SOURCE.DRAFT : FEED_ITEM_SOURCE.MANUAL,
            status: shareOnNewsfeed ? FEED_ITEM_STATUS.VISIBLE : FEED_ITEM_STATUS.NON_PUBLIC,
          },
        ],
      })

      const newFeedId = feedRes.insertId

      // We insert media link below for draft Wambis instead of transferring here, since they need to save with a type image...JC
      if (feedItemDraftId) {
        await deleteFeedItemDraft({
          feedItemDraftId,
          req,
          transaction,
        })
      }

      // Save image to mediaLink table...KA
      if (type) {
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO mediaLink
            SET ?
          `,
          params: [
            {
              mediaId: type.mediaId,
              tableName: 'feedItems',
              tableKey: newFeedId,
              usage: 'banner',
            },
          ],
        })
      }

      // Save award nomination if recipient was nominated...KA
      if (nominate && type.awardTypeId && recipients.length === 1 && !groups.length) {
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO awardNominations
            SET ?
          `,
          params: [
            {
              accountId: clientAccountId,
              awardTypeId: type.awardTypeId,
              comment: nominateComment.trim() || null,
              feedId: newFeedId,
              nominatorId: authorId,
              nomineeId: recipients[0],
            },
          ],
        })
      }

      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO feedGroups (feedId, groupId, isManaging)
          VALUES ?
        `,
        params: [feedGroupsList.map(({ id, isManaging }) => [newFeedId, id, isManaging])],
      })

      await wambiDB.commitTransaction(transaction)

      await chunkDataset({
        connection: wambiDB,
        commandText: /*sql*/ `
          INSERT INTO feedPeople (feedId, peopleId)
          VALUES ?
        `,
        dataRows: recipients,
        rowSelector: r => [newFeedId, r],
      })

      // Handle user challenges...JC
      const { completedChallenges, rewardProgress } = await handleChallenges({
        clientAccountId,
        noCelebration: isScheduled,
        req,
        skipRewardProgress: !shareOnNewsfeed,
        triggerArgs: { cpcThemeId: type.cpcThemeId, cpcTypeId: type.id },
        triggers: [TRIGGERS.CPC_SEND],
        userId: authorId,
      })

      // Standalone functionality from post CPC...CY
      const sendNotification = shareOnNewsfeed ? notification.sendWambi : notification.sendPrivateWambi
      sendNotification({ feedId: newFeedId, recipients, userId: authorId }, clientAccountId)

      // Handle recipient challenges...CY
      handleChallenges({
        clientAccountId,
        isMe: false,
        req,
        skipRewardProgress: !shareOnNewsfeed,
        triggerArgs: { cpcValues: values },
        triggers: [TRIGGERS.CPC_RECEIVE],
        userIds: recipients,
      })

      if (notifications?.email || notifications?.sms) {
        // Send emails out depending on group access level of sender and number of recipients...KA
        const notifData = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT PR.id,
              CONCAT(IFNULL(NULLIF(PR.displayName, ''), PR.firstName), ' ', PR.lastName) AS recipientName,
              IF(PR.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.EMAIL_ONLY}), PR.email, NULL) AS email,
              IF(PR.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.TEXT_ONLY}), PR.mobile, NULL) AS mobile,
              CONCAT(IFNULL(NULLIF(PS.displayName, ''), PS.firstName), ' ', PS.lastName) AS senderName
            FROM people PS
            INNER JOIN clientAccountPeople CAP ON (PS.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
            LEFT JOIN people PR ON (PR.id IN (?))
            WHERE PS.id = ${authorId}
          `,
          params: [recipients],
        })

        if (notifData.length > 1 || (notifData.length === 1 && notifData[0].senderName != null)) {
          const { email, mobile, recipientName, senderName } = notifData[0]

          const cpcUrl = `https://${host}/newsfeed?feedId=${newFeedId}`

          const emailData = {
            cpcContent: content.split(' ').length > 5 ? `"${content.split(' ').slice(0, 5).join(' ')}..."` : `"${content}"`,
            cpcUrl,
            email: notifData.map(({ email }) => email).join(','),
            recipientName,
            senderName,
          }

          const smsData = {
            cpcUrl,
            senderName,
            to: notifData,
          }

          const userIsAGroupOwner = userGroups.length && userGroups.some(g => g.level > GROUP_ACCESS_LEVELS.TEAM_MEMBER)

          if (userIsAGroupOwner) {
            if (recipients.length === 1) {
              if (email && notifications?.email) sendIndividualWambiFromManager_Email(emailData)
              if (mobile && notifications?.sms) sendIndividualWambiFromManager_SMS(smsData)
            } else {
              if (notifData.some(nd => nd.email != null) && notifications?.email) sendGroupWambiFromManager_Email(emailData)
              if (notifData.some(nd => nd.mobile != null) && notifications?.sms) sendGroupWambiFromManager_SMS(smsData)
            }
          } else {
            if (recipients.length === 1) {
              if (email && notifications?.email) sendIndividualWambiFromTeamMember_Email(emailData)
              if (mobile && notifications?.sms) sendIndividualWambiFromTeamMember_SMS(smsData)
            } else {
              if (notifData.some(nd => nd.email != null) && notifications?.email) sendGroupWambiFromTeamMember_Email(emailData)
              if (notifData.some(nd => nd.mobile != null) && notifications?.sms) sendGroupWambiFromTeamMember_SMS(smsData)
            }
          }
        }
      }
      return { success: true, newFeedId, completedChallenges, rewardProgress }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of postWambi', error, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      return { success: false }
    }
  },
}
