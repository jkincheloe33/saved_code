const { setCookie: generateCookie } = require('nookies')

const setCookie = ({ maxAge = 60 * 60, res, token, tokenAlias }) => {
  generateCookie({ res }, tokenAlias, token, {
    domain: process.env.COOKIE_DOMAIN,
    maxAge,
    path: '/',
    secure: true,
  })
}

module.exports = {
  setCookie,
}
