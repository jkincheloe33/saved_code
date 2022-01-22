const getGroupChildren = async ({ groupId, wambiDB }) => {
  return await wambiDB.query({
    queryText: /*sql*/ `
      SELECT * 
      FROM groups
      WHERE parentGroupId = ${groupId}
    `,
  })
}

module.exports = {
  getGroupChildren,
}
