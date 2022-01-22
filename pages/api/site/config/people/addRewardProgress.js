const MAX_PROGRESS = 1000

export default async (req, res) => {
  const {
    body: { progressIncrement = 1000, peopleId },
    clientAccount,
  } = req

  let transaction

  try {
    const existingRecord = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id, progress, peopleId
        FROM rewardProgress
        WHERE peopleId = ?
          AND accountId = ${clientAccount.id}
          AND completedAt IS NULL
      `,
      params: [peopleId],
    })

    transaction = await wambiDB.beginTransaction()

    if (existingRecord) {
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE rewardProgress
          SET completedAt = IF(progress + ? >= ${MAX_PROGRESS}, CURRENT_TIMESTAMP, NULL),
            progress = IF(progress + ? >= ${MAX_PROGRESS}, ${MAX_PROGRESS}, progress + ?)
          WHERE id = ${existingRecord.id}
        `,
        params: [progressIncrement, progressIncrement, progressIncrement],
      })
    }

    const additionalProgress = existingRecord ? progressIncrement - (MAX_PROGRESS - existingRecord.progress) : progressIncrement

    if (additionalProgress > 0) {
      const newProgressRecordCount = Math.floor(additionalProgress / MAX_PROGRESS)

      const newProgressRecords = [
        ...new Array(newProgressRecordCount).fill(`(${[clientAccount.id, peopleId, MAX_PROGRESS, 'CURRENT_TIMESTAMP']})`),
        `(${[clientAccount.id, peopleId, additionalProgress % MAX_PROGRESS, 'NULL']})`,
      ]

      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO rewardProgress (accountId, peopleId, progress, completedAt)
          VALUES ${newProgressRecords}
        `,
      })
    }

    await wambiDB.commitTransaction(transaction)

    const rewardProgress = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT RP.id AS rewardProgressId, RP.accountId, RP.progress, RP.startedAt, RP.completedAt, RP.playedAt
        FROM rewardProgress RP
        WHERE RP.accountId = ${clientAccount.id}
          AND RP.peopleId = ?
        ORDER BY RP.startedAt DESC, RP.id DESC
      `,
      params: [peopleId],
    })

    res.json({ success: true, rewardProgress })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false })
  }
}
