import { handleChallenges } from '@serverHelpers/challenges/handleChallenges'
import { uploadAndLinkMedia } from '@serverHelpers/media'
import { postAnnouncement } from '@serverHelpers/newsfeed/announcement'
import notification from '@serverHelpers/notifications/newsfeed'
import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { getUserGroups } from '@serverHelpers/user/groups'

import { TRIGGERS } from '@utils/types'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  let transaction

  try {
    const parsedBody = await parseMultipartFormData(req)

    let { content, feedItemDraftId, file, pinDays } = parsedBody

    const {
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const fileRemoved = parsedBody.fileRemoved === 'true'
    const groups = JSON.parse(parsedBody.groups)
    let draftDetails
    if (parsedBody.draftDetails) {
      draftDetails = JSON.parse(parsedBody.draftDetails)
      draftDetails.hasMedia = Boolean(draftDetails.banner)
    }

    if (groups.length) {
      const { userGroups: userOwnedGroups } = await getUserGroups({
        clientAccountId,
        getByRealm: true,
        getOwned: true,
        groupsToCheck: groups.map(g => g.id),
        userId,
      })

      // Check if user have access level to all groups...CY
      if (userOwnedGroups.length) {
        transaction = await wambiDB.beginTransaction()

        if (fileRemoved) {
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              DELETE FROM mediaLink
              WHERE tableKey = ?
                AND tableName = 'feedItemDrafts'
                AND (\`usage\` = 'banner'
                OR \`usage\` = 'video')
            `,
            params: [feedItemDraftId],
          })
        }

        const feedItemDetails = {
          content,
          groups,
          pinDays,
          file,
        }

        const { feedId, success } = await postAnnouncement({
          accountId: clientAccountId,
          authorId: userId,
          draftDetails,
          feedItemDetails,
          req,
          transaction,
        })

        if (!success) {
          await wambiDB.rollbackTransaction(transaction)
          return res.json({ success: false, msg: 'Failed to save announcement' })
        }

        await wambiDB.commitTransaction(transaction)

        notification.postAnnouncement({ accountId: clientAccountId, feedId, groups, userId })

        if (file) {
          await uploadAndLinkMedia({
            clientAccount: req.clientAccount,
            fileName: file.fileName,
            mediaBuffer: file.buffer,
            mediaCategory: 'announcement',
            mimeType: file.mimeType,
            tableKey: feedId,
            tableName: 'feedItems',
            usage: 'banner',
          })
        }

        // Await so challenge transaction finishes before create notification transaction...JC
        const { completedChallenges, rewardProgress } = await handleChallenges({
          clientAccountId,
          req,
          triggers: [TRIGGERS.ANNOUNCEMENT_POST],
          userId,
        })

        res.json({ completedChallenges, newFeedId: feedId, rewardProgress, success: true })
      } else {
        res.json({ success: false, msg: 'User does not have the right access' })
      }
    } else {
      res.json({ success: false, msg: 'Missing necessary data to save post' })
    }
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
