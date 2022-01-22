const { rejectRequest } = require('@serverHelpers/responses')
const { CHALLENGE_STATUS } = require('@utils')

export default async (req, res) => {
  const {
    body: { peopleId },
    clientAccount,
  } = req

  if (peopleId == null || isNaN(peopleId)) {
    return rejectRequest({ res, msg: 'Bad Request; Invalid argument.' })
  }

  try {
    const groupQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT G.id AS groupId, G.name,
          PG.id AS peopleGroupId, PG.level, PG.isPrimary,
          GT.name AS groupTypeName,
          GP.name AS parentGroupName
        FROM groups G
        INNER JOIN peopleGroups PG ON (G.id = PG.groupId AND PG.peopleId = ?)
        INNER JOIN groupTypes GT ON (G.groupTypeId = GT.id)
        LEFT JOIN groups GP ON (G.parentGroupId = GP.id)
        WHERE G.accountId = ${clientAccount.id}
      `,
      params: [peopleId],
    })

    const traitQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT T.id AS traitId, T.name,
          TT.name AS traitTypeName,
          PT.id AS peopleTraitId
        FROM traits T
        INNER JOIN peopleTraits PT ON (T.id = PT.traitId AND PT.peopleId = ?)
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id)
        WHERE TT.accountId = ${clientAccount.id}
      `,
      params: [peopleId],
    })

    const rewardClaimQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT RC.id AS rewardClaimId, RC.expiresAt, RC.claimedAt, RC.createdAt,
          RG.attributeValue, RG.name
        FROM rewardClaims RC
        INNER JOIN rewardGifts RG ON (RC.rewardGiftId = RG.id AND RG.accountId = ${clientAccount.id})
        WHERE RC.claimedBy = ?
        ORDER BY RC.claimedAt ASC, expiresAt DESC,  RC.createdAt ASC
      `,
      params: [peopleId],
    })

    const challengeQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT CP.id AS challengeProgressId, CP.completedAt,
          C.title, C.endDate
        FROM challenges C
        INNER JOIN challengeProgress CP ON (C.id = CP.challengeId AND CP.peopleId = ?)
        INNER JOIN challengeThemes CT ON (C.challengeThemeId = CT.id AND CT.accountId = ${clientAccount.id})
        WHERE C.status = ${CHALLENGE_STATUS.ACTIVE}
        ORDER BY CP.completedAt ASC, C.endDate ASC
      `,
      params: [peopleId],
    })

    const rewardProgressQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT RP.id AS rewardProgressId, RP.accountId, RP.progress, RP.startedAt, RP.completedAt, RP.playedAt
        FROM rewardProgress RP
        WHERE RP.accountId = ${clientAccount.id}
          AND RP.peopleId = ?
        ORDER BY RP.startedAt DESC, RP.id DESC
      `,
      params: [peopleId],
    })

    const [groupMembership, traitMembership, rewardClaims, challenges, rewardProgress] = await Promise.all([
      groupQuery,
      traitQuery,
      rewardClaimQuery,
      challengeQuery,
      rewardProgressQuery,
    ])

    res.json({ success: true, challenges, groupMembership, rewardClaims, rewardProgress, traitMembership })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
