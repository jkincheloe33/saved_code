import { handleChallenges } from '@serverHelpers/challenges/handleChallenges'
import { postAnnouncement } from '@serverHelpers/newsfeed/announcement'
import notification from '@serverHelpers/notifications/newsfeed'
import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadVideo } from '@serverHelpers/post/uploadVideo'
import { getUserGroups } from '@serverHelpers/user/groups'

import { FEED_ITEM_STATUS, TRIGGERS } from '@utils/types'

import { v4 as uuidv4 } from 'uuid'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const {
    clientAccount,
    session: { userId },
  } = req

  // Initialize temp files...JC
  const uid = uuidv4()
  const sourceFile = `./_temp/${uid}_source`

  let transaction

  try {
    // Parse the body...JC
    const parsedBody = await parseMultipartFormData(req, sourceFile)
    let { content, file, pinDays } = parsedBody

    const groups = JSON.parse(parsedBody.groups)
    let draftDetails
    if (parsedBody.draftDetails) {
      draftDetails = JSON.parse(parsedBody.draftDetails)
      draftDetails.hasMedia = Boolean(draftDetails.video)
    }

    const { userGroups: userOwnedGroups } = await getUserGroups({
      clientAccountId: clientAccount.id,
      getByRealm: true,
      getOwned: true,
      groupsToCheck: groups.map(g => g.id),
      userId,
    })

    // Check if user have access level to all groups...CY
    if (userOwnedGroups.length) {
      transaction = await wambiDB.beginTransaction()

      const feedItemDetails = {
        content,
        groups,
        pinDays,
        file,
        status: FEED_ITEM_STATUS.HIDDEN,
      }

      const { feedId, success } = await postAnnouncement({
        accountId: clientAccount.id,
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
      await uploadVideo({ clientAccount, file, res, sourceFile, tableKey: feedId, tableName: 'feedItems' })

      // After media has uploaded to CDN, update feedItem to be visible...JC
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE feedItems
          SET status = ${FEED_ITEM_STATUS.VISIBLE}
          WHERE id = ${feedId}
      `,
      })

      // Await so challenge transaction finishes before create notification transaction...JC
      await handleChallenges({
        clientAccountId: clientAccount.id,
        noCelebration: true,
        req,
        triggers: [TRIGGERS.ANNOUNCEMENT_POST],
        userId,
      })

      notification.postAnnouncement({ accountId: clientAccount.id, feedId, groups, userId })
    } else {
      res.json({ success: false, msg: 'User does not have the right access' })
    }
  } catch (error) {
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    logServerError({ error, excludeBody: true, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
