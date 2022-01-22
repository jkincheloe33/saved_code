const fetch = require('node-fetch')
const { pipeline } = require('stream')
const { promisify } = require('util')

// NOTE: This endpoint will proxy web resources to the caller.  This is needed for editing image content on a canvas, etc...EK
export default async (req, res) => {
  const { url } = req.query

  try {
    // Ensure we are only allowing a proxy through a trusted host (in this case the CDN - others may follow)
    if (url !== null && typeof url === 'string') {
      if (!url.includes(process.env.MEDIA_CDN)) {
        res.statusCode = 404
        return res.end('Not Found. Proxy must be to the Wambi CDN.')
      }

      const streamPipeline = promisify(pipeline)
      const fetchRes = await fetch(url)

      if (fetchRes.ok) {
        // If the request is successful, stream it to the res...EK
        await streamPipeline(fetchRes.body, res)
        res.end()
      } else {
        const fetchResText = await fetchRes.text()
        res.statusCode = fetchRes.status
        res.end(fetchResText)
      }
    } else {
      res.statusCode = 400
      return res.end('Bad Request - url must be supplied.')
    }
  } catch (error) {
    logServerError({ error, req })
  }
}
