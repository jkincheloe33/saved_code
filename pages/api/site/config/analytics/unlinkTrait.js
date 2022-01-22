export default async (req, res) => {
  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE RT
        FROM reportTraits RT
        INNER JOIN traits T ON (T.id = RT.traitId)
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
        WHERE RT.id = ?
      `,
      params: [req.clientAccount.id, req.body.id],
    })

    res.json({ success: deleteRes.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
