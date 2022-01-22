import { deleteMedia } from '@serverHelpers/media'

export default async (req, res) => {
  const { mediaId } = req.body
  let deleteRes = await deleteMedia(mediaId, req.clientAccount)
  res.json({ success: deleteRes })
}
