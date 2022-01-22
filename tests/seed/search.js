const { USER_STATUS } = require('../../utils/types')

const _selectPeopleDataQuery = accountId => /*sql*/ `
  SELECT CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name, P.id
  FROM people P
  INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${accountId})
`

const getActiveUser = async ({ accountId, wambiDB }) =>
  await wambiDB.querySingle({
    queryText: /*sql*/ `
      ${_selectPeopleDataQuery(accountId)}
      WHERE P.status = ${USER_STATUS.ACTIVE}
      ORDER BY RAND()
    `,
  })

const getDisabledUser = async ({ accountId, wambiDB }) => {
  let wasActive = false

  let [disabledUser] = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      ${_selectPeopleDataQuery(accountId)}
      WHERE P.status = ${USER_STATUS.DISABLED}
      ORDER BY RAND()
      LIMIT 1
    `,
  })

  // If disabledUser is not found set a user to disabled and set wasActive to true so we revert the data...CY
  if (!disabledUser) {
    wasActive = true
    ;[disabledUser] = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        ${_selectPeopleDataQuery(accountId)}
        ORDER BY RAND()
        LIMIT 1
      `,
    })

    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people
        SET status = ${USER_STATUS.DISABLED}
        WHERE id = ${disabledUser.id}
      `,
    })
  }

  return { disabledUser, wasActive }
}

const revertDisabledUser = async ({ userId, wambiDB }) => {
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE people
      SET status = ${USER_STATUS.ACTIVE}
      WHERE id = ${userId}
    `,
  })
}

const getIncognitoUser = async ({ accountId, wambiDB }) => {
  let wasActive = false
  let [incognitoUser] = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      ${_selectPeopleDataQuery(accountId)}
      WHERE CAP.isIncognito = 1
      ORDER BY RAND()
      LIMIT 1
    `,
  })

  // If disabledUser is not found set a user to incognito and set wasActive to true so we revert the data...CY
  if (!incognitoUser) {
    wasActive = true
    ;[incognitoUser] = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        ${_selectPeopleDataQuery(accountId)}
        ORDER BY RAND()
        LIMIT 1
      `,
    })

    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE clientAccountPeople
        SET isIncognito = 1
        WHERE peopleId = ${incognitoUser.id}
          AND accountId = ${accountId}
      `,
    })
  }

  return { incognitoUser, wasActive }
}

const revertIncognitoUser = async ({ accountId, userId, wambiDB }) => {
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      UPDATE clientAccountPeople
      SET isIncognito = 0
      WHERE peopleId = ${userId} 
        AND accountId = ${accountId}
    `,
  })
}

module.exports = {
  getActiveUser,
  getDisabledUser,
  getIncognitoUser,
  revertDisabledUser,
  revertIncognitoUser,
}
