import { getUserGroups } from '@serverHelpers/user/groups'

module.exports = {
  getOwnedDraftGroups: async ({ clientAccountId, groups, userId }) => {
    const { userGroups: userOwnedGroups } = await getUserGroups({
      clientAccountId,
      getByRealm: true,
      getOwned: true,
      userId,
    })

    const ownedDraftGroups = groups.filter(ug => userOwnedGroups.find(g => g.id === ug.id))

    return { success: ownedDraftGroups.length > 0, ownedDraftGroups }
  },
}
