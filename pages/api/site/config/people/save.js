import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  // NOTE: This req has already been verified for the given user/session/account for admin access...EK
  const {
    body: { updated, inserted, deleted },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  // NOTE: Only one update, insert, or delete one at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (inserted) {
    let checkPerson = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id
        FROM people
        where loginId = ?
      `,
      params: [inserted.loginId],
    })

    if (checkPerson == null) {
      let insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO people SET ?
        `,
        params: [protectEdit(inserted, null, allowPeopleEdit)],
      })

      recordAuditTrail(userId, 'insert', 'people', insertRes.insertId, protectEdit(inserted, null, allowPeopleEdit))

      // Associate this new person record to this account...EK
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO clientAccountPeople (accountId, peopleId, accessLevel, hideFromPortal, isIncognito)
          VALUES (?, ?, 1, 0, 0)
        `,
        params: [clientAccountId, insertRes.insertId],
      })

      // Return to the client the newly generated PK
      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else {
      res.json({ success: false, msg: 'A person already exists with this id' })
    }
  } else if (updated) {
    // Execute update statement...EK
    let updatePeopleRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        SET ?
        WHERE P.id = ?
      `,
      params: [addUpdateAlias(updated, 'P', allowPeopleEdit), updated.id],
    })

    let updateClientAccountRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE clientAccountPeople CAP
        SET ?
        WHERE CAP.peopleId = ?
          AND CAP.accountId = ${clientAccountId}
      `,
      params: [addUpdateAlias(updated, 'CAP', allowClientAccountEdit), updated.id],
    })

    // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
    if (updatePeopleRes.changedRows === 1) {
      recordAuditTrail(userId, 'update', 'people', updated.id, protectEdit(updated, null, allowPeopleEdit))
    }

    if (updateClientAccountRes.changedRows === 1) {
      recordAuditTrail(userId, 'update', 'clientAccountPeople', updated.id, protectEdit(updated, null, allowClientAccountEdit))
    }

    const success = updatePeopleRes.changedRows === 1 || updateClientAccountRes.changedRows === 1
    res.json({ msg: !success && 'Unable to update people record', success })
  } else if (deleted) {
    res.json({ success: false, msg: 'Not Implemented' })
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

const allowPeopleEdit = [
  'displayName',
  'email',
  'enableEmailCampaignSync',
  'firstName',
  'hrId',
  'jobTitle',
  'jobTitleDisplay',
  'lastName',
  'loginId',
  'mobile',
  'notifyMethod',
  'prefix',
  'pronouns',
  'reportsTo',
  'ssoId',
  'status',
]

const allowClientAccountEdit = ['accessLevel', 'hideFromPortal', 'isIncognito']
// For reference, these fields are not editable from this endpoint:
// id, passwordHash, passwordChangedAt, code

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter, allowEdit) {
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
function addUpdateAlias(updated, alias, allowEdit) {
  let validUpdate = {}
  for (let p in updated) {
    if (allowEdit.indexOf(p) > -1) {
      validUpdate[`${alias}.${p}`] = updated[p] === '' ? null : updated[p]
    }
  }

  return validUpdate
}
