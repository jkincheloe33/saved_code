export default async (req, res) => {
  const {
    body: { dashboardId, reportId },
  } = req

  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE 
        FROM dashboardReports 
        WHERE dashboardId = ? AND reportId = ?
      `,
      params: [dashboardId, reportId],
    })

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to get report' })
  }
}
