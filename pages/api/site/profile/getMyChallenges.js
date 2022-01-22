const { getChallenges } = require('@serverHelpers/challenges/getChallenges')

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      query: { userProgress },
      session: { userId: userSessionId },
    } = req

    const { challenges } = await getChallenges({
      clientAccountId,
      isMe: true,
      limit: 4,
      req,
      userId: userSessionId,
      userProgress: Number(userProgress),
    })

    res.json({ success: true, challengeList: challenges })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
