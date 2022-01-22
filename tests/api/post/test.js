const { expect } = require('chai')
const loginProvider = require('../util/loginProvider')

let agent, user, feedId

describe('Post', () => {
  context('when editing', () => {
    before(async () => {
      ;({ agent, user } = await loginProvider())

      const res = await agent
        .post('/newsfeed/announcements/postAnnouncement')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          content: 'new post',
          groups: JSON.stringify(user.groups),
        })
      feedId = res.body.newFeedId
    })

    it('should update the post content', async () => {
      const res = await agent.post('/newsfeed/announcements/editPost').set('content-type', 'application/x-www-form-urlencoded').send({
        feedId,
        post: 'edited post',
      })

      expect(res).to.have.status(200)
    })

    // Temp files are removed on test complete...CY
    it('should update the post video', async () => {
      const res = await agent
        .post('/newsfeed/announcements/editVideo')
        .set('content-type', 'application/x-www-form-urlencoded')
        .field('feedId', feedId)
        .field('post', 'edited video')
        .attach('file', 'tests/vid/charizardhood.mp4')

      expect(res).to.have.status(200)
      // Increase timeout so endpoint can response...CY
    }).timeout(10000)
  })
})
