export default async (req, res) => {
  try {
    const { settings } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT settings
        FROM systemSettings
      `,
    })

    res.json({ success: true, settings })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
