import { getLocations } from '@serverHelpers/people'
import { USER_STATUS } from '@utils/types'

const pageSize = 10

export default async (req, res) => {
  try {
    let {
      body: { groupId, isRealm, page = 0, search = '' },
      clientAccount,
      session: { userId },
    } = req

    const searchTerm = wambiDB.escapeValue(
      search
        .trim()
        .split(' ')
        .map(s => `${s}%`)
        .join(' ')
    )

    // If group is a realm, pull everyone inside realm...JC
    const groupsJoin = isRealm
      ? `INNER JOIN groupIndex GI ON (PG.groupid = GI.fromGroupId AND GI.groupId = ${wambiDB.escapeValue(groupId)})`
      : `INNER JOIN groups G ON (PG.groupId = G.id AND G.id = ${wambiDB.escapeValue(groupId)} AND G.accountId = ${clientAccount.id})
    `

    const groupMembers = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.jobTitle, P.isSelfRegistered,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
        ${groupsJoin}
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.id <> ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
          AND (
            P.firstName LIKE ${searchTerm}
              OR P.lastName LIKE ${searchTerm}
              OR P.displayName LIKE ${searchTerm}
              OR CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName) LIKE ${searchTerm}
          )
        GROUP BY P.id
        -- Order by relevancy (most relevant on top)
        ORDER BY CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName)
        LIMIT ${page * pageSize}, ${pageSize}
      `,
    })

    if (groupMembers.length) {
      const locations = await getLocations(
        clientAccount,
        groupMembers.map(p => p.id),
        userId
      )

      // if locations was successful, match each person to their groupName
      // locations array always matches order of ids in peopleList array...JK
      if (locations?.success) locations.groupNames.forEach((location, i) => (groupMembers[i].groupName = location.groupName))
    }

    res.json({ groupMembers, success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
