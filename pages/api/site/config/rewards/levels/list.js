export default async (req, res) => {
  try {
    const levels = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RL.*
        FROM rewardLevels RL
        WHERE RL.accountId = ?
        ORDER BY RL.level
      `,
      params: [req.clientAccount.id],
    })

    res.json({ success: true, levels })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
