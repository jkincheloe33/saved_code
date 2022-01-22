const crypto = require('crypto')
const qs = require('querystring')

const authorityHost = process.env.OFFICE365_AUTHHOST
const tenant = process.env.OFFICE365_TENANT
const clientId = process.env.OFFICE365_CLIENTID
const scope = 'openid profile email'

// This is the endpoint that initiates the SSO request/login process...EK
export default async (req, res) => {
  try {
    const buf = crypto.randomBytes(48)
    const token = buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-')

    //Append the original query string to the state token...EK
    const state = JSON.stringify({
      token,
      qs: encodeURIComponent(req.url.split('?').slice(1).join('?') || ''),
    })

    res.setHeader('Set-Cookie', [`authstate=${state}`])

    // Redirect to authorization Url...EK
    res.statusCode = 302
    res.setHeader('Location', createAuthorizationUrl(req, state))
    res.end()
  } catch (error) {
    logServerError({ error, req })
  }
}

const createAuthorizationUrl = (req, state) => {
  const queryString = qs.stringify({
    response_type: 'code',
    scope,
    client_id: clientId,
    redirect_uri: `${req.headers.origin}/api/site/oauth/office365/return`,
    state,
  })

  return `${authorityHost}/${tenant}/oauth2/v2.0/authorize?${queryString}`
}
