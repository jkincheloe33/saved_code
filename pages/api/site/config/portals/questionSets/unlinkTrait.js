export default async (req, res) => {
  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE PQST
        FROM portalQuestionSetTraits PQST
        INNER JOIN traits T ON (T.id = PQST.traitId)
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
        WHERE PQST.id = ?
      `,
      params: [req.clientAccount.id, req.body.id],
    })

    res.json({ success: deleteRes.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
