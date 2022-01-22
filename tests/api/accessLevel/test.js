const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')
const { updateUserAccessLevel } = require('../../seed/accessLevel')
const { ACCOUNT_ACCESS_LEVELS } = require('../../../utils/types')

describe('Access level', () => {
  let agent, accountId, user

  before(async () => {
    ;({ agent, user } = await loginProvider())
    ;({ accountId } = apiStore)
  })

  context('when accessing /config endpoint with team member access', () => {
    before(async () => {
      await updateUserAccessLevel({ accessLevel: ACCOUNT_ACCESS_LEVELS.TEAM_MEMBER, accountId, user, wambiDB })
    })

    it('should reject the request', () => {
      // Add timeout for access level update to finish...CY
      setTimeout(async () => {
        const res = await agent.get('/config/people/list')
        expect(res).to.have.status(401)
      })
    })
  })

  context('when accessing /config endpoint with global system admin access', () => {
    before(async () => {
      await updateUserAccessLevel({ accessLevel: ACCOUNT_ACCESS_LEVELS.GLOBAL_SYSTEM_ADMIN, accountId, user, wambiDB })
    })

    it('should accept the request', () => {
      // Add timeout for access level update to finish...CY
      setTimeout(async () => {
        const res = await agent.get('/config/people/list')
        expect(res).to.have.status(200)
      })
    })
  })
})
