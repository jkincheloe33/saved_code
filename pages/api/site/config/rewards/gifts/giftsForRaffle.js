import { REWARD_GIFT_STATUS } from '@utils'

export default async (req, res) => {
  const {
    clientAccount,
    query: { raffleId },
  } = req

  try {
    const giftsForRaffle = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RG.id AS value,
          CONCAT(RG.name, IF(RG.attributeValue IS NOT NULL, CONCAT(' - ', RG.attributeValue), '')) AS name
        FROM rewardGifts RG
        WHERE RG.accountId = ${clientAccount.id}
          AND RG.status IN (${REWARD_GIFT_STATUS.ACTIVE}, ${REWARD_GIFT_STATUS.MANUAL})
          AND (RG.startDate < CURRENT_TIMESTAMP OR RG.startDate IS NULL)
          AND (RG.endDate > CURRENT_TIMESTAMP OR RG.endDate IS NULL)
          AND RG.id <> ?
          AND (RG.inventory > 0 OR RG.inventory IS NULL)
        ORDER BY name
      `,
      params: [raffleId],
    })

    res.json({ success: true, giftsForRaffle })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
