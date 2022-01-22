import { CPC_TYPES_STATUS } from '@utils'

export default async (req, res) => {
  const {
    body: { cpcThemeId, showActiveOnly = false },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const cpcTypes = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT CT.*,
          M.id AS mediaId,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS src,
          COUNT(DISTINCT ML.id) AS images,
          COUNT(DISTINCT C.id) AS wambis
        FROM cpcTypes CT
        INNER JOIN cpcThemes CTH ON (CT.cpcThemeId = CTH.id AND CTH.id = ?)
        LEFT JOIN mediaLink ML ON (CT.id = ML.tableKey AND ML.tableName = 'cpcTypes')
        LEFT JOIN media M ON (ML.mediaId = M.id AND M.accountId = ${clientAccountId})
        LEFT JOIN cpc C ON (C.cpcTypeId = CT.id)
        WHERE CT.accountId = ${clientAccountId}
          ${showActiveOnly ? `AND CT.status = ${CPC_TYPES_STATUS.ACTIVE}` : ''}
        GROUP BY CT.id
        ORDER BY CT.order
      `,
      params: [cpcThemeId],
    })

    res.json({ success: true, cpcTypes })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
