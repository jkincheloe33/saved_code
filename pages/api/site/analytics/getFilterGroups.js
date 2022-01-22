import { GROUP_ACCESS_LEVELS } from '@utils/types'

export default async (req, res) => {
  try {
    const {
      body: { parentGroup, search = '' },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req
    const searchTrimmed = search.trim()
    const term = wambiDB.escapeValue(`%${searchTrimmed}%`)

    let childGroups = []

    if (!parentGroup) {
      childGroups = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT DISTINCT G.id, G.name, COUNT(CG.id) childCount
          FROM peopleGroups PG
          INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
          LEFT JOIN groups CG ON (G.id = CG.parentGroupId)
          WHERE PG.peopleId = ${userSessionId}
            AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
            AND G.name LIKE ${term}
          GROUP BY G.id
          ORDER BY G.name ASC
        `,
      })
    } else {
      childGroups = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT G.id, G.name, COUNT(CG.id) childCount
          FROM groups G
          LEFT JOIN groups CG ON (G.id = CG.parentGroupId)
          WHERE G.parentGroupId = ${parentGroup.id}
            AND G.accountId = ${clientAccountId}
            AND G.name LIKE ${term}
          GROUP BY G.id
          ORDER BY G.name ASC
        `,
      })
    }

    res.json({ success: true, childGroups, parentGroup })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
