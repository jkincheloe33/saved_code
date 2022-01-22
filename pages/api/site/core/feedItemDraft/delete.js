import { deleteFeedItemDraft } from '@serverHelpers/feedItemDraft/deleteFeedItemDraft'

export default async (req, res) => {
  const {
    body: { feedItemDraftId },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const deleteData = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT ML.id AS hasMedia
        FROM feedItemDrafts FID
        LEFT JOIN mediaLink ML ON (FID.id = ML.tableKey AND ML.tableName = 'feedItemDrafts')
        WHERE FID.authorId = ${userId}
          AND FID.accountId = ${clientAccountId}
          AND FID.id = ?
      `,
      params: [feedItemDraftId],
    })

    if (!deleteData) return { success: false, msg: 'User does not have permission to delete this draft.' }

    res.json(await deleteFeedItemDraft({ feedItemDraftId, hasMedia: deleteData.hasMedia, req }))
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
