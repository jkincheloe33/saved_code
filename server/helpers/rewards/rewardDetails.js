const selectRewardAttributes = require('./selectRewardAttributes')
const selectRewardDetails = require('./selectRewardDetails')

module.exports = {
  getDetails: async ({ claimedBy, clientAccountId, rewardClaimId, userSessionId }) => {
    //get gift detail by claimer ID...PS
    const claimer = claimedBy && claimedBy !== userSessionId ? claimedBy : userSessionId

    const rewardRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        ${selectRewardDetails(clientAccountId)}
        WHERE RC.id = ?
          AND RC.claimedBy = ${claimer}
      `,
      params: [rewardClaimId],
    })

    const reward = rewardRes[0]

    // Convert 1 || 0 to true || false and add attribute for the client...PS
    if (reward) {
      const { hasInventory } = reward
      reward.hasInventory = hasInventory > 0

      if (reward.itemNumber) {
        reward.attributes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            ${selectRewardAttributes({ clientAccountId, reward })}
          `,
        })
      }

      return { success: true, reward }
    } else {
      return { success: false }
    }
  },
}
