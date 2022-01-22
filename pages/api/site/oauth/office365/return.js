const qs = require('querystring')
const jwt = require('jsonwebtoken')

const { createUserSession, recordLoginAttempt } = require('@serverHelpers/sessions')

import { setCookie, USER_STATUS } from '@utils'

const { parseCookies } = require('nookies')
const fetch = require('node-fetch')

const authorityHost = process.env.OFFICE365_AUTHHOST
const tenant = process.env.OFFICE365_TENANT
const clientId = process.env.OFFICE365_CLIENTID
const clientSecret = process.env.OFFICE365_SECRET
const scope = 'openid profile email'

// This is the endpoint the SSO provider calls with the results of the SSO request...EK
export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req
  const query = req.query,
    cookies = parseCookies({ req })

  try {
    // Check if the auth provider threw an error...EK
    if (query.error != null) {
      console.error(`SSO: ${decodeURIComponent(query.error_description).replace(/\+/g, ' ')}`)
      if (query.error === 'consent_required') {
        query.error = 'User declined to consent to access the app'
      }
      throw new Error(query.error)
    }

    // // Make sure the `state` values match. If not, this is a malicious request.
    if (cookies.authstate !== qs.unescape(query.state)) {
      throw new Error('Invalid State: State does not match')
    }

    // The auth state is valid, get the original query string for later...EK
    const originalQS = JSON.parse(cookies.authstate).qs

    // Encode required params as x-www-form-urlencoded
    const postData = qs.stringify({
      client_id: clientId,
      scope: scope,
      code: query.code,
      redirect_uri: `${req.headers.origin}/api/site/oauth/office365/return`,
      grant_type: 'authorization_code',
      client_secret: clientSecret,
    })

    let body = await fetch(`${authorityHost}/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData,
    })
    body = await body.json()

    const token = jwt.decode(body.id_token)

    // Get the wambi User by loginId / email
    const wambiUser = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        WHERE P.ssoId = ?
          AND P.status = ${USER_STATUS.ACTIVE}
      `,
      params: [token.email],
    })

    if (wambiUser != null) {
      const { msg, sessionToken, sessionId, success } = await createUserSession({ isSSO: 1, req, wambiUser })
      recordLoginAttempt({ req, userId: wambiUser.id, sessionId, isSSO: true })

      if (success) {
        setCookie({ res, token: sessionToken, tokenAlias: 'tkn' })

        // Redirect to the main application
        res.statusCode = 302
        res.setHeader('Location', `/auth/complete${originalQS ? `?${originalQS}` : ''}`)
        res.end()
      } else {
        res.statusCode = 500
        res.end(msg)
      }
    } else {
      recordLoginAttempt({ req, attemptedUser: token.email, isSSO: true })
      res.statusCode = 200
      res.end(`USER ${token.email} NOT FOUND IN WAMBI`)
    }
  } catch (error) {
    logServerError({ error, req })
    const detailedMessage = error ? error.message : 'Office 365 response error'

    const clientMessage = error?.showOnClient ? detailedMessage : 'Office 365 response error'
    res.statusCode = error?.statusCode ? error.statusCode : 500
    res.end(clientMessage)
  }
}
