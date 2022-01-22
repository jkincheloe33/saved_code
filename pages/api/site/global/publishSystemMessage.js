export default async (req, res) => {
  const {
    body: { settings },
  } = req

  let transaction

  try {
    transaction = await wambiDB.beginTransaction()

    // Update system settings with newly published message...KA
    const updateSettingsRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE systemSettings
        SET settings = ?
      `,
      params: [JSON.stringify(settings)],
    })

    // Reset all users' systemMessageSeen flag so they see the new message...KA
    if (updateSettingsRes.changedRows === 1) {
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE people
          SET systemMessageSeen = 0
        `,
      })
    }

    await wambiDB.commitTransaction(transaction)

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false })
  }
}
