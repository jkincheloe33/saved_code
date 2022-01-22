export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    // Read from DB write stream to wait for any reward progress write updates...CY
    const [rewardProgress] = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT id 
        FROM rewardProgress
        WHERE accountId = ${clientAccountId}
          AND peopleId = ${userId}
          AND completedAt IS NOT NULL 
          AND playedAt IS NULL
        LIMIT 1
      `,
    })

    res.json({ success: true, rewardProgressId: rewardProgress?.id })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
