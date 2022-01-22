export default async (req, res) => {
  const { lang, questionSetId } = req.body

  let questionsForSet = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT QSI.*, T.translation questionTrans
      FROM questionSetItems QSI
      INNER JOIN questionSets QS ON (QSI.questionSetId = QS.id AND QS.accountId = ?)
      LEFT JOIN translations T ON (T.localeCode = ? AND T.tableName = 'questionSetItems' AND T.tableKey = QSI.id AND T.columnName = 'question')
      WHERE QS.id = ?
      ORDER BY QSI.order
    `,
    params: [req.clientAccount.id, lang, questionSetId],
  })

  res.json({ success: true, questionsForSet })
}
