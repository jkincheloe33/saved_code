export default async (req, res) => {
  try {
    const deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE PQS
        FROM portalQuestionSets PQS
        INNER JOIN portals P ON (P.id = PQS.portalId AND P.accountId = ?)
        WHERE PQS.id = ?
    `,
      params: [req.clientAccount.id, req.body.id],
    })

    res.json({ success: deleteRes.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
