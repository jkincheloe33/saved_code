import { sendExpiringSurprises_Email } from '@serverHelpers/email'
import { USER_NOTIFY_METHODS, USER_STATUS } from '@utils'
import { expiringGiftNotif } from '@serverHelpers/notifications/reward'

const expiresInDays = 7

export default async (req, res) => {
  try {
    const recipientsByClientAccount = await wambiDB.query({
      queryText: /*sql*/ `
          SELECT CA.name AS clientAccountName, CA.id AS clientAccountId,
            CONCAT('https://', CA.host, '/profile?showRewardList=true') AS rewardListUrl,
            GROUP_CONCAT(DISTINCT IF(P.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.EMAIL_ONLY}), P.email, NULL)) AS email,
            GROUP_CONCAT(RC.id) AS rewardClaims,
            CA.settings->'$.featureToggles.notifications.email' AS emailsEnabled
          FROM clientAccountPeople CAP
          INNER JOIN clientAccounts CA ON (CA.id = CAP.accountId)
          INNER JOIN people P ON (P.id = CAP.peopleId AND P.status = ${USER_STATUS.ACTIVE})
          INNER JOIN rewardClaims RC ON (
            RC.claimedAt IS NULL
              AND DATEDIFF(RC.expiresAt, CURDATE() + INTERVAL ${expiresInDays} DAY) = 0
              AND RC.claimedBy = P.id
          )
          INNER JOIN rewardGifts RG ON (RG.id = RC.rewardGiftId AND RG.accountId = CA.id)
          WHERE CAP.isIncognito = 0
          GROUP BY CAP.accountId
        `,
    })

    if (recipientsByClientAccount.length) {
      const filteredRecipients = recipientsByClientAccount.filter(ca => ca.emailsEnabled === true)
      sendExpiringSurprises_Email(filteredRecipients)

      for (let i = 0; i < recipientsByClientAccount.length; i++) {
        const claimIds = recipientsByClientAccount[i].rewardClaims.split(',')
        await expiringGiftNotif({ accountId: recipientsByClientAccount[i].clientAccountId, claimIds })
      }
      res.json({ success: true })
    } else res.json({ success: true, msg: 'No client account recipients found.' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
