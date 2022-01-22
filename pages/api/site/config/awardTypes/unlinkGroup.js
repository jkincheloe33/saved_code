export default async (req, res) => {
  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE ATG 
        FROM awardTypeGroups ATG
        INNER JOIN groups G ON (ATG.groupId = G.id AND G.accountId = ?)
        WHERE ATG.id = ?
      `,
      params: [req.clientAccount.id, req.body.id],
    })

    res.json({ success: deleteRes.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
