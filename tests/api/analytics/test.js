const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')
const { addReports, getReport } = require('../../seed/analytics')
const { getGroupChildren } = require('../../seed/groups')
const { getTraits } = require('../../seed/traits')

let agent, accountId, dashboardId, reportId, user, widgetId

before(async () => {
  ;({ agent, user } = await loginProvider())
  ;({ accountId } = apiStore)
  dashboardId = await addReports({ clientAccountId: accountId, me: user, wambiDB })
  ;({ id: reportId } = await getReport({ dashboardId, wambiDB }))
  ;({ id: widgetId } = await getReport({ dashboardId, getWidget: true, wambiDB }))
})

context('When getting dashboards', () => {
  it('should return a list from the client account', async () => {
    const res = await agent.get('/analytics/getDashboardList')
    expect(res).to.have.status(200)
    const qaDashboard = res.body.dashboards.find(d => d.name === 'QA Dashboard')
    expect(qaDashboard?.id).to.eq(dashboardId)
  })
})

context('When running a report', () => {
  it('should return info for the report', async () => {
    const res = await agent.post('/analytics/runReport').send({
      reportId,
      filterGroups: user.groups,
    })
    expect(res.body).to.have.property('reportResults')
    expect(res.body).to.have.property('fields')
    expect(res).to.have.status(200)
  })
})
context('When getting child groups', () => {
  let groupChild

  before(async () => {
    const children = await getGroupChildren({
      groupId: user.groups[0].id,
      wambiDB,
    })

    groupChild = children[0]
  })

  context('When getting filter groups', () => {
    it('should return the user group', async () => {
      const res = await agent.post('/analytics/getFilterGroups').send({})

      expect(res.body.childGroups.find(g => g.id === user.groups[0].id)).to.exist
      expect(res).to.have.status(200)
    })
  })

  it('should return a list of parent group children', async () => {
    const res = await agent.post('/analytics/getFilterGroups').send({
      parentGroup: user.groups[0],
    })

    expect(res.body.parentGroup.id).to.eq(user.groups[0].id)
    expect(res.body.childGroups.find(g => g.id === groupChild.id)).to.exist
    expect(res).to.have.status(200)
  })

  it('should return a specific parent group children', async () => {
    const res = await agent.post('/analytics/getFilterGroups').send({
      parentGroup: user.groups[0],
      search: groupChild.name,
    })

    expect(res.body.parentGroup.id).to.eq(user.groups[0].id)
    expect(res.body.childGroups.find(g => g.id === groupChild.id)).to.exist
    expect(res).to.have.status(200)
  })
})

context('When getting traits from a dashboard', () => {
  let traits, traitType

  before(async () => {
    ;({ traits, traitType } = await getTraits({
      clientAccountId: accountId,
      dashboardId,
      wambiDB,
    }))
  })

  it('should return a list of traits', async () => {
    const res = await agent.post('/analytics/getFilterTraits').send({
      dashboardId,
      traitTypeId: traitType.id,
    })

    expect(res.body.traitsForType.find(t => t.id === traits[0].id)).to.exist
    expect(res.body.traitsForType.every(t => t.traitTypeId === traitType.id)).to.be.true
    expect(res).to.have.status(200)
  })

  it('should return a specific trait', async () => {
    const res = await agent.post('/analytics/getFilterTraits').send({
      dashboardId,
      search: traits[0].name,
      traitTypeId: traitType.id,
    })

    expect(res.body.traitsForType.find(t => t.id === traits[0].id)).to.exist
    expect(res.body.traitsForType.every(t => t.traitTypeId === traitType.id)).to.be.true
    expect(res).to.have.status(200)
  })
})

context('When getting reports', () => {
  it('should return a list of reports', async () => {
    const res = await agent.post('/analytics/getReportList').send({
      id: dashboardId,
    })
    const report = res.body.reports.find(r => r.id === reportId)
    const widget = res.body.reports.find(r => r.id === widgetId)
    expect(report).to.exist
    expect(widget).to.exist
    expect(res).to.have.status(200)
  })
})

context('When running a widget', () => {
  it('should return info for the widget', async () => {
    const res = await agent.post('/analytics/runWidget').send({
      widgetId,
      filterGroups: user.groups,
    })
    expect(res.body).to.have.property('widgetResults')
    expect(res).to.have.status(200)
  })
})
