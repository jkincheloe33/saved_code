/**
 * This endpoint gets the Wambi list for a user..PS
 */
import { TRIGGERS } from '@utils'
const { getWambis } = require('@serverHelpers/wambi')
const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')

export default async (req, res) => {
  let {
    clientAccount: { id: clientAccountId },
    body: { fetchedInitialList, page, userId, type },
    session: { userId: userSessionId },
  } = req

  // Pass in userId query param if it's another user. If it's you, you have id in userSession..JC
  userId = userId || userSessionId
  const isMe = userId == userSessionId

  try {
    const { cpc, success } = await getWambis({
      clientAccountId,
      isMe,
      limit: 20,
      userId,
      page,
      type,
      userSessionId,
    })

    // Complete challenge only for viewing your own cpc list. Only check the first time...JC
    const { completedChallenges, rewardProgress } =
      isMe && fetchedInitialList
        ? await handleChallenges({
            clientAccountId,
            req,
            triggers: [TRIGGERS.CPC_VIEW_ALL],
            userId,
          })
        : {}

    res.json({ completedChallenges, cpc, rewardProgress, success })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'An error occurred. Check system logs for details.' })
  }
}
