export default async (req, res) => {
  try {
    const { lessonId, traitId } = req.body

    const linkTraitRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO lessonTraits (lessonId, traitId)
          SELECT L.id, T.id
          FROM lessons L
          INNER JOIN traits T ON (T.id = ?)
          INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
          WHERE L.id = ?
      `,
      params: [traitId, req.clientAccount.id, lessonId],
    })

    res.json({ success: linkTraitRes.affectedRows === 1, newLinkId: linkTraitRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
