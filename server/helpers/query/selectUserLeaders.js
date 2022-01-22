// Gets a users leaders - managers and group owners in their groups...JC
const { GROUP_ACCESS_LEVELS, USER_STATUS } = require('@utils')

module.exports = {
  selectUserLeaders: ({ clientAccountId, userId }) => /*sql*/ `
    SELECT P.id
    FROM people P
    INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
    INNER JOIN peopleGroups PG ON (PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER} AND P.id = PG.peopleId AND PG.groupId IN (
      -- Get group owners in my groups
      SELECT PG.groupId
      FROM peopleGroups PG
      WHERE PG.peopleId = ${wambiDB.escapeValue(userId)}
      )
    )
    INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
    WHERE P.status = ${USER_STATUS.ACTIVE}
    UNION (
    -- Get person I report to
      SELECT P.id
      FROM people P
      INNER JOIN people P2 ON (P2.id = ${wambiDB.escapeValue(userId)} AND P.id = P2.reportsTo)
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
      WHERE P.status = ${USER_STATUS.ACTIVE}
    )
  `,
}
