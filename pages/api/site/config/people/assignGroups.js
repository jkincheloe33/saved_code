export default async (req, res) => {
  const {
    body: { groupId, groupIds, level = 1, peopleId, peopleIds },
    clientAccount,
  } = req

  try {
    // QUESTION: Do we want to audit trail these assignments?
    const insertRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO peopleGroups (peopleId, groupId, level)
          SELECT P.id, G.id, ?
          FROM people P
          LEFT JOIN groups G ON (G.id IN (?) AND G.accountId = ${clientAccount.id})
          WHERE G.id IS NOT NULL
            AND P.id IN (?)
      `,
      params: [level, groupId || groupIds || 0, peopleId || peopleIds || 0],
    })

    if (insertRes.affectedRows > 0) {
      res.json({ success: true, newId: insertRes.insertId })
    } else {
      res.json({ success: false, msg: 'Invalid arguments' })
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.json({ success: false, msg: 'Person is already linked to this group.' })
    } else {
      res.json({ success: false, msg: 'Server Error; Check logs.' })
    }
  }
}
