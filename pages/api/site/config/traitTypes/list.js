export default async (req, res) => {
  let traitTypes = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT * FROM traitTypes 
      WHERE accountId = ${req.clientAccount.id}
    `,
  })

  res.json({ success: true, traitTypes })
}
