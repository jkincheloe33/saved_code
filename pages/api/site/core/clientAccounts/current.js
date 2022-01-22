export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      systemSettings,
    } = req

    let currentAccount = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT CA.id, CA.name, CA.settings,
          CONCAT('${process.env.MEDIA_CDN}/', MC.category, '/', MC.uid, '.', MC.ext) AS clientTermsUrl,
          CONCAT('${process.env.MEDIA_CDN}/', MS.category, '/', MS.uid, '.', MS.ext) AS selfRegisterTermsUrl
        FROM clientAccounts CA
        LEFT JOIN mediaLink MLC ON (CA.id = MLC.tableKey AND MLC.tableName = 'clientAccounts' AND MLC.usage = 'clientTerms')
        LEFT JOIN media MC ON (MLC.mediaId = MC.id)
        LEFT JOIN mediaLink MLS ON (CA.id = MLS.tableKey AND MLS.tableName = 'clientAccounts' AND MLS.usage = 'selfRegisterTerms')
        LEFT JOIN media MS ON (MLS.mediaId = MS.id)
        WHERE CA.id = ${clientAccountId}
      `,
    })

    currentAccount.languages = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT languageType, language
        FROM accountLanguage
        WHERE accountId = ${clientAccountId}
      `,
    })

    // verify the self register group id is valid
    const selfRegisterGroupId = currentAccount.settings?.selfRegister?.groupId

    if (selfRegisterGroupId) {
      const isGroupValid = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT 1
          FROM groups
          WHERE id = ${selfRegisterGroupId}
            AND accountId = ${clientAccountId}
        `,
      })

      if (!isGroupValid) currentAccount.settings.selfRegister.groupId = undefined
    }

    // Default settings to empty object if missing...EK
    currentAccount.settings = currentAccount.settings || {}

    // Allow for account level overrides of system settings...EK
    currentAccount.settings.helpSupportUrl = currentAccount.settings.helpSupportUrl || systemSettings.helpSupportUrl
    currentAccount.settings.sentiment = currentAccount.settings.sentiment ?? systemSettings.sentiment

    // For security purposes, we need to only pass these settings down to a client.
    // If additional settings are needed, we need to add it to the "include" list below so it will go to the client.
    const {
      disableTermsOfService,
      helpSupportUrl,
      integrations,
      featureToggles,
      newsfeed,
      selfRegister,
      sentiment,
      ssoProvider,
      surveys,
    } = currentAccount.settings

    currentAccount.settings = {
      disableTermsOfService,
      featureToggles,
      helpSupportUrl,
      integrations,
      newsfeed,
      selfRegister,
      sentiment,
      ssoProvider,
      surveys,
    }

    res.json(currentAccount)
  } catch (error) {
    logServerError({ error, req })
    res.json(null)
  }
}
