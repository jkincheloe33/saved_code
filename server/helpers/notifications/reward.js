const createNotification = require('./create')
const { NOTIFICATION_TYPE, NOTIFICATION_STATUS } = require('../../../utils/types')

const receiveGiftNotif = async (claimedBy, claimId, accountId, senderId) => {
  try {
    const sender = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name
        FROM people P
        WHERE P.id = ${senderId}
      `,
    })

    const notificationParams = [claimedBy].map(id => {
      return {
        accountId,
        content: `${sender.name} has sent you a surprise`,
        peopleId: id,
        status: 0,
        type: NOTIFICATION_TYPE.RECEIVE_GIFT,
      }
    })

    const linkParams = notificationId => [
      {
        notificationId,
        tableName: 'rewardClaims',
        tableKey: claimId,
        usage: 'trigger',
      },
    ]

    await createNotification(notificationParams, linkParams)
  } catch (error) {
    console.error('Error receiving gift notification: ', error)
  }
}

const expiringGiftNotif = async ({ accountId, claimIds }) => {
  try {
    const recipients = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RG.name AS giftName, P.id AS peopleId
        FROM rewardClaims RC
        INNER JOIN people P ON (P.id = RC.claimedBy)
        INNER JOIN rewardGifts RG ON (RC.rewardGiftId = RG.id AND RG.accountId = ${accountId})
        WHERE RC.id IN (${claimIds})
      `,
    })

    const notificationParams = recipients.map(r => {
      return {
        accountId,
        content: `Reminder! Your ${r.giftName} will expire soon.`,
        peopleId: r.peopleId,
        status: NOTIFICATION_STATUS.UNREAD,
        type: NOTIFICATION_TYPE.REWARD_REMINDER,
      }
    })

    const linkParams = (notificationId, i) => [
      {
        notificationId,
        tableName: 'rewardClaims',
        tableKey: claimIds[i],
        usage: 'trigger',
      },
    ]

    await createNotification(notificationParams, linkParams)
  } catch (error) {
    console.error('Error receiving gift notification: ', error)
  }
}

module.exports = {
  expiringGiftNotif,
  receiveGiftNotif,
}
