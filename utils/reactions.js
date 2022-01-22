import { coreApi } from '@services'

export const addNewReaction = async ({ feedItem, handleReactionClick, mergeUpdatedFeedItem, reaction, reactions }) => {
  // Check all the reactions and make sure that the user doesn't already have one (if they do, turn it into a toggle and remove)...EK
  let existingReaction = feedItem.reactions.find(r => r.reactionId === reaction.id)

  if (existingReaction == null) {
    const { data: addRes } = await coreApi.post('/newsfeed/addReaction', {
      reactionId: reaction.id,
      feedId: feedItem.id,
      isCpc: feedItem.cpcId != null,
    })

    if (addRes.success) {
      feedItem.reactions = [
        ...reactions,
        {
          feedReactionId: addRes.newId,
          count: 1,
          feedId: feedItem.id,
          reactionId: reaction.id,
          name: reaction.name,
          icon: reaction.icon,
        },
      ]

      mergeUpdatedFeedItem && mergeUpdatedFeedItem(feedItem)
      return { completedChallenges: addRes.completedChallenges, rewardProgress: addRes.rewardProgress }
    } else {
      return
    }
  } else {
    await handleReactionClick(existingReaction)
    return { completedChallenges: [], rewardProgress: null }
  }
}

export const toggleReactions = async ({ feedItem, mergeUpdatedFeedItem, reaction, reactions }) => {
  let completedChallenges
  let rewardProgress

  if (reaction.feedReactionId != null) {
    // I have reacted to this.. toggle and remove my reaction...EK
    const { data: removeRes } = await coreApi.post('/newsfeed/removeReaction', { feedReactionId: reaction.feedReactionId })
    if (removeRes.success) {
      reaction.count -= 1
      reaction.feedReactionId = null
    } else {
      return console.warn('Unable to remove reaction, check server logs', removeRes.msg)
    }
  } else {
    // Others have reacted, but I haven't.  Add my reaction to this...EK
    const { data: addRes } = await coreApi.post('/newsfeed/addReaction', {
      reactionId: reaction.reactionId,
      feedId: feedItem.id,
      isCpc: feedItem.cpcId != null,
    })
    if (addRes.success) {
      reaction.count += 1
      reaction.feedReactionId = addRes.newId
      completedChallenges = [...addRes.completedChallenges]
      rewardProgress = addRes.rewardProgress
    } else {
      return
    }
  }

  // Update the reactions list state...EK
  // If the new count is 0 we need to remove the reaction from the list...EK
  if (reaction.count === 0) {
    feedItem.reactions = reactions.filter(r => r.reactionId !== reaction.reactionId)
  } else {
    feedItem.reactions = [...reactions]
  }

  mergeUpdatedFeedItem && mergeUpdatedFeedItem(feedItem)
  return { completedChallenges, rewardProgress }
}
