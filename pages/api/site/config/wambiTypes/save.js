import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  try {
    const {
      body: { deleted, inserted, updated },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionid },
    } = req
    if (inserted) {
      const insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO cpcTypes SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId, createdBy: userSessionid })],
      })

      recordAuditTrail(req.session.userId, 'insert', 'cpcTypes', insertRes.insertId, protectEdit(inserted))

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE cpcTypes 
          SET ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
            AND accountId = ?
        `,
        params: [protectEdit(updated, { updatedBy: userSessionid }), updated.id, clientAccountId],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userSessionid, 'update', 'cpcTypes', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      // Only deletes if cpcType is not linked to any cpcs...KA
      const deleteRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE CT FROM cpcTypes CT
          WHERE CT.id = ? 
            AND CT.accountId = ?
            AND CT.id NOT IN (
              SELECT C.cpcTypeId 
              FROM cpc C 
              WHERE C.cpcTypeId = ?
            )
        `,
        params: [deleted.id, clientAccountId, deleted.id],
      })

      if (deleteRes.affectedRows === 1) {
        recordAuditTrail(userSessionid, 'delete', 'cpcTypes', deleted.id, protectEdit(deleted))
        res.json({ success: true })
      } else {
        // If cpcType is linked to a cpc, update status to removed instead...KA
        const updateRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE cpcTypes SET ?
            WHERE id = ?
              AND accountId = ?
          `,
          params: [protectEdit({ status: 2 }, { updatedBy: userSessionid, updatedAt: new Date() }), deleted.id, clientAccountId],
        })

        if (updateRes.changedRows === 1) {
          recordAuditTrail(userSessionid, 'update', 'cpcTypes', deleted.id, protectEdit({ status: 2 }))
        }

        res.json({ success: false, msg: 'Linked to a cpc, status set to removed instead.' })
      }
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error, please check server logs.' })
  }
}

const allowEdit = ['name', 'cpcThemeId', 'exampleText', 'keywords', 'startDate', 'endDate', 'whoCanSend', 'status', 'awardTypeId', 'order']

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      validRow[p] = row[p] === '' ? null : row[p]
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
