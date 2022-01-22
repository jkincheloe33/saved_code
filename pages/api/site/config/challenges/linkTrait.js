export default async (req, res) => {
  try {
    const { challengeId, traitId } = req.body

    const linkTraitRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO challengeTraits (challengeId, traitId)
          SELECT C.id challengeId, T.id traitId
          FROM challenges C
          INNER JOIN traits T ON (T.id = ?)
          INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
          LEFT JOIN challengeTraits CT ON (CT.challengeId = C.id AND T.id = CT.traitId)
          WHERE C.id = ?
            AND CT.id IS NULL
      `,
      params: [traitId, req.clientAccount.id, challengeId],
    })

    res.json({ success: linkTraitRes.affectedRows === 1, newLinkId: linkTraitRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
