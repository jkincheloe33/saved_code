import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { openSheetAndParseRows } from '@serverHelpers/excel'
import { getRuntimeSettingsFromGroup } from '@serverHelpers/groupEditing'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const {
    clientAccount: {
      id: clientAccountId,
      settings: { defaultGroupSettings },
    },
  } = req

  const parsedBody = await parseMultipartFormData(req)
  if (parsedBody) {
    let transaction

    try {
      const { rows } = await openSheetAndParseRows({ buffer: parsedBody.importFile.buffer })

      let groupInsertRes

      transaction = await wambiDB.beginTransaction()

      if (parsedBody.parentGroupId == null) {
        // Importing at the account level...EK
        groupInsertRes = await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO groups (groupTypeId, accountId, name, description, depth, runtimeSettings, clientId)
            VAlUES ?
          `,
          params: [
            rows.map(r => [
              parsedBody.groupTypeId,
              clientAccountId,
              r.name,
              r.description,
              parsedBody.depth,
              JSON.stringify(defaultGroupSettings),
              r.clientId,
            ]),
          ],
        })
      } else {
        // Pull the parent group id and runtimeSettings, verify it's valid for this account...EK
        const validParentGroup = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT id, editSettings
            FROM groups
            WHERE id = ?
              AND accountId = ${clientAccountId}
          `,
          params: [parsedBody.parentGroupId],
        })

        if (validParentGroup != null) {
          // Calculate the runtime settings from the root (can't just assume the runtimeSettings on the parent group is valid to all inherit)...EK
          const mergedRuntimeSettings = await getRuntimeSettingsFromGroup(defaultGroupSettings, parsedBody.parentGroupId)

          groupInsertRes = await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              INSERT INTO groups (parentGroupId, groupTypeId, accountId, name, description, depth, runtimeSettings, clientId)
              VAlUES ?
            `,
            params: [
              rows.map(r => [
                parsedBody.parentGroupId,
                parsedBody.groupTypeId,
                clientAccountId,
                r.name,
                r.description,
                parsedBody.depth,
                JSON.stringify(mergedRuntimeSettings),
                r.clientId,
              ]),
            ],
          })
        } else {
          return res.json({ success: false, msg: 'Import Failed.  Check that the parent Group ID is valid for this account.' })
        }
      }

      // Create array of inserted group ids...CY
      const insertedGroups = Array.from({ length: groupInsertRes.affectedRows }, (_, i) => groupInsertRes.insertId + i)

      const groupIndexInsertRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO groupIndex (groupId, depth, fromGroupId)
            SELECT DISTINCT GI.groupId, GI.depth, G.id AS fromGroupId
            FROM groupIndex GI
            -- If there's a parent group, builds parent group index tree for each group...JC/CY
            INNER JOIN groups G ON (G.id IN (${insertedGroups}))
            WHERE GI.groupId IN (
              SELECT groupId
              FROM groupIndex
              WHERE fromGroupId = ?
            )
            UNION
            -- Always build each groups group index row for itself (no realm to build)...JC/CY
            SELECT id AS groupId, depth, id AS fromGroupId
            FROM groups
            WHERE id IN (${insertedGroups})
        `,
        params: [parsedBody.parentGroupId],
      })

      if (groupInsertRes.affectedRows === rows.length && groupIndexInsertRes.affectedRows >= rows.length) {
        await wambiDB.commitTransaction(transaction)
        res.json({ success: true, rowsAdded: rows.length, newId: groupInsertRes.insertId })
      } else {
        await wambiDB.rollbackTransaction(transaction)
        res.json({ success: false, msg: 'Import Failed.  Check the import file and try again.' })
      }
    } catch (error) {
      logServerError({ error, excludeBody: true, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      if (process.env.NODE_ENV !== 'production') {
        res.json({ success: false, msg: `ERROR THROWN: ${error}` })
      } else {
        res.json({ success: false, msg: 'Issue processing your request.  Please try again.  If the issue persists, contact support.' })
      }
    }
  } else {
    res.json({ success: false, msg: 'Unable to parse request.  Check logs.' })
  }
}
