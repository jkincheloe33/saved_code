// Gets a leaders direct reports and people in the groups they own...JC
const { GROUP_ACCESS_LEVELS, USER_STATUS } = require('@utils')

module.exports = {
  selectLeaderPeople: ({ clientAccountId, includeRealm = false, userId }) => /*sql*/ `
    SELECT P.id
    FROM people P
    INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
    ${
      includeRealm
        ? /*sql*/ `
      INNER JOIN peopleGroups PG ON (PG.peopleId = P.id)
      INNER JOIN groupIndex GI ON (PG.groupid = GI.fromGroupId AND GI.groupId IN (
        -- Get people who are in the realm of groups I own...KA
        SELECT PG.groupId
        FROM peopleGroups PG
        WHERE PG.peopleId = ${wambiDB.escapeValue(userId)}
          AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
        )
      )
    `
        : /*sql*/ `
      INNER JOIN peopleGroups PG ON (P.id = PG.peopleId AND PG.groupId IN (
        -- Get people who are in the groups I own
        SELECT PG.groupId
        FROM peopleGroups PG
        WHERE PG.peopleId = ${wambiDB.escapeValue(userId)}
          AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
        )
      )
    `
    }
    INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
    WHERE P.status = ${USER_STATUS.ACTIVE}
    UNION (
      -- Get people who report to me
      SELECT P.id
      FROM people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
      WHERE P.reportsTo = ${wambiDB.escapeValue(userId)}
        AND P.status = ${USER_STATUS.ACTIVE}
    )
`,
}
