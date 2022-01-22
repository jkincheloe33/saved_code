const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')
const { issueChallenges } = require('@serverHelpers/challenges/issueChallenges')
const { convertPecks } = require('@serverHelpers/rewards/handleRewardProgress')

const { GROUP_ACCESS_LEVELS, LESSON_STATUS, LESSON_WHO_CAN_SEE, TRIGGERS } = require('@utils/types')

//Trigger login data whenever user access the app...CY
export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    session: { isSelfRegistered, userId },
  } = req

  try {
    // creates new lessonProgress if a lesson doesn't have a corresponding lessonProgress row...JK
    const createLessonProgress = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO lessonProgress (lessonId, peopleId)
          SELECT L.id lessonId, ${userId} peopleId
          FROM lessons L
          LEFT JOIN lessonProgress LP ON (LP.peopleId = ${userId} AND L.id = LP.lessonId)
          ${
            isSelfRegistered
              ? `
          INNER JOIN lessonGroups LG ON (LG.lessonId = L.id)
          INNER JOIN groups G ON (G.id = LG.groupId AND G.accountId = ${clientAccountId})
          INNER JOIN peopleGroups PG ON (PG.groupId = G.id AND PG.peopleId = ${userId})`
              : ''
          }
          WHERE L.accountId = ${clientAccountId}
            AND L.status = ${LESSON_STATUS.PUBLISHED}
            AND LP.id IS NULL
            AND (
              -- Anyone can see
              L.whoCanSee = ${LESSON_WHO_CAN_SEE.ANYONE}
                -- Only for team members (check that they don't own anything)
                OR (L.whoCanSee = ${LESSON_WHO_CAN_SEE.TEAM_MEMBERS}
                  AND ${LESSON_WHO_CAN_SEE.TEAM_MEMBERS} IN (
                    SELECT MAX(level)
                    FROM peopleGroups PG
                    INNER JOIN groups G ON (PG.groupId = G.id AND PG.peopleId = ${userId} AND G.accountId = ${clientAccountId})
                  )
                )
                -- Only for delegates/owners (check to see that they own at least one group
                OR (L.whoCanSee = ${LESSON_WHO_CAN_SEE.OWNERS}
                  AND (
                    SELECT MAX(level)
                    FROM peopleGroups PG
                    INNER JOIN groups G ON (PG.groupId = G.id AND PG.peopleId = ${userId} AND G.accountId = ${clientAccountId})
                  ) > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
                )
            )
      `,
    })

    if (isSelfRegistered) {
      const loginData = {
        completedChallenges: [],
        hasNewLessons: createLessonProgress.affectedRows > 0,
      }

      return res.json({
        success: true,
        loginData,
      })
    }

    await issueChallenges({ clientAccountId, req, userId })

    const { completedChallenges, rewardProgress } = await handleChallenges({
      clientAccountId,
      getRewardPercentage: true,
      req,
      triggers: [TRIGGERS.AUTH_SIGN_IN],
      userId,
    })

    const celebrateChallenges = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT C.id challengeId, CP.id challengeProgressId, C.title, C.goalsNeeded, C.rewardIncrement
        FROM challengeProgress CP
        LEFT JOIN challenges C ON (C.id = CP.challengeId)
        INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ${clientAccountId})
        WHERE CP.peopleId = ${userId}
          AND CP.celebrated = 0
          AND CP.completedAt IS NOT NULL
      `,
    })

    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE challengeProgress CP
        LEFT JOIN challenges C ON (C.id = CP.challengeId)
        INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ${clientAccountId})
        SET celebrated = 1
        WHERE CP.peopleId = ${userId}
          AND CP.celebrated = 0
          AND CP.completedAt IS NOT NULL
      `,
    })

    // W3 pecks converted to reward progress...CY
    const w3pecks = await convertPecks({
      clientAccountId,
      req,
      userId,
    })

    if (rewardProgress.success && w3pecks.success) {
      rewardProgress.overallProgress = (rewardProgress.overallProgress ?? 0) + w3pecks.peckPercentage
      rewardProgress.convertedPecks = w3pecks.convertedPecks
    }

    const loginData = {
      completedChallenges: [...completedChallenges, ...celebrateChallenges],
      rewardProgress: rewardProgress,
      hasNewLessons: !w3pecks.convertedPecks && createLessonProgress.affectedRows > 0,
    }

    res.json({
      success: true,
      loginData,
    })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
