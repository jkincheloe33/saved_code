module.exports = {
  // Takes a list of groups and calculates managing groups in the hierarchy tree...JC
  getManagingGroups: async ({ groups, onlyManaging }) => {
    const groupIndexList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT GI.groupId, GI.fromGroupId
        FROM groupIndex GI
        WHERE GI.fromGroupId IN (?)
          AND GI.groupId <> GI.fromGroupId
        ORDER BY GI.depth DESC
      `,
      params: [groups.map(g => g.id)],
    })

    /*
    -- Calculating if a group is managing
    Given below arrays, check every groupIndexList array item's fromGroupId. Then, loop through the groupId list of the entire groupIndexList.  If one of those
    groupIds is also in the groups array list AND the fromGroupId is also equal to the group you are currently checking, it is not a managing group.

    Ex:
    1. Given this item in groupIndexList:  { groupId: 7964, fromGroupId: 7977 },
    2. Loop through the groupIndexList list of groupIds (7964, 5303, 7917, 5292, 5292, 7916)
    3. First, we check if groupId 7964 is also in the groups array
    4. It is not, so continue
    5. Then check if groupId 5303 is also in the groups array.
    6. It is! However, the fromGroupId is not equal to the fromGroupId in our group we are currently checking (7977). It is (6823).
      This means that it belongs to a different realm and is not a 'parent' of group 7977 higher up.
    7. Continue looping. We never find another groupId that belongs to the groups array
    8. Move on to check { groupId: 5303, fromGroupId: 6823 }. We only check from that array item down.
    9. First, check if groupId 5303 is in the groups array.
    10. It is! The fromGroupId is equal to the fromGroupId of the group we are checking (6823). This is confirmed NOT a managing group.
    11. Check next group in groupIndexList { groupId: 7917, fromGroupId: 7977 }. Continue looping.
    NOTE: Top level groups (with no parent groups) will not be included in the groupIndexList because their groupId and fromGroupId equal each other. 
      We set those to managing later.

    {
      groupIndexList: [
         { groupId: 7964, fromGroupId: 7977 },
         { groupId: 5303, fromGroupId: 6823 },
         { groupId: 7917, fromGroupId: 7977 },
         { groupId: 5292, fromGroupId: 5303 },
         { groupId: 5292, fromGroupId: 6823 },
         { groupId: 7916, fromGroupId: 7977 }
      ]
    }

      groups: [ { id: 5303 },  { id: 6823 }, { id: 7977 } ]
    */

    const [groupsWithManaging] = groupIndexList.reduce(
      ([groups, checkedIds], group, i) => {
        // If id has already been checked, return
        if (checkedIds.includes(group.fromGroupId)) {
          return [groups, checkedIds]
        } else if (
          groupIndexList
            .slice(i, groupIndexList.length)
            .some(indexListGroup => indexListGroup.fromGroupId === group.fromGroupId && groups.find(g => g.id === indexListGroup.groupId))
        ) {
          // Found a non-managing group
          groups.find(g => g.id === group.fromGroupId).isManaging = 0
          return [groups, [...checkedIds, group.fromGroupId]]
        } else {
          // Found a managing group
          groups.find(g => g.id === group.fromGroupId).isManaging = 1
          return [groups, [...checkedIds, group.fromGroupId]]
        }
      },
      [[...groups], []]
    )

    // If id in groups is not in groupIndex list query, it is a top level managing group...JC
    const allGroups = groupsWithManaging.map(group => (group.isManaging == null ? { ...group, isManaging: 1 } : group))

    return onlyManaging ? allGroups.filter(g => g.isManaging) : allGroups
  },
}
