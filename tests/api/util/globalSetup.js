const AWS = require('aws-sdk')
const DB = require('../../../server/dataProvider/MySQLProvider')
const { logServerError } = require('../../../server/helpers/log')

const getCreds = async () => {
  try {
    const S3 = new AWS.S3()
    const s3Res = await S3.getObject({
      Bucket: 'wambi-role-based-test-users',
      Key: 'creds.json',
    }).promise()
    return JSON.parse(s3Res.Body)
  } catch (error) {
    console.error(error)
  }
}

exports.mochaHooks = async () => {
  // CI is set true for github action workflow...CY
  require('dotenv').config({ path: process.env.CI || '.env.development.local' })

  const users = await getCreds()
  await DB.createConnectionPools()

  const clientAccount = await DB.querySingle({
    queryText: /*sql*/ `
      SELECT * 
      FROM clientAccounts 
      WHERE host = '${process.env.DEV_ALIAS_HOST_DNS}'
    `,
  })

  return {
    beforeAll(done) {
      global.apiStore = {
        accountId: clientAccount.id,
        users,
      }
      global.wambiDB = DB
      global.logServerError = logServerError
      done()
    },
  }
}
