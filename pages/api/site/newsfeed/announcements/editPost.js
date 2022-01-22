import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  let transaction

  try {
    const parsedBody = await parseMultipartFormData(req)
    let { content, feedId, image, fileRemoved } = parsedBody

    transaction = await wambiDB.beginTransaction()

    const updatePost = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE feedItems
        SET content = ?, editedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND accountId = ${clientAccountId}
          AND authorId = ${userId}
      `,
      params: [content, feedId],
    })

    if (fileRemoved) {
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          DELETE FROM mediaLink
          WHERE tableKey = ?
            AND tableName = 'feedItems'
            AND (\`usage\` = 'banner'
            OR \`usage\` = 'video')
        `,
        params: [feedId],
      })
    }

    if (image) {
      await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        fileName: image.fileName,
        mediaBuffer: image.buffer,
        mediaCategory: 'announcement',
        mimeType: image.mimeType,
        tableName: 'feedItems',
        tableKey: feedId,
        transaction,
        usage: 'banner',
      })
    }

    await wambiDB.commitTransaction(transaction)

    res.json({ success: updatePost.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false })
  }
}
