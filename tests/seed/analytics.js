const types = require('../../utils/types')

const { WIDGET_TYPES } = types

const _createDashboard = async ({ clientAccountId, wambiDB }) => {
  const dashboardData = { name: 'QA Dashboard', accountId: clientAccountId }
  return await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      INSERT INTO dashboards 
      SET ?
    `,
    params: [dashboardData],
  })
}

const _linkDashboardToReport = async ({ dashboardId, reportIds, wambiDB }) => {
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      INSERT INTO dashboardReports (dashboardId, reportId)
      VALUES ?
    `,
    params: [reportIds.map(rid => [dashboardId, rid])],
  })
}

const _createReports = async ({ clientAccountId, dashboardId, me, wambiDB }) => {
  const reportDataMapping = {
    published: 1,
    createdBy: me.id,
    updatedBy: me.id,
    accountId: clientAccountId,
  }

  const reportsData = [
    {
      name: 'QA Wambis Sent',
      description: 'The total number of Wambis sent by all team members',
      widgetQuery: `
        SELECT COUNT(DISTINCT id) AS value 
        FROM cpc 
        WHERE accountId = ${clientAccountId}
          AND createdAt >= {fromDate}
          AND createdAt <= {toDate}
      `,
      widgetType: WIDGET_TYPES.NUMBER,
    },
    {
      name: 'QA Report',
      description: 'Report for QA',
      reportQuery: `
        SELECT "QA";
      `,
    },
    {
      name: 'QA Percentage Bar',
      widgetQuery: `
        SELECT 'Bayshore' AS seriesName, 0.7 AS targetLow, 0.33 AS value 
        UNION (SELECT 'HMH' AS seriesName, 0.8 AS targetLow, 0.76 AS value) 
        UNION (SELECT 'UMC North' AS seriesName, 0.8 AS targetLow, 0.85 AS value)
      `,
      widgetType: WIDGET_TYPES.PERCENT_BAR_CHART,
    },
    {
      name: 'QA Target Total Widget',
      widgetQuery: `
        SELECT 95 AS numerator, 130 AS denominator, 0.50 AS target, '{"barColor": "#FFC0CB"}' AS options
      `,
      widgetType: WIDGET_TYPES.PERCENTAGE_TOTAL,
    },
  ]

  const data = reportsData.map(r => [
    r.name,
    r.description,
    r.widgetQuery,
    r.reportQuery,
    r.widgetType,
    reportDataMapping.published,
    reportDataMapping.createdBy,
    reportDataMapping.updatedBy,
    reportDataMapping.accountId,
  ])

  const report = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
        INSERT INTO reports (name, description, widgetQuery, reportQuery, widgetType, published, createdBy, updatedBy, accountId)
        VALUES ?
      `,
    params: [data],
  })

  const reportIds = Array.from({ length: reportsData.length }, (_, i) => report.insertId + i)
  await _linkDashboardToReport({ dashboardId, reportIds, wambiDB })
  return reportIds
}

const addReports = async ({ clientAccountId, me, wambiDB }) => {
  const dashboard = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT id
      FROM dashboards
      WHERE name = "QA Dashboard" 
        AND accountId = ${clientAccountId}
    `,
  })

  if (!dashboard) {
    const insertedDashboard = await _createDashboard({ clientAccountId, wambiDB })
    await _createReports({ clientAccountId, dashboardId: insertedDashboard.insertId, me, wambiDB })
    return insertedDashboard.insertId
  }

  return dashboard.id
}

const getReport = async ({ dashboardId, getWidget = false, wambiDB }) => {
  return await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT R.*
      FROM reports R
      INNER JOIN dashboardReports DR ON (R.id = DR.reportId AND DR.dashboardId = ${dashboardId})
      WHERE R.reportQuery ${getWidget ? 'IS NULL' : 'IS NOT NULL'}
    `,
  })
}

module.exports = {
  addReports,
  getReport,
}
