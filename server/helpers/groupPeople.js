const { USER_STATUS } = require('@utils/types')

module.exports = {
  getGroupPeople: async ({ clientAccountId, groupId, limit, page }) => {
    // Gets list of people directly related to the groupId...PS
    const personList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT P.id, P.isSelfRegistered,
          IFNULL(NULLIF(P.jobTitle, ''), P.jobTitleDisplay) AS jobTitle,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MT.category, '/', MT.uid, '.', MT.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
        INNER JOIN peopleGroups PG ON (PG.peopleId = P.id AND PG.groupId = ?)
        LEFT JOIN mediaLink MLT ON (P.id = MLT.tableKey AND MLT.usage = 'thumbnail' AND MLT.tableName = 'people')
        LEFT JOIN media MT ON (MLT.mediaId = MT.id)
        WHERE P.status = ${USER_STATUS.ACTIVE}
        ORDER BY name
        LIMIT ?, ?
      `,
      params: [groupId, page * limit, limit],
    })

    return { success: true, personList }
  },
}
