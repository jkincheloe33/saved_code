import { login } from './helper'
import { types } from '../../../../support/imports'

const _checkChallenges = (clientAccountId, challenges) => {
  const { CHALLENGE_STATUS } = types
  const triggers = challenges.map(c => c.trigger)
  return cy
    .task('query', {
      queryText: /*sql*/ `
        SELECT CG.trigger
        FROM challengeThemes CT
        INNER JOIN challenges C ON (C.challengeThemeId = CT.id 
          AND CT.accountId = ${clientAccountId}
          AND C.startDate IS NULL 
          AND C.endDate IS NULL
          AND C.status = ${CHALLENGE_STATUS.ACTIVE})
        INNER JOIN challengeGoals CG ON (CG.challengeId = C.id 
          AND CG.trigger IN (${triggers}) 
          AND CG.goal = 1)
        LEFT JOIN challengeTraits CTR ON (C.id = CTR.challengeId AND CTR.id IS NULL)
        LEFT JOIN challengeGroups CGR ON (C.id = CGR.challengeId AND CGR.id IS NULL)
      `,
    })
    .then(triggers => triggers)
}

const _createChallengeTheme = clientAccountId => {
  const themeName = 'QA challenges'
  return cy
    .task('query', {
      queryText: /*sql*/ `
        SELECT id
        FROM challengeThemes 
        WHERE accountId = ${clientAccountId} 
          AND name = '${themeName}'
        LIMIT 1
      `,
    })
    .then(theme => {
      if (theme.length === 0) {
        cy.task('executeNonQuery', {
          commandText: /*sql*/ `
            INSERT INTO challengeThemes (accountId, name) VALUES (${clientAccountId}, '${themeName}');
        `,
        }).then(({ insertId }) => insertId)
      } else {
        return theme[0].id
      }
    })
}

const _insertChallenges = (themeId, missingTriggers) => {
  const { CHALLENGE_STATUS } = types

  return cy
    .task('executeNonQuery', {
      commandText: /*sql*/ `
        INSERT INTO challenges (challengeThemeId, title, status) VALUES ?
      `,
      params: [missingTriggers.map(t => [themeId, t.challengeName, CHALLENGE_STATUS.ACTIVE])],
    })
    .then(({ insertId }) => insertId)
}

const _insertChallengeGoal = (challengesId, missingTriggers) => {
  return cy
    .task('executeNonQuery', {
      commandText: /*sql*/ `
        INSERT INTO challengeGoals (challengeId, goal, \`trigger\`, title) 
        VALUES ?
      `,
      params: [missingTriggers.map((t, i) => [challengesId + i, 1, t.trigger, t.triggerName])],
    })
    .then(res => res)
}

const _clearUserChallengeProgress = (clientAccountId, me) => {
  return cy.task('executeNonQuery', {
    commandText: /*sql*/ `
      -- Reset all user challenge goal progress...CY 
      UPDATE challengeGoalProgress CGP
      INNER JOIN challengeProgress CP ON (CGP.challengeProgressId = CP.id) 
      INNER JOIN challenges C ON (C.id = CP.challengeId)
      INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND accountId = ${clientAccountId}) 
      SET CGP.progress = 0, CGP.updatedAt = NULL, CGP.completedAt = NULL
      WHERE CP.peopleId = ${me.id};
      -- Reset all user challenge progress...CY
      UPDATE challengeProgress CP
      INNER JOIN challenges C ON (C.id = CP.challengeId)
      INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND accountId = ${clientAccountId}) 
      SET CP.updatedAt = NULL, CP.completedAt = NULL
      WHERE peopleId = ${me.id};
    `,
  })
}

/*
 * - Check if challenge triggers exist in challenge goal. If not create new challenge goals
 * - Reset user challenges....CY
 */
export const challengeUpdate = () => {
  const createChallengesTask = ({ clientAccountId, me }) => {
    const { TRIGGERS } = types
    const challenges = [
      { challengeName: 'challenge1', trigger: TRIGGERS.AUTH_SIGN_IN, triggerName: 'login' },
      { challengeName: 'challenge2', trigger: TRIGGERS.PROFILE_ADD_DISPLAY_NAME, triggerName: 'update display name' },
    ]

    return _clearUserChallengeProgress(clientAccountId, me).then(() => {
      // Check if challenge types exist...CY
      _checkChallenges(clientAccountId, challenges).then(triggers => {
        // Find triggers that don't exist...CY
        const missingTriggers = challenges.filter(c => !triggers.some(({ trigger }) => c.trigger === trigger))

        if (missingTriggers.length > 0) {
          _createChallengeTheme(clientAccountId).then(themeId => {
            _insertChallenges(themeId, missingTriggers).then(insertId => {
              _insertChallengeGoal(insertId, missingTriggers)
            })
          })
        }
      })
    })
  }

  login({ task: createChallengesTask })
}
