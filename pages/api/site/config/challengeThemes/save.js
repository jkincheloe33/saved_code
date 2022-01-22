import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  // NOTE: This req has already been verified for the given user/session/account for admin access...EK

  let { updated, inserted, deleted } = req.body

  // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (inserted) {
    let insertRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO challengeThemes SET ?
      `,
      params: [protectEdit(inserted, { accountId: req.clientAccount.id })],
    })

    recordAuditTrail(req.session.userId, 'insert', 'challengeThemes', insertRes.insertId, protectEdit(inserted))

    // Return to the client the newly generated PK
    res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
  } else if (updated) {
    // Execute update statement...EK
    let updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE challengeThemes
        SET ?
        WHERE id = ?
          AND accountId = ?
      `,
      params: [protectEdit(updated), updated.id, req.clientAccount.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (updateRes.changedRows === 1) {
      recordAuditTrail(req.session.userId, 'update', 'challengeThemes', updated.id, protectEdit(updated))
    }

    res.json({ success: updateRes.changedRows === 1 })
  } else if (deleted) {
    // Verify that the group type is unused.  If not don't allow the delete...EK
    let relCount = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT COUNT(id) AS count FROM challenges WHERE challengeThemeId = ?
      `,
      params: deleted.id,
    })

    if (relCount.count > 0) {
      return res.json({ success: false, msg: `Challenge theme cannot be deleted. Used by ${relCount.traitCount} challenge records` })
    }

    // Execute delete statement...EK
    let deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE FROM challengeThemes WHERE id = ? AND accountId = ?
      `,
      params: [deleted.id, req.clientAccount.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (deleteRes.affectedRows === 1) {
      recordAuditTrail(req.session.userId, 'delete', 'challengeThemes', deleted.id, protectEdit(deleted))
    }

    res.json({ success: deleteRes.affectedRows === 1 })
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

const allowEdit = ['name', 'description', 'templateTitle', 'templateDescription']

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
