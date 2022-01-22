module.exports = {
  getAccountLanguageByType: async ({ clientAccountId, type }) => {
    const text = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT language
        FROM accountLanguage
        WHERE accountId = ${clientAccountId}
          AND languageType = ${type}
      `,
    })

    return text?.language
  },
}
