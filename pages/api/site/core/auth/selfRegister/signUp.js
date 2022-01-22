import { createUserSession, recordLoginAttempt } from '@serverHelpers/sessions'
import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'
import { setCookie, USER_NOTIFY_METHODS } from '@utils'

export const config = {
  api: {
    bodyParser: false,
  },
}

const ERROR_MESSAGE = 'Error signing up. Please try again later.'

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req

  let transaction
  let groupId

  try {
    const { original, selfRegisterInfo, thumbnail } = await parseMultipartFormData(req)
    const { email, firstName, jobTitle, lastName, uid } = JSON.parse(selfRegisterInfo)

    // Pull groupId from clientAccount and check if id exists...CY
    const clientAccountSetting = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT G.id as groupId
        FROM groups G
        INNER JOIN clientAccounts CA ON (G.id = CA.settings->'$.selfRegister.groupId' AND CA.id = ${clientAccountId})
        WHERE G.accountId = ${clientAccountId}
      `,
    })

    if (!clientAccountSetting?.groupId) return res.json({ success: false, msg: ERROR_MESSAGE })

    groupId = clientAccountSetting.groupId

    // Check the uid is the same uid from user validation...CY
    const validSelfRegistered = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM selfRegisterCodes
        WHERE email = ?
          AND uid = ?
          AND accountId = ${clientAccountId}
      `,
      params: [email, uid],
    })

    if (!validSelfRegistered) return res.json({ success: false, msg: ERROR_MESSAGE })

    transaction = await wambiDB.beginTransaction()

    const { insertId: insertedPersonId } = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO people (email, firstName, isSelfRegistered, jobTitle, lastName, loginId, notifyMethod)
        VALUES (?, ?, 1, ?, ?, ?, ${USER_NOTIFY_METHODS.EMAIL_ONLY})
      `,
      params: [email, firstName, jobTitle, lastName, email],
    })

    if (original) {
      await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        fileName: original.fileName,
        mediaBuffer: original.buffer,
        mediaCategory: 'profile',
        mimeType: original.mimeType,
        tableKey: insertedPersonId,
        tableName: 'people',
        transaction,
        usage: 'pendingOriginal',
      })
    }

    if (thumbnail) {
      await uploadAndLinkMedia({
        clientAccount: req.clientAccount,
        fileName: thumbnail.fileName,
        mediaBuffer: thumbnail.buffer,
        mediaCategory: 'profile',
        mimeType: thumbnail.mimeType,
        tableKey: insertedPersonId,
        tableName: 'people',
        transaction,
        usage: 'pendingThumbnail',
      })
    }

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO peopleGroups (peopleId, groupId, isPrimary)
        VALUES (${insertedPersonId}, ${groupId}, 1)
      `,
    })

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        INSERT INTO clientAccountPeople (accountId, peopleId, hideFromPortal, accessLevel)
        VALUES (${clientAccountId}, ${insertedPersonId}, 1, 1)
      `,
    })

    await wambiDB.commitTransaction(transaction)

    const { msg, sessionId, sessionToken, success } = await createUserSession({
      req,
      wambiUser: { id: insertedPersonId, isSelfRegistered: 1 },
    })
    recordLoginAttempt({ req, sessionId, userId: insertedPersonId })

    if (success) {
      setCookie({ res, token: sessionToken, tokenAlias: 'tkn' })

      return res.json({ success: true })
    } else res.json({ msg, success: false })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: ERROR_MESSAGE })
  }
}
