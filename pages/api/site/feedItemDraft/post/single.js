import { getOwnedDraftGroups } from '@serverHelpers/feedItemDraft/getOwnedDraftGroups'
import { GROUP_ACCESS_LEVELS } from '@utils/types'

export default async (req, res) => {
  const {
    body: { feedItemDraftId, groups, itemType },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const draftDetails = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT FID.id, FID.scheduledAt, FID.status, FID.editedAt, FID.createdAt, FID.draftData,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner,
          CONCAT('${process.env.MEDIA_CDN}/', MV.category, '/', MV.uid, '.', MV.ext) AS video
        FROM feedItemDrafts FID
        LEFT JOIN mediaLink ML ON (FID.id = ML.tableKey AND ML.tableName = 'feedItemDrafts' AND ML.usage = 'banner')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN mediaLink MLV ON (FID.id = MLV.tableKey AND MLV.tableName = 'feedItemDrafts' AND MLV.usage = 'video')
        LEFT JOIN media MV ON (MLV.mediaId = MV.id)
        WHERE FID.id = ?
          AND FID.accountId = ${clientAccountId}
          AND FID.authorId = ${userId}
          AND FID.itemType = ?
      `,
      params: [feedItemDraftId, itemType],
    })

    if (draftDetails?.draftData?.groups?.length) {
      // Check if user still owns at least one of the draft groups...JC
      const { success, ownedDraftGroups } = await getOwnedDraftGroups({ clientAccountId, groups, userId })

      let defaultUserGroups
      if (!success) {
        // If user doesnt own any draft groups, fetch their default groups data...JC
        defaultUserGroups = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT DISTINCT G.id, G.name, COUNT(CG.id) childCount
            FROM peopleGroups PG
            INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
            LEFT JOIN groups CG ON (G.id = CG.parentGroupId)
            WHERE PG.peopleId = ${userId}
              AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER}
            GROUP BY G.id
            ORDER BY G.name ASC
          `,
        })

        if (!defaultUserGroups.length) return res.json({ success: false, msg: 'User does not have the right access' })
      }

      // Either replace draft groups with owned draft groups (May be less groups than in draft data), or w/ default data...JC
      draftDetails.draftData.groups = ownedDraftGroups.length ? ownedDraftGroups : defaultUserGroups
    }

    res.json({ success: true, draftDetails })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
