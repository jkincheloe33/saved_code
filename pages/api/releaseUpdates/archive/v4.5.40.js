export default async (req, res) => {
  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        ALTER TABLE challenges
        MODIFY startDate TIMESTAMP DEFAULT NULL,
        MODIFY endDate TIMESTAMP DEFAULT NULL;

        UPDATE challenges
        SET startDate = TIMESTAMP(startDate, '00:00:00'), 
          endDate = TIMESTAMP(endDate, '23:59:59');
      `,
    })

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
