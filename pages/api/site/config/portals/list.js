export default async (req, res) => {
  let portalsForAccount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT P.*
      FROM portals P
      WHERE P.accountId = ?
      ORDER BY P.name ASC
    `,
    params: [req.clientAccount.id],
  })

  res.json({ success: true, portalsForAccount })
}
