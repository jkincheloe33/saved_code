const { CPC_TYPES_STATUS } = require('@utils/types')

const pageLimit = 5

// gets all cpc cpcTypes based on a user's access level compared to `cpcTypes.whoCanSend`
// if there is a startDate/endDate, we only include that cpc type if the current date falls within that range...JK
export default async (req, res) => {
  const {
    body: { page, themeId },
    clientAccount: { id: clientAccountId },
    session: { userId: userSessionId },
  } = req

  try {
    const types = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT CT.description, CT.exampleText, CT.id, CT.name, CT.cpcThemeId, CT.awardTypeId, A.name AS awardName,
          M.id AS mediaId,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS src
        FROM cpcTypes CT
        INNER JOIN peopleGroups PG ON (PG.peopleId = ${userSessionId} AND PG.level >= CT.whoCanSend)
        INNER JOIN mediaLink ML ON (ML.tableName = 'cpcTypes' AND ML.tableKey = CT.id)
        INNER JOIN media M ON (ML.mediaId = M.id AND M.accountId = ${clientAccountId})
        LEFT JOIN awardTypes A ON (A.id = CT.awardTypeId)
        WHERE CT.cpcThemeId = ?
          AND CT.status = ${CPC_TYPES_STATUS.ACTIVE}
          AND IFNULL(CT.startDate, CURDATE()) <= CURDATE()
          AND IFNULL(CT.endDate, CURDATE()) >= CURDATE()
        ORDER BY CT.order
        LIMIT ?, ?
      `,
      params: [themeId, page * pageLimit, pageLimit],
    })

    res.json({ success: true, types })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
