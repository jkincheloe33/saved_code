import { uploadBufferToCDN, deleteObjectFromCDN } from '@serverHelpers/aws'
import { v4 as uuidv4 } from 'uuid'

module.exports = {
  uploadMedia: async ({
    clientAccount, // Passed from the req of the caller
    mediaBuffer, // The file buffer that was uploaded
    mediaCategory = 'uploads', // A category to organize on S3 (not critical)
    fileName, // The file name the user uploaded
    mimeType, // The mime type of the file (based on what was uploaded)
  }) => {
    // Insert record into media table (assign PK and file UID).
    let mediaRecord = {
      accountId: clientAccount.id,
      category: mediaCategory,
      uid: uuidv4(),
      uploadName: fileName,
      ext: fileName.split('.').reverse()[0],
      byteSize: mediaBuffer.length,
      mimeType,
    }

    let insertRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO media
        SET ?
      `,
      params: [mediaRecord],
    })

    if (insertRes.affectedRows === 1) {
      mediaRecord.id = insertRes.insertId

      // Push to AWS S3
      await uploadBufferToCDN(mediaBuffer, mediaRecord)

      return {
        success: true,
        mediaRecord,
        mediaPath: `${process.env.MEDIA_CDN}/${mediaRecord.category}/${mediaRecord.uid}.${mediaRecord.ext}`,
      }
    } else {
      return { success: false }
    }
  },
  uploadAndLinkMedia: async ({
    allowMultipleLinks = false,
    clientAccount, // Passed from the req of the caller
    mediaBuffer, // The file buffer that was uploaded
    tableName, // The table this media should be associated with
    tableKey, // The table Primary key to associate it with
    mediaCategory = 'uploads', // A category to organize on S3 (not critical)
    fileName, // The file name the user uploaded
    mimeType, // The mime type of the file (based on what was uploaded)
    usage, // How this image is used (must be unique by tablename/key combination) IE: (icon, profile, background, main, etc)
    transaction = null, // External transaction to passed down and not commit in this function...CY,
    videoStream, // If video stream is provided, upload that to CDN instead of media buffer (will be set as type video/mp4)...JC
  }) => {
    let mediaRecord
    // Insert record into media table (assign PK and file UID).
    if (videoStream) {
      mediaRecord = {
        accountId: clientAccount.id,
        category: mediaCategory,
        uid: uuidv4(),
        uploadName: fileName,
        ext: 'mp4',
        byteSize: mediaBuffer.length,
        mimeType: 'video/mp4',
      }
    } else {
      mediaRecord = {
        accountId: clientAccount.id,
        category: mediaCategory,
        uid: uuidv4(),
        uploadName: fileName,
        ext: fileName.split('.').reverse()[0],
        byteSize: mediaBuffer.length,
        mimeType,
      }
    }

    let isLocalTransaction = true

    if (transaction) {
      isLocalTransaction = false
    } else {
      transaction = await wambiDB.beginTransaction()
    }

    let insertRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO media
        SET ?
      `,
      params: [mediaRecord],
    })

    if (insertRes.affectedRows === 1) {
      mediaRecord.id = insertRes.insertId

      // Push to AWS S3
      await uploadBufferToCDN(videoStream ?? mediaBuffer, mediaRecord)

      if (allowMultipleLinks === false) {
        // Delete an existing link if one exists...EK
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            DELETE FROM mediaLink
            WHERE tableName = ?
              AND tableKey = ?
              AND \`usage\` = ?
          `,
          params: [tableName, tableKey, usage],
        })
      }

      // Update media field in the table (default as mediaId, but might be others)
      let linkRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO mediaLink SET ?
        `,
        params: [
          {
            mediaId: mediaRecord.id,
            tableName,
            tableKey,
            usage,
          },
        ],
      })
      if (linkRes.affectedRows === 1) {
        if (isLocalTransaction) {
          await wambiDB.commitTransaction(transaction)
        }

        return {
          image: `${process.env.MEDIA_CDN}/${mediaRecord.category}/${mediaRecord.uid}.${mediaRecord.ext}`,
          mediaId: mediaRecord.id,
          mimeType: mimeType,
          success: true,
          uploadName: fileName,
          usage: usage,
          tableName: tableName,
        }
      } else {
        await wambiDB.rollbackTransaction(transaction)
        return { success: false, msg: 'Unable to link media to record, check logs' }
      }
    } else {
      return { success: false }
    }
  },
  deleteMedia: async (mediaId, clientAccount) => {
    let mediaRecord = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT * FROM media WHERE id = ? AND accountId = ?
      `,
      params: [mediaId, clientAccount.id],
    })

    if (mediaRecord != null) {
      // Delete from S3
      await deleteObjectFromCDN(mediaRecord)

      // Delete any media links...EK
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE FROM mediaLink WHERE mediaId = ?
        `,
        params: [mediaId],
      })

      // Delete the actual media record...EK
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE FROM media WHERE id = ?
        `,
        params: [mediaId],
      })
      return true
    } else {
      // invalid id for this account...EK
      return false
    }
  },
}
