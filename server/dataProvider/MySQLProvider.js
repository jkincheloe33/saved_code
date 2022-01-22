const MYSQL = require('mysql2')

let __connReadPool = null
let __connWritePool = null

const createConnectionPools = async () => {
  // Based on the environment, build read and write connection pools...EK
  __connReadPool = MYSQL.createPool({
    connectionLimit: Number(process.env.READ_DB_CONNECTION_LIMIT) || 100,
    host: process.env.READ_DB_HOST,
    user: process.env.READ_DB_USER,
    password: process.env.READ_DB_PASSWORD,
    database: process.env.READ_DB_DATABASE,
    multipleStatements: true,
    charset: 'utf8mb4',
    compress: 1,
    timezone: 'Z', // Force it to read UTC.  Let the browser client translate...EK
  })

  __connWritePool = MYSQL.createPool({
    connectionLimit: Number(process.env.WRITE_DB_CONNECTION_LIMIT || process.env.READ_DB_CONNECTION_LIMIT) || 100,
    host: process.env.WRITE_DB_HOST || process.env.READ_DB_HOST,
    user: process.env.WRITE_DB_USER || process.env.READ_DB_USER,
    password: process.env.WRITE_DB_PASSWORD || process.env.READ_DB_PASSWORD,
    database: process.env.WRITE_DB_DATABASE || process.env.READ_DB_DATABASE,
    multipleStatements: true,
    charset: 'utf8mb4',
    compress: 1,
    timezone: 'Z', // Force it to read UTC.  Let the browser client translate...EK
  })
}

const beginTransaction = async () => {
  return await new Promise((resolve, reject) => {
    __connWritePool.getConnection((err, _transactionConn) => {
      if (err) {
        if (err.fatal) _transactionConn?.destroy()
        reject(err)
      } else {
        _transactionConn.beginTransaction(err => {
          if (err) {
            reject(err)
          } else {
            resolve(_transactionConn)
          }
        })
      }
    })
  })
}

const commitTransaction = async transaction => {
  if (transaction == null) {
    throw new Error('No transaction to commit.  Pass transaction returned from beginTransaction().')
  }

  await new Promise((resolve, reject) => {
    transaction.commit(err => {
      if (err) {
        if (err.fatal) transaction?.destroy()
        reject(err)
      } else {
        try {
          transaction.release()
        } catch (error) {
          // Don't report issues with releasing the connection...EK
        }

        resolve()
      }
    })
  })
}

const rollbackTransaction = async transaction => {
  if (transaction == null) {
    throw new Error('No transaction to rollback.  Pass transaction returned from beginTransaction().')
  }

  await new Promise((resolve, reject) => {
    transaction.rollback(err => {
      if (err) {
        if (err.fatal) transaction?.destroy()
        reject(err)
      } else {
        try {
          transaction.release()
        } catch (error) {
          // Don't report issues with releasing the connection...EK
        }

        resolve()
      }
    })
  })
}

const __getReadConnection = async () => {
  return await new Promise((resolve, reject) => {
    __connReadPool.getConnection((err, connection) => {
      if (err) {
        if (err.fatal) connection?.destroy()
        reject(err)
      } else {
        resolve(connection)
      }
    })
  })
}

const __releaseReadConnection = _conn => {
  __connReadPool.releaseConnection(_conn)
}

const __getWriteConnection = async () => {
  return await new Promise((resolve, reject) => {
    __connWritePool.getConnection((err, connection) => {
      if (err) {
        if (err.fatal) connection?.destroy()
        reject(err)
      } else {
        resolve(connection)
      }
    })
  })
}

const __releaseWriteConnection = _conn => {
  __connWritePool.releaseConnection(_conn)
}

const querySingle = async ({ queryText, params, transaction }) => {
  let releaseAfter = false
  if (transaction == null) {
    releaseAfter = true
    transaction = await __getReadConnection()
  }

  return await new Promise((resolve, reject) => {
    transaction.query(queryText, params, (err, results) => {
      if (err) {
        if (err.fatal) {
          transaction?.destroy()
          releaseAfter = false
        }
        reject(err)
      } else {
        resolve(results[0])
      }

      if (releaseAfter) {
        __releaseReadConnection(transaction)
      }
    })
  })
}

const query = async ({ queryText, params, transaction }) => {
  let releaseAfter = false
  if (transaction == null) {
    releaseAfter = true
    transaction = await __getReadConnection()
  }

  return await new Promise((resolve, reject) => {
    transaction.query(queryText, params, (err, results) => {
      if (err) {
        if (err.fatal) {
          transaction?.destroy()
          releaseAfter = false
        }
        reject(err)
      } else {
        resolve(results)
      }

      if (releaseAfter) {
        __releaseReadConnection(transaction)
      }
    })
  })
}

const queryWithFields = async ({ queryText, params, transaction, takeLastResult = false }) => {
  let releaseAfter = false
  if (transaction == null) {
    releaseAfter = true
    transaction = await __getReadConnection()
  }

  return await new Promise((resolve, reject) => {
    transaction.query(queryText, params, (err, results, fields) => {
      if (err) {
        if (err.fatal) {
          transaction?.destroy()
          releaseAfter = false
        }
        reject(err)
      } else {
        // If multiple results sets are returned, we need to pick the last one and then process it...EK
        if (takeLastResult) {
          if (Array.isArray(results[results.length - 1])) {
            results = results.pop()
            fields = fields.pop()
          }
        }

        fields = fields.map(f => f && { name: f.name, ...getDataType(f.columnType) })
        resolve({ results, fields })
      }

      if (releaseAfter) {
        __releaseReadConnection(transaction)
      }
    })
  })
}

const executeNonQuery = async ({ commandText, params, transaction }) => {
  let releaseAfter = false
  if (transaction == null) {
    releaseAfter = true
    transaction = await __getWriteConnection()
  }

  return await new Promise((resolve, reject) => {
    transaction.query(commandText, params, (err, results) => {
      if (err) {
        if (err.fatal) {
          transaction?.destroy()
          releaseAfter = false
        }
        reject(err)
      } else {
        resolve(results)
      }

      if (releaseAfter) {
        __releaseWriteConnection(transaction)
      }
    })
  })
}

module.exports = {
  createConnectionPools,

  escapeValue: MYSQL.escape,
  escapeIdentifier: MYSQL.escapeId,

  beginTransaction,
  commitTransaction,
  rollbackTransaction,

  querySingle,
  query,
  queryWithFields,
  executeNonQuery,
}

// Gets data type of a column based on its columnType...KA
// SEE https://github.com/mysqljs/mysql/blob/master/lib/protocol/constants/types.js
const getDataType = field => {
  const dateTypes = [7, 10, 11, 12, 13, 14, 17, 19]
  const stringTypes = [15, 253, 254]
  const numberTypes = [0, 1, 2, 3, 4, 5, 8, 9, 246]
  const binaryTypes = [249, 250, 251, 252]
  const objectTypes = [245, 247, 248]

  if (dateTypes.includes(field)) return { isDate: true }
  else if (stringTypes.includes(field)) return { isString: true }
  else if (numberTypes.includes(field)) return { isNumber: true }
  else if (binaryTypes.includes(field)) return { isBinary: true }
  else if (objectTypes.includes(field)) return { isObject: true }
  else return { isOther: true }
}
