import { getOwnedDraftGroups } from '@serverHelpers/feedItemDraft/getOwnedDraftGroups'

module.exports = {
  validatePostDraft: async draft => {
    const { success, ownedDraftGroups } = await getOwnedDraftGroups({
      clientAccountId: draft.accountId,
      groups: draft.draftData.groups,
      userId: draft.authorId,
    })

    if (success) {
      // Set post drafts groups to the ones user still owns by realm if there are any...CY/JC
      draft.draftData.groups = ownedDraftGroups
    }
    return { isValid: success }
  },
}
