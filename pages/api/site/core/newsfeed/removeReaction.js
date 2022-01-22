// This endpoint will add a reaction to a news feed item...EK
export default async (req, res) => {
  const { feedReactionId } = req.body

  try {
    // This delete is written so if either the feed reaction id specified is not in the current account for this person, no record will be deleted...EK
    const reactionDeleteRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE FROM feedReactions
        WHERE id = ?
          AND peopleId = ?
      `,
      params: [feedReactionId, req.session.userId],
    })

    if (reactionDeleteRes.affectedRows === 1) {
      res.json({ success: true })
    } else {
      res.json({ success: false, msg: 'Missing or invalid arguments' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
