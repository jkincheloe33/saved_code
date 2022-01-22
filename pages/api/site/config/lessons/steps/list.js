export default async (req, res) => {
  try {
    const lessonSteps = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT LS.*
        FROM lessonSteps LS
        INNER JOIN lessons L ON (L.id = LS.lessonId AND L.accountId = ? AND L.id = ?)
        ORDER BY LS.order
    `,
      params: [req.clientAccount.id, req.query.lessonId],
    })

    res.json({ success: true, lessonSteps })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
