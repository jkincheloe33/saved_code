import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  let parsedBody = await parseMultipartFormData(req)

  try {
    if (parsedBody) {
      const { image } = await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        fileName: parsedBody.mediaUpload.fileName,
        mediaBuffer: parsedBody.mediaUpload.buffer,
        mediaCategory: 'gifts',
        mimeType: parsedBody.mediaUpload.mimeType,
        tableKey: parsedBody.rewardGiftId,
        tableName: 'rewardGifts',
        usage: 'primary',
      })

      if (image) return res.json({ success: true })
      else return res.json({ success: false, msg: 'Issue linking uploaded media; check logs' })
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    res.json({ success: false })
  }
}
