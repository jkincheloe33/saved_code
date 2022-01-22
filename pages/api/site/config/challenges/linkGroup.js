export default async (req, res) => {
  try {
    const { challengeId, groupId } = req.body

    const linkGroupRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO challengeGroups (challengeId, groupId)
          SELECT C.id challengeId, G.id groupId
          FROM challenges C
          INNER JOIN groups G ON (G.id = ? AND G.accountId = ?)
          LEFT JOIN challengeGroups CG ON (CG.challengeId = C.id AND G.id = CG.groupId)
          WHERE C.id = ?
            AND CG.id IS NULL
      `,
      params: [groupId, req.clientAccount.id, challengeId],
    })

    res.json({ success: linkGroupRes.affectedRows === 1, newLinkId: linkGroupRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
