const { destroyCookie } = require('nookies')

export default async (req, res) => {
  try {
    if (req.method === 'POST') {
      destroyCookie({ res }, 'review_tkn', {
        path: '/',
        domain: process.env.COOKIE_DOMAIN,
      })
      res.json({ success: true })
    } else return res.json({ success: false, msg: 'Error, bad method.' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
