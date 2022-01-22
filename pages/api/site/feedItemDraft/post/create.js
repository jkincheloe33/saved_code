import fs from 'fs'
import { uploadAndLinkMedia } from '@serverHelpers/media'
import { uploadVideo } from '@serverHelpers/post/uploadVideo'
import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { FEED_ITEM_DRAFT_STATUS, FEED_ITEM_TYPES } from '@utils/types'
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

  let sourceFile

  try {
    let parsedBody
    if (isVideo === 'true') {
      sourceFile = `./_temp/${uuidv4()}_source`
      parsedBody = await parseMultipartFormData(req, sourceFile)
    } else parsedBody = await parseMultipartFormData(req)

    const { content, file, scheduledAt, pinDays, status } = parsedBody

    const groups = JSON.parse(parsedBody.groups)

    const fileType = !file ? null : file?.mimeType.includes('video') ? 'video' : 'image'

    const draftData = JSON.stringify({
      content,
      groups,
      pinDays,
    })

    const feedItemDraft = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO feedItemDrafts
        SET ?
      `,
      params: [
        {
          accountId: clientAccount.id,
          authorId: userId,
          draftData,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          itemType: FEED_ITEM_TYPES.ANNOUNCEMENT,
          status: fileType === 'video' ? FEED_ITEM_DRAFT_STATUS.VIDEO_PROCESSING : status,
        },
      ],
    })

    if (fileType === 'video') {
      await uploadVideo({
        clientAccount,
        file,
        res,
        sourceFile,
        tableKey: feedItemDraft.insertId,
        tableName: 'feedItemDrafts',
      })

      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE feedItemDrafts
          SET status = ${status}
          WHERE id = ${feedItemDraft.insertId}
        `,
      })
    } else if (fileType === 'image') {
      await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        fileName: file.fileName,
        mediaBuffer: file.buffer,
        mediaCategory: 'announcement',
        mimeType: file.mimeType,
        tableKey: feedItemDraft.insertId,
        tableName: 'feedItemDrafts',
        usage: 'banner',
      })
    }

    // Only send response back if we didnt upload a video, which sends one early..JC
    if (!res.headersSent) res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    if (sourceFile && fs.statSync(sourceFile)) fs.unlinkSync(sourceFile)
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
