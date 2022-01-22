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
        mediaCategory: 'challengeThemes',
        fileName: parsedBody.mediaUpload.fileName,
        mimeType: parsedBody.mediaUpload.mimeType,
      })

      if (success) {
        // We link this manually since we want multiple links to a challenge theme...EK
        const linkRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            INSERT INTO mediaLink SET ?
          `,
          params: [
            {
              mediaId: mediaRecord.id,
              tableName: 'challengeThemes',
              tableKey: parsedBody.challengeThemeId,
              usage: 'imageOption',
            },
          ],
        })

        if (linkRes.affectedRows === 1) {
          // Return the new media record in the same form so it can just be used immediately on the client...EK
          return res.json({ success: true, media: { id: linkRes.insertedId, imageOption: mediaPath } })
        } else {
          return res.json({ success, msg: 'Issue linking uploaded media; check logs' })
        }
      }
    }
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    res.json({ success: false, msg: 'Issue uploading media; check logs' })
  }
}
