import { login } from './helper'
import moment from 'moment'

const _getUser = (clientAccountId, me) => {
  return cy.task('querySingle', {
    queryText: /*sql*/ `
      SELECT PG.peopleId AS id, 
        CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name
      FROM peopleGroups PG
      INNER JOIN people P ON (PG.peopleId = P.id)
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND accountId = ${clientAccountId})
      WHERE PG.groupId = ${me.groups[0].id} 
        AND PG.peopleId <> ${me.id}
    `,
  })
}

const _updateCelebration = (dateDiff, user) => {
  return cy
    .task('executeNonQuery', {
      commandText: /*sql*/ `
        UPDATE people
        SET birthday = "${moment().add(dateDiff, 'days').format('YYYY/MM/DD')}" 
        WHERE id = ${user.id}
      `,
    })
    .then(() => user.name)
}

export const addCelebration = (dateDiff, callback) => {
  const task = ({ clientAccountId, me }) => {
    return _getUser(clientAccountId, me).then(user => _updateCelebration(dateDiff, user))
  }
  login({ task }, callback)
}

export const updateUser = () => {
  const userData = `test${Math.floor(Math.random() * 9999)}`

  const updateUserRequest = async ({ me }) => {
    return cy.task('executeNonQuery', {
      commandText: /*sql*/ `
        UPDATE people P  
        INNER JOIN peopleGroups PG ON (PG.peopleId = P.id)
        INNER JOIN peopleGroups PG2 ON (PG2.groupId = PG.groupId AND PG2.peopleId = ${me.id})
        SET P.draftDisplayName = '${userData}'
        WHERE PG.peopleId <> ${me.id} 
          AND PG.LEVEL = 1
      `,
    })
  }
  login({ task: updateUserRequest })
}

export const clearLessons = () => {
  const clearLessonQuery = ({ clientAccountId, me }) => {
    return cy.task('executeNonQuery', {
      commandText: /*sql*/ `
        DELETE LP 
        FROM lessonProgress LP
        INNER JOIN lessons L ON (L.id = LP.lessonId AND L.accountId = ${clientAccountId})
        WHERE LP.peopleId = ${me.id}
      `,
    })
  }
  login({ task: clearLessonQuery, userType: 'member' })
}
