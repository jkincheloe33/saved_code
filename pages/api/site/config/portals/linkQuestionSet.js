export default async (req, res) => {
  try {
    const { portalId, questionSetId } = req.body

    const linkRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO portalQuestionSets (portalId, questionSetId)
          SELECT P.id, QS.id
          FROM portals P
          INNER JOIN questionSets QS ON (QS.id = ? AND QS.accountId = ?)
          WHERE P.id = ? AND P.accountId = ?
      `,
      params: [questionSetId, req.clientAccount.id, portalId, req.clientAccount.id],
    })

    res.json({ success: linkRes.affectedRows === 1, newLinkId: linkRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
