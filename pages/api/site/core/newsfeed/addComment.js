const notification = require('@serverHelpers/notifications/newsfeed')
const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')
import { TRIGGERS } from '@utils/types'

// This endpoint will add a comment to a news feed item...EK
export default async (req, res) => {
  const {
    body: { comment, feedId, isCpc },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    // This insert is written so if the feed id specified is not in the current account, no record will be created...EK
    const commentAddRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO feedComments (feedId, authorId, comment)
          SELECT id, ${userId}, ?
          FROM feedItems
          WHERE id = ?
            AND accountId = ${clientAccountId}
      `,
      params: [comment, feedId],
    })

    if (commentAddRes.affectedRows === 1) {
      // Use execute Non Query to read from the write DB...EK
      const [insertedComment] = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          SELECT FC.comment, FC.id, FC.createdAt, FC.authorId,
            CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
            IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS authorImg
          FROM feedComments FC
          INNER JOIN people P ON (P.id = FC.authorId)
          LEFT JOIN mediaLink ML ON (ML.tableKey = P.id AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
          LEFT JOIN media M ON (M.id = ML.mediaId)
          WHERE FC.id = ?
        `,
        params: [commentAddRes.insertId],
      })

      // Await this time so challenge transaction finishes before create notification transaction...JC
      const { completedChallenges, rewardProgress } = await handleChallenges({
        clientAccountId,
        req,
        triggers: [isCpc ? TRIGGERS.CPC_COMMENT : TRIGGERS.ANNOUNCEMENT_COMMENT],
        userId,
      })

      if (isCpc) {
        notification.cpcComment(commentAddRes.insertId, clientAccountId)
      } else {
        notification.announcementComment(commentAddRes.insertId, clientAccountId)
      }

      res.json({ success: true, completedChallenges, insertedComment, rewardProgress })
    } else {
      res.json({ success: false, msg: 'Missing or invalid arguments' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
