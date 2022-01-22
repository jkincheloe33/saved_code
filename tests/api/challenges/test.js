const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')
const { issueChallenges } = require('../../../server/helpers/challenges/issueChallenges.js')
const { TRIGGERS } = require('../../../utils/types')
const { addChallenges, disableChallenges } = require('../../seed/challenges')

const { AUTH_SIGN_IN, PROFILE_ADD_MOBILE, PROFILE_ADD_BIRTHDAY, PROFILE_ADD_DISPLAY_NAME, CPC_VIEW_ALL } = TRIGGERS

const _hasTrigger = ({ completedChallenges }, trigger) => completedChallenges.some(c => c.goals.some(g => g.trigger === trigger))

describe('Challenges', () => {
  const { TEST_PHONE } = process.env

  let accountId, agent, user

  before(async () => {
    ;({ accountId } = apiStore)
    ;({ agent, user } = await loginProvider())

    await addChallenges({ accountId, wambiDB })
    await issueChallenges({ clientAccountId: accountId, userId: user.id })
  })

  after(async () => {
    await disableChallenges({ accountId, user, wambiDB })
  })

  context('when logging in', () => {
    it('should complete the login challenge', async () => {
      const res = await agent.get('/auth/completeUserLogin').send()
      expect(res).to.have.status(200)
      expect(_hasTrigger(res.body.loginData, AUTH_SIGN_IN)).to.be.true
    })
  })

  context('when viewing Wambis', () => {
    it('should complete the view all Wambi challenge', async () => {
      const res = await agent.post('/profile/getWambiList').send({ fetchedInitialList: true, type: 'received', userId: user.id })
      expect(res).to.have.status(200)
      expect(_hasTrigger(res.body, CPC_VIEW_ALL)).to.be.true
    })
  })

  context('when updating the profile', () => {
    it('should complete the update mobile challenge', async () => {
      await agent.post('/profile/requestCode').send({ userData: { mobile: TEST_PHONE } })

      const { code } = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT P.code
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${accountId})
          WHERE P.id = ${user.id}
        `,
      })

      const verifyCodeRes = await agent.post('/profile/verifyCode').send({ code, mobile: TEST_PHONE })

      expect(verifyCodeRes).to.have.status(200)
      expect(_hasTrigger(verifyCodeRes.body, PROFILE_ADD_MOBILE)).to.be.true
    })

    let updateMeRes

    const getRandomDate = userBday => {
      const start = new Date(1990, 0, 1)
      const end = new Date(1990, 12, 31)
      const formattedUserBday = userBday.slice(0, 10)
      const newBday = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().slice(0, 10)

      if (formattedUserBday !== newBday) return newBday
      else getRandomDate(user.birthday)
    }

    before(async () => {
      updateMeRes = await agent.post('/users/updateMe').send({
        userData: { birthday: getRandomDate(user.birthday), displayName: `Automation-user-${Math.floor(Math.random() * 9999)}` },
      })
    })

    it('should complete the update display challenge', () => {
      expect(updateMeRes).to.have.status(200)
      expect(_hasTrigger(updateMeRes.body, PROFILE_ADD_DISPLAY_NAME)).to.be.true
    })

    it('should complete the update birthday challenge', () => {
      expect(updateMeRes).to.have.status(200)
      expect(_hasTrigger(updateMeRes.body, PROFILE_ADD_BIRTHDAY)).to.be.true
    })
  })
})
