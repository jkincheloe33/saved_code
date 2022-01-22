export default async (req, res) => {
  try {
    const { groupId, portalId } = req.body

    const linkGroupRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO portalGroups (portalId, groupId)
          SELECT P.id, G.id
          FROM portals P
          INNER JOIN groups G ON (G.id = ? AND G.accountId = ?)
          WHERE P.id = ? AND P.accountId = ?
      `,
      params: [groupId, req.clientAccount.id, portalId, req.clientAccount.id],
    })

    res.json({ success: linkGroupRes.affectedRows === 1, newLinkId: linkGroupRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
