export default async (req, res) => {
  try {
    const lessons = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT L.*
        FROM lessons L
        WHERE L.accountId = ?
        ORDER BY L.order
      `,
      params: [req.clientAccount.id],
    })

    res.json({ success: true, lessons })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
