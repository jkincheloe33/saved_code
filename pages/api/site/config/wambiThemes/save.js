import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  try {
    const {
      body: { inserted, updated },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionid },
    } = req

    if (inserted) {
      const insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO cpcThemes
          SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId })],
      })

      recordAuditTrail(userSessionid, 'insert', 'cpcThemes', insertRes.insertId, protectEdit(inserted))

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE cpcThemes
          SET ?
          WHERE id = ?
            AND accountId = ${clientAccountId}
        `,
        params: [protectEdit(updated), updated.id],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userSessionid, 'update', 'cpcThemes', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error, please check server logs.' })
  }
}

const allowEdit = ['name', 'description', 'limitToHotStreak', 'order']

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
