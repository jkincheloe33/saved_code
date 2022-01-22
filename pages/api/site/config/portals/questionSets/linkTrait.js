export default async (req, res) => {
  try {
    const { portalQuestionSetId, traitId } = req.body

    const linkTraitRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO portalQuestionSetTraits (portalQuestionSetId, traitId)
          SELECT PQS.id, T.id
          FROM portalQuestionSets PQS
          INNER JOIN portals P ON (P.id = PQS.portalId AND P.accountId = ?)
          INNER JOIN traits T ON (T.id = ?)
          INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
          WHERE PQS.id = ?
      `,
      params: [req.clientAccount.id, traitId, req.clientAccount.id, portalQuestionSetId],
    })

    res.json({ success: linkTraitRes.affectedRows === 1, newLinkId: linkTraitRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
