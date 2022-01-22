import { getLocations } from '@serverHelpers/people'
import getGroupLocation from '@serverHelpers/groupLocation'
import { GROUP_ACCESS_LEVELS, USER_STATUS } from '@utils/types'

const limit = 20

// returns a max of ${limit} people or group in your account who's name, displayName or firstName contains the search input...JK
export default async (req, res) => {
  let {
    body: { search = '' },
    clientAccount,
    session: { userId },
  } = req

  try {
    const peopleSearchTerm = wambiDB.escapeValue(
      search
        .trim()
        .split(' ')
        .map(s => `${s}%`)
        .join(' ')
    )

    const groupSearchTerm = wambiDB.escapeValue(
      search
        .trim()
        .split(' ')
        .map(s => `%${s}%`)
        .join(' ')
    )

    // search for people in users client account...JK
    const peopleSearchResultsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.jobTitle, P.isSelfRegistered,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.id <> ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
          AND (
            P.firstName LIKE ${peopleSearchTerm}
            OR P.lastName LIKE ${peopleSearchTerm}
            OR P.displayName LIKE ${peopleSearchTerm}
            OR CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName) LIKE ${peopleSearchTerm}
          )
        GROUP BY P.id
        ORDER BY CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName)
        LIMIT ${limit}
      `,
    })

    let combinedSearchResults = []

    // Search for groups in users client account, searchable by any user...PS
    const groupSearchResultsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id, COUNT(PG.id) AS peopleCount, 0 AS isRealm, MYPG.peopleId AS userId
        FROM groups G
        INNER JOIN peopleGroups PG ON (PG.groupId = G.id)
        LEFT JOIN peopleGroups MYPG ON (MYPG.groupId = G.id AND MYPG.peopleId = ${userId})
        INNER JOIN people P ON (P.id = PG.peopleId AND P.status = ${USER_STATUS.ACTIVE})
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        WHERE G.accountId = ${clientAccount.id}
          AND G.name LIKE ${groupSearchTerm}
        GROUP BY G.id
        LIMIT ${limit}
      `,
    })

    const [peopleSearchResults, groupSearchResults] = await Promise.all([peopleSearchResultsQuery, groupSearchResultsQuery])

    if (groupSearchResults.length) {
      const realmSearchResults = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT RGI.groupId AS id, COUNT(DISTINCT P.id) AS peopleCount, 1 AS isRealm, GT.isLocation
          FROM peopleGroups PG
          -- Get list of user owned groups
          INNER JOIN groupIndex UGI ON (PG.groupId = UGI.groupId
            AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
            AND PG.peopleId = ${userId}
          )
          -- Get groups under realm
          INNER JOIN groupIndex RGI ON (UGI.fromGroupId = RGI.groupId AND RGI.groupId IN (?))
          INNER JOIN groups G ON (G.id = RGI.groupId)
          INNER JOIN groupTypes GT ON (G.groupTypeId = GT.id)
          -- Get the child groups people for their realm
          INNER JOIN peopleGroups PG2 ON (PG2.groupId = RGI.fromGroupId)
          INNER JOIN people P ON (P.id = PG2.peopleId AND P.status = 1 AND P.id <> ${userId})
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
          GROUP BY RGI.groupId
        `,
        params: [groupSearchResults.map(({ id }) => id)],
      })

      // Inserts realm behind matching group so they are always grouped together
      groupSearchResults.forEach(g => {
        // Remove user from people count after getting realm if they are in the searched group
        if (g.userId) g.peopleCount -= 1
        // Filter out realms that have the same people count as groups so we don't return redundant groups
        const matchingRealm = realmSearchResults.find(r => r.id === g.id && r.peopleCount !== g.peopleCount)
        if (matchingRealm) {
          // If we match a realm below a group only the user is in, dont include the group
          combinedSearchResults.push(...(g.userId === userId && g.peopleCount === 0 ? [matchingRealm] : [g, matchingRealm]))
        } else if (g.peopleCount > 0) combinedSearchResults.push(g)
      })
    }

    if (combinedSearchResults.length || peopleSearchResults.length) {
      const [groupLocations, locations] = await Promise.all([
        getGroupLocation(clientAccount, combinedSearchResults),
        getLocations(
          clientAccount,
          peopleSearchResults.map(p => p.id),
          userId
        ),
      ])

      // if locations was successful, match each person to their groupName
      // locations array always matches order of ids in peopleList array...JK
      if (locations?.success) locations.groupNames.forEach((location, i) => (peopleSearchResults[i].groupName = location.groupName))

      // combine both results into an array...PS
      return res.json({ searchList: [...groupLocations, ...peopleSearchResults], success: true })
    }
    res.json({ searchList: [], success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ msg: 'Error occurred while searching; check logs', success: false })
  }
}
