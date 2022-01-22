const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')
const { getCreateWambiData, getWambiIds } = require('../../seed/wambis')

let accountId, agent, user, wambiIds

describe('Wambi', () => {
  context('when editing', () => {
    before(async () => {
      ;({ agent, user } = await loginProvider())
      ;({ accountId } = apiStore)

      const { cpcTypeId, mediaId, peopleId, values } = await getCreateWambiData({ accountId, user, wambiDB })
      const res = await agent.post('/wambi/postWambi').send({
        cpcData: {
          content: `test${Math.floor(Math.random() * 9999)}`,
          groups: [],
          nominate: false,
          recipients: [
            {
              id: peopleId,
            },
          ],
          shareOnNewsfeed: true,
          type: {
            id: cpcTypeId,
            mediaId,
          },
          values,
        },
      })

      wambiIds = await getWambiIds({ newFeedId: res.body.newFeedId, wambiDB })
    })

    it('should update the Wambi message', async () => {
      const res = await agent.post('/wambi/editWambi').send({
        cpcData: {
          content: 'edited wambi',
        },
        cpcId: wambiIds.cpcId,
        feedId: wambiIds.newFeedId,
      })
      expect(res.body.success).to.be.true
      expect(res).to.have.status(200)
    })
  })
})
