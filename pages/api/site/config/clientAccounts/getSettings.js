export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      systemSettings,
    } = req

    let { settings } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT settings
        FROM clientAccounts
        WHERE id = ${clientAccountId}
      `,
    })

    // Allow for account level overrides of system settings...KA
    settings.helpSupportUrl = settings.helpSupportUrl || systemSettings.helpSupportUrl
    settings.sentiment = settings.sentiment ?? systemSettings.sentiment

    res.json({ success: true, settings })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
