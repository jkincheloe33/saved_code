import { validateWambiDraft } from '@serverHelpers/feedItemDraft/wambiValidation'
import { FEED_ITEM_TYPES } from '@utils/types'

export default async (req, res) => {
  const {
    body: { feedItemDraftId },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const draftDetails = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id, scheduledAt, status, editedAt, createdAt, draftData
        FROM feedItemDrafts
        WHERE id = ?
          AND accountId = ${clientAccountId}
          AND authorId = ${userId}
          AND itemType = ${FEED_ITEM_TYPES.CPC}
      `,
      params: [feedItemDraftId],
    })

    if (draftDetails) {
      const { draftData } = draftDetails

      const { invalidRecipients, invalidType, validatedDraftData } = await validateWambiDraft({
        clientAccountId,
        draftData,
        userId,
      })

      draftDetails.draftData = validatedDraftData

      return res.json({
        success: true,
        draftDetails,
        invalidRecipients,
        invalidType,
      })
    }

    res.json({ success: false, msg: 'Cannot access feed item draft or it does not exist' })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
