import { profileChangesDeniedNotif } from '@serverHelpers/notifications/profile'
const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')
import { sendProfileChangesDenied_Email } from '@serverHelpers/email'
import { sendProfileChangesDenied_SMS } from '@serverHelpers/sms'
import { USER_NOTIFY_METHODS } from '@utils'

export default async (req, res) => {
  if (req.method === 'POST') {
    let transaction

    try {
      const {
        body: { changesRequested = '', profiles },
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

      // Check user can deny profiles..JC
      const userCanDenyProfiles = await wambiDB.querySingle({
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

      if (!userCanDenyProfiles) return res.json({ msg: 'User does not have permission to deny profiles', success: false })

      const { managerName } = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS managerName
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
          WHERE P.id = ${userId}
        `,
      })

      transaction = await wambiDB.beginTransaction()

      // Remove draft display names
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE people
          SET draftDisplayName = NULL
          WHERE id IN (?)
        `,
        params: [peopleIds],
      })

      let mediaLinkIds = await wambiDB.query({
        transaction,
        queryText: /*sql*/ `
          SELECT ML.id
          FROM mediaLink ML
           WHERE ML.tableName = 'people'
            AND ML.tableKey IN (?)
            AND ML.usage IN ('pendingOriginal', 'pendingThumbnail')
        `,
        params: [peopleIds],
      })

      if (mediaLinkIds.length) {
        // Remove pending images
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            DELETE FROM mediaLink
            WHERE id IN (?)
          `,
          params: [mediaLinkIds.map(({ id }) => id)],
        })
      }

      await wambiDB.commitTransaction(transaction)
      res.json({ success: true })

      profileChangesDeniedNotif({ clientAccountId, managerName, profiles })

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

        const editProfileUrl = `https://${host}/profile?showEditProfile=true`

        people = profiles.map(p => ({ ...p, ...people.find(pp => pp.id === p.id) }))

        if (notifications?.email && people.some(p => p.email != null)) {
          sendProfileChangesDenied_Email({ changesRequested, editProfileUrl, managerName, people })
        }

        if (notifications?.sms && people.some(p => p.mobile != null)) {
          sendProfileChangesDenied_SMS({ editProfileUrl, managerName, to: people })
        }
      }
    } catch (error) {
      logServerError({ error, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      res.json({ success: false })
    }
  }
}
