import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  const {
    body: { dashboardId, deleted, inserted, updated },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req
  let transaction

  try {
    // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
    if (inserted && dashboardId) {
      transaction = await wambiDB.beginTransaction()

      let insertedReport = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO reports SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId, createdBy: userId, updatedBy: userId })],
      })

      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO dashboardReports SET dashboardId = ?, reportId = ${insertedReport.insertId}
        `,
        params: [dashboardId],
      })

      await wambiDB.commitTransaction(transaction)
      recordAuditTrail(userId, 'insert', 'reports', insertedReport.insertId, protectEdit(inserted))

      // Return to the client the newly generated PK
      res.json({ success: true, newId: insertedReport.insertId, oldId: inserted.id })
    } else if (updated) {
      // Execute update statement...EK
      let updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE reports SET ?
          WHERE id = ?
            AND accountId = ?
        `,
        params: [protectEdit(updated, { updatedBy: userId, updatedAt: new Date() }), updated.id, clientAccountId],
      })
      // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
      if (updateRes.changedRows === 1) {
        recordAuditTrail(userId, 'update', 'reports', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      transaction = await wambiDB.beginTransaction()

      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          DELETE DR
          FROM dashboardReports DR
          INNER JOIN reports R ON (DR.reportId = R.id)
          WHERE R.id = ? 
            AND R.accountId = ${clientAccountId};
        `,
        params: [deleted.id],
      })

      // Execute delete statement...EK
      let deleteRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          DELETE FROM reports
          WHERE id = ?
            AND accountId = ${clientAccountId}
        `,
        params: [deleted.id],
      })

      await wambiDB.commitTransaction(transaction)

      // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
      if (deleteRes.affectedRows === 1) {
        recordAuditTrail(userId, 'delete', 'reports', deleted.id, protectEdit(deleted))
      }

      res.json({ success: deleteRes.affectedRows === 1 })
    } else {
      // Nothing specified to do, just return false...EK
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Failed to update report. If you are trying to delete report. Try to unlinking it' })
  }
}

const allowEdit = ['name', 'description', 'hidden', 'onClick', 'reportQuery', 'widgetQuery', 'widgetType', 'published']

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      validRow[p] = !row[p] ? null : row[p]
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
