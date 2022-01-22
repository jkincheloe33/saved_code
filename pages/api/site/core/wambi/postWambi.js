import { postWambi } from '@serverHelpers/newsfeed/wambi'
import { ACCOUNT_ACCESS_LEVELS, USER_STATUS } from '@utils'

export default async (req, res) => {
  let {
    body: { cpcData, feedItemDraftId, sentAsPeopleId = null },
    clientAccount,
    session: { userId },
  } = req

  let { groups = [], recipients = [] } = cpcData
  const { accessLevel, id: clientAccountId } = clientAccount

  if (!groups.length && !recipients.length) return res.json({ success: false, msg: 'Error: No recipients selected.' })

  try {
    if (sentAsPeopleId && accessLevel > ACCOUNT_ACCESS_LEVELS.ACCOUNT_MANAGER) {
      userId = sentAsPeopleId

      // Get ids based on users' hrids...KA
      recipients = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT P.id
          FROM people P
          INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
          WHERE P.hrId IN (?)
            AND P.status = ${USER_STATUS.ACTIVE}
        `,
        params: [recipients],
      })

      if (!recipients.length) return res.json({ success: false, msg: 'Error: No recipients found for given HR IDs' })
      else cpcData.recipients = recipients
    }

    const { completedChallenges, newFeedId, rewardProgress, success } = await postWambi({
      authorId: userId,
      clientAccount,
      cpcData,
      feedItemDraftId,
      req,
      sentAsPeopleId,
    })

    if (success) res.json({ success: true, newFeedId, completedChallenges, rewardProgress })
    else res.json({ success: false, msg: 'Failed to post cpc.' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error: Please try again or submit a help desk ticket.' })
  }
}
