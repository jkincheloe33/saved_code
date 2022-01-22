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
          INSERT INTO rewardGifts SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId, rewardLevelId: inserted.rewardLevelId })],
      })

      recordAuditTrail(req.session.userId, 'insert', 'rewardGifts', insertRes.insertId, protectEdit(inserted))

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE rewardGifts 
          SET ?
          WHERE id = ?
            AND accountId = ?
        `,
        params: [protectEdit(updated), updated.id, clientAccountId],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userSessionid, 'update', 'rewardGifts', updated.id, protectEdit(updated))
      }

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      // Only deletes reward gift if not linked to any reward claims...KA
      const deleteRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE RG
          FROM rewardGifts RG
          WHERE RG.id = ?
            AND RG.accountId = ?
            AND RG.id NOT IN (
              SELECT RC.rewardGiftId
              FROM rewardClaims RC
              WHERE RC.rewardGiftId = ?
            )
        `,
        params: [deleted.id, clientAccountId, deleted.id],
      })

      if (deleteRes.affectedRows === 1) {
        recordAuditTrail(userSessionid, 'delete', 'rewardGifts', deleted.id, protectEdit(deleted))
        res.json({ success: true })
      } else {
        // If gift is linked to a claim record, update status to archived instead...KA
        const updateRes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE rewardGifts
            SET ?
            WHERE id = ?
              AND accountId = ?
          `,
          params: [protectEdit({ status: 2 }), deleted.id, clientAccountId],
        })

        if (updateRes.changedRows === 1) {
          recordAuditTrail(userSessionid, 'update', 'cpcTypes', deleted.id, protectEdit({ status: 2 }))
        }

        res.json({ success: false, msg: 'Linked to a reward gift, status set to archived instead.' })
      }
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

const allowEdit = [
  'attributeName',
  'attributeValue',
  'claimInstructions',
  'cost',
  'ctaText',
  'description',
  'endDate',
  'expiresInDays',
  'inventory',
  'isRaffle',
  'itemNumber',
  'name',
  'notifyWhenClaimed',
  'notes',
  'requiredPhone',
  'requiredShipping',
  'SKU',
  'startDate',
  'status',
  'supplier',
  'order',
]

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
