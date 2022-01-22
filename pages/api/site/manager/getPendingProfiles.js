const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')
import { PROFILE_CHANGE_REQUEST_TYPE, USER_STATUS } from '@utils'

const pageLimit = 24

export default async (req, res) => {
  try {
    const {
      body: { directReportsOnly = false, page = 0, search = '' },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const searchTrimmed = search.trim()
    const term = wambiDB.escapeValue(`%${searchTrimmed}%`)

    const profiles = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT P.id,
          CONCAT(P.draftDisplayName, ' ', P.lastName) AS draftDisplayName,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS displayName,
          IF(P.reportsTo = ${userId}, 'You', CONCAT(IFNULL(NULLIF(RP.displayName, ''), RP.firstName), ' ', RP.lastName)) AS reportsTo,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MT.category, '/', MT.uid, '.', MT.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage,
          CONCAT('${process.env.MEDIA_CDN}/', MPT.category, '/', MPT.uid, '.', MPT.ext) AS pendingThumbnail
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
        LEFT JOIN people RP ON (RP.id = P.reportsTo)
        INNER JOIN (
          ${
            directReportsOnly
              ? /*sql*/ `
                  SELECT P.id
                  FROM people P
                  INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
                  WHERE P.reportsTo = ${userId}
                    AND P.status = ${USER_STATUS.ACTIVE}
                `
              : selectLeaderPeople({ clientAccountId, includeRealm: true, userId })
          }
        ) PM ON (P.id = PM.id)
        LEFT JOIN mediaLink MLT ON (MLT.tableName = 'people' AND MLT.tableKey = P.id AND MLT.usage = 'thumbnail')
        LEFT JOIN media MT ON (MLT.mediaId = MT.id)
        LEFT JOIN mediaLink MLPT ON (MLPT.tableName = 'people' AND MLPT.tableKey = P.id AND MLPT.usage = 'pendingThumbnail')
        LEFT JOIN media MPT ON (MLPT.mediaId = MPT.id)
        WHERE P.status = ${USER_STATUS.ACTIVE}
          AND (P.draftDisplayName IS NOT NULL OR MLPT.usage = 'pendingThumbnail')
          ${
            search.length > 2
              ? /*sql*/ `
                  AND (
                    P.firstName LIKE ${term}
                    OR P.lastName LIKE ${term}
                    OR P.displayName LIKE ${term}
                    OR CONCAT(P.firstName, ' ', P.lastName) LIKE ${term}
                    OR CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName) LIKE ${term}
                  )
                `
              : ''
          }
        ORDER BY P.draftDisplayName, displayName ASC
        LIMIT ?, ?
      `,
      params: [page * pageLimit, pageLimit],
    })

    profiles.forEach(
      p =>
        (p.profileRequestType =
          p.pendingThumbnail && p.draftDisplayName
            ? PROFILE_CHANGE_REQUEST_TYPE.NAME_AND_PHOTO
            : p.pendingThumbnail
            ? PROFILE_CHANGE_REQUEST_TYPE.PHOTO_ONLY
            : PROFILE_CHANGE_REQUEST_TYPE.NAME_ONLY)
    )

    res.json({ success: true, profiles })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'An error occurred. Check system logs for details.' })
  }
}
