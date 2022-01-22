export default async (req, res) => {
  const {
    body: { dashboardId, reportId },
  } = req

  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO dashboardReports SET ?
      `,
      params: [{ dashboardId, reportId }],
    })

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to get report' })
  }
}
