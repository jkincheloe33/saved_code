export default async (req, res) => {
  const {
    body: { level, peopleGroupId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const deletedRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE peopleGroups PG
        INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
        SET PG.level = ?
        WHERE PG.id = ?
      `,
      params: [level, peopleGroupId],
    })

    res.json({ success: deletedRes.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to update group membership' })
  }
}
