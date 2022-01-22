export default async (req, res) => {
  let challengeThemesForAccount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT CT.*
      FROM challengeThemes CT
      WHERE CT.accountId = ?
      ORDER BY CT.name ASC
    `,
    params: [req.clientAccount.id],
  })

  res.json({ success: true, challengeThemesForAccount })
}
