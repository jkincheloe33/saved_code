import { recordAuditTrail } from '@serverHelpers/auditTrail'
import { v4 as uuidv4 } from 'uuid'

export default async (req, res) => {
  // NOTE: This req has already been verified for the given user/session/account for admin access...EK

  let { updated, inserted, deleted } = req.body

  // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (inserted) {
    let shortUid = uuidv4().split('-').reverse()[0]
    let insertRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO portals SET ?
      `,
      params: [protectEdit(inserted, { accountId: req.clientAccount.id, shortUid })],
    })

    recordAuditTrail(req.session.userId, 'insert', 'portals', insertRes.insertId, protectEdit(inserted))

    // Return to the client the newly generated PK
    res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id, shortUid })
  } else if (updated) {
    // Execute update statement...EK
    let updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE portals SET ? WHERE id = ? AND accountId = ?
      `,
      params: [protectEdit(updated), updated.id, req.clientAccount.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (updateRes.changedRows === 1) {
      recordAuditTrail(req.session.userId, 'update', 'portals', updated.id, protectEdit(updated))
    }

    res.json({ success: updateRes.changedRows === 1 })
  } else if (deleted) {
    // Execute delete statement...EK
    let deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE FROM portals WHERE id = ? AND accountId = ?
      `,
      params: [deleted.id, req.clientAccount.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (deleteRes.affectedRows === 1) {
      recordAuditTrail(req.session.userId, 'delete', 'portals', deleted.id, protectEdit(deleted))
    }

    res.json({ success: deleteRes.affectedRows === 1 })
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

const allowEdit = [
  'name',
  'commentPromptThreshold',
  'description',
  // 'chatCode',    // This field can only be saved from the updateChatCode endpoint...EK
  'donationLink',
  'notifyOnFeedback',
  'showReviewFollowup',
  'disableTranslations',
]

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      validRow[p] = row[p]
    }
  }

  // mergeAfter is used for service specified defaults that may not be allowed to edit by end users (i.e. accountId)...EK
  if (mergeAfter != null) {
    validRow = {
      ...validRow,
      ...mergeAfter,
    }
  }

  return validRow
}
