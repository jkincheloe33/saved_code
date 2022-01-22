// All change to the hierarchy (New, parent update) should use this save method...EK
import { recordAuditTrail } from '@serverHelpers/auditTrail'
import { getRuntimeSettingsFromGroup } from '@serverHelpers/groupEditing'

export default async (req, res) => {
  const { inserted, moved, deleted } = req.body

  if (inserted != null) {
    let validGroupType = await wambiDB.querySingle({
      queryText: /*sql*/ `
          SELECT id
          FROM groupTypes
          WHERE id = ? AND accountId = ?
        `,
      params: [inserted.groupTypeId, req.clientAccount.id],
    })

    // Ensure the parentGroupID is valid for this account...EK
    let validParentGroup = null
    let mergedRuntimeSettings = req.clientAccount.settings.defaultGroupSettings
    if (inserted.parentGroupId != null) {
      validParentGroup = await wambiDB.querySingle({
        queryText: /*sql*/ `
            SELECT id
            FROM groups
            WHERE id = ? AND accountId = ?
          `,
        params: [inserted.parentGroupId, req.clientAccount.id],
      })
    } else {
      // Inserting at root.  Make this valid...EK
      validParentGroup = { id: null }
    }

    if (validGroupType == null || validParentGroup == null) {
      return res.json({ success: false, msg: 'Invalid group type id or parent id for this account' })
    } else {
      // Calculate the runtime settings from the root (can't just assume the runtimeSettings on the parent group is valid to all inherit)
      mergedRuntimeSettings = await getRuntimeSettingsFromGroup(req.clientAccount.settings.defaultGroupSettings, inserted.parentGroupId)
    }

    let insertRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
          INSERT INTO groups SET ?
        `,
      params: [
        protectEdit(inserted, {
          accountId: req.clientAccount.id,
          runtimeSettings: JSON.stringify(mergedRuntimeSettings),
        }),
      ],
    })

    // NOTE: This is not awaited
    recordAuditTrail(req.session.userId, 'insert', 'groups', insertRes.insertId, protectEdit(inserted))

    // NOTE:  The indexing process is not awaited, but we might need to if this becomes long process...EK
    let oldId = inserted.id
    inserted.id = insertRes.insertId
    _buildGroupIndexes(inserted, inserted, true)

    // Return to the client the newly generated PK and runtimeSettings
    res.json({ success: true, newId: insertRes.insertId, oldId, runtimeSettings: mergedRuntimeSettings })
  } else if (moved != null) {
    // We need to handle this saving and index/depth updates... EK
    // ALSO: We need to make sure the client is kept in sync from a depth value perspective...EK
  } else if (deleted != null) {
    // Validate ALL INDEXES, SURVEYS, ETC
    //  NOTE SURVEY and other records should STOP a delete from happening...EK  FK Constraint?
    // FOR NOW JUST DELETE.
    // const transaction = await wambiDB.beginTransaction();
    // try {
    //   // DELETE group
    //   let deleteRes = await wambiDB.executeNonQuery({
    //     transaction,
    //     commandText: `
    //       DELETE FROM groups
    //       WHERE id = ? AND accountId = ?
    //     `,
    //     params: [deleted.id, req.clientAccount.id]
    //   })
    //   if (deleteRes.changedRows === 1) {
    //     // Delete was successful...EK
    //     // On the same transaction delete the group indexes...EK
    //   }
    // } catch (error) {
    //   wambiDB.rollbackTransaction(transaction)
    // }
  } else {
    res.json({ success: false, msg: 'No work to do.' })
  }
}

// This function will look at the group and build a recursive list of IDs until it finds the root...EK
async function _buildGroupIndexes(group, fromGroup, isNew) {
  if (isNew === true) {
    let allLevels = [{ groupId: group.id, fromGroupId: group.id, depth: group.depth }]

    await _recordLevels(group, fromGroup, true, allLevels)

    // Bulk insert these new group index records...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO groupIndex (groupId, depth, fromGroupId)
        VALUES ?
      `,
      params: [allLevels.map(l => [l.groupId, l.depth, l.fromGroupId])],
    })
  } else {
    // This is a moved group.
    // We need to rebuild this index and update all affected groups by where this was moved from, and where it was moved to.
  }
}

async function _recordLevels(group, fromGroup, up, levels) {
  // console.log('_recordLevels', group, fromGroup.id, up, levels)

  // Get the parent and record it in the levels
  if (up === true) {
    // searching and recording up the tree...EK
    let nextLevel = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id, parentGroupId, depth
        FROM groups
        WHERE id = ?
      `,
      params: [group.parentGroupId],
    })

    if (nextLevel != null) {
      levels.push({ groupId: nextLevel.id, fromGroupId: fromGroup.id, depth: nextLevel.depth })

      if (nextLevel.parentGroupId != null) {
        await _recordLevels(nextLevel, fromGroup, up, levels)
      } else {
        // Else:  We have reached a root item.  We're done...EK
      }
    }
  } else {
    // Searching and recording levels down the tree...EK
    // This is for when we move groups around...EK
  }
}

const allowEdit = ['name', 'description', 'settingId', 'parentGroupId', 'groupTypeId', 'depth']

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
