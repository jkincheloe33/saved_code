import getGroupLocation from '@serverHelpers/groupLocation'
import { GROUP_ACCESS_LEVELS, USER_STATUS } from '@utils/types'

export default async (req, res) => {
  try {
    const {
      session: { userId },
      clientAccount,
    } = req

    let userOwnedGroups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id, COUNT(PG2.peopleId) AS peopleCount, 0 AS isRealm
        FROM peopleGroups PG
        INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccount.id})
        INNER JOIN peopleGroups PG2 ON (PG2.groupId = G.id)
        INNER JOIN people P ON (P.id = PG2.peopleId AND P.status = ${USER_STATUS.ACTIVE})
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        WHERE PG.peopleId = ${userId}
          AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
        GROUP BY G.id
      `,
    })

    let combinedSearchResults = []

    if (userOwnedGroups.length) {
      const userRealmGroups = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT PG.groupId AS id, COUNT(DISTINCT P.id) AS peopleCount, 1 AS isRealm, GT.isLocation
          FROM peopleGroups PG
          INNER JOIN groupIndex GI ON (PG.groupId = GI.groupId
            AND PG.groupId IN (?)
            AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
            AND PG.peopleId = ${userId}
          )
          INNER JOIN groups G ON (G.id = GI.groupId AND G.accountId = ${clientAccount.id})
          INNER JOIN groupTypes GT ON (G.groupTypeId = GT.id)
          -- Get people count of all the people in the realm
          INNER JOIN peopleGroups PG2 ON (PG2.groupId = GI.fromGroupId)
          INNER JOIN people P ON (P.id = PG2.peopleId AND P.status = ${USER_STATUS.ACTIVE} AND P.id <> ${userId})
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
          GROUP BY PG.groupId
        `,
        params: [userOwnedGroups.map(({ id }) => id)],
      })

      // Inserts realm behind matching group so they are always grouped together...JC
      userOwnedGroups.forEach(g => {
        // Remove user from group people count after getting realm
        g.peopleCount -= 1
        // Filter out realms that have the same people count as groups so we don't return redundant groups
        const matchingRealm = userRealmGroups.find(r => r.id === g.id && r.peopleCount !== g.peopleCount)
        if (matchingRealm) {
          // If we match a realm below a group only the user is in, dont include the group
          combinedSearchResults.push(...(g.peopleCount === 0 ? [matchingRealm] : [g, matchingRealm]))
        } else if (g.peopleCount > 0) combinedSearchResults.push(g)
      })
    }

    // Add group parent locations...JC
    userOwnedGroups = await getGroupLocation(clientAccount, combinedSearchResults)

    res.json({ success: true, userOwnedGroups })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
