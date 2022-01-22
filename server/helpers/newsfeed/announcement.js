import { deleteFeedItemDraft } from '@serverHelpers/feedItemDraft/deleteFeedItemDraft'
import { getManagingGroups } from '@serverHelpers/getManagingGroups'
import { handleChallenges } from '@serverHelpers/challenges/handleChallenges'
import notification from '@serverHelpers/notifications/newsfeed'

import { FEED_ITEM_SOURCE, FEED_ITEM_TYPES, FEED_ITEM_STATUS, PIN_POST_DAYS, TRIGGERS } from '@utils'

module.exports = {
  postAnnouncement: async ({ accountId, authorId, draftDetails, feedItemDetails, req, scheduledAt, transaction }) => {
    // Local transaction for draft automation...CY
    const localTransaction = !transaction
    transaction = localTransaction ? await wambiDB.beginTransaction() : transaction

    try {
      let { content, file, groups, pinDays, status = FEED_ITEM_STATUS.VISIBLE } = feedItemDetails

      if (pinDays != null) {
        //Check if pin days is valid and a number, if not set pin days as default value..CY
        if (Number(pinDays)) {
          if (pinDays < PIN_POST_DAYS.MIN) pinDays = PIN_POST_DAYS.MIN
          else if (pinDays > PIN_POST_DAYS.MAX) pinDays = PIN_POST_DAYS.MAX
        } else pinDays = PIN_POST_DAYS.DEFAULT
      }
      const pinUntilInsert = pinDays ? `, pinUntil = CURRENT_TIMESTAMP + INTERVAL ${pinDays} DAY` : ''
      const dateInsert = scheduledAt
        ? `, createdAt = ${wambiDB.escapeValue(scheduledAt)}, sortDate = ${wambiDB.escapeValue(scheduledAt)}`
        : ''
      const feedGroupsList = await getManagingGroups({ groups })

      const feedItem = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO feedItems
          SET ?
            ${pinUntilInsert}
            ${dateInsert}
        `,
        params: [
          {
            accountId,
            authorId,
            content,
            itemType: FEED_ITEM_TYPES.ANNOUNCEMENT,
            limitedByTrait: 0,
            source: scheduledAt ? FEED_ITEM_SOURCE.SCHEDULED : draftDetails ? FEED_ITEM_SOURCE.DRAFT : FEED_ITEM_SOURCE.MANUAL,
            status,
          },
        ],
      })

      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO feedGroups (feedId, groupId, isManaging)
          VALUES ?
        `,
        params: [feedGroupsList.map(({ id, isManaging }) => [feedItem.insertId, id, isManaging])],
      })

      if (draftDetails) {
        const { id: feedItemDraftId, hasMedia } = draftDetails
        const deleteRes = await deleteFeedItemDraft({
          feedItemDraftId,
          hasMedia,
          newFeedItemId: !file && feedItem.insertId,
          req,
          transaction,
        })

        if (!deleteRes.success) {
          if (localTransaction) await wambiDB.rollbackTransaction(transaction)
          return { success: false }
        }
      }

      // Create notification and challenges for draft automation...CY
      if (localTransaction) {
        await wambiDB.commitTransaction(transaction)
        notification.postAnnouncement({
          accountId,
          feedId: feedItem.insertId,
          groups,
          userId: authorId,
        })

        handleChallenges({
          clientAccountId: accountId,
          req,
          noCelebration: true,
          triggers: [TRIGGERS.ANNOUNCEMENT_POST],
          userIds: authorId,
        })
      }

      return { feedId: feedItem.insertId, success: true }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of postAnnouncement', error, excludeBody: true, req })
      if (localTransaction) await wambiDB.rollbackTransaction(transaction)
      return { success: false }
    }
  },
}
