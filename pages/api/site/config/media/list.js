import { createSortClauseFromModel, createWhereFromFilter } from '@serverHelpers/gridFilters'

export default async (req, res) => {
  const { startRow = 0, endRow = 100, filter = {}, sort = [] } = req.body

  const sortClause = createSortClauseFromModel(sort)
  const whereClause = createWhereFromFilter(filter)

  let mediaForAccount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT M.*, COUNT(ML.id) as usages
      FROM media M
      LEFT JOIN mediaLink ML on (M.id = ML.mediaId)
      WHERE M.accountId = ?
      ${whereClause && 'AND M.' + whereClause}
      GROUP BY M.id
      ORDER BY ${sortClause ? sortClause : 'M.category, M.uploadName ASC'}
      LIMIT ?, ?;
    `,
    params: [req.clientAccount.id, startRow, endRow - startRow],
  })

  res.json({ success: true, mediaForAccount, cdnHost: process.env.MEDIA_CDN })
}
