const { USER_STATUS } = require('@utils/types')

export default async (req, res) => {
  try {
    // NOTE:: If there is only one group, the prior step should provide the default unit...EK

    const {
      body: { groupId, lang, peopleId, sid },
      clientAccount: { id: clientAccountId },
    } = req

    // Get the employee, ensure group id to review is associated with this user...EK
    const employee = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.id
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        LEFT JOIN peopleGroups PG ON (P.id = PG.peopleId)
        LEFT JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId)
        WHERE GI.groupId = ?
          AND P.id = ?
          AND P.status = ${USER_STATUS.ACTIVE}
      `,
      params: [groupId, peopleId],
    })

    if (employee == null) {
      // Either this employee id is bad, or the group specified is not associated with the employee
      // Either way, this is an invalid request...EK
      return res.status(400).send('Invalid Request: Employee ID or Unit invalid.')
    }

    // Get a person's traits to check against questions and awards...KA
    const personTraitsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT traitId
        FROM peopleTraits
        WHERE peopleId = ?
      `,
      params: [peopleId],
    })

    // Get questions sets with all assigned traits...KA
    const questionSetsQuery = wambiDB.query({
      queryText: /*sql*/ `
        SELECT PQS.questionSetId, PQS.order, GROUP_CONCAT(DISTINCT PQST.traitId) AS traits
        FROM portalQuestionSets PQS
        INNER JOIN questionSets QS ON (PQS.questionSetId = QS.id)
        INNER JOIN portals P ON (P.id = PQS.portalId AND P.shortUid = ?)
        LEFT JOIN portalQuestionSetTraits PQST ON (PQS.id = PQST.portalQuestionSetId)
        LEFT JOIN portalQuestionSetGroups PQSG ON (PQSG.portalQuestionSetId = PQS.id)
        LEFT JOIN groupIndex GI ON (PQSG.groupId = GI.groupId OR PQSG.groupId IS NULL)
        INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId = ?)
        GROUP BY PQS.questionSetId
        ORDER BY PQST.traitId IS NULL, PQS.order
      `,
      params: [sid, peopleId],
    })

    // Get awards if they exist and award traits match person traits...KA
    const awardsQuery = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT A.id, A.awardType, GROUP_CONCAT(DISTINCT ATT.traitId) AS traits
        FROM awardTypes A
        LEFT JOIN awardTypeTraits ATT ON (A.id = ATT.awardTypeId)
        INNER JOIN awardTypeGroups ATG ON (A.id = ATG.awardTypeId)
        INNER JOIN groupIndex GI ON (ATG.groupId = GI.groupId AND GI.fromGroupId = ?)
        WHERE A.accountId = ${clientAccountId}
        GROUP BY A.id
      `,
      params: [groupId],
    })

    const [personTraits, questionSets, awardTypes] = await Promise.all([personTraitsQuery, questionSetsQuery, awardsQuery])
    let matchingSet

    // If a question set has traits, check if the person has all of them assigned...KA
    questionSets.some(qs => {
      if (!matchingSet) {
        if (qs.traits) {
          const questionSetTraits = qs.traits.split(',')

          if (questionSetTraits.every(qst => personTraits.some(pt => pt.traitId === Number(qst)))) return (matchingSet = qs)
        } else {
          return (matchingSet = qs)
        }
      }
    })

    let questions = []

    if (matchingSet) {
      questions = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT QSI.id, IFNULL(NULLIF(T.translation, ''), QSI.question) AS question, QSI.questionSetId
          FROM questionSetItems QSI
          INNER JOIN questionSets QS ON (QSI.questionSetId = QS.id AND QS.accountId = ${clientAccountId})
          LEFT JOIN translations T ON (T.localeCode = ?
            AND T.tableName = 'questionSetItems'
            AND T.tableKey = QSI.id
            AND T.columnName = 'question'
          )
          WHERE QS.id = ?
          ORDER BY QSI.order
        `,
        params: [lang, matchingSet.questionSetId],
      })
    }

    // Only return awards a person's traits match...KA
    const awards = awardTypes.filter(a => {
      if (a.traits) {
        const awardTraits = a.traits.split(',')
        return awardTraits.every(at => personTraits.some(pt => pt.traitId === Number(at)))
      }
      return true
    })

    res.json({ success: true, awards, questions })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
