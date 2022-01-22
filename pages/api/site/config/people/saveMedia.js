import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  let { peopleId, original, thumbnail } = await parseMultipartFormData(req)
  let originalImage = null
  let croppedImage = null

  const transaction = await wambiDB.beginTransaction()

  try {
    if (original) {
      originalImage = await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        mediaBuffer: original.buffer,
        tableName: 'people',
        tableKey: peopleId,
        mediaCategory: 'profile',
        fileName: original.fileName,
        mimeType: original.mimeType,
        usage: 'original',
        transaction,
      })
    }

    if (thumbnail) {
      croppedImage = await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        mediaBuffer: thumbnail.buffer,
        tableName: 'people',
        tableKey: peopleId,
        mediaCategory: 'profile',
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
    await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false })
  }
}
