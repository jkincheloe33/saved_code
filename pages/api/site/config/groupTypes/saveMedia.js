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
      const uploadRes = await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        mediaBuffer: parsedBody.mediaUpload.buffer,
        tableName: 'groupTypes',
        tableKey: parsedBody.groupTypeId,
        mediaCategory: 'groupTypes',
        fileName: parsedBody.mediaUpload.fileName,
        mimeType: parsedBody.mediaUpload.mimeType,
        usage: 'icon',
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
