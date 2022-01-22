export default async (req, res) => {
  let { chatCode } = req.query
  chatCode = chatCode.trim()

  // Global check for chatCode since chatCode is unique...CY
  const portalCode = await wambiDB.querySingle({
    queryText: /*sql*/ `
        SELECT name, accountId
        FROM portals P 
        WHERE chatCode = ?
      `,
    params: [chatCode],
  })

  if (!portalCode) {
    res.json({ success: true, msg: 'Code is available' })
  } else {
    if (portalCode.accountId === req.clientAccount.id) {
      res.json({ success: true, msg: `Code is being used in ${portalCode.name} portal` })
    } else {
      res.json({ success: true, msg: 'Another Wambi portal is already using that code' })
    }
  }
}
