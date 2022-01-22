const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const agent = chai.request.agent(process.env.API_TEST_HOST ?? `https://${process.env.DEV_ALIAS_HOST_DNS}/api/site`)

module.exports = async loginUser => {
  const { loginId, pass: password } = loginUser ?? apiStore.users.leader

  return agent
    .post('/auth/authWithCreds')
    .send({ loginId, password })
    .then(async () => {
      const res = await agent.get('/users/me')
      return { agent, user: res.body }
    })
}
