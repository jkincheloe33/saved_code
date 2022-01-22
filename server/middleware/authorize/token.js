const { rejectRequest } = require('../../helpers/responses')
const { parseCookies } = require('nookies')

const { extendUserSessionForActivity } = require('../../helpers/sessions')
const { verifyJwt } = require('../../helpers/security')

module.exports = {
  requestAuthorized: async (req, res) => {
    let requestCookies = parseCookies({ req })
    if (requestCookies.tkn) {
      try {
        let { s: session, exp } = await verifyJwt(requestCookies.tkn)

        if (session != null) {
          // Destructure the session array into user friendly properties...EK
          let [sessionId, userId, accounts, isSSO, isSelfRegistered = 0] = session

          // Check to see if this token is close to being invalid...EK
          // If so, we should issue a new token and update the session table signature
          const { success } = await extendUserSessionForActivity(sessionId, exp, session, res)

          if (success) {
            accounts = accounts.map(account => {
              const [id, accessLevel] = account
              return {
                id,
                accessLevel,
              }
            })

            session = {
              sessionId,
              userId,
              accounts,
              isSSO: isSSO === 1,
              isSelfRegistered: isSelfRegistered === 1,
            }

            // Apply this session to the request object so it can be used in next handle(s)...EK
            req.session = session
            return true
          } else {
            rejectRequest({ res, code: 401, msg: 'Access Denied; Invalid token' })
            return false
          }
        } else {
          rejectRequest({
            res,
            code: 401,
            msg: 'Access Denied; Invalid token',
          })
          return false
        }
      } catch (error) {
        rejectRequest({ res, code: 401, msg: 'Access Denied; Invalid token' })
        return false
      }
    } else {
      rejectRequest({ res, code: 401, msg: 'Access Denied; Invalid token' })
      return false
    }
  },
  reviewRequest: async (req, res) => {
    let requestCookies = parseCookies({ req })
    if (requestCookies.review_tkn) {
      try {
        let { r: reviewer } = await verifyJwt(requestCookies.review_tkn)

        // TOD: Check to see if this token is close to being invalid (close by configuration)...EK
        // If so, we should issue a new token and update the session table signature

        if (reviewer != null) {
          // Destructure the session array into user friendly properties...EK
          let [id, botSessionId, collectorId] = reviewer

          reviewer = {
            id,
            botSessionId,
            collectorId,
          }

          // Apply this session to the request object so it can be used in next handle(s)...EK
          req.reviewer = reviewer
          return true
        } else {
          rejectRequest({
            res,
            code: 401,
            msg: 'Access Denied; Invalid token',
          })
          return false
        }
      } catch (error) {
        rejectRequest({ res, code: 401, msg: 'Access Denied; Invalid token' })
        return false
      }
    } else {
      rejectRequest({ res, code: 401, msg: 'Access Denied; Invalid token' })
      return false
    }
  },
}
