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
          INSERT INTO rewardLevels SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId })],
      })

      recordAuditTrail(req.session.userId, 'insert', 'rewardLevels', insertRes.insertId, protectEdit(inserted))

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE rewardLevels 
          SET ?
          WHERE id = ?
            AND accountId = ?
        `,
        params: [protectEdit(updated), updated.id, clientAccountId],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userSessionid, 'update', 'rewardLevels', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      // Only deletes reward level is not linked to any reward gifts...KA
      const deleteRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE RL
          FROM rewardLevels RL
          WHERE RL.id = ?
            AND RL.accountId = ?
            AND RL.id NOT IN (
              SELECT DISTINCT RG.rewardLevelId
              FROM rewardGifts RG
              WHERE RG.rewardLevelId = ?
            )
        `,
        params: [deleted.id, clientAccountId, deleted.id],
      })

      if (deleteRes.affectedRows === 1) {
        recordAuditTrail(userSessionid, 'delete', 'rewardLevels', deleted.id, protectEdit(deleted))
        res.json({ success: true })
      } else {
        res.json({ success: false, msg: 'Linked to a reward gift.' })
      }
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

const allowEdit = ['level', 'name', 'probabilityMultiplier', 'requiredPlays']

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
