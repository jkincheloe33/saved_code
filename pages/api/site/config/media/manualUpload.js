import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadMedia } from '@serverHelpers/media'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  try {
    const parsedBody = await parseMultipartFormData(req)

    if (parsedBody) {
      const uploadRes = await uploadMedia({
        clientAccount: req.clientAccount,
        mediaBuffer: parsedBody.mediaUpload.buffer,
        mediaCategory: parsedBody.category,
        fileName: parsedBody.mediaUpload.fileName,
        mimeType: parsedBody.mediaUpload.mimeType,
      })

      res.json(uploadRes)
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    res.json({ success: false })
  }
}
