export default async (req, res) => {
  try {
    const { groupId, portalQuestionSetId } = req.body

    const linkGroupRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO portalQuestionSetGroups (portalQuestionSetId, groupId)
          SELECT PQS.id, G.id
          FROM portalQuestionSets PQS
          INNER JOIN portals P ON (PQS.portalId = P.id AND P.accountId = ?)
          INNER JOIN groups G ON (G.id = ? AND G.accountId = ?)
          WHERE PQS.id = ?
      `,
      params: [req.clientAccount.id, groupId, req.clientAccount.id, portalQuestionSetId],
    })

    res.json({ success: linkGroupRes.affectedRows === 1, newLinkId: linkGroupRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
