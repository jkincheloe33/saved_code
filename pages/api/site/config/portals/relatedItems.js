const { USER_STATUS } = require('@utils/types')

export default async (req, res) => {
  const {
    body: { portalId },
    clientAccount: { id: clientAccountId },
  } = req

  // Will return all related groups to a given portal id, how many descendent groups are included, and how many people...EK
  const groupsQuery = wambiDB.query({
    queryText: /*sql*/ `
      SELECT PG.id, PG.groupId, G.name, GC.groupCount, PC.peopleCount
      FROM portalGroups PG
      INNER JOIN portals P ON (P.id = PG.portalId AND P.accountId = ${clientAccountId} AND P.id = ?)
      INNER JOIN groups G ON (PG.groupId = G.id)
      LEFT JOIN (
        -- This gets all groups associated with a portal by direct or reference...EK
        SELECT portalGroups.groupId, COUNT(portalGroups.id) AS groupCount
        FROM portalGroups
        INNER JOIN groupIndex GI ON (portalGroups.groupId = GI.groupId)
        WHERE portalGroups.portalId = ?
        GROUP BY portalGroups.groupId
      ) AS GC ON (PG.groupId = GC.groupId)
      LEFT JOIN (
        -- This gets all people (in this case the count, but could be a list) associated with a portal...EK
        SELECT portalGroups.groupId, COUNT(DISTINCT P.id) AS peopleCount
        FROM portalGroups
        INNER JOIN groups G ON (portalGroups.groupId = G.id)
        INNER JOIN groupIndex GI ON (portalGroups.groupId = GI.groupId)
        INNER JOIN peopleGroups ON (GI.fromGroupId = peopleGroups.groupId)
        INNER JOIN people P ON (peopleGroups.peopleId = P.id AND P.status = ${USER_STATUS.ACTIVE})
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.hideFromPortal = 0)
        WHERE portalGroups.portalId = ?
        GROUP BY portalGroups.groupId
      ) AS PC ON (PG.groupId = PC.groupId)
    `,
    params: [portalId, portalId, portalId],
  })

  const questionSetsQuery = wambiDB.query({
    queryText: /*sql*/ `
      SELECT PQS.id, PQS.questionSetId, PQS.order,
        QS.name,
        GROUP_CONCAT(DISTINCT T.name SEPARATOR ', ') AS traits
      FROM portalQuestionSets PQS
      INNER JOIN questionSets QS ON (QS.id = PQS.questionSetId AND QS.accountId = ${clientAccountId})
      LEFT JOIN portalQuestionSetTraits PQST ON (PQST.portalQuestionSetId = PQS.id)
      LEFT JOIN traits T ON (T.id = PQST.traitId)
      WHERE PQS.portalId = ?
      GROUP BY PQS.id
      ORDER BY PQS.order ASC
    `,
    params: [portalId],
  })

  const questionSetGroupsQuery = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT PQSG.id, PQSG.groupId, G.name,
        PQS.id AS portalQuestionSetId
      FROM portalQuestionSetGroups PQSG
      INNER JOIN portalQuestionSets PQS ON (PQS.id = PQSG.portalQuestionSetId AND PQS.id IN (
        SELECT PQS.id
        FROM portalQuestionSets PQS
        INNER JOIN questionSets QS ON (QS.id = PQS.questionSetId AND QS.accountId = ${clientAccountId})
        WHERE PQS.portalId = ?
      ))
      INNER JOIN portals P ON (P.id = PQS.portalId AND P.accountId = ${clientAccountId})
      INNER JOIN groups G ON (G.id = PQSG.groupId)
      ORDER BY G.name
    `,
    params: [portalId],
  })

  const awardsQuery = wambiDB.query({
    queryText: /*sql*/ `
      SELECT T.id, T.name, T.awardType
      FROM awardTypes T
      INNER JOIN awardTypeGroups ATG ON (T.id = ATG.awardTypeId)
      INNER JOIN portalGroups PG ON (ATG.groupId = PG.groupId)
      INNER JOIN portals P ON (PG.portalId = P.id AND P.id = ?)
      WHERE T.accountId = ${clientAccountId}
      GROUP BY T.id
      ORDER BY T.id
    `,
    params: [portalId],
  })

  const [relatedGroups, relatedQuestionSets, relatedQuestionSetGroups, relatedAwards] = await Promise.all([
    groupsQuery,
    questionSetsQuery,
    questionSetGroupsQuery,
    awardsQuery,
  ])

  res.json({ success: true, relatedAwards, relatedGroups, relatedQuestionSetGroups, relatedQuestionSets })
}
