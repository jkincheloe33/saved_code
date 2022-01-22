import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'
import { GROUP_ACCESS_LEVELS as levels, TRIGGERS } from '@utils/types'
const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')
import { profileChangesRequestedNotif } from '@serverHelpers/notifications/profile'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  try {
    const {
      clientAccount,
      session: { userId },
    } = req

    let { original, thumbnail } = await parseMultipartFormData(req)
    let originalImage = null
    let croppedImage = null

    const groupAccessLevel = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT MAX(PG.level) AS maxLevel
        FROM peopleGroups PG
        INNER JOIN groups G ON (PG.peopleId = ${userId} AND PG.groupId = G.id AND G.accountId = ${clientAccount.id})
        GROUP BY PG.peopleId
      `,
    })

    const { maxLevel } = groupAccessLevel

    const transaction = await wambiDB.beginTransaction()

    if (original) {
      originalImage = await uploadAndLinkMedia({
        clientAccount,
        mediaBuffer: original.buffer,
        tableName: 'people',
        tableKey: userId,
        mediaCategory: 'profile',
        fileName: original.fileName,
        mimeType: original.mimeType,
        usage: maxLevel > levels.TEAM_MEMBER ? 'original' : 'pendingOriginal',
        transaction,
      })
    }

    if (thumbnail) {
      croppedImage = await uploadAndLinkMedia({
        clientAccount,
        mediaBuffer: thumbnail.buffer,
        tableName: 'people',
        tableKey: userId,
        mediaCategory: 'profile',
        fileName: thumbnail.fileName,
        mimeType: thumbnail.mimeType,
        usage: maxLevel > levels.TEAM_MEMBER ? 'thumbnail' : 'pendingThumbnail',
        transaction,
      })
    }

    await wambiDB.commitTransaction(transaction)

    const { completedChallenges, rewardProgress } = await handleChallenges({
      clientAccountId: clientAccount.id,
      req,
      triggers: [TRIGGERS.PROFILE_ADD_IMAGE],
      userId,
    })

    if (maxLevel === levels.TEAM_MEMBER) {
      profileChangesRequestedNotif({ clientAccountId: clientAccount.id, userId })
    }

    res.json({ success: true, completedChallenges, croppedImage, originalImage, rewardProgress })
  } catch (error) {
    logServerError({ error, excludeBody: true, req })
    res.json({ success: false })
  }
}
