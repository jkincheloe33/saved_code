export default async (req, res) => {
  const { peopleGroupId, peopleGroupIds } = req.body

  // Remove the linker between a person and a group...EK
  const deleteRes = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      DELETE PG
      FROM peopleGroups PG
      INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ?)
      WHERE PG.id in (?)
    `,
    params: [req.clientAccount.id, peopleGroupId || peopleGroupIds],
  })

  if (deleteRes.affectedRows > 0) {
    res.json({ success: true })
  } else {
    res.json({ success: false, msg: 'Nothing was deleted.  Verify IDs and try again.' })
  }
}
