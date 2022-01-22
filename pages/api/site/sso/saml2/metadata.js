const { rejectRequest } = require('@serverHelpers/responses')

export default async (req, res) => {
  if (req.clientAccount.saml2 == null) {
    return rejectRequest({ res, msg: 'SAML2 not configured on this account.' })
  }

  try {
    const { serviceProvider } = req.clientAccount.saml2

    res.writeHead(200, {
      'Content-Type': 'application/samlmetadata+xml',
    })

    res.end(serviceProvider.create_metadata())
  } catch (error) {
    logServerError({ error, req })
    res.statusCode = 500
    res.end('Error: Check logs')
  }
}
