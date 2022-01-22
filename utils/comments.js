import { coreApi } from '@services'

export const postComment = async (comment, feedItem, mergeUpdatedFeedItem) => {
  const { data: addRes } = await coreApi.post('/newsfeed/addComment', {
    comment,
    feedId: feedItem.id,
    isCpc: Boolean(feedItem.cpcId),
  })
  if (addRes.success) {
    feedItem.comments = [addRes.insertedComment]
    feedItem.commentCount++

    mergeUpdatedFeedItem && mergeUpdatedFeedItem(feedItem)
    return { completedChallenges: addRes.completedChallenges, rewardProgress: addRes.rewardProgress }
  } else {
    return console.warn('Unable to add comment, check server logs', addRes.msg)
  }
}
