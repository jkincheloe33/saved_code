const getGroupLocation = async (clientAccount, groups) => {
  // get itself and all parents that is a location...PS
  if (groups.length) {
    const groupIds = groups.map(({ id }) => id)
    const locations = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT G.id, G.name, GI.fromGroupId,
          CONCAT(LEFT(G.name, 1 )) AS thumbnailImage
        FROM groups G 
        INNER JOIN groupIndex GI ON (G.id = GI.groupId AND GI.fromGroupId IN (?)) 
        INNER JOIN groupTypes GT ON (GT.id = G.groupTypeId)
        WHERE GT.isLocation = 1 OR G.id IN (?)
        ORDER BY GI.depth DESC
      `,
      params: [groupIds, groupIds],
    })

    if (locations.length) {
      groups.forEach(group => {
        const [groupData, locationData] = locations.filter(({ fromGroupId }) => fromGroupId === group.id)

        if (groupData) {
          group.id = groupData.id
          group.name = groupData.name
          group.thumbnailImage = groupData.thumbnailImage
          group.type = 'group'

          // if a parent group is found then assign a location else the location is the client account...PS
          group.groupName = locationData?.name ?? clientAccount.name
        }
      })
    }
  }
  return groups
}

module.exports = getGroupLocation
