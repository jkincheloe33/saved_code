import moment from 'moment'
import { ACCOUNT_ACCESS_LEVELS, GROUP_ACCESS_LEVELS, removeDuplicates } from '@utils'

const { sendReport_Email } = require('@serverHelpers/email')
import { createSimpleWorkbook } from '@serverHelpers/excel'
import { rejectRequest } from '@serverHelpers/responses'

export default async (req, res) => {
  try {
    const {
      body: { asCSV, clientTzOffset, emailReport, endDate, filterGroups, filterTraits, startDate, reportId },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId, startRow = 0, endRow = 1000000 },
    } = req

    if (!reportId) return rejectRequest({ msg: 'reportId is a required parameter.' })

    const reportToRun = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT R.name, R.reportQuery
        FROM reports R
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = ${userSessionId} AND CAP.accountId = ${clientAccountId})
        WHERE R.id = ?
          AND (R.published = 1 OR CAP.accessLevel > ${ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN})
          AND R.reportQuery IS NOT NULL
          AND R.accountId = ${clientAccountId}
      `,
      params: [reportId],
    })

    let userContext = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.loginId, PG.groupId ownedGroupIds, GROUP_CONCAT(GI.fromGroupId) realmGroupIds
        FROM people P
        INNER JOIN peopleGroups PG ON (P.id = PG.peopleId AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER})
        INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
        INNER JOIN groupIndex GI ON (G.id = GI.groupId)
        WHERE P.id = ${userSessionId}
        GROUP BY P.loginId, ownedGroupIds;
      `,
    })

    if (reportToRun == null || userContext.length === 0) {
      return rejectRequest({ msg: `Report ${reportId} not found or doesn't have a reportQuery specified.` })
    }
    // Else: Run the report found!...EK

    // Merge the user context into a single record...EK
    userContext = {
      ownedGroupIds: removeDuplicates(userContext.flatMap(uc => [uc.ownedGroupIds])),
      realmGroupIds: removeDuplicates(userContext.flatMap(uc => uc.realmGroupIds?.split(','))),
    }

    // If filterGroups exists, filter the realmGroupIds and get all descendants...KA
    let filterGroupIds = []
    if (filterGroups.length) {
      // Ensure the passed in filter groups are within this user's realm...EK
      filterGroupIds = filterGroups.filter(fg => userContext.realmGroupIds.includes(String(fg)))

      if (filterGroupIds.length) {
        const { filteredRealmIds } = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT GROUP_CONCAT(GI.fromGroupId) filteredRealmIds
            FROM people P
            INNER JOIN groups G ON (G.id IN (${filterGroupIds}) AND G.accountId = ${clientAccountId})
            INNER JOIN groupIndex GI ON (G.id = GI.groupId)
            WHERE P.id = ${userSessionId}
            GROUP BY P.loginId;
          `,
        })
        userContext.realmGroupIds = removeDuplicates(filteredRealmIds?.split(','))
      }
    }

    // Prepare the query by replacing placeholders with values...EK
    const queryText = reportToRun.reportQuery
      .replace(/\{currentUserId\}/g, userSessionId)
      .replace(/\{currentAccountId\}/g, clientAccountId)

      // The groups the user owns...EK
      .replace(/\{ownedGroupIds\}/g, userContext.ownedGroupIds)
      // All groups within the user realm...EK
      .replace(/\{realmGroupIds\}/g, userContext.realmGroupIds)
      // Actual groups selected by the user to filter within the user realm...EK
      .replace(/\{filterGroupIds\}/g, filterGroupIds)

      // Traits selected by user to filter by...KA
      .replace(/\{filterTraitIds\}/g, filterTraits)

      // If we need an image, we need to have access to the media cdn host...EK
      .replace(/\{cdnHost\}/g, process.env.MEDIA_CDN)

      // Supports: -7, -30, -90, YTD
      .replace(/\{fromDate\}/g, `${startDate === 'YTD' ? 'CONCAT(YEAR(CURRENT_DATE), "-01-01")' : wambiDB.escapeValue(startDate)}`)
      .replace(/\{toDate\}/g, endDate ? wambiDB.escapeValue(endDate) : 'CURRENT_TIMESTAMP')

      // Currently we can make limit dynamic with the below, but it's possible we need to force this...EK
      .replace(/\{skip\}/g, startRow)
      .replace(/\{limit\}/g, endRow)

    // Run the report and return the results to the client...EK
    let { fields, results } = await wambiDB.queryWithFields({ queryText, takeLastResult: true })

    fields.forEach(f => {
      if (f.isDate) {
        results.forEach(
          r =>
            (r[f.name] = r[f.name]
              ? moment(r[f.name])
                  .subtract(clientTzOffset / 60, 'hours')
                  .format('lll')
              : '-')
        )
      }
      if (f.isObject && f.name === 'link') results.forEach(r => (r.link = r.link?.link ?? ''))
    })

    const firstRow = results[0]

    let workbook = null
    if (firstRow != null) {
      workbook = createSimpleWorkbook({
        worksheetName: `Export - ${reportToRun.name} - ${req.clientAccount.name}`,
        columns: Object.keys(firstRow).map(key => ({ header: key, key, width: 10 })),
        rows: results,
      }).workbook
    } else {
      // If there are no results, then return an empty workbook...EK
      workbook = createSimpleWorkbook({
        worksheetName: `Export - ${reportToRun.name} - ${req.clientAccount.name}`,
        columns: [],
        rows: [],
      }).workbook
    }

    if (emailReport) {
      const { email, name } = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT P.id, P.email,
            CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
          WHERE P.id = ${userSessionId}
        `,
      })

      const fileExt = asCSV ? 'csv' : 'xlsx'
      const buffer = await workbook[fileExt].writeBuffer()
      const fileName = `Export - ${reportToRun.name}_${moment().format('YYYYMMDD')}`

      sendReport_Email({
        attachment: {
          data: buffer,
          fileName: `${fileName} - ${req.clientAccount.name}.${fileExt}`,
        },
        email,
        name,
        subject: fileName,
      })

      return res.json({ success: true })
    } else {
      if (asCSV) {
        await workbook.csv.write(res)
      } else {
        await workbook.xlsx.write(res)
      }
    }
    res.end()
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
