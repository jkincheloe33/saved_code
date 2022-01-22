import { After, Before } from 'cypress-cucumber-preprocessor/steps'
import {
  addCelebration,
  addInsight,
  addReports,
  addRewardProgress,
  challengeUpdate,
  clearLessons,
  clearNotifications,
  clearPinPost,
  createFeedback,
  createGiftReward,
  createPerfectSurvey,
  createPost,
  createSubmitSurvey,
  createWambi,
  getInsideRealm,
  getOutsideRealm,
  getRecognizer,
  getReviewableUser,
  getReviewer,
  termsUnsigned,
  updateUser,
} from './seed'

export const store = new Map()

Before(() => {
  cy.viewport('iphone-6')
  store.set('screenSize', 'mobile')
})

Before({ tags: '@mobileView' }, () => {
  cy.viewport('iphone-6')
  store.set('screenSize', 'mobile')
})

Before({ tags: '@desktopView' }, () => {
  cy.viewport('macbook-16')
  store.set('screenSize', 'desktop')
})

Before({ tags: '@skip' }, () => {
  const getMochaContext = () => cy.state('runnable').ctx
  return getMochaContext().skip()
})

Object.keys(Cypress.env('USERS')).forEach(user => {
  const userLogin = user.replace(' ', '-')
  Before({ tags: `@${userLogin}` }, () => store.set('userLogin', userLogin))
})

//Analytics
Before({ tags: '@addReports' }, () => addReports())

//Challenge
Before({ tags: '@challengeUpdate' }, () => challengeUpdate())

// Wambis
Before({ tags: '@createWambi' }, () => createWambi())

//Groups
Before({ tags: '@getOutsideRealm' }, () => getOutsideRealm(({ group, people }) => store.set('groupData', { group, people })))
Before({ tags: '@getInsideRealm' }, () => getInsideRealm(({ group, people }) => store.set('groupData', { group, people })))

//Insight
Before({ tags: '@addInsight' }, () => addInsight())

//Newsfeed
Before({ tags: '@addTodayCelebration' }, () => addCelebration(0, name => store.set('user', name)))
Before({ tags: '@addComingUpCelebration' }, () => addCelebration(1, name => store.set('user', name)))
Before({ tags: '@addRecentCelebration' }, () => addCelebration(-2, name => store.set('user', name)))

//Notification
Before({ tags: '@clearNotifications' }, () => clearNotifications())

//Portal
Before({ tags: '@createFeedback' }, () => createFeedback())
Before({ tags: '@createSubmitSurvey' }, () => createSubmitSurvey())
Before({ tags: '@getReviewableUser' }, () => getReviewableUser(data => store.set('reviewData', data)))
Before({ tags: '@getReviewer' }, () =>
  getReviewer(Cypress.env('MOBILE'), reviewer => {
    store.set('mobile', Cypress.env('MOBILE'))
    store.set('reviewer', reviewer)
  })
)

Before({ tags: '@getRecognizer' }, () =>
  getRecognizer(Cypress.env('RECOGNIZER_MOBILE'), recognizer => {
    store.set('mobile', Cypress.env('RECOGNIZER_MOBILE'))
    store.set('reviewer', recognizer)
  })
)

Before({ tags: '@perfectReview' }, () => createPerfectSurvey())

//Post
After({ tags: '@clearPinPost' }, () => clearPinPost())
Before({ tags: '@createPinPost' }, () => createPost({ withPin: true }))

//Terms and Conditions
Before({ tags: '@termsUnsigned' }, () => termsUnsigned())

//User
Before({ tags: '@updateUser' }, () => updateUser())

After(() => store.clear())

//Lessons
Before({ tags: '@clearLessons' }, () => clearLessons())

//Reward
Before({ tags: '@addRewardProgress' }, () => addRewardProgress())
Before({ tags: '@createGiftReward' }, () => createGiftReward())
