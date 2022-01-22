const qs = require('querystring')

const { redirectRequest } = require('@serverHelpers/responses')
const { createUserSession, recordLoginAttempt } = require('@serverHelpers/sessions')

import { setCookie, USER_STATUS } from '@utils'

export default async (req, res) => {
  const { identityClaimUri, identityProvider, serviceProvider } = req.clientAccount.saml2

  try {
    if (req.method === 'GET') return res.json({ success: true })
    serviceProvider.post_assert(identityProvider, { request_body: req.body }, async (error, samlResponse) => {
      if (error != null) {
        logServerError({ additionalInfo: 'Inner error in service provider', error, req })

        res.statusCode = 500
        return res.end('Error occurred: check logs')
      } else {
        // Attempt to read the identity claim based on the specified uri XML namespace...EK
        let ssoUser = samlResponse.user.attributes[identityClaimUri]?.[0]
        if (ssoUser == null) {
          // If the user is still null, attempt to read the upn built in...EK
          ssoUser = samlResponse.user.upn || samlResponse.user.name_id
        }

        // Get the wambi User by loginId / email
        const wambiUser = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT P.id
            FROM people P
            INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${req.clientAccount.id})
            WHERE P.ssoId = ?
              AND P.status = ${USER_STATUS.ACTIVE}
          `,
          params: [ssoUser],
        })

        if (wambiUser != null) {
          const { msg, sessionToken, sessionId, success } = await createUserSession({ isSSO: 1, req, wambiUser })
          recordLoginAttempt({ req, userId: wambiUser.id, sessionId, isSSO: true })

          if (success) {
            setCookie({ res, token: sessionToken, tokenAlias: 'tkn' })

            // Redirect to the main application
            const queryArgs = qs.parse(req.url.split('?').slice(1).join('?'))
            redirectRequest({ res, location: `/auth/complete${queryArgs.RelayState ? `?${queryArgs.RelayState}` : ''}` })
          } else {
            logServerError({ additionalInfo: 'Inner error in creating user session', error: msg, req })
            res.statusCode = 500
            res.end(msg)
          }
        } else {
          recordLoginAttempt({ req, attemptedUser: ssoUser, isSSO: true })
          res.statusCode = 200
          res.end(`USER ${ssoUser} NOT FOUND IN WAMBI`)
        }
      }
    })
  } catch (error) {
    logServerError({ additionalInfo: 'Outer error in catch block', error, req })
    res.statusCode = 500
    return res.end('Error occurred: check logs')
  }
}
