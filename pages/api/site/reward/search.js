import { getLocations } from '@serverHelpers/people'
const { USER_STATUS } = require('@utils/types')

const limit = 20

// returns a max of ${limit} people or group in your account who's name, displayName or firstName contains the search input...JK
export default async (req, res) => {
  let {
    body: { search = '', giftId },
    clientAccount,
    session: { userId },
  } = req

  try {
    // Use the + operator at the start of each word to ensure that is in the results, and use the * at the end for "starts with" behavior.
    // NOTE: We may need to tweak this later with double quotes
    const peopleSearchTerm = wambiDB.escapeValue(
      search
        .trim()
        .split(' ')
        .map(s => `${s}%`)
        .join(' ')
    )

    // search for people in users client account...JK
    const searchList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.jobTitle,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage,
          GROUP_CONCAT(G.name ORDER BY G.name ASC SEPARATOR ', ') AS groupName
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        LEFT JOIN peopleGroups PG ON (P.id = PG.peopleId)
        LEFT JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId)
        LEFT JOIN groups G ON (GI.groupId = G.id)
        LEFT JOIN groupTypes GT ON (G.groupTypeId = GT.id AND GT.isLocation = 1)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail'  AND ML.tableName = 'people')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.id <> ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
          AND P.isSelfRegistered = 0
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

    if (searchList.length) {
      const locations = await getLocations(
        clientAccount,
        searchList.map(p => p.id),
        userId
      )

      // if locations was successful, match each person to their groupName
      // locations array always matches order of ids in searchList array...JK
      if (locations?.success) locations.groupNames.forEach((location, i) => (searchList[i].groupName = location.groupName))

      // check if gift belongs to a group...PS
      const giftGroups = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT groupId
          FROM rewardGiftGroups
          WHERE rewardGiftId = ?
        `,
        params: [giftId],
      })

      let recipientsInGiftGroup = []
      // if gift belongs to a group, get recipients and tag them with true || false, else tag every recipient as true...PS
      if (giftGroups.length && searchList.length) {
        recipientsInGiftGroup = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT DISTINCT PG.peopleId
            FROM groupIndex GI
            INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId IN (${searchList.map(sl => sl.id)}))
            WHERE GI.groupId IN (${giftGroups.map(g => g.groupId)})
          `,
        })
      }
      // check to see if recipient is eligible to receive gift...PS
      searchList.forEach(sl => (sl.isEligible = Boolean(recipientsInGiftGroup.find(r => r.peopleId === sl.id)) || giftGroups.length === 0))

      res.json({ searchList, success: true })
    } else {
      res.json({ searchList: [], success: true })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ msg: 'Error occurred while searching; check logs', success: false })
  }
}
