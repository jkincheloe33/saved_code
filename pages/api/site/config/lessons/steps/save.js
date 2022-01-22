import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  try {
    const {
      body: { deleted, inserted, updated },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionid },
    } = req

    if (inserted) {
      // Verify the lesson id is in the current client account...KA
      let lessonInAccount = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT 1
          FROM lessons L
          WHERE L.id = ?
            AND L.accountId = ?
        `,
        params: [inserted.lessonId, req.clientAccount.id],
      })

      if (lessonInAccount) {
        const insertRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            INSERT INTO lessonSteps 
            SET ?
          `,
          params: [protectEdit(inserted)],
        })

        recordAuditTrail(req.session.userId, 'insert', 'lessonSteps', insertRes.insertId, protectEdit(inserted))

        res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
      } else {
        res.json({ success: false, msg: 'Invalid lesson id for this account' })
      }
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE lessonSteps LS
          INNER JOIN lessons L ON (L.id = LS.lessonId AND L.accountId = ?)
          SET ?
          WHERE LS.id = ?
        `,
        params: [clientAccountId, addUpdateAlias(updated, 'LS'), updated.id],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userSessionid, 'update', 'lessonSteps', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      const deleteRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE LS
          FROM lessonSteps LS
          INNER JOIN lessons L ON (L.id = LS.lessonId AND L.accountId = ?)
          WHERE LS.id = ?
        `,
        params: [clientAccountId, deleted.id],
      })

      if (deleteRes.affectedRows === 1) {
        recordAuditTrail(userSessionid, 'delete', 'lessonSteps', deleted.id, protectEdit(deleted))
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

const allowEdit = ['lessonId', 'order', 'title', 'content', 'actionConfig']

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      if (p === 'actionConfig') {
        try {
          validRow[p] = JSON.stringify(row[p])
        } catch (error) {
          console.error('Error parsing JSON, setting to null instead')
          validRow[p] = null
        }
      } else {
        validRow[p] = row[p] === '' ? null : row[p]
      }
    }
  }

  // mergeAfter is used for service specified defaults that may not be allowed to edit by end users (i.e. accountId)
  if (mergeAfter != null) {
    validRow = {
      ...validRow,
      ...mergeAfter,
    }
  }

  return validRow
}

function addUpdateAlias(updated, alias) {
  let validUpdate = {}
  for (let p in updated) {
    if (allowEdit.indexOf(p) > -1) {
      if (p === 'actionConfig') {
        try {
          validUpdate[`${alias}.${p}`] = JSON.stringify(updated[p])
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
