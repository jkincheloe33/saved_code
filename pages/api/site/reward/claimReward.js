import { sendGiftConfirmation_Email, sendNotifiedGiftConfirmation_Email, sendRaffleConfirmation_Email } from '@serverHelpers/email'
import { capitalizeWords, REWARD_GIFT_STATUS } from '@utils'

export default async (req, res) => {
  let transaction
  try {
    const {
      body: { rewardClaimId, userData = {} },
      clientAccount: { id: clientAccountId, name: clientAccountName },
      session: { userId },
    } = req

    // Validate claim data, check inventory, and get email data...CY
    const claimData = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT RC.id AS rewardClaimId, RC.rewardGiftId,
          RG.SKU AS sku, RG.notifyWhenClaimed, RG.claimInstructions, RG.name, RG.isRaffle, RG.itemNumber, RG.attributeName, RG.attributeValue,
          G.name location,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image,
          P.hrId, P.email, P.mobile,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS fullName
        FROM rewardClaims RC
        INNER JOIN rewardGifts RG ON (RG.id = RC.rewardGiftId
          AND (RG.inventory > 0 OR RG.inventory IS NULL) 
          AND RG.status IN (${REWARD_GIFT_STATUS.ACTIVE}, ${REWARD_GIFT_STATUS.MANUAL}))
        INNER JOIN people P ON (P.id = RC.claimedBy)
        INNER JOIN peopleGroups PG ON (PG.peopleId = P.id)
        INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
        LEFT JOIN mediaLink ML ON (RG.id = ML.tableKey AND ML.tableName = 'rewardGifts' AND ML.usage = 'primary')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE RC.id = ?
          AND RC.claimedAt IS NULL
          AND RC.claimedBy = ${userId}
      `,
      params: [rewardClaimId],
    })

    if (!claimData) return res.json({ success: false, msg: 'Failed to claim gift.' })

    transaction = await wambiDB.beginTransaction()

    // Update columns with claim info...PS
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE rewardClaims
        SET claimedAt = CURRENT_TIMESTAMP,
          claimMetadata = ? 
        WHERE id = ? 
      `,
      params: [Object.keys(userData).length ? JSON.stringify(userData) : null, rewardClaimId],
    })

    // Decrement inventory when claiming...PS
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE rewardGifts
        SET inventory = inventory - 1
        WHERE id = ${claimData.rewardGiftId} 
          AND inventory IS NOT NULL
      `,
    })

    await wambiDB.commitTransaction(transaction)

    // Prune data from claim data if value is null...CY
    const pruneNullKeys = ['image', 'notifyWhenClaimed', 'email', 'attributeName', 'attributeValue', 'claimInstructions']
    pruneNullKeys.forEach(key => {
      if (claimData[key] == null) delete claimData[key]
    })

    claimData.fullName = capitalizeWords(claimData.fullName)
    if (userData.email) claimData.email = userData.email
    claimData.mobile = userData.mobile || claimData.mobile
    claimData.clientAccountName = clientAccountName
    claimData.giftName = claimData.name || ''

    if (userData.address) {
      const { address, addressTwo, city, state, zip } = userData

      claimData.address = `${address}, ${addressTwo ? `${addressTwo}, ` : ''}${city}, ${state} ${zip}`
    } else {
      claimData.address = null
    }

    // Set null data as N/A...CY
    Object.keys(claimData).forEach(key => (claimData[key] = claimData[key] ?? 'N/A'))

    if (claimData.notifyWhenClaimed && !claimData.isRaffle) sendNotifiedGiftConfirmation_Email(claimData)

    if (claimData.email) {
      claimData.isRaffle ? sendRaffleConfirmation_Email(claimData) : sendGiftConfirmation_Email(claimData)
    }

    return res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Failed to claim gift. Please try again later.' })
  }
}
