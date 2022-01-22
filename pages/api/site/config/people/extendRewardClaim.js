const extendByDays = 14

export default async (req, res) => {
  const {
    body: { peopleId, rewardClaimId },
    clientAccount,
  } = req

  try {
    const updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE rewardClaims RC
        INNER JOIN rewardGifts RG ON (RG.id = RC.rewardGiftId AND RG.accountId = ${clientAccount.id})
        SET RC.expiresAt = (IF(RC.expiresAt < CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, RC.expiresAt) + INTERVAL ${extendByDays} DAY)
        WHERE RC.id = ?
          AND RC.claimedBy = ?
      `,
      params: [rewardClaimId, peopleId],
    })

    res.json({ success: updateRes.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
