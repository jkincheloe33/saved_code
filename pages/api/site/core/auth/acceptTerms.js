export default async (req, res) => {
  const {
    clientAccount: { clientTermsUrl, id: clientAccountId, selfRegisterTermsUrl },
    session: { userId },
  } = req

  let transaction

  try {
    transaction = await wambiDB.beginTransaction()

    const peopleTermsRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        SET P.acceptedTermsAt = CURRENT_TIMESTAMP
        WHERE P.id = ${userId}
          AND P.acceptedTermsAt IS NULL
      `,
    })

    let clientTermsRes

    if (clientTermsUrl) {
      clientTermsRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE clientAccountPeople
          SET clientTermsAt = CURRENT_TIMESTAMP
          WHERE accountId = ${clientAccountId}
            AND peopleId = ${userId}
            AND clientTermsAt IS NULL
        `,
      })
    }

    let selfRegisterTermsRes

    if (selfRegisterTermsUrl) {
      selfRegisterTermsRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE people P
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
          SET P.selfRegisterTermsAcceptedAt = CURRENT_TIMESTAMP
          WHERE P.id = ${userId}
            AND P.selfRegisterTermsAcceptedAt IS NULL
            AND P.isSelfRegistered = 1
        `,
      })
    }

    await wambiDB.commitTransaction(transaction)
    res.json({
      success: true,
      clientTermsUpdated: clientTermsRes?.changedRows === 1,
      peopleTermsUpdated: peopleTermsRes.changedRows === 1,
      selfRegisterTermsUpdated: selfRegisterTermsRes?.changedRows === 1,
    })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false })
  }
}
