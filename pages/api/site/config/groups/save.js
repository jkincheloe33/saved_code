import { recordAuditTrail } from '@serverHelpers/auditTrail'

import { splitEditSettings, getRuntimeSettingsFromGroup } from '@serverHelpers/groupEditing'

export default async (req, res) => {
  // NOTE: This req has already been verified for the given user/session/account for admin access...EK

  const { updated } = req.body

  // NOTE: Only one update at a time (to simplify response parsing).  We will create a bulk save if needed...EK
  if (updated != null) {
    // Perform all updates under a single transaction so we can rollback if needed...EK
    const transaction = await wambiDB.beginTransaction()

    // Execute update statement...EK
    try {
      const updateRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE groups SET ?
          WHERE id = ?
            AND accountId = ?
        `,
        params: [protectEdit(updated), updated.id, req.clientAccount.id],
      })

      let finalRuntimeSettingsForGroup = undefined

      if (updateRes.changedRows === 1 && updated.editSettings) {
        // This is a settings update.  We need to detect the inheritance and update recursively if necessary...EK

        // Pull the current group record...EK
        let updatedGroup = await wambiDB.querySingle({
          transaction,
          queryText: /*sql*/ `
            SELECT G.id, G.parentGroupId
            FROM groups G
            WHERE G.id = ?
          `,
          params: [updated.id],
        })

        // Calculate the runtime settings from the root (can't just assume the runtimeSettings on the parent is valid to all inherit)
        let mergedRuntimeSettings = await getRuntimeSettingsFromGroup(
          req.clientAccount.settings.defaultGroupSettings,
          updatedGroup.parentGroupId
        )

        const { localSettings, localAndDescendantSettings } = splitEditSettings(updated.editSettings)

        mergedRuntimeSettings = {
          ...mergedRuntimeSettings,
          ...localAndDescendantSettings,
        }

        // The "final" for this group saved also includes local.  This can't be part of the other merge because local doesn't inherit to others...EK
        finalRuntimeSettingsForGroup = {
          ...mergedRuntimeSettings,
          ...localSettings,
        }

        // Update the running config of the current group (includes both local and ones that children are going to inherit).
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE groups SET ? WHERE id = ?
          `,
          params: [
            {
              runtimeSettings: JSON.stringify(finalRuntimeSettingsForGroup),
            },
            updatedGroup.id,
          ],
        })

        // We have at least one setting that needs to be inherited down... Update all descendent...EK
        let descendentGroups = await wambiDB.query({
          transaction,
          queryText: /*sql*/ `
            SELECT G.id, G.depth, G.parentGroupId, G.editSettings
            FROM groups G
            INNER JOIN groupIndex GI ON (G.id = GI.fromGroupId AND GI.groupId = ?)
            ORDER BY G.depth, G.parentGroupId ASC
          `,
          params: [updatedGroup.id],
        })

        // Go through each decedent and update the runtime settings (merged with only the inherited ones) ... EK
        // The setting will build inherited properties as we go through the list (Which is ordered by depth and parentId)...EK
        descendentGroups = descendentGroups.map(descendent => {
          if (descendent.editSettings != null) {
            // There are settings specifically set, update the ongoing "merged" runtime settings (if any are set to be descendant)...EK
            const { localSettings, localAndDescendantSettings } = splitEditSettings(updated.editSettings)

            // Merge what is before with the local and descendant settings...EK
            mergedRuntimeSettings = {
              ...mergedRuntimeSettings,
              ...localAndDescendantSettings,
            }

            return {
              id: descendent.id,
              runtimeSettings: {
                ...mergedRuntimeSettings,
                ...localSettings, // Local settings are only applied to this returned copy of the merged runtime object...EK
              },
            }
          } else {
            // There are no settings specifically set, no updates to the ongoing "merged" runtime settings...EK
            return {
              id: descendent.id,
              runtimeSettings: {
                ...mergedRuntimeSettings,
              },
            }
          }
        })

        // Bulk update groups the the ID/new config combination...EK
        await wambiDB.executeNonQuery({
          transaction,
          commandText: descendentGroups
            .map(
              descendent => /*sql*/ `
                UPDATE groups
                SET runtimeSettings = '${JSON.stringify(descendent.runtimeSettings)}'
                WHERE id = ${descendent.id};
              `
            )
            .join(''),
        })
      }

      // In the event an invalid id / account combination is specified, only record audit log if changedRows === 1... EK
      if (updateRes.changedRows === 1) {
        recordAuditTrail(req.session.userId, 'update', 'groups', updated.id, protectEdit(updated))
      }

      await wambiDB.commitTransaction(transaction)

      res.json({ success: updateRes.changedRows === 1, runtimeSettings: finalRuntimeSettingsForGroup })
    } catch (error) {
      logServerError({ error, req })
      await wambiDB.rollbackTransaction(transaction)
      res.json({ success: false, msg: 'There was an error saving the group.  Check logs.' })
    }
  } else {
    // Nothing specified to do, just return false...EK
    res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
  }
}

// NOTES:
//  'parentGroupId' is protected by checking for it's account (to avoid bad data)...EK
//  'runtimeSettings' is never specified by the client, only added to the mergeAfter when calculated by server code...EK
const allowEdit = ['name', 'description', 'editSettings', 'clientId', 'groupTypeId', 'hideFromPortal']

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      if (p === 'editSettings') {
        validRow[p] = JSON.stringify(row[p])
      } else {
        validRow[p] = row[p]
      }
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
