export default async (req, res) => {
  const {
    body: { feedId },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const dismissPinnedAnnouncement = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO dismissedPins (feedId, peopleId)
          SELECT FI.id, ${userId}
          FROM feedItems FI
          LEFT JOIN dismissedPins DP ON (DP.feedId = FI.id AND DP.peopleId = ${userId})
          WHERE FI.id = ?
            AND FI.accountId = ${clientAccountId}
            -- Check if dismissed announcement doesn't exist already...CY
            AND DP.id IS NULL
      `,
      params: [feedId],
    })

    res.json({ success: dismissPinnedAnnouncement.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
