export default async (req, res) => {
  // Take the media link specified from the challenge theme, and create a new link to the media it references to a given challenge record...EK
  const { mediaLinkId, challengeId } = req.body

  // Remove any existing image link for this challenge...EK
  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      DELETE FROM mediaLink
      WHERE tableName = 'challenges' AND tableKey = ? AND \`usage\` = 'challenge'
    `,
    params: [challengeId],
  })

  const linkRes = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      INSERT INTO mediaLink (mediaId, tableName, tableKey, \`usage\`)
        SELECT ML.mediaId, 'challenges', ?, 'challenge'
        FROM mediaLink ML
        INNER JOIN media M on (M.id = ML.mediaId AND M.accountId = ?)
        WHERE ML.id = ? AND ML.\`usage\` = 'imageOption'
    `,
    params: [challengeId, req.clientAccount.id, mediaLinkId],
  })

  res.json({ success: linkRes.affectedRows === 1 })
}
