// const notification = require('@serverHelpers/notifications/newsfeed')
const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')
import { TRIGGERS } from '@utils/types'

// This endpoint will add a reaction to a news feed item...EK
export default async (req, res) => {
  const {
    body: { feedId, isCpc, reactionId },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    // This insert is written so if either the feed or reaction id specified is not in the current account, no record will be created...EK
    const reactionAddRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO feedReactions (feedId, reactionId, peopleId)
          SELECT F.id, R.id, ${userId}
          FROM reactions R
          INNER JOIN feedItems F
          WHERE R.id = ?
            AND R.accountId = ${clientAccountId}
            AND F.id = ?
            AND F.accountId = ${clientAccountId}
      `,
      params: [reactionId, feedId],
    })

    if (reactionAddRes.affectedRows === 1) {
      // TODO: WP-4479 Uncomment when newsfeed reaction and stack notification is added
      //   if (isCpc) {
      //     notification.cpcReaction(reactionAddRes.insertId, clientAccountId)
      //   } else {
      //     notification.announcementReaction(reactionAddRes.insertId, clientAccountId)
      //   }

      const { completedChallenges, rewardProgress } = await handleChallenges({
        clientAccountId,
        req,
        triggers: [isCpc ? TRIGGERS.CPC_REACT : TRIGGERS.ANNOUNCEMENT_REACT],
        userId: req.session.userId,
      })

      res.json({ success: true, completedChallenges, newId: reactionAddRes.insertId, rewardProgress })
    } else {
      res.json({ success: false, msg: 'Missing or invalid arguments' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
