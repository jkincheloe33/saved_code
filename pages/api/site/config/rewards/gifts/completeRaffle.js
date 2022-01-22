const { sendRaffleNotif } = require('@serverHelpers/notifications/raffle')
import { sendRaffleWinner_Email } from '@serverHelpers/email'
import { sendRaffleWinner_SMS } from '@serverHelpers/sms'
import { USER_NOTIFY_METHODS, USER_STATUS } from '@utils'

export default async (req, res) => {
  const {
    body: { endDate, numOfWinners, raffleId, rewardGiftId, startDate },
    clientAccount: {
      host,
      id: clientAccountId,
      name: clientAccountName,
      settings: {
        featureToggles: { notifications },
      },
    },
  } = req

  let transaction

  try {
    transaction = await wambiDB.beginTransaction()

    // grabs random winners to send gift to...KA
    const winners = await wambiDB.query({
      transaction,
      queryText: /*sql*/ `
        SELECT RG.id AS rewardGiftId, RG.name AS giftName, RG.expiresInDays, RG.inventory, RG.claimInstructions,
          RC.id AS rewardClaimId, RC.claimedBy AS personId,
          P.email,
          IF(P.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.TEXT_ONLY}), P.mobile, NULL) AS mobile,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(P.jobTitleDisplay, P.jobTitle) AS title,
          IFNULL(CONCAT('${
            process.env.MEDIA_CDN
          }/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image
        FROM rewardClaims RC
        INNER JOIN rewardGifts RG ON (RG.id = ? AND RG.accountId = ${clientAccountId} AND (RG.inventory IS NULL OR RG.inventory >= ?))
        INNER JOIN people P ON (P.id = RC.claimedBy AND P.status = ${USER_STATUS.ACTIVE} AND P.isSelfRegistered = 0)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE RC.rewardGiftId = ?
          AND RC.raffleWon IS NULL
          AND RC.claimedAt IS NOT NULL
          ${startDate && endDate ? `AND RC.claimedAt BETWEEN ${wambiDB.escapeValue(startDate)} AND ${wambiDB.escapeValue(endDate)}` : ''}
        GROUP BY RC.claimedBy
        ORDER BY RAND()
        LIMIT ?
      `,
      params: [rewardGiftId, numOfWinners, raffleId, numOfWinners],
    })

    if (winners.length > 0) {
      // insert new claim records for winners...KA
      const insertRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO rewardClaims (claimedBy, rewardGiftId, expiresAt)
          VALUES ${winners.map(
            w => `(${[w.personId, w.rewardGiftId, `DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${winners[0].expiresInDays || 14} DAY)`]})`
          )}
        `,
      })

      // update raffleWon in existing claim entries...KA
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE rewardClaims RC
          SET raffleWon = 1
          WHERE RC.id IN (?)
        `,
        params: [winners.map(w => w.rewardClaimId)],
      })

      // show them a message if the winners count is less than numOfWinners
      await wambiDB.commitTransaction(transaction)

      const newClaimIds = Array.from({ length: insertRes.affectedRows }, (_, i) => insertRes.insertId + i)

      // send notification to winners...KA
      sendRaffleNotif(
        winners.map(w => w.personId),
        newClaimIds,
        clientAccountId
      )

      if (winners.some(w => w.email != null)) {
        const emailWinners = winners.map((w, i) => ({
          ...w,
          giftUrl: `https://${host}/profile?rewardClaimId=${newClaimIds[i]}`,
        }))

        sendRaffleWinner_Email({ clientAccountName, winners: emailWinners })
      }

      if (notifications?.sms && winners.some(w => w.mobile != null)) {
        winners.forEach((w, i) => {
          const giftUrl = `https://${host}/profile?rewardClaimId=${newClaimIds[i]}`

          sendRaffleWinner_SMS({ giftUrl, to: [w] })
        })
      }
    }

    res.json({ success: true, winners })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false })
  }
}
