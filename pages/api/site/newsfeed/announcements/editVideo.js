const { uploadVideo } = require('@serverHelpers/post/uploadVideo')

import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { FEED_ITEM_STATUS } from '@utils/types'

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

  try {
    const parsedBody = await parseMultipartFormData(req, sourceFile)
    let { content, feedId, file } = parsedBody

    const updateFeedItemRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE feedItems
        SET content = ?, status = ${FEED_ITEM_STATUS.HIDDEN},
          editedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND accountId = ${clientAccount.id}
          AND authorId = ${userId}
      `,
      params: [content, feedId],
    })

    if (updateFeedItemRes.changedRows === 0) return res.json({ success: false })

    await uploadVideo({ clientAccount, file, res, sourceFile, tableKey: feedId, tableName: 'feedItems' })

    // After media has uploaded to CDN, update feedItem to be visible...JC
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE feedItems
        SET status = ${FEED_ITEM_STATUS.VISIBLE}
        WHERE id = ${feedId}
      `,
    })
  } catch (error) {
    logServerError({ error, req })
    if (!res.headersSent) res.json({ success: false, msg: 'Failed to save post' })
  }
}
