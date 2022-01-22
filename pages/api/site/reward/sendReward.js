const { receiveGiftNotif } = require('@serverHelpers/notifications/reward')
import { sendGiftReceive_Email } from '@serverHelpers/email'
import { sendGiftReceive_SMS } from '@serverHelpers/sms'
import { capitalizeWords, REWARD_GIFT_STATUS, USER_NOTIFY_METHODS, USER_STATUS } from '@utils'

const _getUserData = async userId => {
  const user = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT P.id,
        CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS fullName,
        IF(P.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.EMAIL_ONLY}), P.email, NULL) AS email,
        IF(P.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.TEXT_ONLY}), P.mobile, NULL) AS mobile
      FROM people P
      WHERE P.id = ?
        AND P.status = ${USER_STATUS.ACTIVE}
        AND P.isSelfRegistered = 0
    `,
    params: [userId],
  })

  return {
    ...user,
    fullName: capitalizeWords(user.fullName),
  }
}

export default async (req, res) => {
  try {
    const {
      body: { sendNote = null, selectedPersonId, rewardClaimId },
      session: { userId },
      clientAccount: {
        host,
        id: clientAccountId,
        name: clientAccountName,
        settings: {
          featureToggles: { notifications },
        },
      },
    } = req

    const sentDate = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY) expiresAt
        FROM rewardGifts RG
        INNER JOIN rewardClaims RC ON (RG.id = RC.rewardGiftId AND RC.id = ?)
      `,
      params: [rewardClaimId],
    })

    const sendGiftResponse = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE rewardClaims RC
        INNER JOIN rewardGifts RG ON (RC.rewardGiftId = RG.id AND RG.accountId = ${clientAccountId} AND RG.status = ${REWARD_GIFT_STATUS.ACTIVE})
        INNER JOIN people P ON (P.id = ? AND P.status = ${USER_STATUS.ACTIVE} AND P.isSelfRegistered = 0)
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        SET sentAt = CURRENT_TIMESTAMP,
          sendNote = ?,
          sentBy = ${userId},
          claimedBy = ?,
          expiresAt = ?
        WHERE RC.id = ? AND RC.claimedAt IS NULL AND RC.claimedBy = ${userId}
      `,
      params: [selectedPersonId, sendNote, selectedPersonId, sentDate.expiresAt, rewardClaimId],
    })

    if (sendGiftResponse.changedRows === 0) return res.json({ success: false, msg: 'Failed to send gift.' })

    const [recipientData, senderData] = await Promise.all([_getUserData(selectedPersonId), _getUserData(userId)])
    const { email, fullName: recipient, mobile } = recipientData

    const { fullName: sender } = senderData

    receiveGiftNotif(selectedPersonId, rewardClaimId, clientAccountId, userId)

    const giftUrl = `https://${host}/profile?rewardClaimId=${rewardClaimId}`

    if (email && notifications?.email) {
      sendGiftReceive_Email({
        clientAccountName,
        email,
        giftUrl,
        recipient,
        sender,
      })
    }

    if (mobile && notifications?.sms) {
      sendGiftReceive_SMS({ giftUrl, to: [{ ...recipientData, mobile }] })
    }

    res.json({ success: sendGiftResponse.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
