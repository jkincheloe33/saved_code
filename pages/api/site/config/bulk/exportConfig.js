import { REACTIONS_STATUS, LESSON_STATUS, CPC_TYPES_STATUS, CHALLENGE_STATUS } from '@utils/types'

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req

  const reactions = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT R.id, R.name, R.status, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
      FROM reactions R
      LEFT JOIN mediaLink ML ON (R.id = ML.tableKey AND ML.tableName = 'reactions')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE R.accountId = ${clientAccountId}
        AND R.status = ${REACTIONS_STATUS.ACTIVE}
      ORDER BY R.name ASC
      ;
    `,
  })

  const lessons = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT L.*,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
      FROM lessons L
      LEFT JOIN mediaLink ML ON (L.id = ML.tableKey AND ML.tableName = 'lessons' AND ML.usage = 'primary')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE L.accountId = ${clientAccountId}
        AND L.status = ${LESSON_STATUS.PUBLISHED}
      ;
    `,
  })

  const lessonSteps = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT LS.*,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
      FROM lessonSteps LS
      INNER JOIN lessons L ON (LS.lessonId = L.id AND L.accountId = ${clientAccountId} AND L.status = ${LESSON_STATUS.PUBLISHED})
      LEFT JOIN mediaLink ML ON (LS.id = ML.tableKey AND ML.tableName = 'lessonSteps' AND ML.usage = 'primary')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      ;
    `,
  })

  lessons.forEach(lesson => {
    lesson.steps = lessonSteps.filter(step => step.lessonId === lesson.id)
  })

  const cpcThemes = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT DISTINCT CTH.*
      FROM cpcThemes CTH
      INNER JOIN cpcTypes CT ON (CTH.id = CT.cpcThemeId AND CT.status = ${CPC_TYPES_STATUS.ACTIVE} AND CTH.accountId = ${clientAccountId})
      ;
    `,
  })

  const cpcTypes = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT CT.*,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
      FROM cpcTypes CT
      INNER JOIN mediaLink ML ON (ML.tableName = 'cpcTypes' AND ML.tableKey = CT.id)
      INNER JOIN media M ON (ML.mediaId = M.id AND M.accountId = ${clientAccountId})
      WHERE CT.accountId = ${clientAccountId}
        AND CT.status = ${CPC_TYPES_STATUS.ACTIVE}
      GROUP BY CT.id    -- NOTE: This is due to multiple images from w3 on a single type...EK
      ;
    `,
  })

  cpcThemes.forEach(cpcTheme => {
    cpcTheme.types = cpcTypes.filter(type => type.cpcThemeId === cpcTheme.id)
  })

  const challengeThemes = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT *
      FROM challengeThemes
      WHERE accountId = ${clientAccountId}
      ;
    `,
  })

  const challenges = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT C.*,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
      FROM challenges C
      INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ${clientAccountId})
      LEFT JOIN mediaLink ML ON (C.id = ML.tableKey AND ML.usage = 'challenge' AND ML.tableName = 'challenges')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE C.status <> ${CHALLENGE_STATUS.REMOVED}
      ;
    `,
  })

  const challengeGoals = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT CG.*
      FROM challengeGoals CG
      INNER JOIN challenges C ON (CG.challengeId = C.id AND C.status = ${CHALLENGE_STATUS.ACTIVE})
      INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ${clientAccountId})
      ;
    `,
  })

  challengeThemes.forEach(challengeTheme => {
    challengeTheme.challenges = challenges.filter(challenge => challenge.challengeThemeId === challengeTheme.id)
    challengeTheme.challenges.forEach(challenge => (challenge.goals = challengeGoals.filter(goal => goal.challengeId === challenge.id)))
  })

  const rewardTriggers = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT *
      FROM rewardTriggers
      WHERE accountId = ${clientAccountId}
      ;
    `,
  })

  res.end(
    JSON.stringify(
      {
        challengeThemes,
        cpcThemes,
        lessons,
        reactions,
        rewardTriggers,
      },
      null,
      2
    )
  )
}
