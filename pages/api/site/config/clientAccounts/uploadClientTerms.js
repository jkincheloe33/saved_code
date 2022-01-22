import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const { clientAccount } = req

  let transaction

  try {
    transaction = await wambiDB.beginTransaction()

    const parsedBody = await parseMultipartFormData(req)

    if (parsedBody?.mediaUpload) {
      const { image: mediaUrl, success } = await uploadAndLinkMedia({
        clientAccount: clientAccount,
        fileName: parsedBody.mediaUpload.fileName,
        mediaBuffer: parsedBody.mediaUpload.buffer,
        mediaCategory: 'clientTerms',
        mimeType: parsedBody.mediaUpload.mimeType,
        tableKey: clientAccount.id,
        tableName: 'clientAccounts',
        transaction,
        usage: 'clientTerms',
      })

      // If there was an existing terms file, nullify all users' terms...KA
      if (success && clientAccount.clientTermsUrl) {
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE clientAccountPeople
            SET clientTermsAt = NULL
            WHERE accountId = ${clientAccount.id}
          `,
        })
      }

      await wambiDB.commitTransaction(transaction)
      res.json({ success, mediaUrl })
    } else {
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      res.json({ success: false })
    }
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Issue saving client terms, please try again' })
  }
}
