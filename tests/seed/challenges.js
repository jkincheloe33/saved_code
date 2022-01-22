const { CHALLENGE_STATUS, TRIGGERS } = require('../../utils/types')

const _getThemeData = accountId => ({
  name: 'Api Test Challenge Theme',
  accountId: accountId,
})

const addChallenges = async ({ accountId, wambiDB }) => {
  const triggerValues = Object.values(TRIGGERS)
  const triggerKeys = Object.keys(TRIGGERS)
  const themeData = _getThemeData(accountId)

  let challengeTheme = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT id
      FROM challengeThemes
      WHERE accountId = ${themeData.accountId}
        AND name = '${themeData.name}'
    `,
  })

  if (!challengeTheme) {
    challengeTheme = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO challengeThemes
        SET ?
      `,
      params: [themeData],
    })

    challengeTheme.id = challengeTheme.insertId
  }

  const challengeTriggers = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT CG.trigger
      FROM challengeThemes CT
      INNER JOIN challenges C ON (CT.id = C.challengeThemeId)
      INNER JOIN challengeGoals CG ON (C.id = CG.challengeId)
      WHERE CT.id = ${challengeTheme.id}
        AND CG.trigger IN (${triggerValues})
    `,
  })

  const insertTriggers = triggerValues.filter(tv => !challengeTriggers.find(ct => ct.trigger === tv))

  if (insertTriggers.length) {
    const challengeDataMapping = index => ({
      challengeThemeId: challengeTheme.id,
      title: `QA challenge ${index}`,
      status: CHALLENGE_STATUS.DRAFT,
    })

    const insertChallengeData = Array.from({ length: insertTriggers.length }, (_, i) => challengeDataMapping(i))
    const insertedChallenges = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO challenges (challengeThemeId, title, status)
        VALUES ?
      `,
      params: [insertChallengeData.map(c => [c.challengeThemeId, c.title, c.status])],
    })

    const goalDataMapping = index => ({
      challengeId: insertedChallenges.insertId + index,
      trigger: triggerValues[index],
      goal: 1,
      title: triggerKeys[index],
    })

    const insertGoalData = Array.from({ length: insertTriggers.length }, (_, i) => goalDataMapping(i))
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO challengeGoals (challengeId, \`trigger\`, goal, title)
        VALUES ?
      `,
      params: [insertGoalData.map(t => [t.challengeId, t.trigger, t.goal, t.title])],
    })
  }

  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE challenges
      SET status = ${CHALLENGE_STATUS.ACTIVE}
      WHERE challengeThemeId = ${challengeTheme.id}
    `,
  })

  return challengeTheme.id
}

const disableChallenges = async ({ accountId, user, wambiDB }) => {
  const themeData = _getThemeData(accountId)

  let challengeTheme = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT id
      FROM challengeThemes
      WHERE accountId = ${themeData.accountId}
        AND name = '${themeData.name}'
    `,
  })

  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE challenges
      SET status = ${CHALLENGE_STATUS.DRAFT}
      WHERE challengeThemeId = ${challengeTheme.id}
    `,
  })

  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      -- Reset all user challenge goal progress...CY
      UPDATE challengeGoalProgress CGP
      INNER JOIN challengeProgress CP ON (CGP.challengeProgressId = CP.id)
      INNER JOIN challenges C ON (C.id = CP.challengeId)
      INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND accountId = ${accountId})
      SET CGP.progress = 0, CGP.updatedAt = NULL, CGP.completedAt = NULL
      WHERE CP.peopleId = ${user.id};
      -- Reset all user challenge progress...CY
      UPDATE challengeProgress CP
      INNER JOIN challenges C ON (C.id = CP.challengeId)
      INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND accountId = ${accountId})
      SET CP.updatedAt = NULL, CP.completedAt = NULL
      WHERE peopleId = ${user.id};
    `,
  })
}

module.exports = {
  addChallenges,
  disableChallenges,
}
