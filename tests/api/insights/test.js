const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')
const { createInsight } = require('../../seed/insights')
const { INSIGHT_STATUS } = require('../../../utils/types')

const _getInsight = (insights, id) => insights.filter(i => i.id === id)

describe('Insights', () => {
  let accountId, agent, user
  before(async () => {
    ;({ accountId } = apiStore)
    ;({ agent, user } = await loginProvider())
  })

  context('when getting insights', () => {
    let insights
    const insight = {}
    before(async () => {
      insight.active = await createInsight({ accountId, user, wambiDB })
      insight.addressed = await createInsight({ accountId, status: INSIGHT_STATUS.ADDRESSED, user, wambiDB })
      insight.dismissed = await createInsight({ accountId, status: INSIGHT_STATUS.DISMISSED, user, wambiDB })
      insight.expired = await createInsight({ accountId, status: INSIGHT_STATUS.EXPIRED, user, wambiDB })
    })

    it('should return a list of insights and insight links', async () => {
      const res = await agent.get('/insights/list')
      insights = res.body.insights
      expect(_getInsight(insights, insight.active.id)).to.be.length(1)
      expect(res).to.have.status(200)
    })

    it('should not return an expired insight', async () => {
      expect(_getInsight(insights, insight.expired.id)).to.be.length(0)
    })

    it('should not return an addressed insight', async () => {
      expect(_getInsight(insights, insight.addressed.id)).to.be.length(0)
    })

    it('should not return a dismissed insight', async () => {
      expect(_getInsight(insights, insight.dismissed.id)).to.be.length(0)
    })
  })

  context('when updating an insight', () => {
    let insight = {}
    before(async () => {
      insight.active = await createInsight({ accountId, user, wambiDB })
      insight.expired = await createInsight({ accountId, status: INSIGHT_STATUS.EXPIRED, user, wambiDB })
    })

    it('should not update insight with no new status', async () => {
      const res = await agent.post('/insights/update').send({ insightId: insight.active.id })
      expect(res.body.success).to.be.false
    })

    it('should not update insight with no insight id', async () => {
      const res = await agent.post('/insights/update').send({ newStatus: INSIGHT_STATUS.ADDRESSED })
      expect(res.body.success).to.be.false
    })

    it('should not update expired insight', async () => {
      const res = await agent.post('/insights/update').send({ insightId: insight.expired.id, newStatus: INSIGHT_STATUS.ADDRESSED })
      expect(res.body.success).to.be.false
    })
  })

  context('when addressing an insight', () => {
    let insight
    before(async () => {
      insight = await createInsight({ accountId, user, wambiDB })
    })

    it('should update active insight to addressed', async () => {
      const res = await agent.post('/insights/update').send({ insightId: insight.id, newStatus: INSIGHT_STATUS.ADDRESSED })
      expect(res.body.success).to.be.true
    })

    it('should not update addressed insight to addressed', async () => {
      const res = await agent.post('/insights/update').send({ insightId: insight.id, newStatus: INSIGHT_STATUS.ADDRESSED })
      expect(res.body.success).to.be.false
    })
  })

  context('when dismissing an insight', () => {
    let insight
    before(async () => {
      insight = await createInsight({ accountId, user, wambiDB })
    })

    it('should update active insight to dismissed', async () => {
      const res = await agent.post('/insights/update').send({ insightId: insight.id, newStatus: INSIGHT_STATUS.DISMISSED })
      expect(res.body.success).to.be.true
    })

    it('should not update dismissed insight to dismissed', async () => {
      const res = await agent.post('/insights/update').send({ insightId: insight.id, newStatus: INSIGHT_STATUS.DISMISSED })
      expect(res.body.success).to.be.false
    })
  })
})
