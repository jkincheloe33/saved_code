import { deleteObjectsFromCDN } from '@serverHelpers/aws'

export default async (req, res) => {
  console.log('-- AUTO CLEANUP MEDIA | START --')

  try {
    // get list of unlinked media from DB
    const unlinkedMedia = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT M.id, M.uid, M.ext, M.category
        FROM media M
        LEFT JOIN mediaLink ML ON (M.id = ML.mediaId)
        WHERE ML.id IS NULL
      `,
    })

    console.log(`Found ${unlinkedMedia.length} unlinked media records`)

    if (unlinkedMedia.length) {
      const deleteRes = await deleteObjectsFromCDN(unlinkedMedia)
      console.log(`Deleted ${deleteRes.length} objects from S3.`)
      console.log('Removing records from media table...')

      const removedMedia = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE FROM media
          WHERE id IN (${unlinkedMedia.map(({ id }) => id)});
        `,
      })

      console.log(`Removed media records. ${removedMedia.affectedRows} records removed`)
    }

    console.log('-- AUTO CLEANUP MEDIA | END --')

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
