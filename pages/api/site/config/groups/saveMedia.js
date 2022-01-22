import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const { clientAccount } = req

  let { groupId, original, thumbnail } = await parseMultipartFormData(req)

  let originalImage
  let croppedImage
  let transaction

  try {
    transaction = await wambiDB.beginTransaction()

    if (original) {
      originalImage = await uploadAndLinkMedia({
        clientAccount: clientAccount,
        mediaBuffer: original.buffer,
        tableName: 'groups',
        tableKey: groupId,
        mediaCategory: 'groups',
        fileName: original.fileName,
        mimeType: original.mimeType,
        usage: 'original',
        transaction,
      })
    }

    if (thumbnail) {
      croppedImage = await uploadAndLinkMedia({
        clientAccount: clientAccount,
        mediaBuffer: thumbnail.buffer,
        tableName: 'groups',
        tableKey: groupId,
        mediaCategory: 'groups',
        fileName: thumbnail.fileName,
        mimeType: thumbnail.mimeType,
        usage: 'thumbnail',
        transaction,
      })
    }

    await wambiDB.commitTransaction(transaction)
    res.json({ success: true, croppedImage, originalImage })
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false })
  }
}
