export default async (req, res) => {
  try {
    const {
      body: { rewardGiftId },
      clientAccount: { id: clientAccountId },
    } = req

    const relatedGroups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RGG.id, RGG.groupId, G.name
        FROM rewardGiftGroups RGG
        INNER JOIN rewardGifts RG ON (RGG.rewardGiftId = RG.id AND RG.accountId = ? AND RG.id = ?)
        INNER JOIN groups G ON (RGG.groupId = G.id)
        ORDER BY G.name
      `,
      params: [clientAccountId, rewardGiftId],
    })

    res.json({ success: true, relatedGroups })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
