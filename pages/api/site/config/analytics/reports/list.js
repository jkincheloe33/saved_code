export default async (req, res) => {
  const {
    body: { dashboardId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    let reportsForAccount = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT R.*
        FROM reports R
        INNER JOIN dashboardReports DR ON (R.id = DR.reportId AND DR.dashboardId = ?)
        WHERE R.accountId = ${clientAccountId}
        ORDER BY R.name ASC
    `,
      params: [dashboardId],
    })

    res.json({ success: true, reportsForAccount })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to get report' })
  }
}
