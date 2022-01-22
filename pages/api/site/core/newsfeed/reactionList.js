import { REACTIONS_STATUS } from '@utils'

export default async (req, res) => {
  try {
    const reactions = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT R.id, R.name, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS icon
        FROM reactions R
        LEFT JOIN mediaLink ML ON (R.id = ML.tableKey AND ML.tableName = 'reactions')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE R.accountId = ${req.clientAccount.id}
          AND R.status = ${REACTIONS_STATUS.ACTIVE}
        ORDER BY R.name ASC
      `,
    })

    res.json({ success: true, reactions })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
