export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req

  const languages = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT id, language, languageType
      FROM accountLanguage
      WHERE accountId = ${clientAccountId}
    `,
  })

  res.json({ success: true, languages })
}
