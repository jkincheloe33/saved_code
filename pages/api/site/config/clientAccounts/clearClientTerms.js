export default async (req, res) => {
  const { clientAccount } = req

  let transaction

  try {
    const { mediaLinkId } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT ML.id AS mediaLinkId
        FROM mediaLink ML
        INNER JOIN media M ON (M.id = ML.mediaId AND M.accountId = ${clientAccount.id})
        WHERE ML.tableName = 'clientAccounts'
          AND ML.tableKey = ${clientAccount.id}
          AND ML.usage = 'clientTerms'
      `,
    })

    let deleteRes

    if (mediaLinkId) {
      transaction = await wambiDB.beginTransaction()

      deleteRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          DELETE FROM mediaLink
          WHERE id = ${mediaLinkId}
        `,
      })

      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE clientAccountPeople
          SET clientTermsAt = NULL
          WHERE accountId = ${clientAccount.id}
        `,
      })

      await wambiDB.commitTransaction(transaction)
    }

    res.json({ success: deleteRes?.affectedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Error clearing client terms' })
  }
}
