import { USER_STATUS } from '@utils'

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      query: { groupId },
    } = req

    const traits = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT T.id, T.name
        FROM traits T
        INNER JOIN peopleTraits PT ON (T.id = PT.traitId)
        INNER JOIN people P ON (P.id = PT.peopleId
          AND P.status = ${USER_STATUS.ACTIVE}
        )
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId
          AND CAP.accountId = ${clientAccountId}
          AND CAP.hideFromPortal = 0
          AND CAP.isIncognito = 0
        )
        INNER JOIN peopleGroups PG ON (PT.peopleId = PG.peopleId)
        INNER JOIN groupIndex GI ON (PG.groupId = GI.fromGroupId AND GI.groupId = ?)
        INNER JOIN traitTypes TT ON (TT.id = T.traitTypeId
          AND TT.isReviewFilter = 1
          AND TT.accountId = ${clientAccountId}
        )
        ORDER BY T.name ASC
      `,
      params: [groupId],
    })

    res.json({ success: true, traits })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
