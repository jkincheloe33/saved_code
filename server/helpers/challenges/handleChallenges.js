const checkTriggerConditions = require('./checkTriggerConditions')
const { updateProgress } = require('../rewards/handleRewardProgress')
import { CHALLENGE_STATUS } from '@utils'

module.exports = {
  handleChallenges: async ({
    clientAccountId,
    getRewardPercentage = false,
    increment = 1,
    isMe = true,
    noCelebration,
    req,
    skipRewardProgress,
    triggers,
    triggerArgs,
    userId,
    userIds,
  }) => {
    if (req.session?.isSelfRegistered) return { completedChallenges: [], success: true }

    userIds = userIds ?? [userId]
    let transaction

    try {
      let rewardProgress
      let completedChallenges = []
      let activeChallengeGoalsByTrigger = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT CGP.id challengeGoalProgressId, CGP.challengeProgressId, CGP.progress, CG.goal, CG.triggerCondition, CG.trigger
          FROM challengeGoalProgress CGP
          INNER JOIN challengeGoals CG ON (CGP.challengeGoalId = CG.id)
          LEFT JOIN challenges C ON (C.id = CG.challengeId AND (C.endDate > CURRENT_TIMESTAMP OR C.endDate IS NULL) AND C.status = ${CHALLENGE_STATUS.ACTIVE})
          INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ?)
          INNER JOIN challengeProgress CP ON (CP.id = CGP.challengeProgressId AND CP.peopleId IN (?))
          WHERE CGP.completedAt IS NULL
            AND CG.trigger IN (?)
        `,
        params: [clientAccountId, userIds, triggers],
      })

      if (activeChallengeGoalsByTrigger.length) {
        if (triggerArgs) {
          // Map challenges into itself or a promise...CY
          const conditionChecks = activeChallengeGoalsByTrigger.map(acg =>
            !acg.triggerCondition ? acg : checkTriggerConditions[acg.trigger](triggerArgs, acg)
          )

          //Run all checks and filtered data without value...CY
          activeChallengeGoalsByTrigger = (await Promise.all(conditionChecks)).filter(Boolean)
        }

        let activeChallenges = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT C.id challengeId, CP.id challengeProgressId, C.title, C.goalsNeeded, COUNT(CGP.completedAt) completedChallengeGoals,
            COUNT(DISTINCT CG.id) activeChallengeGoals
            FROM challengeProgress CP
            LEFT JOIN challenges C ON (C.id = CP.challengeId AND (C.endDate > CURRENT_TIMESTAMP OR C.endDate IS NULL))
            INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ?)
            LEFT JOIN challengeGoalProgress CGP ON (CP.id = CGP.challengeProgressId)
            LEFT JOIN challengeGoals CG ON (CGP.challengeGoalId = CG.id)
            WHERE CP.peopleId IN (?)
              AND CP.completedAt IS NULL
            GROUP BY CP.id
          `,
          params: [clientAccountId, userIds],
        })

        // Merge challenge goals into challenges...JC
        activeChallenges.forEach(
          c => (c.goals = activeChallengeGoalsByTrigger.filter(cg => cg.challengeProgressId === c.challengeProgressId))
        )

        completedChallenges = activeChallenges.filter(c => {
          const newCompletedGoals = c.goals.filter(cg => cg.progress + increment >= cg.goal)
          const totalCompletedGoals = c.completedChallengeGoals + newCompletedGoals.length
          return c.goalsNeeded ? totalCompletedGoals >= c.goalsNeeded : totalCompletedGoals === c.activeChallengeGoals
        })

        transaction = await wambiDB.beginTransaction()

        if (activeChallengeGoalsByTrigger.length) {
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              UPDATE challengeGoalProgress CGP
              LEFT JOIN challengeGoals CG ON (CG.id = CGP.challengeGoalId)
              INNER JOIN challengeProgress CP ON (CP.id = CGP.challengeProgressId AND CP.peopleId IN (?))
              SET CGP.completedAt = IF(CGP.progress + ? >= CG.goal,
                CURRENT_TIMESTAMP, NULL),
                CGP.updatedAt = CURRENT_TIMESTAMP,
                CGP.progress = CGP.progress + ?
              WHERE CGP.id IN (?)
            `,
            params: [userIds, increment, increment, activeChallengeGoalsByTrigger.map(c => c.challengeGoalProgressId)],
          })
        }

        if (completedChallenges.length) {
          const updateCelebrated = !isMe || noCelebration ? ', celebrated = 0' : ''
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              UPDATE challengeProgress
              SET completedAt = CURRENT_TIMESTAMP
              ${updateCelebrated}
              WHERE id IN (?)
            `,
            params: [completedChallenges.map(c => c.challengeProgressId)],
          })
        }

        await wambiDB.commitTransaction(transaction)
      }

      if (!skipRewardProgress) {
        // Post process to progress reward progression with completed challenge and triggers...CY
        rewardProgress = await updateProgress({
          completedChallenges,
          clientAccountId,
          req,
          triggers,
          userId: isMe && (completedChallenges.length || getRewardPercentage) && userIds[0],
          userIds,
        })
      }

      return { success: true, completedChallenges, rewardProgress }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of handleChallenges', error, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      return { success: false }
    }
  },
}
