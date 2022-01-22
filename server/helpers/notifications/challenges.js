const createNotification = require('./create')
const { NOTIFICATION_TYPE } = require('../../../utils/types')

const challenges = async (accountId, challenges, peopleId) => {
  if (challenges.length && peopleId) {
    const notificationParams = challenges.map(({ title }) => {
      let content = `You started the <b>${title}</b> challenge`
      let type = NOTIFICATION_TYPE.CHALLENGE_ISSUED

      return {
        peopleId,
        type,
        status: 0,
        accountId,
        content,
      }
    })

    const linkParams = (notificationId, i) => [
      { tableName: 'challenges', tableKey: challenges[i].challengeId ?? challenges[i].id, usage: 'trigger', notificationId },
    ]

    await createNotification(notificationParams, linkParams)
  }
}

module.exports = {
  challenges,
}
