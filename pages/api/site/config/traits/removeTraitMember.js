export default async (req, res) => {
  const {
    body: { id: peopleTraitId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const deletedRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE PT
        FROM peopleTraits PT
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = PT.peopleId AND CAP.accountId = ${clientAccountId})
        WHERE PT.id = ?
      `,
      params: [peopleTraitId],
    })

    res.json({ success: deletedRes.affectedRows > 0 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to update trait members' })
  }
}
