export default async (req, res) => {
  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE systemSettings 
        SET settings = JSON_SET(settings, '$.sentiment', JSON_OBJECT('negativeThreshold', 0.5));
      `,
    })

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
