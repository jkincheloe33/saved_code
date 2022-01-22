import { ACCOUNT_ACCESS_LEVELS, GROUP_ACCESS_LEVELS, removeDuplicates } from '@utils'

export default async (req, res) => {
  try {
    const {
      body: { endDate, endRow = 25, filterGroups = [], filterTraits = [], reportId, startDate, startRow = 0 },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    if (!reportId) {
      return res.json({ success: false, msg: 'reportId is a required parameter.' })
    }

    const reportToRun = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT R.id, R.reportQuery
        FROM reports R
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = ${userSessionId} AND CAP.accountId = ${clientAccountId})
        WHERE R.id = ?
          AND (R.published = 1 OR CAP.accessLevel >= ${ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN})
          AND NULLIF(R.reportQuery, '\n') IS NOT NULL
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
      return res.json({ success: false, msg: `Report ${reportId} not found or doesn't have a reportQuery specified.` })
    }
    // Else: Run the report found for this userContext!...EK

    // Merge the user context into a single record...EK
    userContext = {
      ownedGroupIds: removeDuplicates(userContext.flatMap(uc => [uc.ownedGroupIds])),
      realmGroupIds: removeDuplicates(userContext.flatMap(uc => uc.realmGroupIds?.split(','))),
    }

    if (filterGroups.length) {
      // If filterGroups exists, filter the realmGroupIds and get all descendants...KA
      let filterGroupIds = []

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

      // Prepare the query by replacing placeholders with values...EK
      const queryText = `
    ${reportToRun.reportQuery
      // NOTE: SECURITY: This is not securable from a client account perspective, so we cannot give access to anyone without RAW DB access...EK
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

      .replace(/\{skip\}/g, startRow)
      .replace(/\{limit\}/g, endRow)}
  `

      // Run the report and return the results to the client...EK
      let { results, fields } = await wambiDB.queryWithFields({ queryText, takeLastResult: true })

      res.json({ success: true, reportResults: results, fields })
    } else {
      // console logs added for help with troubleshooting errors...JK
      console.log('================== Empty Filter Issues ==================')
      console.log(JSON.stringify(req.body))
      res.json({ success: false, msg: 'No filter groups were specified' })
    }
  } catch (error) {
    if (req.clientAccount.accessLevel >= ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN) {
      res.json({ success: false, msg: `Query Error occurred: ${error.sqlMessage}` })
    } else {
      logServerError({ error, req })
      res.json({ success: false, msg: 'Error occurred; check server logs.' })
    }
  }
}
