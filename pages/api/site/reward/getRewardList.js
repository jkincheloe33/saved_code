import { REWARD_GIFT_STATUS } from '@utils/types'
const pageSize = 10

export default async (req, res) => {
  try {
    const {
      body: { page = 0, rewardClaimId },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    // Verify the rewardProgress record, and get the level the user won at...JC
    const rewardProgressRecord = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT RL.level AS levelWonAt, RG.id AS rewardGiftId
        FROM rewardProgress RP
        INNER JOIN rewardLevels RL ON (RL.id = RP.winLevelId AND RL.accountId = ${clientAccountId})
        INNER JOIN rewardClaims RC ON (RC.id = RP.rewardClaimId AND RC.claimedAt IS NULL AND RC.claimedBy = ${userSessionId})
        INNER JOIN rewardGifts RG ON (RC.rewardGiftId = RG.id)
        WHERE RP.rewardClaimId = ?
          AND RP.playedAt IS NOT NULL
      `,
      params: [rewardClaimId],
    })

    if (!rewardProgressRecord) return res.json({ msg: 'Could not find a valid reward progress record', success: false })
    const { levelWonAt, rewardGiftId } = rewardProgressRecord

    let rewards = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT RG.id, RG.name, RG.description, RG.endDate AS giftEndDate, RG.requiredShipping, RG.requiredPhone, RG.inventory AS hasInventory, RG.ctaText, RG.attributeValue,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
        FROM rewardGifts RG
        LEFT JOIN rewardGiftGroups RGG ON (RG.id = RGG.rewardGiftId)
        LEFT JOIN groupIndex GI ON (RGG.groupId = GI.groupId OR RGG.groupId IS NULL)
        INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId = ${userSessionId})
        INNER JOIN rewardLevels RL ON (RL.id = RG.rewardLevelId AND RL.level <= ${levelWonAt} AND RL.accountId = ${clientAccountId})
        LEFT JOIN mediaLink ML ON (RG.id = ML.tableKey AND ML.tableName = 'rewardGifts' AND ML.usage = 'primary')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE RG.status = ${REWARD_GIFT_STATUS.ACTIVE}
          AND RG.Id <> ${rewardGiftId}
          AND (RG.inventory > 0 OR RG.inventory IS NULL)
          AND (CURRENT_TIMESTAMP > RG.startDate OR RG.startDate IS NULL)
          AND (CURRENT_TIMESTAMP < RG.endDate OR RG.endDate IS NULL)
        GROUP BY IFNULL(RG.itemNumber, RG.id)
        ORDER BY RL.level, RG.order
        LIMIT ?, ${pageSize}
      `,
      params: [page * pageSize],
    })

    // Convert inventory for each reward to true for the client...PS
    rewards.forEach(reward => (reward.hasInventory = true))

    res.json({ success: true, rewards })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
