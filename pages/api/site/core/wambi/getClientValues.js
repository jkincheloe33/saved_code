export default async (req, res) => {
  try {
    const values = await wambiDB.query({
      queryText: /*sql*/ `
          SELECT id, name
          FROM clientValues
          WHERE accountId = ?
          ORDER BY rank ASC;
        `,
      params: [req.clientAccount.id],
    })

    res.json({ success: true, values })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
