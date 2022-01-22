import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  // NOTE: This req has already been verified for the given user/session/account for admin access...EK
  const {
    body: { updated, inserted, deleted },
    clientAccount: { id: clientAccountId },
  } = req

  // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (inserted) {
    // Verify that the inserted record is for a trait type within the current account...EK
    let traitTypeInAccount = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id
        FROM traitTypes
        WHERE id = ?
          AND accountId = ${clientAccountId}
      `,
      params: [inserted.traitTypeId],
    })

    if (traitTypeInAccount) {
      let insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO traits SET ?
        `,
        params: [protectEdit(inserted, { traitTypeId: traitTypeInAccount.id })],
      })

      recordAuditTrail(req.session.userId, 'insert', 'traits', insertRes.insertId, protectEdit(inserted))

      // Return to the client the newly generated PK
      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else {
      res.json({ success: false, msg: 'Trait Type ID invalid for this account.' })
    }
  } else if (updated) {
    // Execute update statement...EK
    let updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE traits
        INNER JOIN traitTypes ON (traitTypes.id = traits.traitTypeId AND traitTypes.accountId = ${clientAccountId})
        SET ?
        WHERE traits.id = ?
      `,
      params: [addUpdateAlias(updated, 'traits'), updated.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (updateRes.changedRows === 1) {
      recordAuditTrail(req.session.userId, 'update', 'traits', updated.id, protectEdit(updated))
    }

    res.json({ success: updateRes.changedRows === 1 })
  } else if (deleted) {
    // Execute delete statement...EK
    let deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE T
        FROM traits T
        INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ${clientAccountId})
        WHERE T.id = ?
      `,
      params: [deleted.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (deleteRes.affectedRows === 1) {
      recordAuditTrail(req.session.userId, 'delete', 'traits', deleted.id, protectEdit(deleted))
    }

    res.json({ success: deleteRes.affectedRows === 1 })
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

const allowEdit = ['name', 'notes', 'crossRefId']

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

// When you have a join in an update statement, if the joined table has the same column names, we need to add the alias...EK
function addUpdateAlias(updated, alias) {
  let validUpdate = {}
  for (let p in updated) {
    if (allowEdit.indexOf(p) > -1) {
      validUpdate[`${alias}.${p}`] = updated[p]
    }
  }

  return validUpdate
}
