// gets all user's groups, as a string, that have an isLocation flag set. if they don't have any, sets their groupName to clientAccount.name...JK
module.exports = {
  getLocations: async (clientAccount, ids, userId) => {
    if (ids.length) {
      const locations = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT P.id, GROUP_CONCAT(DISTINCT G.name ORDER BY G.name ASC separator ', ') groupName
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id})
          LEFT JOIN peopleGroups PG ON (P.id = PG.peopleId)
          LEFT JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId)
          INNER JOIN groups G ON (GI.groupId = G.id AND G.accountId = ${clientAccount.id})
          INNER JOIN groupTypes GT ON (G.groupTypeId = GT.id AND GT.isLocation = 1)
          WHERE P.id IN (?)
            AND P.id <> ${userId}
          GROUP BY P.id
        `,
        params: [ids],
      })

      // match location to id. add clientAccount.name if id doesn't have an associated location...JK
      const groupNames = ids.map(id => {
        const name = locations.find(l => l.id === id)
        return { id, groupName: name && name.groupName ? name.groupName : clientAccount.name }
      })
      if (groupNames.length) return { success: true, groupNames }
      return { success: false }
    }
    return { success: true, groupNames: [] }
  },
}
