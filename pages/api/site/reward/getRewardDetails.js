const { getDetails } = require('@serverHelpers/rewards/rewardDetails')

export default async (req, res) => {
  const {
    body: { claimedBy, rewardClaimId },
    clientAccount: { id: clientAccountId },
    session: { userId: userSessionId },
  } = req

  try {
    const { reward, success } = await getDetails({ claimedBy, clientAccountId, rewardClaimId, userSessionId })

    res.json({ success, reward })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
