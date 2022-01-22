import { LESSON_STATUS } from '@utils'

export default async (req, res) => {
  const {
    clientAccount,
    session: { userId },
  } = req

  // We inner join lessonProgress in this query and that will only have lessons this user has access to...EK
  try {
    const lessons = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT L.id, L.order, L.readMinutes, L.summary, L.title, LP.completedAt, LP.step, COUNT(DISTINCT LS.id) totalSteps,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM lessons L
        INNER JOIN lessonProgress LP ON (LP.lessonId = L.id AND LP.peopleId = ${userId})
        INNER JOIN lessonSteps LS ON (LS.lessonId = L.id)
        LEFT JOIN mediaLink ML ON (L.id = ML.tableKey AND ML.tableName = 'lessons' AND ML.usage = 'primary')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE L.accountId = ${clientAccount.id} AND L.status = ${LESSON_STATUS.PUBLISHED}
        GROUP BY L.id
        ORDER BY L.order
      `,
    })

    res.json({ success: true, lessons })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
