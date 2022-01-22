import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { openSheetAndParseRows } from '@serverHelpers/excel'

import { ACCOUNT_ACCESS_LEVELS, GROUP_ACCESS_LEVELS } from '@utils/types'

import { v4 as uuidv4 } from 'uuid'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const { importFile, birthYearIncluded = false } = await parseMultipartFormData(req)

  if (importFile) {
    try {
      let { rows, columnHeaders } = await openSheetAndParseRows({ buffer: importFile.buffer })

      let peopleFields = columnHeaders.filter(ch => ch.startsWith('Trait -') === false)

      // Validate that hrId is in the regular people field list.  If not, we cannot continue...EK
      if (peopleFields.some(f => f === 'hrId') === false) {
        return res.json({ success: false, msg: 'hrId is a required column.  Please use the template and try again.' })
      }

      // Validate and set birthday (as needed) dates...EK
      if (handleDateFields(rows, birthYearIncluded) === false) {
        return res.json({
          success: false,
          msg: 'Non-date Excel fields for birthday or hire date columns.  Please make them dates in Excel and try again.',
        })
      }

      // Detect if the group client id field is specified, if so track it and remove it from the people field array...EK
      let groupField = null
      if (peopleFields.indexOf('Group - Client ID') > -1) {
        groupField = 'Group - Client ID'
        peopleFields = peopleFields.filter(pf => pf !== groupField)
      }

      // Detect if the reports to hr id field is specified, if so track it and remove it from the people field array...EK
      let reportsToField = null
      if (peopleFields.indexOf('Reports To - HR ID') > -1) {
        reportsToField = 'Reports To - HR ID'
        peopleFields = peopleFields.filter(pf => pf !== reportsToField)
      }

      const traitFields = columnHeaders
        .filter(ch => ch.startsWith('Trait -'))
        .map(traitHeader => {
          return {
            name: traitHeader,
            id: Number(traitHeader.split('|')[1]),
          }
        })

      if (traitFields.length > 0) {
        // Check that the columns specified are valid for the current account trait types...EK
        const result = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT 1
            FROM traitTypes
            WHERE id IN (?)
              AND accountId = ?
            HAVING COUNT(id) = ?
          `,
          params: [traitFields.map(tf => tf.id), req.clientAccount.id, traitFields.length],
        })

        if (result == null) {
          return res.json({ success: false, msg: 'One or more trait columns contain invalid IDs.  Please use the template and try again.' })
        }
      }

      // Determine people who are already imported (these become a merge)
      let existingPeople = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT P.id, P.hrId
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleID AND CAP.accountId = ?)
          WHERE hrId IN (?)
        `,
        params: [req.clientAccount.id, rows.map(r => r.hrId)],
      })

      existingPeople = new Map(existingPeople.map(ep => [ep.hrId?.toLowerCase(), ep]))

      // We then need to merge the id found for existing to determine whether we are merging existing, or inserting new people...EK
      let peopleToMerge = []
      let peopleToCreate = []

      rows.forEach(row => {
        let existing = existingPeople.get(row.hrId?.toLowerCase())
        if (existing != null) {
          row.id = existing.id
          peopleToMerge.push(row)
        } else {
          // If there is no loginId provided, default it to the hrId instead...KA
          row.loginId = row.loginId || row.hrId
          peopleToCreate.push(row)
        }
      })

      let transaction = await wambiDB.beginTransaction()

      // Merge existing people...EK
      let mergeRes = await mergePeopleRecords({ peopleFields, peopleToMerge, transaction })

      // If the person doesn't exist, we need to create a new people record
      let createRes = await createPeopleRecords({ req, peopleFields, peopleToCreate, transaction })

      await wambiDB.commitTransaction(transaction)
      transaction = null

      // If there is the reports to HR field, process it...EK
      if (reportsToField != null) {
        const reportsToLinkRes = await linkReportsTo({ req, reportsToField, peopleToMerge, peopleToCreate })
        if (reportsToLinkRes.success === false) {
          return res.json({ success: false, msg: 'People imported, but issue when linking reports to.  Check logs.' })
        }
      }

      // If there are trait fields specified in the import, process them...EK
      if (traitFields.length > 0) {
        const traitLinkRes = await linkTraits({ req, traitFields, peopleToMerge, peopleToCreate })
        if (traitLinkRes.success === false) {
          return res.json({ success: false, msg: 'People imported, but issue when linking traits.  Check logs.' })
        }
      }

      // If there is a group field specified, link people to groups...EK
      if (groupField != null) {
        const groupLinkRes = await linkGroups({ req, groupField, peopleToMerge, peopleToCreate })
        if (groupLinkRes.success === false) {
          return res.json({ success: false, msg: 'People & traits imported, but issue when linking groups.  Check logs.' })
        }
      }

      res.json({
        success: true,
        mergedPeople: mergeRes ? mergeRes.length : 0,
        createdPeople: createRes ? createRes.length : 0,
      })
    } catch (error) {
      logServerError({ error, excludeBody: true, req })
      res.json({ success: false, msg: 'Issue processing your request.  Please try again.  If the issue persists, contact support.' })
    }
  } else {
    res.json({ success: false, msg: 'Unable to parse request.  Check logs.' })
  }
}

async function dropImportTable({ transaction, importTblName }) {
  await wambiDB.executeNonQuery({
    transaction,
    commandText: /*sql*/ `
      DROP TABLE IF EXISTS ${importTblName};
    `,
  })
}

// Date fields MUST be date types or null/undefined.  If the birthYearIncluded is true, allow the year to go to the DB otherwise obfuscate with 1900
function handleDateFields(importRows, birthYearIncluded) {
  for (let rowIdx = 0; rowIdx < importRows.length; rowIdx++) {
    const row = importRows[rowIdx]
    if (row.hireDate != null) {
      if (row.hireDate instanceof Date === false) {
        // All dates must be.. well.. dates...EK
        return false
      }
    }

    if (row.birthday != null) {
      if (row.birthday instanceof Date === false) {
        // All dates must be.. well.. dates...EK
        return false
      }

      if (birthYearIncluded === false) {
        // The birth year should be obfuscated with 1900 as the year...EK
        row.birthday.setFullYear(1900)
      }
    }
  }

  // If the code gets here, all dates are valid and have been updated...EK
  return true
}

async function mergePeopleRecords({ peopleFields, peopleToMerge, transaction }) {
  let mergeRes = null
  if (peopleToMerge.length > 0) {
    mergeRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: peopleToMerge
        .map(
          mergePerson => /*sql*/ `
            UPDATE people
            SET ${peopleFields.map(k => `${k} = ${wambiDB.escapeValue(mergePerson[k])}`).join(', ')}
            WHERE id = ${mergePerson.id};
          `
        )
        .join(''),
    })

    // If we only insert one, it will return a single object result... make array if true...EK
    if (mergeRes.length == null) {
      mergeRes = [mergeRes]
    }
  }

  return mergeRes
}

async function createPeopleRecords({ req, peopleFields, peopleToCreate, transaction }) {
  let createRes = null
  if (peopleToCreate.length > 0) {
    createRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: peopleToCreate
        .map(
          createPerson => /*sql*/ `
            INSERT INTO people (${peopleFields.join(',')})
            VAlUES (${peopleFields.map(k => wambiDB.escapeValue(createPerson[k])).join(',')});
          `
        )
        .join(''),
    })

    // If we only insert one, it will return a single object result... make array if true...EK
    if (createRes.length == null) {
      createRes = [createRes]
    }

    // Track the new insert Id to the create people array...EK
    // NOTE: The ID's and the order of the array are important.  The createRes and peopleToCreate arrays should match in size...EK
    peopleToCreate.forEach((personCreated, i) => {
      personCreated.id = createRes[i].insertId
    })

    // Once we create the person, we need to then link them to the current account...EK
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO clientAccountPeople (accountId, peopleId, accessLevel)
        VALUES ?
      `,
      params: [peopleToCreate.map(personCreated => [req.clientAccount.id, personCreated.id, ACCOUNT_ACCESS_LEVELS.TEAM_MEMBER])],
    })
  }

  return createRes
}

async function linkReportsTo({ req, reportsToField, peopleToMerge, peopleToCreate }) {
  const importTblName = `\`peopleReportsToImport${uuidv4().split('-').reverse()[0]}\``
  let transaction = null

  try {
    transaction = await wambiDB.beginTransaction()

    // Create import table for group links...EK
    // Create a temp import table with the people Ids mapped to reports to HR Ids...EK
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        CREATE TABLE ${importTblName} (
          id int(11) NOT NULL AUTO_INCREMENT,
          peopleId int(11) DEFAULT NULL,
          reportsToHRId varchar(45) DEFAULT NULL,
          PRIMARY KEY (id),
          KEY PEOPLEID (peopleId)
        ) ENGINE=memory;
      `,
    })

    // Populate import table (maps people who actually have reports HR ID assigned)...EK
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO ${importTblName} (peopleId, reportsToHRId)
        VALUES ?;
      `,
      params: [
        [...peopleToMerge, ...peopleToCreate]
          .filter(p => {
            let reportsToVal = p[reportsToField]
            if (reportsToVal) {
              p[reportsToField] = reportsToVal.toString().trim()
              return true
            } else {
              return false
            }
          })
          .map(person => {
            return [person.id, person[reportsToField]]
          }),
      ],
    })

    // Link people to who they report to (Note: If the HR ID specified is bad, no link will be created and it will be skipped)
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE people P
        INNER JOIN (
          SELECT I.peopleId, IP.id reportsToId
          FROM ${importTblName} I
          INNER JOIN people IP on (I.reportsToHRId = IP.hrId)
          INNER JOIN clientAccountPeople CAP on (IP.id = CAP.peopleId AND CAP.accountId = ?)
        ) SI ON (P.id = SI.peopleId)
        SET P.reportsTo = SI.reportsToId
        WHERE P.reportsTo IS NULL OR P.reportsTo != SI.reportsToId
        ;
      `,
      params: [req.clientAccount.id],
    })

    // Drop the import table...EK
    await dropImportTable({ transaction, importTblName })

    // Commit the updates to the database...EK
    await wambiDB.commitTransaction(transaction)

    return { success: true }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in linkReportsTo', error, req })

    if (transaction) {
      await dropImportTable({ transaction, importTblName })
      await wambiDB.rollbackTransaction(transaction)
    }

    return { success: false }
  }
}

async function linkTraits({ req, traitFields, peopleToMerge, peopleToCreate }) {
  const importTblName = `\`peopleTraitImport${uuidv4().split('-').reverse()[0]}\``
  const traitFieldNames = traitFields.map(tf => `\`trait-${tf.id}\``)

  let transaction = null

  try {
    // Create a new transaction for the trait import...EK
    transaction = await wambiDB.beginTransaction()

    // Create a temp import table with the people Ids mapped to trait values...EK
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        CREATE TABLE ${importTblName} (
          id int(11) NOT NULL AUTO_INCREMENT,
          peopleId int(11) DEFAULT NULL,
          ${traitFieldNames.map(tf => `${tf} varchar(100) DEFAULT NULL`).join(',')},
          PRIMARY KEY (id),
          KEY PEOPLEID (peopleId)
        ) ENGINE=memory;
      `,
    })

    // Import trait fields with people Ids
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO ${importTblName} (peopleId, ${traitFieldNames.join(',')})
        VALUES ?;
      `,
      params: [
        [...peopleToMerge, ...peopleToCreate].map(person => {
          return [
            person.id,
            ...traitFields.map(tf => {
              let traitVal = person[tf.name]
              if (typeof traitVal === 'string') {
                return traitVal.trim()
              } else {
                return null
              }
            }),
          ]
        }),
      ],
    })

    // Merge the trait source to the trait linkers (all trait import fields) (If missing, create link)
    for (let i = 0; i < traitFieldNames.length; i++) {
      const traitField = traitFieldNames[i]
      const traitTypeId = traitFields[i].id

      // Create traits that may be missing from the import...EK
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO traits (traitTypeId, name)
            SELECT DISTINCT ?, I.${traitField}
            FROM ${importTblName} I
            LEFT JOIN traits T ON (T.traitTypeId = ? AND I.${traitField} = T.name)
            WHERE T.id IS NULL
        `,
        params: [traitTypeId, traitTypeId],
      })

      // Technically these might be able to run in parallel, but since they are updating the same table, it may not actually give much benefit...EK
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO peopleTraits (peopleId, traitId)
            SELECT I.peopleId, T.id
            FROM people P
            INNER JOIN ${importTblName} I ON (P.id = I.peopleId AND NULLIF(I.${traitField}, '') IS NOT NULL)
            LEFT JOIN traits T ON (T.traitTypeId = ? AND I.${traitField} = T.name)
            LEFT JOIN (
              -- Existing trait links...EK
              SELECT P.id as peopleId, T.id as traitId
              FROM people P
              LEFT JOIN peopleTraits PT ON (P.id = PT.peopleId)
              INNER JOIN traits T on (PT.traitId = T.id AND T.traitTypeId = ?)
            ) ET ON (P.id = ET.peopleId AND T.id = ET.traitId)
            WHERE ET.peopleId IS NULL	-- Meaning there isn't an existing trait link to this person...EK
        `,
        params: [traitTypeId, traitTypeId],
      })
    }

    await dropImportTable({ transaction, importTblName })

    await wambiDB.commitTransaction(transaction)
    return { success: true }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in linkTraits', error, req })

    if (transaction) {
      await dropImportTable({ transaction, importTblName })
      await wambiDB.rollbackTransaction(transaction)
    }

    return { success: false, msg: 'Error occurred while processing traits; check logs.' }
  }
}

async function linkGroups({ req, groupField, peopleToMerge, peopleToCreate }) {
  const importTblName = `\`peopleGroupImport${uuidv4().split('-').reverse()[0]}\``
  let transaction = null

  try {
    transaction = await wambiDB.beginTransaction()

    // Create import table for group links...EK
    // Create a temp import table with the people Ids mapped to group client Ids...EK
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        CREATE TABLE ${importTblName} (
          id int(11) NOT NULL AUTO_INCREMENT,
          peopleId int(11) DEFAULT NULL,
          importGroup varchar(45) DEFAULT NULL,
          PRIMARY KEY (id),
          KEY PEOPLEID (peopleId)
        ) ENGINE=memory;
      `,
    })

    // Populate import table (maps people who actually have group id assigned)...EK
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO ${importTblName} (peopleId, importGroup)
        VALUES ?;
      `,
      params: [
        [...peopleToMerge, ...peopleToCreate]
          .filter(p => {
            let groupVal = p[groupField]
            if (groupVal) {
              p[groupField] = groupVal.toString().trim()
              return true
            } else {
              return false
            }
          })
          .map(person => {
            return [person.id, person[groupField]]
          }),
      ],
    })

    // Link people to groups if not already linked
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO peopleGroups (peopleId, groupId, level)
          SELECT I.peopleId, G.id, ?
          FROM ${importTblName} I
          INNER JOIN groups G ON (I.importGroup = G.clientId AND G.accountId = ?)
          LEFT JOIN peopleGroups PG ON (G.id = PG.groupId AND PG.peopleId = I.peopleId)
          WHERE PG.id IS NULL		-- Meaning this person is not associated with this group already
        ;
      `,
      params: [GROUP_ACCESS_LEVELS.TEAM_MEMBER, req.clientAccount.id],
    })

    // Drop the import table...EK
    await dropImportTable({ transaction, importTblName })

    // Commit the updates to the database...EK
    await wambiDB.commitTransaction(transaction)

    return { success: true }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in linkGroups', error, req })

    if (transaction) {
      // Drop the import table...EK
      await dropImportTable({ transaction, importTblName })
      await wambiDB.rollbackTransaction(transaction)
    }

    return { success: false }
  }
}
