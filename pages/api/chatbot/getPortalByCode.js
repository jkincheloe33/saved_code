// This is the 1st endpoint chatbot users hit to get a portal name...JC
export default async (req, res) => {
  try {
    let { chatCode } = req.query
    chatCode = chatCode.trim()

    const portalQuery = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT name, shortUid
        FROM portals
        WHERE chatCode = ?
      `,
      params: [chatCode],
    })

    if (portalQuery) {
      res.json({ success: true, portalName: portalQuery.name, portalShortUid: portalQuery.shortUid })
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
