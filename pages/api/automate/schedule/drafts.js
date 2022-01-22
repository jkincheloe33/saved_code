import { postAnnouncement } from '@serverHelpers/newsfeed/announcement'
import { postWambi } from '@serverHelpers/newsfeed/wambi'
import { sendFailedScheduleWambiDraft_Email } from '@serverHelpers/email'
import { validatePostDraft } from '@serverHelpers/feedItemDraft/postValidation'
import { validateWambiDraft } from '@serverHelpers/feedItemDraft/wambiValidation'
import { FEED_ITEM_DRAFT_STATUS, FEED_ITEM_TYPES, USER_STATUS } from '@utils'

const _validatePosts = async drafts => {
  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i]
    const { isValid } = await validatePostDraft(draft)
    drafts[i].isValid = isValid
  }

  return drafts.filter(e => !e.isValid)
}

const _validateCpcs = async ({ drafts }) => {
  for (let i = 0; i < drafts.length; i++) {
    const { accountId, authorId, draftData } = drafts[i]
    const { isValid } = await validateWambiDraft({ clientAccountId: accountId, draftData, userId: authorId })
    drafts[i].isValid = isValid
  }

  return drafts.filter(e => !e.isValid)
}

// Initialize now so we can set valid drafts to ready again if there is an error while validating...JC
let validDrafts = []

export default async (req, res) => {
  try {
    // get all drafts scheduled to run within the hour...KA
    let [, drafts] = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE feedItemDrafts
        SET status = ${FEED_ITEM_DRAFT_STATUS.QUEUED}
        WHERE status = ${FEED_ITEM_DRAFT_STATUS.READY}
          AND scheduledAt <= CURRENT_TIMESTAMP;

        SELECT FID.id, FID.accountId, FID.authorId, FID.draftData, FID.itemType, FID.scheduledAt AS scheduledAt,
          ML.id AS hasMedia, P.status AS userStatus
        FROM feedItemDrafts FID
        LEFT JOIN mediaLink ML ON (FID.id = ML.tableKey AND ML.tableName = 'feedItemDrafts')
        LEFT JOIN people P ON (FID.authorId = P.id)
        WHERE FID.status = ${FEED_ITEM_DRAFT_STATUS.QUEUED}
      `,
    })

    if (!drafts.length) return res.json({ success: true })

    const inactivePeopleDrafts = drafts.filter(d => d.userStatus !== USER_STATUS.ACTIVE)
    drafts = drafts.filter(d => !inactivePeopleDrafts.find(a => a.id === d.id))

    const postDrafts = drafts.filter(d => d.itemType === FEED_ITEM_TYPES.ANNOUNCEMENT)
    const cpcDrafts = drafts.filter(d => d.itemType === FEED_ITEM_TYPES.CPC)

    const failedPosts = await _validatePosts(postDrafts)
    const failedCpcs = await _validateCpcs({ drafts: cpcDrafts })
    const failedDrafts = [...failedCpcs, ...failedPosts, ...inactivePeopleDrafts]

    validDrafts = drafts.filter(d => !failedDrafts.find(fp => fp.id === d.id))

    if (failedDrafts.length) {
      // update all failed drafts to a status of failed...KA
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE feedItemDrafts
          SET status = ${FEED_ITEM_DRAFT_STATUS.FAILED}
          WHERE id IN (${failedDrafts.map(e => e.id)})
        `,
      })

      // No notifications sent for failed posts...JC

      if (failedCpcs.length) {
        const failedCpcDraftData = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT DISTINCT P.email, CONCAT(P.firstName, ' ', P.lastName) AS name,
              CONCAT(CA.host, '/newsfeed?sendCpc=true&wambiDraftId=', FID.id) AS url
            FROM feedItemDrafts FID
            INNER JOIN people P ON (FID.authorId = P.id)
            INNER JOIN clientAccounts CA ON (FID.accountId = CA.id)
            WHERE FID.id IN (${failedCpcs.map(d => d.id)})
          `,
        })

        // Bulk send failed wambi notifications w/out user specific content...JC
        await sendFailedScheduleWambiDraft_Email(failedCpcDraftData)
      }
    }

    // Post and delete validated drafts...CY
    if (validDrafts.length) {
      // Pull all client accounts for post CPC...CY
      const clientAccounts = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT id, host, settings
          FROM clientAccounts
        `,
      })

      for (let i = 0; i < validDrafts.length; i++) {
        // Package data for creating feedItem...CY
        const { accountId, authorId, hasMedia, draftData, id, itemType, scheduledAt } = validDrafts[i]
        const draftDetails = { hasMedia, id }
        const clientAccount = clientAccounts.find(ca => ca.id === accountId)

        const postFeedItemRes =
          itemType === FEED_ITEM_TYPES.ANNOUNCEMENT
            ? await postAnnouncement({
                accountId,
                authorId,
                draftDetails,
                feedItemDetails: draftData,
                req,
                scheduledAt,
              })
            : await postWambi({
                authorId,
                clientAccount,
                cpcData: draftData,
                feedItemDraftId: id,
                isScheduled: true,
                req,
                scheduledAt,
              })

        if (!postFeedItemRes.success) {
          await wambiDB.executeNonQuery({
            commandText: /*sql*/ `
              UPDATE feedItemDrafts
              SET status = ${FEED_ITEM_DRAFT_STATUS.FAILED}
              WHERE id = ${id}
            `,
          })
        }
      }
    }

    res.json({ success: true })
  } catch (error) {
    if (validDrafts.length) {
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE feedItemDrafts
          SET status = ${FEED_ITEM_DRAFT_STATUS.READY}
          WHERE id IN ${validDrafts.map(d => d.id)}
        `,
      })
    }
    logServerError({ error, req })
    res.json({ success: false })
  }
}
