const AWS = require('aws-sdk')

AWS.config.update({
  region: 'us-east-1',
})

const S3 = new AWS.S3()
const ExcelJS = require('exceljs')

import { chunkDataset } from '@serverHelpers/chunkData'
import { extractCellValue } from '@serverHelpers/excel'
import { Readable } from 'stream'
import { removeDuplicates } from '@utils'

const INGESTION_LOG_TYPES = {
  INFO: 0,
  EXCEPTION: 1,
  WARNING: 2,
  ERROR: 3,
}

const ingestLogger = clientAccount => {
  const { id: accountId } = clientAccount

  const log = message => {
    console.log('DEPRECIATED: ', message)
  }

  const _log = async (type, message, data = null) => {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO ingestionLogs
        SET ?
        ;
      `,
      params: [
        {
          accountId,
          type,
          message,
          data: data ? JSON.stringify(data) : null,
        },
      ],
    })
  }

  const bulkLog = async logs => {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO ingestionLogs (accountId, type, message, data)
        VALUES ?
        ;
      `,
      params: [logs.map(l => [accountId, l.type, l.message, l.data ? JSON.stringify(l.data) : null])],
    })
  }

  const logInfo = async (message, data) => {
    await _log(INGESTION_LOG_TYPES.INFO, message, data)
  }

  const logWarning = async (message, data) => {
    await _log(INGESTION_LOG_TYPES.WARNING, message, data)
  }

  const logException = async (message, data) => {
    await _log(INGESTION_LOG_TYPES.EXCEPTION, message, data)
  }

  const logError = async (message, data) => {
    await _log(INGESTION_LOG_TYPES.ERROR, message, data)
  }

  return { bulkLog, log, logInfo, logWarning, logException, logError, LOG_TYPES: INGESTION_LOG_TYPES }
}

const getIngestFileKey = async (clientPathKey, extensionLimit) => {
  let { Contents: importFiles = [] } = await S3.listObjectsV2({
    Bucket: 'transfer.wambiapp.com',
    Prefix: `${clientPathKey}/`,
  }).promise()

  // For each file found parse the date and limit based on extension (if specified)...EK
  importFiles = importFiles.filter(f => {
    f.LastModified = new Date(f.LastModified)
    if (extensionLimit) {
      return f.Key.split('.').pop() === extensionLimit
    } else {
      return true
    }
  })

  // Order the files in descending order
  importFiles.sort((a, b) => a.LastModified - b.LastModified)

  return importFiles.pop()
}

const parseIngestSourceFiles = async sources => {
  const fileSources = []
  for (let sourceIdx = 0; sourceIdx < sources.length; sourceIdx++) {
    const source = sources[sourceIdx]

    const workbook = new ExcelJS.Workbook()
    const fileExt = source.importFileKey.split('.').pop().toLowerCase()
    if (workbook[fileExt] == null) {
      // This is an invalid extension...EK
      throw new Error(`Invalid file extension for import file: ${fileExt}. (xlsx and csv supported)`)
    }

    // Load the config file from the source..EK
    const configFile = await S3.getObject({
      Bucket: 'transfer.wambiapp.com',
      Key: source.configKey,
    }).promise()

    const config = JSON.parse(configFile.Body.toString())

    // Pull the file to import...EK
    const importFile = await S3.getObject({
      Bucket: 'transfer.wambiapp.com',
      Key: source.importFileKey,
    }).promise()

    const readable = new Readable()
    readable._read = () => {} //  _read is required but you can noop it
    readable.push(importFile.Body)
    readable.push(null) // Must be null terminated...EK

    await workbook[fileExt].read(readable, source.options)

    // Get the first sheet in the workbook
    const worksheet = workbook.getWorksheet(1)

    // TODO: hrId is REQUIRED for each source..EK
    // Any other columns missing (according to the fieldMap object) will be set to NULL...EK

    const columnHeaderRow = worksheet.getRow(config.options.columnHeaderRow || 1)
    config.fieldMap.forEach(fm => {
      if (fm.target.static != null) {
        // This field has a static value, process the target/source so it will work with the ingest table...EK
        // The static value is applied during data pull below...EK
        fm.sourceColumnIdx = null
        if (fm.target.type === 'column') fm.source = `${fm.target.table}_${fm.target.field}`
        else fm.source = `trait_${fm.target.traitTypeId}`
      } else {
        columnHeaderRow.eachCell(rowCell => {
          if (fm.source === rowCell.value) {
            fm.sourceColumnIdx = rowCell.col
            if (fm.target.type === 'column') fm.source = `${fm.target.table}_${fm.target.field}`
            else fm.source = `trait_${fm.target.traitTypeId}`
          }
        })
      }
    })

    // Verify the all fields mapped in the fieldMap are found in the source (and are not static)...EK
    const missingMaps = config.fieldMap.filter(fm => fm.sourceColumnIdx == null && fm.target.static == null)

    if (missingMaps.length > 0) {
      console.log('Maps missing in source:', missingMaps)
      throw new Error('Field map missing source')
    }

    fileSources.push({
      source,
      config,
      workbook,
      worksheet,
    })
  }

  return fileSources
}

const createIngestTableFromSources = async (clientAccount, fileSources, httpReq, logger) => {
  const { host: clientAccountHost, id: clientAccountId } = clientAccount
  logger = logger ?? ingestLogger(clientAccount)

  await logger.logInfo(`Ingesting ${clientAccountHost} (${clientAccountId})`)

  // Now that we have the sources, we need to merge the mapper to make sure we have all sources covered and then push the data to the temp table...EK
  const ingestionTableName = `dataFileIngestion_${clientAccountId}`

  // NOTE: If they have multiple sources and they specify a type in one config and not the other it will create duplicates...EK
  const tempTableFields = fileSources.flatMap(fs =>
    fs.config.fieldMap.map(fm => `${fm.source} ${fm.target.dataType ? fm.target.dataType : 'VARCHAR(100)'}`)
  )

  // Create temporary import table..EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      DROP TABLE IF EXISTS ${ingestionTableName};

      CREATE TABLE ${ingestionTableName} (
        id INT NOT NULL AUTO_INCREMENT,
        peopleId INT NULL,
        groups_clientId VARCHAR(45) NULL,
        groups_id INT NULL,
        groups_orgId INT NULL,
        ${removeDuplicates(tempTableFields).join(', ')},
        PRIMARY KEY (id),
        KEY peopleId (peopleId),
        KEY people_hrId (people_hrId),
        ${tempTableFields.find(f => f.startsWith('people_reportsTo')) ? 'KEY people_reportsTo (people_reportsTo),' : ''}
        KEY groups_clientId (groups_clientId),
        KEY groups_id (groups_id),
        KEY groups_orgId (groups_orgId)
      ) CHARACTER SET = latin1
      ;
    `,
  })

  // Now that we have the temp table for all sources, insert the data from each source...EK
  for (let sourceIdx = 0; sourceIdx < fileSources.length; sourceIdx++) {
    const { config, source, worksheet } = fileSources[sourceIdx]

    await logger.logInfo(`Client File: ${source.importFileKey}`)

    await chunkDataset({
      connection: wambiDB,
      commandText: /*sql*/ `
        INSERT INTO ${ingestionTableName} (${config.fieldMap.map(fm => fm.source).join(', ')})
        VALUES ?
        ;
      `,
      dataRows: worksheet.getRows(config.options.dataStartRow || 2, worksheet.rowCount),
      rowSelector: row =>
        config.fieldMap.map(fm => {
          // NOTE: If fm.sourceColumnIdx is null, the value is static...EK
          const cell = fm.sourceColumnIdx ? row.getCell(fm.sourceColumnIdx) : null
          fm.target.dataType = fm.target.dataType ? fm.target.dataType.toUpperCase() : null
          return extractCellValue(cell, fm.target.dataType === 'DATE') || fm.target.static || fm.target.default || null
        }),
      pageSize: 5000,
    })
  }

  // Now that we have the data in the temp import table, actually perform the import sequence across all sources...EK
  const peopleMapWithHR = removeDuplicates(
    fileSources.flatMap(fs => fs.config.fieldMap.filter(fm => fm.target.table === 'people' && fm.target.field != 'reportsTo')),
    'source'
  )

  // NOTE: We are excluding birthday because these are the fields for update not insert...EK
  const peopleMapWithoutHR = removeDuplicates(
    fileSources.flatMap(fs =>
      fs.config.fieldMap.filter(
        fm =>
          fm.target.table === 'people' && fm.target.field !== 'hrId' && fm.target.field !== 'reportsTo' && fm.target.field !== 'birthday'
      )
    ),
    'source'
  )

  // The data range in excel is not 100% accurate so remove null rows...EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      DELETE FROM ${ingestionTableName}
      WHERE NULLIF(people_hrId, '') IS NULL
      ;
    `,
  })

  // Delete duplicates (from source data)...EK
  let duplicateIngestRecords = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      SELECT MIN(id) AS id
      FROM ${ingestionTableName}
      GROUP BY people_hrId
      HAVING COUNT(*) > 1
      ;
    `,
  })

  while (duplicateIngestRecords.length > 0) {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE FROM ${ingestionTableName}
        WHERE id IN (?)
        ;
      `,
      params: [duplicateIngestRecords.map(({ id }) => id)],
    })

    duplicateIngestRecords = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT MIN(id) AS id
        FROM ${ingestionTableName}
        GROUP BY people_hrId
        HAVING COUNT(*) > 1
        ;
      `,
    })
  }

  await logger.logInfo(`Ingesting temporary table is ready for ingest process (Table: ${ingestionTableName})`)

  // This return here becomes the ingestion context that is passed to all the subsequent ingestion functions...EK
  const hrIdSuffix = `__${clientAccountId}`
  return { clientAccountId, hrIdSuffix, httpReq, ingestionTableName, logger, peopleMapWithHR, peopleMapWithoutHR, tempTableFields }
}

const cleanUpOldFiles = async (clientPathKey, excludeKeys = []) => {
  const { Contents: importFiles = [] } = await S3.listObjectsV2({
    Bucket: 'transfer.wambiapp.com',
    Prefix: `${clientPathKey}/`,
  }).promise()

  // Filter out keys that are excluded...EK
  const filesToRemove = importFiles.filter(f => {
    return !excludeKeys.includes(f.Key)
  })

  if (filesToRemove.length > 0) {
    // Remove the files not in the exclusion list...EK
    await S3.deleteObjects({
      Bucket: 'transfer.wambiapp.com',
      Delete: {
        Objects: filesToRemove.map(({ Key }) => ({ Key })),
      },
    }).promise()
  }
}

module.exports = {
  cleanUpOldFiles,
  createIngestTableFromSources,
  getIngestFileKey,
  parseIngestSourceFiles,
}
