import { profileChangesApprovedNotif } from '@serverHelpers/notifications/profile'
const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')
import { sendProfileChangesApproved_Email } from '@serverHelpers/email'
import { sendProfileChangesApproved_SMS } from '@serverHelpers/sms'
import { USER_NOTIFY_METHODS } from '@utils'

export default async (req, res) => {
  if (req.method === 'POST') {
    let transaction

    try {
      const {
        body: { profiles },
        clientAccount: {
          host,
          id: clientAccountId,
          settings: {
            featureToggles: { notifications },
          },
        },
        session: { userId },
      } = req

      const peopleIds = profiles.map(({ id }) => id)

      const userCanApproveProfiles = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT 1
          FROM people P
          INNER JOIN (
            ${selectLeaderPeople({ clientAccountId, includeRealm: true, userId })}
          ) PM ON (P.id = PM.id)
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
          WHERE P.id IN (?)
        `,
        params: [peopleIds],
      })

      if (!userCanApproveProfiles) return res.json({ msg: 'User does not have permission to update profiles', success: false })

      const { managerName } = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS managerName
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
          WHERE P.id = ${userId}
        `,
      })

      const mediaLinks = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT ML.id, ML.usage, P.id AS peopleId
          FROM mediaLink ML
          INNER JOIN people P ON (P.id = ML.tableKey)
          WHERE ML.tableName = 'people'
            AND ML.tableKey IN (?)
            AND ML.usage IN ('pendingOriginal', 'pendingThumbnail')
        `,
        params: [peopleIds],
      })

      transaction = await wambiDB.beginTransaction()

      // Update display names
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE people
          SET displayName = IFNULL(draftDisplayName, displayName),
            draftDisplayName = NULL
          WHERE id IN (?)
        `,
        params: [peopleIds],
      })

      if (mediaLinks.length) {
        const mediaLinkIds = mediaLinks.map(({ id }) => id)

        // Approve pending images
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE mediaLink ML
            SET ML.usage = 'original'
            WHERE ML.id IN (?)
              AND ML.usage = 'pendingOriginal'
           `,
          params: [mediaLinkIds],
        })

        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE mediaLink ML
            SET ML.usage = 'thumbnail'
            WHERE ML.id IN (?)
              AND ML.usage = 'pendingThumbnail'
          `,
          params: [mediaLinkIds],
        })

        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            DELETE ML
            FROM mediaLink ML
            WHERE ML.tableName = 'people'
              AND ML.tableKey IN (?)
              AND ML.id NOT IN (?)
              AND ML.usage IN ('original', 'thumbnail')
          `,
          params: [mediaLinks.map(({ peopleId }) => peopleId), mediaLinks.map(({ id }) => id)],
        })
      }

      await wambiDB.commitTransaction(transaction)
      res.json({ success: true })

      profileChangesApprovedNotif({ clientAccountId, managerName, profiles })

      if (notifications?.email || notifications?.sms) {
        let people = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT P.id, P.email,
              IF(P.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.TEXT_ONLY}), P.mobile, NULL) AS mobile,
              CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS requestorName
            FROM people P
            INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
            WHERE P.id IN (?)
          `,
          params: [peopleIds],
        })

        const sendWambiUrl = `https://${host}/newsfeed?sendCpc=true`

        people = profiles.map(p => ({ ...p, ...people.find(pp => pp.id === p.id) }))

        if (notifications?.email && people.some(p => p.email != null)) {
          sendProfileChangesApproved_Email({ managerName, people, sendWambiUrl })
        }

        if (notifications?.sms && people.some(p => p.mobile != null))
          sendProfileChangesApproved_SMS({ managerName, sendWambiUrl, to: people })
      }
    } catch (error) {
      logServerError({ error, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      res.json({ success: false })
    }
  }
}
