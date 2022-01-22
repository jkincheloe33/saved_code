// get cpcTypeId based on cpcId...JK
export default async (req, res) => {
  const {
    body: { cpcId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const id = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT cpcTypeId
        FROM cpc
        WHERE id = ?
          AND accountId = ${clientAccountId}
      `,
      params: [cpcId],
    })

    if (id) res.json({ success: true, cpcTypeId: id.cpcTypeId })
    else res.json({ success: false })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
