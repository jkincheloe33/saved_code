const { redirectRequest, rejectRequest } = require('@serverHelpers/responses')

export default async (req, res) => {
  try {
    if (req.clientAccount.saml2 == null) {
      return rejectRequest({ res, msg: 'SAML2 not configured on this account.' })
    }

    const { identityProvider, serviceProvider } = req.clientAccount.saml2

    serviceProvider.create_login_request_url(identityProvider, {}, (err, location) => {
      if (err != null) {
        console.error(err)
        res.statusCode = 500
        res.end('There was an error during SAML login.  Check logs.')
      } else {
        const relayState = encodeURIComponent(req.url.split('?').slice(1).join('?'))
        redirectRequest({ res, location: `${location}${relayState ? `&RelayState=${relayState}` : ''}` })
      }
    })
  } catch (error) {
    logServerError({ error, req })
  }
}
