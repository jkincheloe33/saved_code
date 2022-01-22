import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  // NOTE: This req has already been verified for the given user/session/account for admin access...EK

  const {
    body: { deleted, inserted, lang, updated },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (inserted) {
    // Verify that the inserted record is for a question set within the current account...EK
    let questionSetInAccount = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id
        FROM questionSets
        WHERE id = ?
          AND accountId = ?
      `,
      params: [inserted.questionSetId, clientAccountId],
    })

    if (questionSetInAccount) {
      let insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO questionSetItems 
          SET ?
        `,
        params: [protectEdit(inserted, { questionSetId: questionSetInAccount.id })],
      })

      // Insert a translation row for a question item if a translation exists...KA
      if (inserted.questionTrans) {
        await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            INSERT INTO translations 
            SET ?
          `,
          params: [
            {
              accountId: clientAccountId,
              columnName: 'question',
              localeCode: lang,
              tableKey: insertRes.insertId,
              tableName: 'questionSetItems',
              translation: inserted.questionTrans,
            },
          ],
        })
      }

      recordAuditTrail(userId, 'insert', 'questionSetItems', insertRes.insertId, protectEdit(inserted))

      // Return to the client the newly generated PK
      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else {
      res.json({ success: false, msg: 'Question Set ID invalid for this account.' })
    }
  } else if (updated) {
    // Execute update statement...EK

    // NOTE: If you get an ambigous column error in the future, reference traits update...EK
    let updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE questionSetItems QSI
        INNER JOIN questionSets QS ON (QS.id = QSI.questionSetId AND QS.accountId = ?)
        SET ? 
        WHERE QSI.id = ?
      `,
      params: [clientAccountId, protectEdit(updated), updated.id],
    })

    if (updated.questionTrans) {
      // If translation exists ? update row : insert new row...KA
      const transUpdated = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE translations T
          SET ?
          WHERE T.accountId = ?
            AND T.tableKey = ?
            AND T.localeCode = ?
            AND T.tableName = 'questionSetItems'
            AND T.columnName = 'question'
        `,
        params: [{ translation: updated.questionTrans }, clientAccountId, updated.id, lang],
      })

      if (transUpdated.affectedRows === 0) {
        await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            INSERT INTO translations 
            SET ?
          `,
          params: [
            {
              accountId: clientAccountId,
              columnName: 'question',
              localeCode: lang,
              tableKey: updated.id,
              tableName: 'questionSetItems',
              translation: updated.questionTrans,
            },
          ],
        })
      }
    }

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (updateRes.changedRows === 1) {
      recordAuditTrail(userId, 'update', 'questionSetItems', updated.id, protectEdit(updated))
    }

    res.json({ success: updateRes.changedRows === 1 })
  } else if (deleted) {
    // Execute delete statement...EK
    let deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE QSI 
        FROM questionSetItems QSI
        INNER JOIN questionSets QS ON (QSI.questionSetId = QS.id AND QS.accountId = ?)
        WHERE QSI.id = ?
      `,
      params: [clientAccountId, deleted.id],
    })

    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE T
        FROM translations T
        WHERE T.accountId = ? AND T.tableKey = ? AND T.tableName = 'questionSetItems' AND T.columnName = 'question'
      `,
      params: [clientAccountId, deleted.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (deleteRes.affectedRows === 1) {
      recordAuditTrail(userId, 'delete', 'questionSetItems', deleted.id, protectEdit(deleted))
    }

    res.json({ success: deleteRes.affectedRows === 1 })
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

const allowEdit = ['question', 'order']

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
