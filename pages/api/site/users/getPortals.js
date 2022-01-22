export default async (req, res) => {
  try {
    const portals = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT P.id, P.name, P.shortUid
        FROM portals P
        WHERE P.accountId = ${req.clientAccount.id}
      `,
    })

    res.json({ success: true, portals })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
