// Using custom server.js file to override some default behaviors of next.js and have full control of the handler...EK

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const { applySystemSettings } = require('./middleware/system')
const { requestAuthorized, reviewRequest } = require('./middleware/authorize/token')
const { requestClientAccount } = require('./middleware/account')
const { handleAccessLevelAuthorization, getApiPath } = require('./middleware/authorize/path')
const { isClientSupported } = require('./middleware/client')
const { logServerError } = require('./helpers/log')

const port = process.env.PORT || 3000

app.prepare().then(() => {
  // Initialize the DB connection pools from the ENV credentials...EK
  const DB = require('./dataProvider/MySQLProvider')
  DB.createConnectionPools()

  // Making the DB global so we don't need to import in every file...EK
  global.wambiDB = DB
  global.logServerError = logServerError

  createServer(async (req, res) => {
    try {
      if (!isClientSupported(res, req.headers['user-agent'])) return
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true)
      const { pathname } = parsedUrl

      if ((await requestClientAccount(req, res)) === false) return

      await applySystemSettings(req)

      // Determine if path is an portal or app auth path...CY
      const apiPath = getApiPath(pathname)

      // Check authorization token and account access on the data calls...EK
      //    NOTE: All other authorization page checks are client side which allows for static page processing (MUCH FASTER)...EK
      if (apiPath) {
        if (apiPath === 'portal' && (await reviewRequest(req, res))) {
          handle(req, res, parsedUrl)
        } else if (apiPath === 'app' && (await requestAuthorized(req, res))) {
          // Apply authorization and account middleware...EK
          // Request has a valid token - Allow to continue

          // TEMP FIX:  We run this again because now we have a session.  We re-ordered these without taking that into account
          // This allows for proper account accessLevel to be applied to the request object...EK
          // NOTE: We don't take the response because it won't fail because it will reject above...EK
          // LONG TERM FIX: we need to combine the client account and authorized middleware to account for
          // Unauthorized client account read and actual session client accounts...EK
          await requestClientAccount(req, res)

          // Check if user has the access level to restricted endpoints...CY
          if (!handleAccessLevelAuthorization({ pathname, req, res })) return
          handle(req, res, parsedUrl)
        } else {
          // The middleware has already rejected the request.  Exit...EK
          return
        }
      } else {
        // This is a path that is open to the public (without a valid token)...EK
        handle(req, res, parsedUrl)
      }
    } catch (error) {
      logServerError({ error, req })
      res.statusCode = 500
      if (dev) {
        // Only report issues when in dev mode to the client...EK
        res.end(error.toString())
      } else {
        res.end('Internal Server Error')
      }
    }
  }).listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
