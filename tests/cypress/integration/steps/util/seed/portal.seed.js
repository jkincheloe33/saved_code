import { login, reviewerLogin } from './helper'

//Abstract submit survey function to be reusable...CY
const _submitSurvey = (override = () => null) => {
  const submitSurveyTask = ({ clientAccountId, me }) => {
    const group = me.groups[0]

    //Get questionItems...CY
    return cy
      .task('querySingle', {
        queryText: /*sql*/ `
          SELECT GROUP_CONCAT(QSI.id) AS questionId, P.shortUId
          FROM portals P
          INNER JOIN portalGroups PG ON (PG.portalId = P.id)
          INNER JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId AND GI.groupId = ${group.id})
          INNER JOIN portalQuestionSets PQS ON (PQS.portalId = P.id)
          INNER JOIN questionSets QS ON (QS.id  = PQS.questionSetId)
          INNER JOIN questionSetItems QSI ON (QSI.questionSetId = QS.id)
          WHERE P.accountId = ${clientAccountId}
          GROUP BY P.id
      `,
      })
      .then(async ({ questionId, shortUId }) => {
        const body = {
          answers: questionId.split(',').map(questionId => ({ rating: Math.ceil(Math.random() * 5), questionId })),
          comment: `test${Math.floor(Math.random() * 9999)}`,
          contactInfo: { contact: false, email: '', firstName: 'John', lastName: 'Doe', mobile: '' },
          gratitude: '',
          groupId: group.id,
          location: {
            name: group.name,
          },
          noQuestions: false,
          person: { id: me.id, name: `${me.firstName} ${me.lastName}` },
          portalId: shortUId,
        }

        const overrideData = override(questionId)
        const submitSurveyRequest = () =>
          cy.request('POST', `${Cypress.env('WAMBI_URL')}api/site/portal/survey/submitSurvey`, { ...body, ...overrideData })

        await reviewerLogin(submitSurveyRequest)
      })
  }

  login({ task: submitSurveyTask })
}

// Get a user with questions within a group scope...CY
export const getReviewableUser = callback => {
  const getReviewableUserQuery = ({ me }) => {
    return cy
      .task('querySingle', {
        queryText: /*sql*/ `
          SELECT G.name "group", CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS user 
          FROM groups G
          INNER JOIN groupIndex GI ON (GI.fromGroupId = G.id AND GI.groupId = ${me.groups[0].id})
          INNER JOIN portalGroups PG ON (PG.groupId = GI.groupId)
          INNER JOIN groupTypes GT ON (GT.id = G.groupTypeId AND GT.isLocation = 1)
          INNER JOIN portalQuestionSets PQS ON (PQS.portalId = PG.portalId)
          INNER JOIN peopleGroups PEG ON (PEG.groupId = G.id)
          INNER JOIN people P ON (P.id = PEG.peopleId)
        `,
      })
      .then(res => res)
  }
  login({ task: getReviewableUserQuery }, callback)
}

const _getReviewerQuery = (clientAccountId, mobile) => {
  return cy.task('query', {
    queryText: /*sql*/ `
      SELECT id AS reviewerId, acceptedTermsAt, code
      FROM reviewers
      WHERE MOBILE = ${mobile} 
        AND accountId = ${clientAccountId}
    `,
  })
}

export const getReviewer = (callback, mobile) => {
  const task = ({ clientAccountId }) => {
    return _getReviewerQuery(clientAccountId).then(reviewer => {
      if (reviewer.length === 0) {
        cy.task('executeNonQuery', {
          commandText: /*sql*/ `
            INSERT INTO reviewers (mobile, code, accountId)
            VALUES (${mobile}, 1234, ${clientAccountId})
        `,
        }).then(() => {
          _getReviewerQuery(clientAccountId, mobile).then(() => {
            return reviewer[0]
          })
        })
      } else {
        return reviewer[0]
      }
    })
  }
  login({ task }, callback)
}

export const getRecognizer = (mobile, callback) => {
  const task = ({ clientAccountId }) => {
    return _getReviewerQuery(clientAccountId, mobile).then(reviewer => {
      if (!reviewer.length) {
        cy.task('executeNonQuery', {
          commandText: /*sql*/ `
            INSERT INTO reviewers (mobile, code, accountId, isVolunteer)
            VALUES (${mobile}, 1234, ${clientAccountId}, 1)
          `,
        }).then(() => {
          _getReviewerQuery(clientAccountId, mobile).then(() => {
            return reviewer[0]
          })
        })
      } else {
        return reviewer[0]
      }
    })
  }
  login({ task }, callback)
}

export const createSubmitSurvey = async () => {
  await _submitSurvey()
}

//Create survey with feedback...CY
export const createFeedback = async () => {
  await _submitSurvey(() => ({ contactInfo: { contact: true, email: '', firstName: 'John', lastName: 'Doe', mobile: '' } }))
}

//Create survey with perfect score...Cy
export const createPerfectSurvey = async () => {
  await _submitSurvey(questionId => ({
    answers: questionId.split(',').map(questionId => ({ rating: 5, questionId })),
  }))
}
