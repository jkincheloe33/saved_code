const fs = require('fs')
const path = require('path')

module.exports = {
  isClientSupported: (res, userAgent) => {
    const isIE = 'MSIE|Trident'
    const restrictedClientRegex = new RegExp([isIE].join('|'))

    if (restrictedClientRegex.test(userAgent)) {
      const htmlPath = path.join(__dirname, '/../../public/notSupported.html')
      const stat = fs.statSync(htmlPath)
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-length': stat.size,
      })

      const readStream = fs.createReadStream(htmlPath)
      readStream.pipe(res)
      return false
    }
    return true
  },
}
