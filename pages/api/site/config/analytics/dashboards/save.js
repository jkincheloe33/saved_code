import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  const {
    body: { updated, inserted, deleted },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    if (inserted) {
      let insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO dashboards SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId })],
      })

      recordAuditTrail(req.session.userId, 'insert', 'reports', insertRes.insertId, protectEdit(inserted))

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      let updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE dashboards SET ?
          WHERE id = ?
            AND accountId = ${clientAccountId}
        `,
        params: [protectEdit(updated), updated.id],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(req.session.userId, 'update', 'reports', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      //Check if any dashboard reports exist before deleting...CY
      let dashboardReports = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT 1 
          FROM dashboardReports
          WHERE dashboardId = ? 
        `,
        params: [deleted.id],
      })

      if (dashboardReports == null) {
        const deleteRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            DELETE FROM dashboards
            WHERE id = ?
              AND accountId = ${clientAccountId}
          `,
          params: [deleted.id],
        })
        if (deleteRes.affectedRows === 1) {
          recordAuditTrail(req.session.userId, 'delete', 'reports', deleted.id, protectEdit(deleted))
        }

        res.json({ success: deleteRes.affectedRows === 1 })
      } else {
        res.json({ success: false, msg: 'Dashboard must have no reports before deleting' })
      }
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: 'Failed to update dashboard' })
  }
}

const allowEdit = [
  'name',
  'dateRangeHidden',
  'defaultDateRange',
  'description',
  'filterTraitTypeId',
  'groupFilterHidden',
  'limitedToUserTraits',
  'order',
]

function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      validRow[p] = !row[p] ? null : row[p]
    }
  }

  if (mergeAfter != null) {
    validRow = {
      ...validRow,
      ...mergeAfter,
    }
  }

  return validRow
}
