const Busboy = require('busboy')
const fs = require('fs')

module.exports = {
  parseMultipartFormData: async (req, tempFilePath) => {
    if (req.body != null) {
      // In order to parse multipart form data, the default bodyParser must be disabled.
      console.warn(
        'WARNING: Cannot parse multipart form data when nextJS default parser active.  Disable it on this endpoint and try again.'
      )
      console.info('You can disable it by exporting a config object from the endpoint file with api.bodyParser = false')
      return false
    }

    let bb = new Busboy({ headers: req.headers })

    // Await parsing and uploading...EK
    const parsedBody = await new Promise(resolve => {
      const body = {}

      bb.on('file', (fieldName, file, fileName, encoding, mimeType) => {
        const fileBuffer = []
        const tempFile = tempFilePath && fs.createWriteStream(tempFilePath)
        file.on('data', chunk => {
          if (tempFile) {
            tempFile.write(chunk)
          } else {
            fileBuffer.push(...chunk)
          }
        })
        file.on('end', () => {
          const buffer = tempFile ? fs.createReadStream(tempFilePath) : Buffer.from(fileBuffer)

          body[fieldName] = {
            buffer,
            fileName,
            encoding,
            mimeType,
          }
        })
        file.on('error', e => {
          console.log('Parse file err', e)
        })
      })

      bb.on('error', e => {
        console.log('Busboy parse file err', e)
      })

      bb.on('field', (fieldname, val) => {
        body[fieldname] = val
      })

      bb.on('finish', () => {
        resolve(body)
      })

      req.pipe(bb)
    })

    return parsedBody
  },
}
