export default async (req, res) => {
  const {
    body: { peopleId, peopleIds, traitId, traitIds },
    clientAccount,
  } = req

  try {
    const insertRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO peopleTraits (peopleId, traitId)
          SELECT P.id, T.id
          FROM people P
          INNER JOIN traits T ON (T.id IN (?))
          INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = ${clientAccount.id})
          WHERE T.id IS NOT NULL
            AND P.id IN (?)
      `,
      params: [traitId || traitIds || 0, peopleId || peopleIds || 0],
    })

    if (insertRes.affectedRows > 0) {
      res.json({ success: true, newId: insertRes.insertId })
    } else {
      res.json({ success: false, msg: 'Invalid arguments' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Server Error; Check logs.' })
  }
}
