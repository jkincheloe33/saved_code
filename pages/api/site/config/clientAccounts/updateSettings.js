export default async (req, res) => {
  const {
    body: { settings },
    clientAccount,
  } = req

  try {
    const updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE clientAccounts
        SET settings = ?
        WHERE id = ${clientAccount.id}
      `,
      params: [JSON.stringify(settings)],
    })

    res.json({ success: updateRes.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
