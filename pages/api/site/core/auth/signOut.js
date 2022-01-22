const { destroyCookie } = require('nookies')

export default async (req, res) => {
  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE userSessions
        SET lastActivityAt = CURRENT_TIMESTAMP, revoked = 1
        WHERE id = ?
      `,
      params: [req.session.sessionId],
    })

    destroyCookie({ res }, 'tkn', {
      path: '/',
      domain: process.env.COOKIE_DOMAIN,
    })

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
