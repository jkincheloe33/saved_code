export default async (req, res) => {
  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE LT
        FROM lessonTraits LT
        INNER JOIN traits T ON (T.id = LT.traitId)
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
        WHERE LT.id = ?
      `,
      params: [req.clientAccount.id, req.body.id],
    })

    res.json({ success: deleteRes.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
