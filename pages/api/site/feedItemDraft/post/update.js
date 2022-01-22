import fs from 'fs'
const { uploadVideo } = require('@serverHelpers/post/uploadVideo')
import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'
import { FEED_ITEM_DRAFT_STATUS } from '@utils/types'

import { v4 as uuidv4 } from 'uuid'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const {
    clientAccount,
    query: { isVideo = false },
    session: { userId },
  } = req

  let transaction
  let sourceFile

  try {
    let parsedBody
    if (isVideo === 'true') {
      sourceFile = `./_temp/${uuidv4()}_source`
      parsedBody = await parseMultipartFormData(req, sourceFile)
    } else parsedBody = await parseMultipartFormData(req)

    let { content, feedItemDraftId, file, pinDays, scheduledAt, status } = parsedBody
    const fileRemoved = parsedBody.fileRemoved === 'true'
    const groups = JSON.parse(parsedBody.groups)

    const fileType = !file ? null : file?.mimeType.includes('video') ? 'video' : 'image'

    const draftData = JSON.stringify({
      content,
      groups,
      pinDays,
    })

    transaction = await wambiDB.beginTransaction()

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE feedItemDrafts
        SET draftData = ?, scheduledAt = ?, editedAt = CURRENT_TIMESTAMP,
          status = ${fileType === 'video' ? FEED_ITEM_DRAFT_STATUS.VIDEO_PROCESSING : status}
        WHERE id = ?
          AND accountId = ${clientAccount.id}
          AND authorId = ${userId}
      `,
      params: [draftData, scheduledAt ? new Date(scheduledAt) : null, feedItemDraftId],
    })

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

    await wambiDB.commitTransaction(transaction)

    if (file) {
      if (fileType === 'video') {
        await uploadVideo({
          clientAccount,
          file,
          res,
          sourceFile,
          tableKey: feedItemDraftId,
          tableName: 'feedItemDrafts',
        })

        await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE feedItemDrafts
            SET status = ${status}
            WHERE id = ${feedItemDraftId}
          `,
        })
      } else if (fileType === 'image') {
        await uploadAndLinkMedia({
          clientAccount: req.clientAccount,
          fileName: file.fileName,
          mediaBuffer: file.buffer,
          mediaCategory: 'announcement',
          mimeType: file.mimeType,
          tableName: 'feedItemDrafts',
          tableKey: feedItemDraftId,
          transaction,
          usage: 'banner',
        })
      }
    }

    // Only send response back if we didnt upload a video, which sends one early...JC
    if (!res.headersSent) res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    if (sourceFile && fs.statSync(sourceFile)) fs.unlinkSync(sourceFile)
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
