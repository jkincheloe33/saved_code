import { createSortClauseFromModel, createWhereFromFilter } from '@serverHelpers/gridFilters'
import { GROUP_ACCESS_LEVELS, USER_STATUS } from '@utils'

const ambiguousColumns = ['id', 'hrId', 'loginId', 'firstName', 'lastName', 'displayName', 'jobTitle', 'jobTitleDisplay', 'email', 'mobile']

/**
 * Return the list of people (limited by start and end rows, filters and sorts)
 * This endpoint handles the infinite row model by ag-grid...EK
 */
export default async (req, res) => {
  const {
    body: { endRow = 100, filter = {}, sort = [], startRow = 0 },
    clientAccount,
  } = req

  try {
    const sortClause = createSortClauseFromModel(sort)

    // Handle the Alias of P since id is in both joined tables...EK
    if (filter) {
      ambiguousColumns.forEach(col => {
        if (filter[col] != null) {
          filter[`P.${col}`] = filter[col]
          delete filter[col]
        }
      })

      if (filter.manager != null) {
        /* eslint-disable-next-line quotes */
        filter["IFNULL(NULLIF(RP.displayName, ''), CONCAT(RP.firstName, ' ', RP.lastName))"] = filter.manager
        delete filter.manager

        // Since the filter field is a calculation, we can't escape it as an identifier.  Flag this here so we allow this raw SQL to run...EK
        filter.trustIdentifiers = true
      }
    }

    const whereClause = createWhereFromFilter(filter)

    const pageOfPeople = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.hrId, P.loginId, P.firstName, P.lastName, P.displayName, P.jobTitle, P.jobTitleDisplay, P.email, P.mobile, P.isSelfRegistered,
          CAP.accessLevel,
          M.mimeType, M.uploadName, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS originalImage,
          P.reportsTo, CONCAT(IFNULL(NULLIF(RP.displayName, ''), RP.firstName), ' ', RP.lastName) AS manager,
          IF(MAX(PG.level) > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}, 1, 0) AS isOwner
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id})
        LEFT JOIN peopleGroups PG ON (PG.peopleId = P.id)
        LEFT JOIN people RP ON (P.reportsTo = RP.id)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'original' AND ML.tableName = 'people')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.status = ${USER_STATUS.ACTIVE}
          ${whereClause ? `AND ${whereClause}` : ''}
        GROUP BY P.id
        ${sortClause ? `ORDER BY ${sortClause}` : ''}
        LIMIT ?, ?
      `,
      params: [startRow, endRow - startRow],
    })

    res.json({ success: true, pageOfPeople })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
