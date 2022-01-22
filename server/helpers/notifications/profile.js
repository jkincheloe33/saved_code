const createNotification = require('./create')
const { NOTIFICATION_STATUS, NOTIFICATION_TYPE, PROFILE_CHANGE_REQUEST_TYPE, PROFILE_CHANGE_REQUEST_TYPE_NAMES } = require('@utils')
const { selectUserLeaders } = require('@serverHelpers/query/selectUserLeaders')

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

const profileChangesRequestedNotif = async ({ clientAccountId, userId }) => {
  const userManagers = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT P.id
      FROM people P
      INNER JOIN (
        ${selectUserLeaders({ clientAccountId, userId })}
      ) UM ON (P.id = UM.id)
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
      WHERE P.id <> ?
    `,
    params: [userId],
  })

  if (userManagers.length) {
    // Checks if managers already have an unread profile notification...KA
    const notifExists = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT peopleId
        FROM notifications
        WHERE peopleId IN (${userManagers.map(({ id }) => id)})
          AND accountId = ${clientAccountId}
          AND status = ${NOTIFICATION_STATUS.UNREAD}
          AND type = ${NOTIFICATION_TYPE.PROFILE_APPROVAL_NEEDED}
      `,
    })

    const userManagersToNotify = userManagers.filter(m => !notifExists.find(n => n.peopleId === m.id))

    if (userManagersToNotify.length) {
      const notificationParams = userManagersToNotify.map(({ id }) => {
        return {
          accountId: clientAccountId,
          content: '<b>New!</b> Team member profile changes ready for review',
          peopleId: id,
          status: 0,
          type: NOTIFICATION_TYPE.PROFILE_APPROVAL_NEEDED,
        }
      })

      const linkParams = (notificationId, i) => [
        {
          notificationId,
          tableName: 'people',
          tableKey: userManagersToNotify[i],
          usage: 'profile',
        },
      ]

      await createNotification(notificationParams, linkParams)
    }
  }
}

const profileChangesApprovedNotif = async ({ clientAccountId, managerName, profiles }) => {
  try {
    const notificationParams = profiles.map(p => {
      return {
        accountId: clientAccountId,
        content: `${managerName} has approved your ${PROFILE_CHANGE_REQUEST_TYPE_NAMES[p.profileRequestType]} change${
          p.profileRequestType === PROFILE_CHANGE_REQUEST_TYPE.NAME_AND_PHOTO ? 's' : ''
        }!`,
        peopleId: p.id,
        status: 0,
        type: NOTIFICATION_TYPE.PROFILE_APPROVED,
      }
    })

    const linkParams = (notificationId, i) => [
      {
        notificationId,
        tableName: 'people',
        tableKey: profiles[i],
        usage: 'profile',
      },
    ]

    await createNotification(notificationParams, linkParams)
  } catch (error) {
    console.error('Error in profile approval notification: ', error)
  }
}

const profileChangesDeniedNotif = async ({ clientAccountId, managerName, profiles }) => {
  try {
    const notificationParams = profiles.map(p => {
      return {
        accountId: clientAccountId,
        content: `${managerName} has requested changes to your profile.`,
        peopleId: p.id,
        status: 0,
        type: NOTIFICATION_TYPE.PROFILE_DENIED,
      }
    })

    const linkParams = (notificationId, i) => [
      {
        notificationId,
        tableName: 'people',
        tableKey: profiles[i],
        usage: 'profile',
      },
    ]

    await createNotification(notificationParams, linkParams)
  } catch (error) {
    console.error('Error in profile denial notification: ', error)
  }
}

module.exports = {
  challenges,
  profileChangesApprovedNotif,
  profileChangesDeniedNotif,
  profileChangesRequestedNotif,
}
