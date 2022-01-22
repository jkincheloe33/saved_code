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
          INSERT INTO rewardTriggers SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId })],
      })

      recordAuditTrail(req.session.userId, 'insert', 'rewardTriggers', insertRes.insertId, protectEdit(inserted))

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE rewardTriggers
          SET ?
          WHERE id = ?
            AND accountId = ?
        `,
        params: [protectEdit(updated), updated.id, clientAccountId],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userSessionid, 'update', 'rewardTriggers', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      const deleteRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE RT
          FROM rewardTriggers RT
          WHERE RT.id = ?
            AND RT.accountId = ?
        `,
        params: [deleted.id, clientAccountId],
      })

      if (deleteRes.affectedRows === 1) {
        recordAuditTrail(userSessionid, 'delete', 'rewardTriggers', deleted.id, protectEdit(deleted))
        res.json({ success: true })
      }
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error, please check server logs.' })
  }
}

const allowEdit = ['trigger', 'increment']

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
