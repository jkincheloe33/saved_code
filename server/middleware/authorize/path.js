const { rejectRequest } = require('../../helpers/responses')
const { ACCOUNT_ACCESS_LEVELS } = require('../../../utils/types')

module.exports = {
  handleAccessLevelAuthorization: ({ pathname, req, res }) => {
    // Reject request if user is self registered and they are trying to access a path that is not core...KA
    if (req.session?.isSelfRegistered && pathname.indexOf('/core') == -1) {
      rejectRequest({
        res,
        code: 401,
        msg: 'Access denied; User does not have access',
      })

      return false
    }

    const restrictedUrlPaths = {
      automate: {
        alerts: ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN,
        schedule: ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN,
      },
      site: {
        config: ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN,
        global: ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN,
      },
      releaseUpdates: ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN,
    }

    let continueDrilling = true

    // Path constructed by evaluated urls...CY
    let paths = '/api/'

    // Current object being examined...CY
    let urlPath = restrictedUrlPaths
    let restrictedUrlPath

    /*
      This function traverses the restrictedUrlPaths hashMap to retrieve the url restricted access level.
      If an access level is found all the extended paths inherits the level....CY
    */
    while (continueDrilling) {
      // Parse url from pathname...CY
      const currentUrl = pathname.substring(paths.length).split('/')[0]
      // Check if url has existing extended url or access level..CY
      if (urlPath[currentUrl]) {
        // Continue drilling into url...CY
        urlPath = urlPath[currentUrl]
        // Add url to paths...CY
        paths += `${currentUrl}/`
      } else {
        // Stop drilling and check if current url was restricted...CY
        restrictedUrlPath = typeof urlPath === 'number' && urlPath
        continueDrilling = false
      }
    }

    // Check if url is restricted. If not restricted, continue request...CY
    if (restrictedUrlPath) {
      // Check user access level against url restriction..CY
      if (req.clientAccount.accessLevel >= urlPath) {
        return true
      } else {
        // End request early if user doesn't have access...CY
        rejectRequest({
          res,
          code: 401,
          msg: 'Access Denied; Admin access restricted',
        })

        return false
      }
    }
    return true
  },
  getApiPath: pathname => {
    const rootPortalPath = '/api/site/portal'

    // Give nonAuth user access to chatbot response...CY
    if (pathname === rootPortalPath) return null

    const apiPath = pathname.indexOf(rootPortalPath) === 0 ? 'portal' : pathname.indexOf('/api') === 0 ? 'app' : null

    const nonAuthPaths = {
      app: [
        'chatbot',
        'healthCheck',
        'site/core/auth/authWithCreds',
        'site/core/auth/requestCode',
        'site/core/auth/verifyCode',
        'site/core/auth/selfRegister/requestCode',
        'site/core/auth/selfRegister/signUp',
        'site/core/auth/selfRegister/verifyCode',
        'site/core/clientAccounts/current',
        'site/oauth',
        'site/sso',
      ],
      portal: ['/requestCode', '/verifyCode', '/location'],
    }

    // Continue request if rendering a next.js static component (paths that doesn't start with '/api')...CY
    if (apiPath) {
      for (let i = 0; i < nonAuthPaths[apiPath].length; i++) {
        if (pathname.includes(nonAuthPaths[apiPath][i])) {
          return null
        }
      }
    }
    return apiPath
  },
}
