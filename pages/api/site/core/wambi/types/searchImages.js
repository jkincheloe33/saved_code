const { CPC_TYPES_STATUS } = require('@utils/types')

const pageLimit = 5

// infinitely load cpc types based on search parameters
// if there is a startDate/endDate, we only include that cpc type if the current date falls within that range...JK
export default async (req, res) => {
  const {
    body: { page = 0, search = '' },
    clientAccount: { id: clientAccountId },
    session: { userId: userSessionId },
  } = req

  const searchTrimmed = search.trim()
  const term = wambiDB.escapeValue(`%${searchTrimmed}%`)

  try {
    const list = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT CT.description, CT.exampleText, CT.id, CT.name, CT.cpcThemeId, CT.awardTypeId,
          A.name AS awardName, M.id AS mediaId,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS src
        FROM cpcTypes CT
        INNER JOIN peopleGroups PG ON (PG.peopleId = ${userSessionId} AND PG.level >= CT.whoCanSend)
        INNER JOIN mediaLink ML ON (ML.tableName = 'cpcTypes' AND ML.tableKey = CT.id)
        INNER JOIN media M ON (ML.mediaId = M.id AND M.accountId = ${clientAccountId})
        LEFT JOIN awardTypes A ON (A.id = CT.awardTypeId)
        WHERE CT.status = ${CPC_TYPES_STATUS.ACTIVE}
          AND CT.cpcThemeId > 0
          AND (CT.name LIKE ${term} OR CT.description LIKE ${term} OR CT.keywords LIKE ${term})
          AND IFNULL(CT.startDate, CURDATE()) <= CURDATE()
          AND IFNULL(CT.endDate, CURDATE()) >= CURDATE()
        ORDER BY CT.order
        LIMIT ?, ?
      `,
      params: [page * pageLimit, pageLimit],
    })

    res.json({ success: true, list })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
