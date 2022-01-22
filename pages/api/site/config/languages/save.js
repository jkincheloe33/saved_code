export default async (req, res) => {
  try {
    const {
      body: { deleted, inserted, updated },
      clientAccount: { id: clientAccountId },
    } = req

    if (inserted) {
      const insertRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO accountLanguage SET ?
        `,
        params: [protectEdit(inserted, { accountId: clientAccountId })],
      })

      res.json({ success: true, newId: insertRes.insertId, oldId: inserted.id })
    } else if (updated) {
      const updateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE accountLanguage 
          SET ?
          WHERE id = ?
            AND accountId = ${clientAccountId}
        `,
        params: [protectEdit(updated), updated.id],
      })

      res.json({ success: updateRes.changedRows === 1 })
    } else if (deleted) {
      const deleteRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE 
          FROM accountLanguage
          WHERE id = ?
        `,
        params: [deleted.id],
      })

      res.json({ success: deleteRes.affectedRows === 1 })
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

const allowEdit = ['language', 'languageType']

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
