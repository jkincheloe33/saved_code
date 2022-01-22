import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadMedia } from '@serverHelpers/media'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  let parsedBody = await parseMultipartFormData(req)

  try {
    if (parsedBody) {
      const { success, mediaRecord, mediaPath } = await uploadMedia({
        clientAccount: req.clientAccount,
        mediaBuffer: parsedBody.mediaUpload.buffer,
        mediaCategory: 'cpc/banner',
        fileName: parsedBody.mediaUpload.fileName,
        mimeType: parsedBody.mediaUpload.mimeType,
      })

      if (success) {
        let linkRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE mediaLink 
            SET ? 
            WHERE tableKey = ?
            AND tableName = 'cpcTypes'
          `,
          params: [
            {
              mediaId: mediaRecord.id,
              tableName: 'cpcTypes',
              tableKey: parsedBody.cpcTypeId,
              usage: 'banner',
            },
            parsedBody.cpcTypeId,
          ],
        })

        if (linkRes.affectedRows === 0) {
          linkRes = await wambiDB.executeNonQuery({
            commandText: /*sql*/ `
              INSERT INTO mediaLink 
              SET ?
            `,
            params: [
              {
                mediaId: mediaRecord.id,
                tableName: 'cpcTypes',
                tableKey: parsedBody.cpcTypeId,
                usage: 'banner',
              },
            ],
          })
        }

        if (linkRes.affectedRows === 1) {
          return res.json({ success: true, media: { id: linkRes.insertedId, imageOption: mediaPath } })
        } else {
          return res.json({ success, msg: 'Issue linking uploaded media; check logs' })
        }
      } else {
        return res.json({ success, msg: 'Issue uploading media; check logs' })
      }
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    res.json({ success: false })
  }
}
