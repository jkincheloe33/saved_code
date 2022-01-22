import { USER_STATUS } from '@utils'

// Gets the list of filterable groups within a location...JC
export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      query: { groupId },
    } = req

    const groups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id, G.name
        FROM groups G
        INNER JOIN groupIndex GI ON (G.id = GI.fromGroupId AND GI.groupId = ?)
        INNER JOIN groupTypes GT ON (G.groupTypeId = GT.id AND GT.isReviewFilter = 1)
        INNER JOIN peopleGroups PG ON (PG.groupId = G.id)
        INNER JOIN people P ON (P.id = PG.peopleId
          AND P.status = ${USER_STATUS.ACTIVE}
        )
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId
          AND CAP.accountId = ${clientAccountId}
          AND CAP.hideFromPortal = 0
          AND CAP.isIncognito = 0
        )
        WHERE G.id <> ?
          AND G.accountId = ${clientAccountId}
          AND G.hideFromPortal = 0
        GROUP BY G.id
        ORDER BY G.name ASC
      `,
      params: [groupId, groupId],
    })

    res.json({ success: true, groups })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
