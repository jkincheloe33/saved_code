const updateUserAccessLevel = async ({ accessLevel, accountId, user, wambiDB }) => {
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE clientAccountPeople
      SET accessLevel = ${accessLevel}
      WHERE peopleId = ${user.id}
        AND accountId = ${accountId}
    `,
  })
}

module.exports = { updateUserAccessLevel }
