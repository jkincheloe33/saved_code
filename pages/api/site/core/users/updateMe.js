const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')
import { profileChangesRequestedNotif } from '@serverHelpers/notifications/profile'
import { GROUP_ACCESS_LEVELS as levels, TRIGGERS } from '@utils'

export default async (req, res) => {
  try {
    const {
      body: { userData },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const { groupAccessLevel, updatedBday, updatedDisplayName } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT PG.peopleId, MAX(PG.level) groupAccessLevel, P.displayName,
          P.birthday <> ? OR P.birthday IS NULL updatedBday,
          P.displayName <> ? OR P.displayName IS NULL updatedDisplayName
        FROM peopleGroups PG
        INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ?)
        LEFT JOIN people P ON (PG.peopleId = P.id)
        WHERE PG.peopleId = ?
        GROUP BY PG.peopleId
      `,
      params: [userData.birthday, userData.displayName, clientAccountId, userId],
    })

    const isOwner = groupAccessLevel === levels.GROUP_OWNER_DELEGATE || groupAccessLevel === levels.GROUP_OWNER

    const updatedData = {
      ...userData,
      // if owner or if user hasn't updated their display name, set the display name to userData.displayName. else so it to null...JK
      displayName: isOwner || !updatedDisplayName ? userData.displayName : null,
    }

    // check if a non owner updated their display name and add draftDisplayName property. extracted this from object above so that we only set if necessary...JK
    if (!isOwner && updatedDisplayName) updatedData.draftDisplayName = userData.displayName

    const updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people
        SET ?
        WHERE id = ?
      `,
      params: [protectEdit(updatedData), userId],
    })

    let completedChallenges
    let rewardProgress
    if (updateRes.changedRows >= 1) {
      // Check which fields have updated compared to body to update profile challenges..JC
      if (updatedBday || updatedDisplayName) {
        ;({ completedChallenges, rewardProgress } = await handleChallenges({
          clientAccountId,
          req,
          triggers: [updatedBday && TRIGGERS.PROFILE_ADD_BIRTHDAY, updatedDisplayName && TRIGGERS.PROFILE_ADD_DISPLAY_NAME],
          userId,
        }))
      }
    }

    if (updatedData.draftDisplayName) {
      profileChangesRequestedNotif({ clientAccountId, userId })
    }

    res.json({ completedChallenges, rewardProgress, success: updateRes.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Update unsuccessful.' })
  }
}

const allowEdit = ['displayName', 'draftDisplayName', 'birthday', 'birthdayPublic', 'notifyMethod', 'pronouns']

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter) {
  let validRow = {}
  for (let p in row) {
    if (allowEdit.indexOf(p) > -1) {
      validRow[p] = row[p]
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
