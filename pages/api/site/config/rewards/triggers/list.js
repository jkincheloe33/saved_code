export default async (req, res) => {
  try {
    const triggers = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RT.*
        FROM rewardTriggers RT
        WHERE RT.accountId = ?
        ORDER BY RT.id
      `,
      params: [req.clientAccount.id],
    })

    res.json({ success: true, triggers })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
