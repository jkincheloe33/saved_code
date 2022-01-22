import { ACCOUNT_ACCESS_LEVELS, GROUP_ACCESS_LEVELS, removeDuplicates } from '@utils'

export default async (req, res) => {
  try {
    const {
      body: { endDate, endRow = 5, filterGroups = [], filterTraits = [], startDate, startRow = 0, widgetId },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    if (!widgetId) {
      return res.json({ success: false, msg: 'widgetId is a required parameter.' })
    }

    const widgetToRun = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT DISTINCT R.id, R.widgetQuery
        FROM reports R
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = ${userSessionId} AND CAP.accountId = ${clientAccountId})
        WHERE R.id = ?
          AND (R.published = 1 OR CAP.accessLevel > ${ACCOUNT_ACCESS_LEVELS.SYSTEM_ADMIN})
          AND NULLIF(R.widgetQuery, '\n') IS NOT NULL
          AND R.accountId = ${clientAccountId}
      `,
      params: [widgetId],
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

    if (widgetToRun == null || userContext.length === 0) {
      return res.json({ success: false, msg: `Widget ${widgetId} not found or doesn't have a widgetQuery specified.` })
    }
    // Else: Run the widget found!...EK

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
      const queryText = widgetToRun.widgetQuery
        // NOTE SECURITY: This is not securable from a client account perspective, so we cannot give access to anyone without RAW DB access...EK
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

        // Supports: -7, -30, -90, YTD, and DatePicker...PS
        .replace(/\{fromDate\}/g, `${startDate === 'YTD' ? 'CONCAT(YEAR(CURRENT_DATE), "-01-01")' : wambiDB.escapeValue(startDate)}`)
        .replace(/\{toDate\}/g, endDate ? wambiDB.escapeValue(endDate) : 'CURRENT_TIMESTAMP')

        .replace(/\{skip\}/g, startRow)
        .replace(/\{limit\}/g, endRow)

      // Run the widget and return the results to the client...EK
      let widgetResults = await wambiDB.query({ queryText })

      // If the report query returns multiple results (i.e needed variables SET, or TEMP table, etc), pull only the last one for the client...EK
      if (Array.isArray(widgetResults[widgetResults.length - 1])) {
        widgetResults = widgetResults.pop()
      }

      // Else:  Return the results like normal...EK
      res.json({ success: true, widgetResults })
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
