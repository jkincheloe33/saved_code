export default async (req, res) => {
  const {
    body: { groupId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const groupMembers = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT P.id, P.firstName, P.lastName,
          PG.level, PG.id AS peopleGroupId
        FROM peopleGroups PG
        LEFT JOIN people P ON (PG.peopleId = P.id)
        INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
        WHERE G.id = ?
      `,
      params: [groupId],
    })

    res.json(groupMembers)
  } catch (error) {
    logServerError({ error, req })
    res.json([])
  }
}
