import { getLocations } from '@serverHelpers/people'
import getGroupLocation from '@serverHelpers/groupLocation'
import { USER_STATUS } from '@utils/types'

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
    const peopleSearchResults = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.jobTitle, P.isSelfRegistered,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage,
          GROUP_CONCAT(G.name ORDER BY G.name ASC SEPARATOR ', ') groupName
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        LEFT JOIN peopleGroups PG ON (P.id = PG.peopleId)
        LEFT JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId)
        LEFT JOIN groups G ON (GI.groupId = G.id)
        LEFT JOIN groupTypes GT ON (G.groupTypeId = GT.id AND GT.isLocation = 1)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.id <> ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
          AND (
            P.firstName LIKE ${peopleSearchTerm}
            OR P.lastName LIKE ${peopleSearchTerm}
            OR P.displayName LIKE ${peopleSearchTerm}
            OR CONCAT(P.firstName, ' ', P.lastName) LIKE ${peopleSearchTerm}
            OR CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName) LIKE ${peopleSearchTerm}
          )
        GROUP BY P.id
        -- Order by relevancy (most relevant on top)
        ORDER BY CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName)
        LIMIT ${limit}
      `,
    })

    // search for groups in users client account...PS
    const groupSearchResults = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id
        FROM groups G
        INNER JOIN peopleGroups PG ON (PG.groupId = G.id)
        WHERE G.accountId = ${clientAccount.id}
          AND G.name LIKE ${groupSearchTerm}
        GROUP BY G.id
        LIMIT ${limit}
      `,
    })

    if (groupSearchResults.length || peopleSearchResults.length) {
      const [groupLocations, peopleLocations] = await Promise.all([
        getGroupLocation(clientAccount, groupSearchResults),
        getLocations(
          clientAccount,
          peopleSearchResults.map(p => p.id),
          userId
        ),
      ])

      // if locations was successful, match each person to their groupName
      // locations array always matches order of ids in searchList array...JK
      if (peopleLocations?.success)
        peopleLocations.groupNames.forEach((location, i) => (peopleSearchResults[i].groupName = location.groupName))

      // combine both results into an array...PS
      return res.json({ searchList: [...groupLocations, ...peopleSearchResults], success: true })
    }
    res.json({ searchList: [], success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ msg: 'Error occurred while searching; check logs', success: false })
  }
}
