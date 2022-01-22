const { USER_STATUS } = require('@utils')

module.exports = async ({ clientAccountId, userId }) => {
  return await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT P.id, P.status, P.pronouns, P.isSelfRegistered,
        IFNULL(NULLIF(P.jobTitle, ''), P.jobTitleDisplay) AS jobTitle,
        CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
        IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
          CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage,
        GROUP_CONCAT(G.name ORDER BY G.name SEPARATOR ', ') AS groupName
      FROM people P
      INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
      INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
      LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE P.id = ?
        AND P.status = ${USER_STATUS.ACTIVE}
      GROUP BY P.id
    `,
    params: [userId],
  })
}
