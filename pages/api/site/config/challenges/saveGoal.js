import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  let { updated, inserted, deleted } = req.body

  // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (inserted) {
    // Verify that the inserted record is for a related theme in this client account...KA
    let challengeInAccount = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM challenges C
        INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ?)
        WHERE C.id = ?
      `,
      params: [req.clientAccount.id, inserted.challengeId],
    })

    if (challengeInAccount) {
      let insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO challengeGoals
          SET ?
        `,
        params: [protectEdit(inserted)],
      })

      recordAuditTrail(req.session.userId, 'insert', 'challengeGoals', insertRes.insertId, protectEdit(inserted))

      // Return to the client the newly generated PK
      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else {
      res.json({ success: false, msg: 'Challenge ID invalid for this account.' })
    }
  } else if (updated) {
    // Execute update statement...EK
    let updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE challengeGoals CG
        INNER JOIN challenges C ON (C.id = CG.challengeId)
        INNER JOIN challengeThemes CT on (CT.id = C.challengeThemeId and CT.accountId = ?)
        SET ?
        WHERE CG.id = ?
      `,
      params: [req.clientAccount.id, addUpdateAlias(updated, 'CG'), updated.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (updateRes.changedRows === 1) {
      recordAuditTrail(req.session.userId, 'update', 'challengeGoals', updated.id, protectEdit(updated))
    }

    res.json({ success: updateRes.changedRows === 1 })
  } else if (deleted) {
    // Execute delete statement...EK
    let deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE CG
        FROM challengeGoals CG
        INNER JOIN challenges C on (C.id = CG.challengeId)
        INNER JOIN challengeThemes CT on (CT.id = C.challengeThemeId and CT.accountId = ?)
        WHERE CG.id = ?
      `,
      params: [req.clientAccount.id, deleted.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (deleteRes.affectedRows === 1) {
      recordAuditTrail(req.session.userId, 'delete', 'challengeGoals', deleted.id, protectEdit(deleted))
    }

    res.json({ success: deleteRes.affectedRows === 1 })
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

const allowEdit = ['title', 'challengeId', 'goal', 'trigger', 'triggerCondition', 'required']

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      if (p === 'triggerCondition') {
        try {
          validRow[p] = row[p] ? JSON.stringify(row[p]) : null
        } catch (error) {
          console.error('Error parsing JSON, setting to null instead')
          validRow[p] = null
        }
      } else {
        validRow[p] = row[p]
      }
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
      if (p === 'triggerCondition') {
        try {
          validUpdate[p] = updated[p] ? JSON.stringify(updated[p]) : null
        } catch (error) {
          console.error('Error parsing JSON, setting to null instead')
          validUpdate[p] = null
        }
      } else {
        validUpdate[`${alias}.${p}`] = updated[p]
      }
    }
  }

  return validUpdate
}
