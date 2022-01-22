const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')
const { getActiveUser, getDisabledUser, getIncognitoUser, revertDisabledUser, revertIncognitoUser } = require('../../seed/search')

let accountId, agent
const SEARCH_URL = '/search'

// Find user in response searchList...CY
const _findUser = ({ searchList, userId }) => Boolean(searchList.find(sl => (sl.id = userId)))

describe('Search', () => {
  before(async () => {
    ;({ accountId } = apiStore)
    ;({ agent } = await loginProvider())
  })

  context('when searching without a name', () => {
    it('should return users', async () => {
      const res = await agent.post(SEARCH_URL).send({})
      expect(res).to.have.status(200)
      const { searchList } = res.body
      expect(searchList).to.have.length.greaterThan(0)
    })
  })

  context('when searching an active user', () => {
    let activeUser
    before(async () => {
      activeUser = await getActiveUser({ accountId, wambiDB })
    })

    it('should return the searched user', async () => {
      const res = await agent.post(SEARCH_URL).send({ search: activeUser.name })
      expect(res).to.have.status(200)
      const { searchList } = res.body
      expect(_findUser({ searchList, userId: activeUser.id })).to.be.true
    })
  })

  context('when searching a disabled user', () => {
    let disabledUser, wasActive
    before(async () => {
      ;({ disabledUser, wasActive } = await getDisabledUser({ accountId, wambiDB }))
    })

    after(async () => {
      // Only revert if user data was changed...CY
      if (wasActive) {
        await revertDisabledUser({ userId: disabledUser.id, wambiDB })
      }
    })

    it('should not return the searched user', async () => {
      const res = await agent.post(SEARCH_URL).send({ search: disabledUser.name })
      expect(res).to.have.status(200)
      const { searchList } = res.body
      expect(_findUser({ searchList, userId: disabledUser.id })).to.be.false
    })
  })

  context('when searching an incognito user', () => {
    let incognitoUser, wasActive
    before(async () => {
      ;({ incognitoUser, wasActive } = await getIncognitoUser({ accountId, wambiDB }))
    })

    after(async () => {
      // Only revert if user data was changed...CY
      if (wasActive) {
        await revertIncognitoUser({ accountId, userId: incognitoUser.id, wambiDB })
      }
    })

    it('should not return the searched user', async () => {
      const res = await agent.post(SEARCH_URL).send({ search: incognitoUser.name })
      expect(res).to.have.status(200)
      const { searchList } = res.body
      expect(_findUser({ searchList, userId: incognitoUser.id })).to.be.false
    })
  })
})
