const AWS = require('aws-sdk')
const { clientSettingsSchema } = require('@utils')

AWS.config.update({
  region: 'us-east-1',
})

const S3 = new AWS.S3()

const buildMediaRecKey = ({ category, uid, ext }) => `${category}/${uid}.${ext}`

module.exports = {
  deleteObjectFromCDN: async mediaRecord => {
    let deleteRes = await new Promise((resolve, reject) => {
      S3.deleteObject(
        {
          Bucket: process.env.MEDIA_CDN_S3_BUCKET,
          Key: buildMediaRecKey(mediaRecord),
        },
        (error, results) => {
          if (error) {
            console.error('SWS S3 Upload Error', error)
            reject(error)
          } else {
            resolve(results)
          }
        }
      )
    })

    return deleteRes
  },
  deleteObjectsFromCDN: async mediaRecords => {
    const MAX_RECORDS = 1000
    let page = 0
    let deletedFromS3 = []
    while (page < mediaRecords.length) {
      const chunk = mediaRecords.slice(page, page + MAX_RECORDS)
      const s3ParamList = {
        Bucket: process.env.MEDIA_CDN_S3_BUCKET,
        Delete: {
          Objects: chunk.map(m => ({ Key: buildMediaRecKey(m) })),
          Quiet: true,
        },
      }

      const deleteRes = await new Promise((resolve, reject) => {
        S3.deleteObjects(s3ParamList, (error, results) => {
          if (error) {
            reject(error)
          } else {
            resolve(results)
          }
        })
      })

      deletedFromS3 = deletedFromS3.concat(deleteRes)
      page += MAX_RECORDS
    }

    return deletedFromS3
  },
  uploadBufferToCDN: async (buffer, mediaRecord) => {
    let uploadRes = await new Promise((resolve, reject) => {
      S3.upload(
        {
          Bucket: process.env.MEDIA_CDN_S3_BUCKET,
          Key: buildMediaRecKey(mediaRecord),
          Body: buffer,
          ContentType: mediaRecord.mimeType,
        },
        (error, results) => {
          if (error) {
            console.error('SWS S3 Upload Error', error)
            reject(error)
          } else {
            resolve(results)
          }
        }
      )
    })

    return uploadRes
  },

  getSentimentScore: async ({ content, req }) => {
    try {
      const { clientAccount, systemSettings } = req
      const comprehend = new AWS.Comprehend()

      const { negativeThreshold } = clientAccount?.settings?.sentiment ?? systemSettings?.sentiment ?? clientSettingsSchema.sentiment

      // AWS default whitelist...JC
      const langWhitelist = ['ar', 'hi', 'ko', 'zh-TW', 'ja', 'zh', 'de', 'pt', 'en', 'it', 'fr', 'es']

      const { Languages } = await new Promise((resolve, reject) => {
        comprehend.detectDominantLanguage({ Text: content }, (error, results) => {
          if (error) {
            reject(error)
          } else {
            resolve(results)
          }
        })
      })

      let LanguageCode
      // get language based on highest language score. If it fails it defaults to English...PS
      if (Languages.length) {
        ;({ LanguageCode } = Languages.reduce((dominantLang, l) => (!dominantLang || l.Score > dominantLang.Score ? l : dominantLang)))
      }

      if (!langWhitelist.includes(LanguageCode)) LanguageCode = 'en'
      const { SentimentScore: sentimentScore } = await new Promise((resolve, reject) => {
        comprehend.detectSentiment({ Text: content, LanguageCode }, (error, results) => {
          if (error) {
            reject(error)
          } else {
            resolve(results)
          }
        })
      })

      // Set score to two decimal places...CY
      Object.keys(sentimentScore).forEach(k => (sentimentScore[k] = parseFloat(sentimentScore[k].toFixed(2))))

      return {
        isPositive: sentimentScore.Negative <= negativeThreshold,
        sentiment: JSON.stringify(sentimentScore),
        success: true,
      }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of getSentimentScore', error, req })
      return { sentiment: null, success: false }
    }
  },
}
