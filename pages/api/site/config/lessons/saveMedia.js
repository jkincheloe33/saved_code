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
      const { success } = await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        fileName: parsedBody.mediaUpload.fileName,
        mediaBuffer: parsedBody.mediaUpload.buffer,
        mediaCategory: 'lessons',
        mimeType: parsedBody.mediaUpload.mimeType,
        tableKey: parsedBody.lessonId,
        tableName: 'lessons',
        usage: 'primary',
      })

      if (success) {
        return res.json({ success: true })
      } else {
        return res.json({ success, msg: 'Issue linking uploaded media; check logs' })
      }
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    res.json({ success: false })
  }
}
