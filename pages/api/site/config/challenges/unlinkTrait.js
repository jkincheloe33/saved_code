export default async (req, res) => {
  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE CT
        FROM challengeTraits CT
        INNER JOIN traits T ON (T.id = CT.traitId)
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ?)
        WHERE CT.id = ?
      `,
      params: [req.clientAccount.id, req.body.id],
    })

    res.json({ success: deleteRes.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
