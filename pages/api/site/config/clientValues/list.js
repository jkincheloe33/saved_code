export default async (req, res) => {
  let clientValuesForAccount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT CV.*
      FROM clientValues CV
      WHERE CV.accountId = ?
      ORDER BY CV.rank, CV.name ASC
    `,
    params: [req.clientAccount.id],
  })

  res.json({ success: true, clientValuesForAccount })
}
