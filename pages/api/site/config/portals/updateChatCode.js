export default async (req, res) => {
  const { newCode, portalId } = req.body

  try {
    const insertCode = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
          UPDATE portals SET chatCode = ? WHERE id = ?
      `,
      params: [newCode, portalId],
    })

    if (insertCode.affectedRows === 1) {
      res.json({ success: true, newCode, msg: newCode ? `Updated code to ${newCode}` : 'Cleared code' })
    } else {
      res.json({ success: false, msg: 'Unable to update code' })
    }
  } catch (error) {
    res.json({ success: false, msg: error.sqlMessage || 'Unable to update code' })
  }
}
