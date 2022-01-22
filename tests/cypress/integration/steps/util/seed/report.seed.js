const { login } = require('./helper')
import { types } from '../../../../support/imports'

const { WIDGET_TYPES } = types

export const _createDashboard = clientAccountId => {
  const dashboardData = { name: 'QA Dashboard', accountId: clientAccountId }
  return cy.task('executeNonQuery', {
    commandText: /*sql*/ `
      INSERT INTO dashboards 
      SET ?
    `,
    params: [dashboardData],
  })
}

export const _createReports = (clientAccountId, dashboardId, me) => {
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

  return cy
    .task('executeNonQuery', {
      commandText: /*sql*/ `
        INSERT INTO reports (name, description, widgetQuery, reportQuery, widgetType, published, createdBy, updatedBy, accountId)
        VALUES ?
      `,
      params: [data],
    })
    .then(report => {
      const reportIds = Array.from({ length: reportsData.length }, (_, i) => report.insertId + i)
      _linkDashboardToReport(dashboardId, reportIds)
    })
}

const _linkDashboardToReport = (dashboardId, reportIds) => {
  return cy.task('executeNonQuery', {
    commandText: /*sql*/ `
      INSERT INTO dashboardReports (dashboardId, reportId)
      VALUES ?
    `,
    params: [reportIds.map(rid => [dashboardId, rid])],
  })
}

export const addReports = () => {
  const addReportsTask = ({ clientAccountId, me }) => {
    return cy
      .task('query', {
        queryText: /*sql*/ `
          SELECT *
          FROM dashboards
          WHERE name = "QA Dashboard" 
            AND accountId = ${clientAccountId}
        `,
      })
      .then(res => {
        if (res.length === 0) {
          _createDashboard(clientAccountId).then(dashboard => {
            _createReports(clientAccountId, dashboard.insertId, me)
          })
        }
      })
  }

  login({ task: addReportsTask })
}
