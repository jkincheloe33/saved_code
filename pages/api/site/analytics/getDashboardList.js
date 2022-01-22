import { GROUP_ACCESS_LEVELS } from '@utils/types'

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const dashboards = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT D.id, D.description, D.name, D.defaultDateRange, D.dateRangeHidden, D.filterTraitTypeId, D.groupFilterHidden,
          TT.name AS traitTypeName
        FROM dashboards D
        INNER JOIN dashboardReports DR ON (D.id = DR.dashboardId)
        INNER JOIN reports R ON (DR.reportId = R.id AND R.published = 1 AND R.accountId = ${clientAccountId})
        INNER JOIN peopleGroups PG ON (PG.peopleId = ${userId} AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER})
        LEFT JOIN traitTypes TT ON (TT.id = D.filterTraitTypeId)
        LEFT JOIN reportTraits RT ON (R.id = RT.reportId)
        LEFT JOIN peopleTraits PT ON (PT.peopleId = PG.peopleId AND RT.traitId = PT.traitId)
        WHERE (RT.id IS NULL OR PT.id IS NOT NULL)
        ORDER BY D.order ASC
      `,
    })

    res.json({ success: true, dashboards })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
