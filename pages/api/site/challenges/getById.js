export default async (req, res) => {
  const {
    body: { challengeId },
    session: { userId },
    clientAccount: { id: clientAccountId },
  } = req
  try {
    let challenge = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT C.id challengeId, CP.id challengeProgressId, C.title, C.description, C.endDate, C.startDate, C.status, C.createdAt, CP.completedAt, C.goalsNeeded,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM challenges C
        INNER JOIN clientAccountPeople CAP ON (CAP.accountId = ? AND CAP.peopleId = ?)
        INNER JOIN challengeProgress CP ON (CP.challengeId = C.id AND CP.peopleId = ?)
        INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ?)
        LEFT JOIN mediaLink ML ON (C.id = ML.tableKey AND ML.usage = "challenge" AND ML.tableName = "challenges")
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE C.id = ?
      `,
      params: [clientAccountId, userId, userId, clientAccountId, challengeId],
    })

    if (challenge) {
      let challengeGoals = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT CGP.id challengeGoalProgressId, CGP.challengeProgressId, CGP.progress, CGP.completedAt, 
          CG.trigger, CG.goal, CG.title, CG.required, CG.triggerCondition
          FROM challengeGoalProgress CGP 
          INNER JOIN challengeGoals CG ON (CGP.challengeGoalId = CG.id)
          INNER JOIN challengeProgress CP ON (CP.id = CGP.challengeProgressId AND CP.peopleId = ?)
          WHERE CGP.challengeProgressId = ?
        `,
        params: [userId, challenge.challengeProgressId],
      })

      if (challengeGoals?.length) challenge.goals = [...challengeGoals]
      else return res.json({ success: false, msg: 'Failed to retrieve challenge' })

      res.json({ success: true, challenge })
    } else {
      res.json({ success: false, msg: 'Failed to retrieve challenge' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
