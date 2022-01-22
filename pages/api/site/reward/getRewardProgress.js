const { getProgress } = require('@serverHelpers/rewards/handleRewardProgress')

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    session: { userId: userSessionId },
  } = req

  try {
    const rewardProgress = await getProgress({ clientAccountId, req, userId: userSessionId })

    return res.json({ success: rewardProgress != null, rewardProgress })
  } catch (error) {
    logServerError({ error, req })
    return res.json({ success: false })
  }
}
