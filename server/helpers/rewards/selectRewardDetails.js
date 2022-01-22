const selectRewardDetails = clientAccountId => {
  return /*sql*/ `
    SELECT RC.id AS rewardClaimId, RC.expiresAt AS claimExpiresAt, RC.sentAt, RC.createdAt, RC.claimedAt, RC.claimedBy, RC.sendNote,
      RG.id AS rewardGiftId, RG.name, RG.description, RG.requiredShipping, RG.endDate AS giftEndDate, RG.requiredPhone, RG.inventory, RG.ctaText, RG.itemNumber, RG.isRaffle, RG.attributeName, RG.attributeValue, RG.status,
      RP.id AS rewardProgressId,
      IFNULL(P.jobTitleDisplay, P.jobTitle) AS senderTitle,
      IFNULL(RG.inventory, 1) AS hasInventory,
      CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS senderName,
      IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MT.category, '/', MT.uid, '.', MT.ext),
      CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage,
      CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image,
      IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MR.category, '/', MR.uid, '.', MR.ext),
      CONCAT(LEFT(IFNULL(NULLIF(PR.displayName, ''), PR.firstName), 1), LEFT(PR.lastName, 1))) AS receiverThumbnailImage,
      CONCAT(IFNULL(NULLIF(PR.displayName, ''), PR.firstName), ' ', PR.lastName) AS recipient
    FROM rewardClaims RC
    INNER JOIN rewardGifts RG ON (RG.id = RC.rewardGiftId AND RG.accountId = ${clientAccountId})
    INNER JOIN people PR ON (PR.id = RC.claimedBy)
    LEFT JOIN rewardProgress RP ON (RC.id = RP.rewardClaimId)
    LEFT JOIN people P ON (RC.sentBy = P.id)
    LEFT JOIN mediaLink ML ON (RG.id = ML.tableKey AND ML.tableName = 'rewardGifts' AND ML.usage = 'primary')
    LEFT JOIN media M ON (ML.mediaId = M.id)
    LEFT JOIN mediaLink MLT ON (P.id = MLT.tableKey AND MLT.usage = 'thumbnail' AND MLT.tableName = 'people')
    LEFT JOIN media MT ON (MLT.mediaId = MT.id)
    LEFT JOIN mediaLink MLR ON (PR.id = MLR.tableKey AND MLR.usage = 'thumbnail' AND MLR.tableName = 'people')
    LEFT JOIN media MR ON (MLR.mediaId = MR.id)
  `
}

module.exports = selectRewardDetails
