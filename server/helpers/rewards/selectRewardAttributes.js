import { REWARD_GIFT_STATUS } from '@utils/types'

const selectRewardAttributes = ({ clientAccountId, reward }) => {
  return /*sql*/ `
    SELECT RG.attributeName, RG.attributeValue, RG.id, RG.itemNumber
    FROM rewardGifts RG
    WHERE RG.itemNumber = ${wambiDB.escapeValue(reward.itemNumber)}
      AND (RG.inventory > 0 OR RG.inventory IS NULL)
      AND RG.status = ${REWARD_GIFT_STATUS.ACTIVE}
      AND (CURRENT_TIMESTAMP > RG.startDate OR RG.startDate IS NULL)
      AND (CURRENT_TIMESTAMP < RG.endDate OR RG.endDate IS NULL)
      AND RG.attributeName IS NOT NULL
      AND RG.attributeValue IS NOT NULL
      AND RG.accountId = ${clientAccountId}
  `
}

module.exports = selectRewardAttributes
