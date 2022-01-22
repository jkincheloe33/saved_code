export default async (req, res) => {
  try {
    const { groupId, rewardGiftId } = req.body

    const linkGroupRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO rewardGiftGroups (rewardGiftId, groupId)
          SELECT RG.id, G.id
          FROM rewardGifts RG
          INNER JOIN groups G ON (G.id = ? AND G.accountId = ?)
          WHERE RG.id = ?
      `,
      params: [groupId, req.clientAccount.id, rewardGiftId],
    })

    res.json({ success: linkGroupRes.affectedRows === 1, newLinkId: linkGroupRes.insertId })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
