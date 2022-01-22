import { recordAuditTrail } from '@serverHelpers/auditTrail'
import { CHALLENGE_STATUS } from '@utils'

export default async (req, res) => {
  // NOTE: This req has already been verified for the given user/session/account for admin access...EK

  let {
    body: { updated, inserted, deleted },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (inserted) {
    // Verify that the inserted record is for a related record within the current account...EK
    let challengeThemeInAccount = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id
        FROM challengeThemes
        WHERE id = ?
          AND accountId = ?
      `,
      params: [inserted.challengeThemeId, req.clientAccount.id],
    })

    if (challengeThemeInAccount) {
      let insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO challenges 
          SET ?
        `,
        params: [protectEdit(inserted, { challengeThemeId: challengeThemeInAccount.id })],
      })

      recordAuditTrail(userId, 'insert', 'challenges', insertRes.insertId, protectEdit(inserted))

      // Return to the client the newly generated PK
      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else {
      res.json({ success: false, msg: 'Challenge Theme ID invalid for this account.' })
    }
  } else if (updated) {
    // Execute update statement...EK
    let updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE challenges C
        INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId and CT.accountId = ?)
        SET ?
        WHERE C.id = ?
      `,
      params: [clientAccountId, addUpdateAlias(updated, 'C'), updated.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (updateRes.changedRows === 1) {
      recordAuditTrail(userId, 'update', 'challenges', updated.id, protectEdit(updated))
    }

    res.json({ success: updateRes.changedRows === 1 })
  } else if (deleted) {
    // Deletes challenge if not linked to any challenge progress records or challenge goals...KA
    let deleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE C
        FROM challenges C
        INNER JOIN challengeThemes CT ON (C.challengeThemeId = CT.id and CT.accountId = ?)
        WHERE C.id = ?
        AND C.id NOT IN (
          SELECT DISTINCT
            CP.challengeId
          FROM challengeProgress CP
          WHERE CP.challengeId = ?
        )
        AND C.id NOT IN (
          SELECT DISTINCT
            CG.challengeId
          FROM challengeGoals CG
          WHERE CG.challengeId = ?
        )
      `,
      params: [clientAccountId, deleted.id, deleted.id, deleted.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (deleteRes.affectedRows === 1) {
      recordAuditTrail(req.session.userId, 'delete', 'challenges', deleted.id, protectEdit(deleted))
      res.json({ success: deleteRes.affectedRows === 1 })
    } else {
      // If challenge is linked to a challenge progress or goal, update status to removed instead...KA
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE challenges C
          INNER JOIN challengeThemes CT ON (C.challengeThemeId = CT.id and CT.accountId = ?)
          SET C.status = ?, C.updatedAt = CURRENT_TIMESTAMP
          WHERE C.id = ?
        `,
        params: [clientAccountId, CHALLENGE_STATUS.REMOVED, deleted.id],
      })

      if (updateRes.changedRows === 1) {
        recordAuditTrail(userId, 'update', 'challenges', deleted.id, protectEdit({ status: CHALLENGE_STATUS.REMOVED }))
      }

      res.json({ success: false, msg: 'Participant/Goal exists for this challenge, status set to removed instead.' })
    }
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

const allowEdit = ['title', 'description', 'startDate', 'endDate', 'status', 'rewardIncrement', 'whoCanComplete']

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

// When you have a join in an update statement, if the joined table has the same column names, we need to add the alias...EK
function addUpdateAlias(updated, alias) {
  let validUpdate = {}
  for (let p in updated) {
    if (allowEdit.indexOf(p) > -1) {
      validUpdate[`${alias}.${p}`] = updated[p] === '' ? null : updated[p]
    }
  }

  return validUpdate
}
