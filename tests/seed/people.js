const { GROUP_ACCESS_LEVELS, USER_STATUS } = require('../../utils/types')

const editMemberProfile = async ({ directReport = false, me, wambiDB }) => {
  const teamMember = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT P.id, P.displayName
      FROM people P 
      INNER JOIN peopleGroups PG ON (P.id = PG.peopleId AND PG.level = ${GROUP_ACCESS_LEVELS.TEAM_MEMBER})
      INNER JOIN groupIndex GI ON (PG.groupId = GI.fromGroupId AND GI.groupId = ${me.groups[0].id})
      WHERE P.id <> ${me.id}
        AND P.status = ${USER_STATUS.ACTIVE}
        ${directReport ? `AND P.reportsTo = ${me.id}` : ''}
    `,
  })

  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE people 
      SET draftDisplayName = 'QA draft name'
      WHERE id = ${teamMember.id}
    `,
  })

  return teamMember
}

const revertPeopleProfile = async ({ people = [], wambiDB }) => {
  for (let i = 0; i < people.length; i++) {
    const p = people[i]
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people 
        SET displayName = '${p.displayName}', draftDisplayName = NULL
        WHERE id = ${p.id}
      `,
    })
  }
}

module.exports = {
  editMemberProfile,
  revertPeopleProfile,
}
