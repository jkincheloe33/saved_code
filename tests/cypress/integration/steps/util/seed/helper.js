import { store } from '../hooks'

export const _getClientAccount = () => {
  //Parse out host (eg. http://localhost:3000/ -> localhost:3000)...CY
  const url = Cypress.env('WAMBI_URL')
  const hostRegExp = new RegExp('(https://|http://)(.*)/')
  const host = url.match(hostRegExp)[2]

  return cy
    .task('querySingle', {
      queryText: /*sql*/ `
        SELECT id FROM clientAccounts WHERE host = "${host}"
    `,
    })
    .then(({ id: clientAccountId }) => clientAccountId)
}

const _setClientAccountTerm = (userId, clientAccountId) => {
  return cy.task('executeNonQuery', {
    commandText: /*sql*/ `
      UPDATE clientAccountPeople 
      SET clientTermsAt = CURRENT_TIMESTAMP 
      WHERE peopleId = ${userId}
        AND accountId = ${clientAccountId}
    `,
  })
}

export const login = ({ task, userType = 'leader' }, callback = () => null) => {
  const storeUser = store.get('userLogin')
  userType = storeUser ? storeUser.replace('-', ' ') : userType

  _getClientAccount().then(clientAccountId => {
    //Login and store cookie...CY
    cy.request('POST', `${Cypress.env('WAMBI_URL')}api/site/auth/authWithCreds`, {
      loginId: Cypress.env('USERS')[userType].loginId,
      password: Cypress.env('USERS')[userType].pass,
    }).then(({ body: { token } }) => {
      // Get me data...CY
      cy.request('POST', `${Cypress.env('WAMBI_URL')}api/site/users/me`).then(({ body: me }) => {
        _setClientAccountTerm(me.id, clientAccountId)
        task({ clientAccountId, me, token }).then(async value => {
          await callback(value)

          //Clear token so it doesn't break any test...CY
          cy.clearCookie('tkn')
        })
      })
    })
  })
}

export const reviewerLogin = (task, callback = () => null) => {
  cy.request(`${Cypress.env('WAMBI_URL')}api/site/auth/getEmployeeReviewTkn`)
  task().then(async value => {
    await callback(value)
    cy.clearCookie('review_tkn')
  })
}
