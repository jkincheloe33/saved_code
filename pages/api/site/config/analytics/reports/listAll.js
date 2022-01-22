export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req

  try {
    let reportList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT R.*
        FROM reports R
        WHERE R.accountId = ${clientAccountId}
        ORDER BY R.name ASC
      `,
    })

    res.json({ success: true, reportList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to get report' })
  }
}
