const createNotification = require('./create')
const { NOTIFICATION_STATUS, NOTIFICATION_TYPE } = require('../../../utils/types')
const { selectUserLeaders } = require('@serverHelpers/query/selectUserLeaders')

const _getUserManagers = async ({ accountId, userId }) =>
  await wambiDB.query({
    queryText: /*sql*/ `
      SELECT P.id
      FROM people P
      INNER JOIN (
        ${selectUserLeaders({ clientAccountId: accountId, userId })}
      ) UM ON (P.id = UM.id)
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${accountId})
      WHERE P.id <> ?
    `,
    params: [userId],
  })

const managerHotStreak = async ({ accountId, userId }) => {
  const userManagers = await _getUserManagers({ accountId, userId })

  if (userManagers.length) {
    const { name } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT CONCAT(IFNULL(NULLIF(displayName, ''), firstName), ' ', lastName) AS name
        FROM people
        WHERE id = ${userId}
      `,
    })

    const notificationParams = userManagers.map(({ id }) => ({
      accountId,
      content: `<b>${name}</b> is on a Hot Streak! <b>Send them a Wambi</b>`,
      status: 0,
      peopleId: id,
      type: NOTIFICATION_TYPE.MANAGER_HOT_STREAK,
    }))

    const linkParams = notificationId => [
      {
        notificationId,
        tableName: 'people',
        tableKey: userId,
        usage: 'trigger',
      },
    ]

    await createNotification(notificationParams, linkParams)
  }
}

const hotStreak = async ({ accountId, surveyId, userId }) => {
  const notificationParams = [
    {
      accountId,
      // eslint-disable-next-line
      content: `<b>Hot Streak!</b> You're on Fire!`,
      peopleId: userId,
      status: 0,
      type: NOTIFICATION_TYPE.SURVEY_HOT_STREAK,
    },
  ]

  const linkParams = notificationId => [
    {
      notificationId,
      tableName: 'survey',
      tableKey: surveyId,
      usage: 'trigger',
    },
  ]

  await createNotification(notificationParams, linkParams)
}

const perfectScore = async ({ accountId, surveyId, userId }) => {
  const notificationParams = [
    {
      accountId,
      content: '<b>Way to Wambi!</b> Congrats on a perfect score!',
      peopleId: userId,
      status: 0,
      type: NOTIFICATION_TYPE.SURVEY_PERFECT_SCORE,
    },
  ]

  const linkParams = notificationId => [
    {
      notificationId,
      tableName: 'survey',
      tableKey: surveyId,
      usage: 'trigger',
    },
  ]

  await createNotification(notificationParams, linkParams)
}

const surveyFollowUp = async ({ accountId, surveyId, userId }) => {
  try {
    const type = NOTIFICATION_TYPE.SURVEY_FOLLOW_UP

    const userManagers = await _getUserManagers({ accountId, userId })

    if (userManagers.length) {
      // Checks if managers already have survey follow up notification...KA
      const notifExists = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT peopleId
          FROM notifications
          WHERE peopleId IN (${userManagers.map(({ id }) => id)})
            AND accountId = ${accountId}
            AND status = ${NOTIFICATION_STATUS.UNREAD}
            AND type = ${type}
        `,
      })

      const userManagersToNotify = userManagers.filter(m => !notifExists.find(n => n.peopleId === m.id))

      if (userManagersToNotify.length) {
        const notificationParams = userManagersToNotify.map(({ id }) => {
          return {
            accountId,
            content: 'A follow-up request has been submitted',
            peopleId: id,
            status: 0,
            type,
          }
        })

        const linkParams = notificationId => [
          {
            notificationId,
            tableName: 'survey',
            tableKey: surveyId,
            usage: 'trigger',
          },
        ]

        await createNotification(notificationParams, linkParams)
      }
    }
  } catch (error) {
    console.error('Error in portal follow up notification: ', error)
  }
}

module.exports = {
  hotStreak,
  managerHotStreak,
  perfectScore,
  surveyFollowUp,
}
