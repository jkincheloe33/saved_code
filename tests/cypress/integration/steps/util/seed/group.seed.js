import { login } from './helper'
const _getPeople = ({ group, me }) => {
  return cy
    .task('query', {
      queryText: /*sql*/ `
        SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS displayName, P.id AS peopleId
        FROM people P 
        INNER JOIN peopleGroups PG ON (PG.peopleId = P.id AND PG.groupId = ${group.id}) 
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.isIncognito = 0)
        WHERE P.id <> ${me.id}
    	`,
    })
    .then(people => {
      return { group, people }
    })
}
//Find a group and users outside the user realm...CY
//Works best for highest group in a given realm...CY
export const getOutsideRealm = callback => {
  const outsideRealmTask = ({ clientAccountId, me }) => {
    const group = me.groups[0]
    return cy
      .task('querySingle', {
        queryText: /*sql*/ `
          SELECT G.id, G.name, COUNT(PG.peopleId) AS people
          FROM groups G
          INNER JOIN peopleGroups PG ON (PG.groupId = G.id)
          LEFT JOIN groupIndex GI ON (GI.groupId = ${group.id} AND GI.fromGroupId = G.id)
          WHERE GI.fromGroupId IS NULL 
	      AND G.accountId = ${clientAccountId}
          GROUP BY PG.groupId
          HAVING people >= 2
        `,
      })
      .then(group => _getPeople({ group, me }))
  }
  login({ task: outsideRealmTask, userType: 'leader' }, callback)
}
//Find a group and users inside the user realm...CY
export const getInsideRealm = callback => {
  const insideRealmTask = ({ clientAccountId, me }) => {
    const group = me.groups[0]
    return cy
      .task('querySingle', {
        queryText: /*sql*/ `
          SELECT G.id, G.name, COUNT(PG.peopleId) AS people
          FROM groups G
          INNER JOIN peopleGroups PG ON (PG.groupId = G.id AND PG.peopleId <> ${me.id})
          INNER JOIN groupIndex GI ON (GI.groupId = ${group.id} AND GI.fromGroupId = G.id)
          WHERE G.accountId = ${clientAccountId}
          GROUP BY PG.groupId
          HAVING people >= 2
        `,
      })
      .then(group => _getPeople({ group, me }))
  }
  login({ task: insideRealmTask }, callback)
}
