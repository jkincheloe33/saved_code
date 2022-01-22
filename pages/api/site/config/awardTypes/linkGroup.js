export default async (req, res) => {
  try {
    const { awardTypeId, groupId } = req.body

    const linkGroupRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO awardTypeGroups (awardTypeId, groupId)
          SELECT A.id awardTypeId, G.id groupId
          FROM awardTypes A
          INNER JOIN groups G ON (G.id = ? AND G.accountId = ?)
          WHERE A.id = ?
      `,
      params: [groupId, req.clientAccount.id, awardTypeId],
    })

    res.json({ success: linkGroupRes.affectedRows === 1, newLinkId: linkGroupRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
