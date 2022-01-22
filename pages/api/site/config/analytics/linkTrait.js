export default async (req, res) => {
  try {
    const { reportId, traitId } = req.body

    const linkTraitRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO reportTraits (reportId, traitId)
          SELECT R.id, T.id
          FROM reports R
          INNER JOIN traits T ON (T.id = ?)
          INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
          WHERE R.id = ?
      `,
      params: [traitId, req.clientAccount.id, reportId],
    })

    res.json({ success: linkTraitRes.affectedRows === 1, newLinkId: linkTraitRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
