const AWS = require('aws-sdk')

AWS.config.update({
  region: 'us-east-1',
})

const S3 = new AWS.S3()
const ExcelJS = require('exceljs')

import { extractCellValue } from '@serverHelpers/excel'
import { Readable } from 'stream'
import { uploadMedia } from '@serverHelpers/media'

// NOTE: This function works, but does have some caveats
//    In order for this to work, the image MUST be exactly only in one cell row (otherwise it might not link properly)
//    We use the bl in the range and assume that is the row the image is associated with...EK
//    HARD CODED: Right now the Hr id must be the next cell immediately to the left of the image
const importPeopleImages = async (source, clientAccount) => {
  const workbook = new ExcelJS.Workbook()

  // Pull the file to import...EK
  const importFile = await S3.getObject({
    Bucket: 'transfer.wambiapp.com',
    Key: source.importFileKey,
  }).promise()

  const readable = new Readable()
  readable._read = () => {} //  _read is required but you can noop it
  readable.push(importFile.Body)
  readable.push(null) // Must be null terminated...EK

  await workbook.xlsx.read(readable)

  // Get the first sheet in the workbook
  const worksheet = workbook.getWorksheet(1)

  let imagesForImport = worksheet.getImages().map(image => {
    const media = workbook.model.media.find(m => m.index === image.imageId)

    // HARD CODED: Right now the Hr id must be the next cell immediately to the left of the image
    const hrId = extractCellValue(worksheet.getRow(image.range.br.nativeRow).getCell(image.range.br.nativeCol))
    return { hrId, media }
  })

  // Find people who are in the import via the hrId, but don't have a profile image uploaded...EK
  const peopleWithMissingProfileImgs = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT CAP.peopleId, P.hrId
      FROM people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id})
      LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.tableName = 'people' AND (ML.usage = 'thumbnail' OR ML.usage = 'pendingThumbnail'))
      WHERE ML.id IS NULL				-- They don't already have a profile picture uploaded...EK
        AND P.hrId IN (?)
    `,
    params: [imagesForImport.map(i => i.hrId)],
  })

  console.log(`Importing ${peopleWithMissingProfileImgs.length} profile images...`)

  for (let i = 0; i < peopleWithMissingProfileImgs.length; i++) {
    let person = peopleWithMissingProfileImgs[i]

    console.log(`Importing profile image... ${person.hrId} ( ${(i / peopleWithMissingProfileImgs.length) * 100} % )`)

    // Merge the incoming media to the people missing their profile images...EK
    person = { ...person, ...imagesForImport.find(img => img.hrId === person.hrId) }
    if (person.media == null) continue

    const { success, mediaRecord } = await uploadMedia({
      clientAccount,
      mediaBuffer: person.media.buffer,
      mediaCategory: 'profile',
      fileName: `${person.media.name}.${person.media.extension}`,
      mimeType: `image/${person.media.extension}`,
    })

    if (success) {
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO mediaLink (mediaId, tableName, tableKey, \`usage\`)
          VALUES ?;
        `,
        params: [
          [
            [mediaRecord.id, 'people', person.peopleId, 'thumbnail'],
            [mediaRecord.id, 'people', person.peopleId, 'original'],
          ],
        ],
      })
    } else {
      console.log(`Filed to upload image for ${person.hrId}`)
    }
  }
}

module.exports = {
  importPeopleImages,
}
