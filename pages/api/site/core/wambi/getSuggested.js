import { getLocations } from '@serverHelpers/people'
const { USER_STATUS } = require('@utils/types')

const LIMIT = 3

// returns a max of ${limit} users in your group who haven't logged in the longest or at all...JK
export default async (req, res) => {
  try {
    const {
      clientAccount,
      session: { userId },
    } = req

    const suggestedPeople = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.isSelfRegistered,
          IFNULL(NULLIF(P.jobTitleDisplay, ''), P.jobTitle) jobTitle,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        LEFT JOIN peopleGroups PG ON (P.id = PG.peopleId)
        INNER JOIN peopleGroups MYPG ON (MYPG.peopleId = ${userId} AND MYPG.groupId = PG.groupId)
        LEFT JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId)
        INNER JOIN groups G ON (GI.groupId = G.id AND G.accountId = ${clientAccount.id})
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = "thumbnail" AND ML.tableName = "people")
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.id <> ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
        GROUP BY P.id
        ORDER BY P.lastLoginAt, name ASC
        LIMIT ${LIMIT}
      `,
    })

    if (suggestedPeople.length > 0) {
      const locations = await getLocations(
        clientAccount,
        suggestedPeople.map(p => p.id),
        userId
      )

      // if locations was successful, match each person to their groupName
      // locations array always matches order of ids in suggestedPeople array...JK
      if (locations && locations.success) locations.groupNames.forEach((location, i) => (suggestedPeople[i].groupName = location.groupName))
    }

    res.json({ success: true, suggestedPeople })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
