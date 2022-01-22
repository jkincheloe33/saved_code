export default async (req, res) => {
  try {
    const { lessonId, groupId } = req.body

    const linkGroupRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO lessonGroups (lessonId, groupId)
          SELECT L.id, G.id
          FROM lessons L
          INNER JOIN groups G ON (G.id = ? AND G.accountId = ?)
          WHERE L.id = ?
      `,
      params: [groupId, req.clientAccount.id, lessonId],
    })

    res.json({ success: linkGroupRes.affectedRows === 1, newLinkId: linkGroupRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
