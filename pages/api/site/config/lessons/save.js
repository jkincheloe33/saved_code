import { recordAuditTrail } from '@serverHelpers/auditTrail'
import { LESSON_STATUS } from '@utils'

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
          INSERT INTO lessons
          SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId })],
      })

      recordAuditTrail(req.session.userId, 'insert', 'lessons', insertRes.insertId, protectEdit(inserted))

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE lessons 
          SET ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ? AND accountId = ?
        `,
        params: [protectEdit(updated), updated.id, clientAccountId],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userSessionid, 'update', 'lessons', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      const deleteRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE L
          FROM lessons L
          WHERE L.id = ? 
            AND L.accountId = ?
            AND L.id NOT IN (
              SELECT LP.lessonId
              FROM lessonProgress LP
              WHERE LP.lessonId = ?
            )
        `,
        params: [deleted.id, clientAccountId, deleted.id],
      })

      if (deleteRes.affectedRows === 1) {
        recordAuditTrail(userSessionid, 'delete', 'lessons', deleted.id, protectEdit(deleted))
        res.json({ success: true })
      } else {
        // If lesson is in progress, update status to archived instead...KA
        const updateRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE lessons 
            SET ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ? AND accountId = ?
          `,
          params: [protectEdit({ status: LESSON_STATUS.ARCHIVED }), deleted.id, clientAccountId],
        })

        if (updateRes.changedRows === 1) {
          recordAuditTrail(userSessionid, 'update', 'lessons', deleted.id, protectEdit({ status: LESSON_STATUS.ARCHIVED }))
        }

        res.json({ success: false, msg: 'Lesson in progress, status set to archived instead.' })
      }
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error, please check server logs.' })
  }
}

const allowEdit = ['title', 'internalDescription', 'summary', 'order', 'whoCanSee', 'readMinutes', 'status']

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
