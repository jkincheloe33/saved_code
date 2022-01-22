const pageSize = 10

export default async (req, res) => {
  try {
    const {
      body: { page = 0 },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    // Get user reward progress list..PS
    const list = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RC.id AS rewardClaimId, RC.createdAt, RC.expiresAt AS claimExpiresAt, RC.claimedAt, RC.sentBy, RC.sentAt, RC.claimedBy,
          RG.name, RG.inventory, RG.ctaText, RG.endDate AS giftEndDate, RG.status,
          RP.id AS rewardProgressId,
          IFNULL(RG.inventory, 1) AS hasInventory,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM rewardClaims RC
        INNER JOIN rewardGifts RG ON (RG.id = RC.rewardGiftId AND RG.accountId = ${clientAccountId})
        LEFT JOIN rewardProgress RP ON (RP.rewardClaimId = RC.id)
        LEFT JOIN mediaLink ML ON (RG.id = ML.tableKey AND ML.tableName = 'rewardGifts' AND ML.usage = 'primary')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE RC.claimedBy = ${userSessionId} OR RC.sentBy = ${userSessionId}
        ORDER BY RC.createdAt DESC
        LIMIT ?, ? 
      `,
      params: [page * pageSize, pageSize],
    })

    list.forEach(reward => {
      reward.hasInventory = reward.hasInventory > 0
      reward.sentByMe = reward.sentBy === userSessionId
      reward.claimedByMe = reward.claimedBy === userSessionId
    })

    res.json({ success: true, list })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
