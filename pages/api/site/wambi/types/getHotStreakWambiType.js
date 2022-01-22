const { CPC_TYPES_STATUS } = require('@utils/types')
const getPersonDetails = require('@serverHelpers/user/getDetails')

export default async (req, res) => {
  const {
    body: { personId },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  const cpcType = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT DISTINCT CT.description, CT.exampleText, CT.id, CT.name, CT.cpcThemeId, CT.awardTypeId, A.name AS awardName,
        M.id AS mediaId,
        CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS src
      FROM cpcTypes CT
      INNER JOIN cpcThemes CTH ON (CT.cpcThemeId = CTH.id AND CTH.limitToHotStreak = 1)
      INNER JOIN peopleGroups PG ON (PG.peopleId = ${userId} AND PG.level >= CT.whoCanSend)
      INNER JOIN mediaLink ML ON (ML.tableName = 'cpcTypes' AND ML.tableKey = CT.id)
      INNER JOIN media M ON (ML.mediaId = M.id AND M.accountId = ${clientAccountId})
      LEFT JOIN awardTypes A ON (A.id = CT.awardTypeId)
      WHERE CT.status = ${CPC_TYPES_STATUS.ACTIVE}
        AND IFNULL(CT.startDate, CURDATE()) <= CURDATE()
        AND IFNULL(CT.endDate, CURDATE()) >= CURDATE()
      ORDER BY RAND()
    `,
  })

  const person = await getPersonDetails({ clientAccountId, userId: personId })
  if (!person) return res.json({ success: false })

  res.json({ cpcType, person, success: true })
}
