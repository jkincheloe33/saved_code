const { GROUP_SETTING_SCOPES } = require('../../utils/types')

// This function takes an editSettings object and splits it up to local and local and descendant settings...EK
const splitEditSettings = editSettings => {
  const localSettings = {}
  const localAndDescendantSettings = {}

  Object.keys(editSettings).forEach(key => {
    if (editSettings[key].scope === GROUP_SETTING_SCOPES.LOCAL) {
      localSettings[key] = editSettings[key].value
    } else {
      localAndDescendantSettings[key] = editSettings[key].value
    }
  })

  return {
    localSettings,
    localAndDescendantSettings,
  }
}

// This function is used to calculate the group runtimeSettings that can be inherited.
// NOTE:  THIS IS NOT INTENDED TO BE USED FOR RUN TIME.  Use the runtimeSettings object on the group object for this.
const getRuntimeSettingsFromGroup = async (accountGroupDefaultSettings, groupId) => {
  // Use the group index table to get all groups from the given groupId to the root, calculate the runtimeSettings from the list...EK
  // NOTE:  This is ordered by depth so it calculates from the root down...EK

  let groupsFromRoot = await wambiDB.query({
    queryText: /*sql*/ `
      select G.id, G.editSettings
      from groups G
      inner join groupIndex GI on (G.id = GI.groupId and GI.fromGroupId = ?)
      order by G.depth asc
    `,
    params: [groupId],
  })

  // Clone the accountGroupDefaultSettings and then merge from the root down based on edit Settings at all the groups from root to the group id specified...EK
  let mergedRuntimeSettings = {
    ...accountGroupDefaultSettings,
  }

  groupsFromRoot.forEach(group => {
    if (group.editSettings != null) {
      // NOTE: We don't care about "local" settings since it's never inherited...EK
      const { localAndDescendantSettings } = splitEditSettings(group.editSettings)

      // Merge what is before with the current group settings...EK
      mergedRuntimeSettings = {
        ...mergedRuntimeSettings,
        ...localAndDescendantSettings,
      }
    }
    // Else: Just continue to the next group, no edit settings means no changes from above...EK
  })

  return mergedRuntimeSettings
}

module.exports = {
  splitEditSettings,
  getRuntimeSettingsFromGroup,
}
