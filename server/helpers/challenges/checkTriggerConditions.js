const { TRIGGERS } = require('../../../utils/types')

const cpcTriggers = ({ cpcThemeId, cpcTypeId, cpcValues }, challenge) => {
  const { triggerCondition } = challenge

  if (cpcValues && cpcValues.includes(triggerCondition.cpcValue)) return challenge
  else if (cpcTypeId && triggerCondition.cpcTypeId === cpcTypeId) return challenge
  else if (cpcThemeId && triggerCondition.cpcThemeId === cpcThemeId) return challenge
  return
}

module.exports = {
  [TRIGGERS.CPC_SEND]: cpcTriggers,
  [TRIGGERS.CPC_RECEIVE]: cpcTriggers,
}
