export default async (req, res) => {
  try {
    let questionSetsForAccount = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT *
        FROM questionSets
        WHERE accountId = ?
      `,
      params: [req.clientAccount.id],
    })

    res.json({ success: true, questionSetsForAccount })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
