import { USER_STATUS } from '@utils'

const limit = 12

export default async (req, res) => {
  try {
    let {
      body: { groupId, page = 0, searchTerm = '', traitId },
      clientAccount,
    } = req

    // Use the + operator at the start of each word to ensure that is in the results, and use the * at the end for "starts with" behavior.
    // NOTE: We may need to tweak this later with double quotes
    const peopleSearchTerm = wambiDB.escapeValue(
      searchTerm
        .trim()
        .split(' ')
        .map(s => `${s}%`)
        .join(' ')
    )

    // let fullTextTerm

    // if (/-|>|<|\(|\)|~|\+|\*/.test(searchTerm)) {
    //   if (searchTerm.length === 1) searchTerm = ''
    //   fullTextTerm = wambiDB.escapeValue(searchTerm)
    // } else {
    //   fullTextTerm = searchTerm
    //     .split(' ')
    //     .map(t => wambiDB.escapeValue(`+${t}*`))
    //     .join(' ')
    // }

    const peopleTraitsJoin = traitId
      ? `INNER JOIN peopleTraits PT ON (PT.peopleId = P.id AND PT.traitId = ${wambiDB.escapeValue(traitId)})`
      : ''

    const peopleGroupsJoin = groupId
      ? `INNER JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId AND GI.groupId = ${wambiDB.escapeValue(groupId)})`
      : ''

    const results = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image,
          IF(NULLIF(P.prefix, '') IS NOT NULL,
            CONCAT(P.prefix, ' ',P.lastName),
            CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', LEFT(P.lastName, 1), '.') ) AS name,
          IFNULL(P.jobTitleDisplay, P.jobTitle) AS title
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId
          AND CAP.accountId = ${clientAccount.id}
          AND CAP.hideFromPortal = 0
          AND CAP.isIncognito = 0
        )
        INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
        -- Get users that have at least one group that is not hidden from portal...CY
        INNER JOIN groups G ON (PG.groupId = G.id AND G.hideFromPortal = 0)
        LEFT JOIN mediaLink ML ON (ML.tableKey = P.id AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        ${peopleGroupsJoin}
        ${peopleTraitsJoin}
        WHERE P.status = ${USER_STATUS.ACTIVE}
          AND P.isSelfRegistered = 0
          ${
            searchTerm.length
              ? `AND (
                P.firstName LIKE ${peopleSearchTerm}
                OR P.lastName LIKE ${peopleSearchTerm}
                OR P.displayName LIKE ${peopleSearchTerm}
                OR CONCAT(IFNULL(P.displayName, P.firstName), ' ', P.lastName) LIKE ${peopleSearchTerm}
                OR CONCAT(P.prefix, ' ',P.lastName) LIKE ${peopleSearchTerm}
              )`
              : ''
          }
        GROUP BY P.id
        ORDER BY (ML.id IS NULL), name
        LIMIT ?, ?
      `,
      params: [page * limit, limit],
    })

    res.json({ success: true, results })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
