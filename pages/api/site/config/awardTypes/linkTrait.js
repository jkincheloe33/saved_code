export default async (req, res) => {
  try {
    const { awardTypeId, traitId } = req.body

    const linkTraitRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO awardTypeTraits (awardTypeId, traitId)
          SELECT A.id awardTypeId, T.id traitId
          FROM awardTypes A
          INNER JOIN traits T ON (T.id = ?)
          INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
          WHERE A.id = ?

      `,
      params: [traitId, req.clientAccount.id, awardTypeId],
    })

    res.json({ success: linkTraitRes.affectedRows === 1, newLinkId: linkTraitRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
