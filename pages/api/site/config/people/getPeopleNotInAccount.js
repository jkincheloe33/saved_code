import { createSortClauseFromModel, createWhereFromFilter } from '@serverHelpers/gridFilters'

const ambiguousColumns = ['id', 'hrId', 'loginId', 'firstName', 'lastName', 'displayName', 'jobTitle', 'jobTitleDisplay', 'email', 'mobile']

// Returns a list of people not in the current client account..KA
export default async (req, res) => {
  try {
    const {
      body: { endRow = 100, filter = {}, sort = [], startRow = 0 },
      clientAccount: { id: clientAccountId },
    } = req

    const sortClause = createSortClauseFromModel(sort)

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

        filter.trustIdentifiers = true
      }
    }

    const whereClause = createWhereFromFilter(filter)

    const peopleList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.hrId, P.loginId, P.firstName, P.lastName, P.displayName, P.jobTitle, P.jobTitleDisplay, P.email, P.mobile
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId <> ${clientAccountId} AND P.id NOT IN (
          SELECT P.id
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
          )
        )
        WHERE P.isSelfRegistered = 0
          ${whereClause ? `AND ${whereClause}` : ''}
        GROUP BY P.id
        ${sortClause ? `ORDER BY ${sortClause}` : ''}
        LIMIT ?, ?
      `,
      params: [startRow, endRow - startRow],
    })

    res.json({ success: true, peopleList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
