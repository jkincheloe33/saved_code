const createNotification = require('./create')
const { NOTIFICATION_TYPE } = require('../../../utils/types')

const sendRaffleNotif = async (claimedBy, claimId, accountId) => {
  try {
    const notificationParams = claimedBy.map(id => {
      return {
        accountId,
        content: '🎁 You won a raffle!',
        peopleId: id,
        status: 0,
        type: NOTIFICATION_TYPE.RAFFLE_WINNER,
      }
    })

    const linkParams = (notificationId, i) => [
      {
        notificationId,
        tableName: 'rewardClaims',
        tableKey: claimId[i],
        usage: 'trigger',
      },
    ]

    await createNotification(notificationParams, linkParams)
  } catch (error) {
    console.error('Error sending raffle notification: ', error)
  }
}

module.exports = {
  sendRaffleNotif,
}
