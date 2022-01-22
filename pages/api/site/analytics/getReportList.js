import { GROUP_ACCESS_LEVELS } from '@utils/types'

export default async (req, res) => {
  try {
    const {
      body: { id },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    const reports = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT R.id, R.name, R.description, R.hidden,
          NULLIF(R.reportQuery, '') IS NOT NULL AS isReport,
          NULLIF(R.widgetQuery, '') IS NOT NULL AS isWidget,
          R.onClick,
          R.widgetType,
          DR.dashboardId
        FROM reports R
        INNER JOIN dashboardReports DR ON (DR.reportId = R.id AND DR.dashboardId = ?)
        INNER JOIN peopleGroups PG ON (PG.peopleId = ${userSessionId} AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER})
        LEFT JOIN reportTraits RT ON (R.id = RT.reportId)
        LEFT JOIN peopleTraits PT ON (PT.peopleId = PG.peopleId AND RT.traitId = PT.traitId)
        WHERE R.accountId = ${clientAccountId} 
          AND R.published = 1
          AND (RT.id IS NULL OR PT.id IS NOT NULL)
        ORDER BY R.name ASC
      `,
      params: [id],
    })

    res.json({ success: true, reports })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
