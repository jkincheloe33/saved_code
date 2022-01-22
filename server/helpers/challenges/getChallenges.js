import { CHALLENGE_PROGRESS_STATUS, CHALLENGE_STATUS } from '@utils'

module.exports = {
  getChallenges: async ({ clientAccountId, isMe, limit, page = 0, req, userId, userProgress }) => {
    if (req.session?.isSelfRegistered) return { success: true, challenges: [] }

    let userProgressWhereClause = ''
    if (userProgress === CHALLENGE_PROGRESS_STATUS.ACTIVE)
      userProgressWhereClause = `WHERE CP.completedAt IS NULL AND (C.endDate > CURRENT_TIMESTAMP OR C.endDate IS NULL) AND C.status = ${CHALLENGE_STATUS.ACTIVE}`
    else if (userProgress === CHALLENGE_PROGRESS_STATUS.COMPLETE) userProgressWhereClause = 'WHERE CP.completedAt IS NOT NULL'

    let isUser = ''
    if (userProgressWhereClause && !isMe) isUser = ' AND CP.completedAt IS NOT NULL'
    else if (!userProgressWhereClause && !isMe) isUser = 'WHERE CP.completedAt IS NOT NULL'

    let challenges = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT C.id challengeId, CP.id challengeProgressId, C.title, C.description, C.endDate, C.startDate, C.status, C.createdAt, CP.completedAt, C.goalsNeeded,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM challenges C
        INNER JOIN clientAccountPeople CAP ON (CAP.accountId = ? AND CAP.peopleId = ?)
        INNER JOIN challengeProgress CP ON (CP.challengeId = C.id AND CP.peopleId = ?)
        INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ?)
        LEFT JOIN mediaLink ML ON (C.id = ML.tableKey AND ML.usage = "challenge" AND ML.tableName = "challenges")
        LEFT JOIN media M ON (ML.mediaId = M.id)
        ${userProgressWhereClause} ${isUser}
        ORDER BY ISNULL(C.endDate) ASC, C.endDate ASC, C.createdAt DESC
        LIMIT ?, ?
      `,
      params: [clientAccountId, userId, userId, clientAccountId, page * limit, limit],
    })

    if (challenges.length) {
      let challengeGoals = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT CGP.id challengeGoalProgressId, CGP.challengeProgressId, CGP.progress, CGP.completedAt,
          CG.trigger, CG.goal, CG.title, CG.required, CG.triggerCondition
          FROM challengeGoalProgress CGP
          INNER JOIN challengeGoals CG ON (CGP.challengeGoalId = CG.id)
          INNER JOIN challengeProgress CP ON (CP.id = CGP.challengeProgressId AND CP.peopleId = ?)
          WHERE CGP.challengeProgressId IN (?)
        `,
        params: [userId, challenges.map(c => c.challengeProgressId)],
      })

      if (challengeGoals.length) {
        // Merge challenge goals into challenges...JC
        challenges.forEach(c => (c.goals = challengeGoals.filter(cg => cg.challengeProgressId === c.challengeProgressId)))
        return { success: true, challenges }
      }
    }
    return { success: true, challenges: [] }
  },
}
