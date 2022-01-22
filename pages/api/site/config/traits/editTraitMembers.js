export default async (req, res) => {
  const { inserted, deleted } = req.body
  const { id: clientAccountId } = req.clientAccount

  try {
    if (deleted) {
      const deletedRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
        DELETE PT FROM peopleTraits PT
        INNER JOIN traits T ON (T.id = PT.traitId)
        INNER JOIN traitTypes TT ON (TT.id  = T.traitTypeId)
        WHERE traitId = ? AND TT.accountId = ?
      `,
        params: [deleted.traitId, clientAccountId],
      })

      res.json({ success: deletedRes.affectedRows > 0 })
    } else if (inserted) {
      const insertedRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
        INSERT INTO peopleTraits (peopleId, traitId)
          SELECT P.id, T.id
          FROM people P
          LEFT JOIN traits T on (T.id in (?))
          INNER JOIN traitTypes TT on (T.traitTypeId = TT.id and TT.accountId = ?)
          WHERE T.id IS NOT NULL
            AND P.id in (?)
      `,
        params: [inserted.assignedTraitId, req.clientAccount.id, inserted.members.map(member => [member.id])],
      })

      res.json({ success: insertedRes.affectedRows > 0, assignedMembers: insertedRes.affectedRows })
    } else {
      res.json({ success: false, msg: 'No inserted, updated or deleted commands' })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to update trait members' })
  }
}
