export default async (req, res) => {
  const {
    body: { code, email, uid },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const person = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM selfRegisterCodes
        WHERE email = ?
          AND accountId = ${clientAccountId}
          AND code = ?
          AND uid = ?
          AND expiresAt > CURRENT_TIMESTAMP
      `,
      params: [email, code, uid],
    })

    if (person) res.json({ success: true })
    else res.json({ success: false, msg: 'Invalid code, please try again.' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
