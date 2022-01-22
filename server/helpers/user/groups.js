const { GROUP_ACCESS_LEVELS } = require('@utils')

module.exports = {
  getUserGroups: async ({ clientAccountId, getByRealm, getOwned, groupsToCheck, userId }) => {
    const groupsToCheckClause = groupsToCheck ? `AND G.id IN (${groupsToCheck})` : ''

    const groupsJoin = getByRealm
      ? `INNER JOIN groupIndex GI ON (GI.groupId = PG.groupId)
         INNER JOIN groups G ON (G.id = GI.fromGroupId ${groupsToCheckClause})
        `
      : 'INNER JOIN groups G ON (G.id = PG.groupId)'

    const userGroups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id, G.name, G.depth, PG.level
        FROM peopleGroups PG
        ${groupsJoin}
        WHERE PG.peopleId = ${userId}
          AND G.accountId = ${clientAccountId}
          ${getOwned ? `AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}` : ''}
      `,
    })
    return { success: true, userGroups }
  },
}
