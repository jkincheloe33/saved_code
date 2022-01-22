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
        mediaCategory: 'selfRegisterTerms',
        mimeType: parsedBody.mediaUpload.mimeType,
        tableKey: clientAccount.id,
        tableName: 'clientAccounts',
        transaction,
        usage: 'selfRegisterTerms',
      })

      // If there was an existing terms file, nullify all users' terms...KA
      if (success && clientAccount.selfRegisterTermsUrl) {
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE people P
            INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccount.id})
            SET P.selfRegisterTermsAcceptedAt = NULL
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
    res.json({ success: false, msg: 'Issue saving self register terms, please try again' })
  }
}
