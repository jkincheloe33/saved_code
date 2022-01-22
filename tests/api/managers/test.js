const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')
const { editMemberProfile, revertPeopleProfile } = require('../../seed/people')
const { getTraits } = require('../../seed/traits')

describe('Managers', () => {
  let accountId, agent, user
  before(async () => {
    ;({ accountId } = apiStore)
    ;({ agent, user } = await loginProvider())
  })

  context('When a team member update their profile', () => {
    let teamMember, directReport

    after(async () => {
      await revertPeopleProfile({
        people: [directReport, teamMember],
        wambiDB,
      })
    })

    context('When getting pending profile changes', () => {
      before(async () => {
        teamMember = await editMemberProfile({ me: user, wambiDB })
        directReport = await editMemberProfile({ directReport: true, me: user, wambiDB })
      })
      it('should return a list of people with pending changes', async () => {
        const res = await agent.post('/manager/getPendingProfiles').send({})
        expect(res.body.profiles.length).to.be.greaterThan(0)
        expect(res).to.have.status(200)
      })

      it('should return a list of direct report with pending changes', async () => {
        const res = await agent.post('/manager/getPendingProfiles').send({
          directReportsOnly: true,
        })
        expect(res.body.profiles.length).to.be.greaterThan(0)
        expect(res.body.profiles.find(p => p.id === directReport.id)).to.exist
        expect(res).to.have.status(200)
      })

      it('should return the search person with pending changes', async () => {
        const res = await agent.post('/manager/getPendingProfiles').send({
          search: teamMember.displayName,
        })
        expect(res.body.profiles.length).to.be.greaterThan(0)
        expect(res.body.profiles.find(p => p.id === teamMember.id)).to.exist
        expect(res).to.have.status(200)
      })
    })

    context('When approving pending profile changes', () => {
      before(async () => {
        directReport = await editMemberProfile({ directReport: true, me: user, wambiDB })
      })

      it('should update team member profile changes', async () => {
        const res = await agent.post('/manager/approveProfiles').send({
          profiles: [directReport],
        })
        expect(res.body.success).to.be.true
        expect(res).to.have.status(200)
      })
    })

    context('When denying pending profile changes', () => {
      before(async () => {
        directReport = await editMemberProfile({ directReport: true, me: user, wambiDB })
      })

      it('should not update team member profile changes', async () => {
        const res = await agent.post('/manager/denyProfiles').send({
          profiles: [directReport],
        })
        expect(res.body.success).to.be.true
        expect(res).to.have.status(200)
      })
    })
  })

  context('When getting owned groups', () => {
    it('should return a list of owned groups', async () => {
      const res = await agent.get('/manager/getOwnedGroups')
      expect(res.body.userOwnedGroups.find(g => g.id === user.groups[0].id && g.isRealm === 0)).to.exist
      expect(res.body.userOwnedGroups.find(g => g.id === user.groups[0].id && g.isRealm === 1)).to.exist
      expect(res).to.have.status(200)
    })
  })

  context('When getting traits from a group', () => {
    let traits
    before(async () => {
      ;({ traits } = await getTraits({ clientAccountId: accountId, peopleId: user.id, wambiDB }))
    })
    it('should return a list of traits', async () => {
      const res = await agent.post('/manager/getTraitsInMyGroup').send({
        groups: user.groups.map(g => g.id),
      })
      expect(res.body.traitData.find(t => t.id === traits[0].id)).to.exist
      expect(res).to.have.status(200)
    })
  })
})
