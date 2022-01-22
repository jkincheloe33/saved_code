const { signJwt } = require('./security')
const { setCookie } = require('../../utils/cookies')

const authTokenDuration = '1h'
const tokenReissueOffset = 15 * 60 * 1000
const reAuthTokenDuration = '5m'

module.exports = {
  createUserSession: async ({ isSSO = 0, req, wambiUser }) => {
    const transaction = await wambiDB.beginTransaction()

    try {
      const { insertId: sessionId } = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO userSessions (userId) VALUES (?)
        `,
        params: [wambiUser.id],
      })

      // Get the list of accounts this user is associated with...EK
      const accounts = await wambiDB.query({
        transaction,
        queryText: /*sql*/ `
          SELECT accountId, accessLevel
          FROM clientAccountPeople
          WHERE peopleId = ?
        `,
        params: [wambiUser.id],
      })

      // NOTE: We use an array so we don't need to prefix with prop names, saves space and obfuscates the data...EK
      const sessionToken = signJwt(
        {
          s: [sessionId, wambiUser.id, accounts.map(a => [a.accountId, a.accessLevel]), isSSO, wambiUser.isSelfRegistered],
        },
        authTokenDuration
      )

      // Update the session record with the signature.  This is done so we can black list it if needed...EK
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE userSessions SET tokenSignature = ? WHERE id = ?;
          UPDATE people SET lastLoginAt = CURRENT_TIMESTAMP where id = ?;
        `,
        params: [sessionToken.split('.')[2], sessionId, wambiUser.id],
      })

      await wambiDB.commitTransaction(transaction)

      return {
        success: true,
        sessionId,
        sessionToken,
      }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of createUserSession', error, req })
      await wambiDB.rollbackTransaction(transaction)
      return { success: false, msg: 'Failed to create user session' }
    }
  },
  // When a request comes in with a valid token, we check to see if the token is going to expire soon.
  //  If so, we re-issue a new one and update the session so it doesn't expire while being actively used...EK
  extendUserSessionForActivity: async (sessionId, exp, tokenPayload, res) => {
    const tokenExpireTime = new Date(exp * 1000),
      now = new Date()

    if (tokenExpireTime - now < tokenReissueOffset) {
      // This token is being used and is close to expiring, re-issue new token and extend session...EK
      const refreshedToken = signJwt(
        {
          s: tokenPayload,
        },
        authTokenDuration
      )

      // Save the refreshed token signature to the current session so it could be revoked if needed...EK
      wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE userSessions 
          SET tokenSignature = ? 
          WHERE id = ?
        `,
        params: [refreshedToken.split('.')[2], sessionId],
      })

      // Set the tkn cookie on the response, but don't handle it fully...EK
      setCookie({ res, token: refreshedToken, tokenAlias: 'tkn' })
    } else {
      // This token is valid, but not nearing expiring so leave it alone...EK
    }

    // Regardless of the above, update the session that is actively being used (NOT awaited)...EK
    wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE userSessions 
        SET lastActivityAt = CURRENT_TIMESTAMP 
        WHERE id = ?
      `,
      params: [sessionId],
    })

    return { success: true }
  },
  issueReAuthToken: async userId => {
    const reAuthToken = signJwt(
      {
        s: [userId],
      },
      reAuthTokenDuration
    )

    return { reAuthToken }
  },
  recordLoginAttempt: async ({ req, userId = null, sessionId = null, isSSO = false, attemptedUser = null }) => {
    // If the request is handled by a Load Balancer, it will log the LB IP if we don't pull the original IP from here...EK
    let ipAddress = req.headers['x-forwarded-for']

    if (ipAddress == null) {
      // This network is not behind a LB (likely local), use the raw http connection remote address...EK
      ipAddress = req.connection.remoteAddress
    }

    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO loginAttempts SET ?;
      `,
      params: [
        {
          accountId: req.clientAccount.id,
          userId,
          ipAddress,
          sessionId,
          attemptedUser,
          isSSO: isSSO ? 1 : 0,
        },
      ],
    })
  },
}
