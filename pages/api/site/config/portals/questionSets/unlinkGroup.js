export default async (req, res) => {
  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE PQSG
        FROM portalQuestionSetGroups PQSG
        INNER JOIN groups G ON (PQSG.groupId = G.id AND G.accountId = ?)
        WHERE PQSG.id = ?
      `,
      params: [req.clientAccount.id, req.body.id],
    })

    res.json({ success: deleteRes.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
