const { getChallenges } = require('@serverHelpers/challenges/getChallenges')

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    query: { page, userId, userProgress },
    session: { userId: userSessionId },
  } = req

  try {
    const { challenges, msg, success } = await getChallenges({
      clientAccountId,
      isMe: userId == userSessionId,
      limit: 20,
      page,
      req,
      userId: userId || userSessionId,
      userProgress: Number(userProgress),
    })

    res.json({ msg, success, challenges })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
