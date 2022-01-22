const { rejectRequest } = require('../helpers/responses')
const { ACCOUNT_ACCESS_LEVELS } = require('../../utils/types')

// This is specified in local dev env files so they can alias localhost:3000 to any DNS needed...EK
const devAliasHost = process.env.DEV_ALIAS_HOST_DNS
const port = process.env.PORT || 3000

const saml2 = require('saml2-js')

// map object to cache account IDs with a client account DNS host.
let clientAccounts = null

// Every 60 seconds, refresh the host listing
setInterval(_watchAccounts, 60 * 1000)

module.exports = {
  requestClientAccount: async (req, res) => {
    const { host, origin } = req.headers

    if (clientAccounts == null) {
      await _watchAccounts()
    }

    if (origin == null) {
      // Calculate and set the origin so we can redirect the user to a url within the same origin/host DNS for this client account...EK
      req.headers.origin = `${process.env.NODE_ENV === 'dev' ? 'http://' : 'https://'}${host}`
    }

    const clientHost = devAliasHost && host === `localhost:${port}` ? devAliasHost : host
    let currentClientAccount = clientAccounts.get(clientHost)
    if (currentClientAccount != null) {
      if (req.session == null) {
        // SECURITY: For now, if the session is null, we assume this is public access with VERY limited permissions...EK
        req.clientAccount = {
          ...currentClientAccount,
          accessLevel: ACCOUNT_ACCESS_LEVELS.REVIEWER,
        }

        return true
      } else {
        //Verify that this user's session accounts contains this account.  If not, redirect to the first account in their list...EK
        let sessionAccount = req.session.accounts.find(sAcct => sAcct.id === currentClientAccount.id)

        if (sessionAccount != null) {
          req.clientAccount = {
            ...currentClientAccount,
            accessLevel: sessionAccount.accessLevel,
          }

          return true
        } else {
          rejectRequest({
            res,
            code: 401,
            msg: `Bad request; access denied for account: ${host}`,
          })
          return false
        }
      }
    } else {
      if (req.headers['user-agent'] !== 'ELB-HealthChecker/2.0') {
        // This is an invalid client account request (likely an AWS LB config issue).  Reject..EK
        rejectRequest({
          res,
          msg: 'DNS host account not found.  Sys Admin check DNS settings',
        })
        return false
      } else {
        return true
      }
    }
  },
}

async function _watchAccounts() {
  const accountList = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT CA.*,
        CONCAT('${process.env.MEDIA_CDN}/', MC.category, '/', MC.uid, '.', MC.ext) AS clientTermsUrl,
        CONCAT('${process.env.MEDIA_CDN}/', MS.category, '/', MS.uid, '.', MS.ext) AS selfRegisterTermsUrl
      FROM clientAccounts CA
      LEFT JOIN mediaLink MLC ON (CA.id = MLC.tableKey AND MLC.tableName = 'clientAccounts' AND MLC.usage = 'clientTerms')
      LEFT JOIN media MC ON (MLC.mediaId = MC.id)
      LEFT JOIN mediaLink MLS ON (CA.id = MLS.tableKey AND MLS.tableName = 'clientAccounts' AND MLS.usage = 'selfRegisterTerms')
      LEFT JOIN media MS ON (MLS.mediaId = MS.id)
    `,
  })

  const saml2Accounts = accountList.filter(a => a.settings.saml2)

  saml2Accounts.forEach(a => {
    const { identityClaimUri, identityProviderCert, serviceProviderKey, serviceProviderCert, ssoLoginUrl, ssoLogoutUrl } = a.settings.saml2

    // Initialize the saml2 settings on this account so it can be used in the saml 2 endpoints for each account...EK
    const serviceProvider = new saml2.ServiceProvider({
      entity_id: `https://${a.host}/api/site/sso/saml2/metadata`,
      private_key: Buffer.from(serviceProviderKey, 'base64').toString(),
      certificate: Buffer.from(serviceProviderCert, 'base64').toString(),
      assert_endpoint: `https://${a.host}/api/site/sso/saml2/return`,
      nameid_format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
    })

    const identityProvider = new saml2.IdentityProvider({
      sso_login_url: ssoLoginUrl,
      sso_logout_url: ssoLogoutUrl,
      certificates: [Buffer.from(identityProviderCert, 'base64').toString()],
    })

    // Expose this directly on the client account so it can be used in the endpoint...EK
    a.saml2 = {
      identityClaimUri,
      identityProvider,
      serviceProvider,
    }
  })

  //NOTE: the clientAccounts map is keyed on the host.  This MUST match the host header...EK
  clientAccounts = new Map(accountList.map(a => [a.host, a]))
}
