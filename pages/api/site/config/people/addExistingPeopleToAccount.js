export default async (req, res) => {
  try {
    const { peopleIds } = req.body

    const peopleInsertRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO clientAccountPeople (accountId, peopleId, accessLevel)
        VALUES ?
      `,
      params: [peopleIds.map(pi => [req.clientAccount.id, pi, 1])],
    })

    res.json({ success: peopleInsertRes.affectedRows === peopleIds.length })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
