const { USER_STATUS } = require('@utils/types')
import { getLocations } from '@serverHelpers/people'

// gets your direct reports and orders them by those with images first then alphabetically...JC & JK
// LOWER(name) is needed due to utf8mb4 collation on the display name so it doesn't order by binary...EK
export default async (req, res) => {
  const {
    clientAccount,
    session: { userId },
  } = req

  try {
    const directReports = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.reportsTo, P.isSelfRegistered,
          IFNULL(NULLIF(P.jobTitleDisplay, ''), P.jobTitle) jobTitle,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = "thumbnail" AND ML.tableName = "people")
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.reportsTo = ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
        ORDER BY (CHAR_LENGTH(thumbnailImage) > 2) DESC, LOWER(name)
      `,
    })

    if (directReports.length > 0) {
      const locations = await getLocations(
        clientAccount,
        directReports.map(p => p.id),
        userId
      )
      if (locations && locations.success) locations.groupNames.forEach((location, i) => (directReports[i].groupName = location.groupName))
    }

    res.json({ success: true, directReports })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
