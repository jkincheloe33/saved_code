import { REWARD_GIFT_STATUS } from '@utils/types'
const selectRewardAttributes = require('@serverHelpers/rewards/selectRewardAttributes')
const selectRewardDetails = require('@serverHelpers/rewards/selectRewardDetails')

export default async (req, res) => {
  try {
    const {
      body: { newGiftId, rewardClaimId },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    // Verify the rewardProgress record, and get the level the user won at...JC
    const rewardProgressRecord = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT RL.level AS levelWonAt
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

    // Verify user has claimed a gift at the same level or below and gift is still available...JC
    const verifyGiftAvailable = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM rewardGifts RG
        LEFT JOIN rewardGiftGroups RGG ON (RG.id = RGG.rewardGiftId)
        LEFT JOIN groupIndex GI ON (RGG.groupId = GI.groupId OR RGG.groupId IS NULL)
        INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId = ${userSessionId})
        INNER JOIN rewardLevels RL ON (RL.id = RG.rewardLevelId AND RL.level <= ${rewardProgressRecord.levelWonAt} AND RL.accountId = ${clientAccountId})
        WHERE RG.id = ?
          AND RG.status = ${REWARD_GIFT_STATUS.ACTIVE}
          AND (RG.inventory > 0 OR RG.inventory IS NULL)
          AND (CURRENT_TIMESTAMP > RG.startDate OR RG.startDate IS NULL)
          AND (CURRENT_TIMESTAMP < RG.endDate OR RG.endDate IS NULL)
      `,
      params: [newGiftId],
    })

    if (!verifyGiftAvailable)
      return res.json({ msg: 'User does not have permission to claim gift or gift is not available', success: false })

    // Update reward progress gift id to new gift...JC
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE rewardClaims
        SET rewardGiftId = ?
        WHERE id = ?
      `,
      params: [newGiftId, rewardClaimId],
    })

    // Return the new gift...JC
    const [newReward] = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        ${selectRewardDetails(clientAccountId)}
        WHERE RC.id = ${rewardClaimId}
      `,
    })

    if (newReward) {
      const { hasInventory } = newReward
      newReward.hasInventory = hasInventory > 0 || hasInventory === null

      if (newReward.itemNumber) {
        newReward.attributes = await wambiDB.query({
          queryText: /*sql*/ `
            ${selectRewardAttributes({ clientAccountId, reward: newReward })}
          `,
        })
      }

      if (newReward.hasInventory) res.json({ success: true, reward: newReward })
      else res.json({ success: false, msg: 'This reward no longer has inventory. Please play again soon.' })
    } else {
      res.json({ success: false, msg: 'There was an issue retrieving your reward.' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
