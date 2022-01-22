const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')

export default async (req, res) => {
  try {
    const {
      body: { days, peopleId },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    if (peopleId) {
      const isLeader = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT 1
          FROM people P
          INNER JOIN (
            ${selectLeaderPeople({ clientAccountId, includeRealm: true, userId })}
          ) PM ON (P.id = PM.id)
          INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
          WHERE P.id = ?
        `,
        params: [peopleId],
      })

      if (!isLeader) return res.json({ success: true, msg: 'You do not have access to view patient voice for this user.' })
    }

    // Get patient voice statistics for current time period...KA
    const questionQuery = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT QSI.question, AVG(SR.rating) AS averageScore,
          COUNT(S.id) AS reviewCount, MIN(S.createdAt) AS firstDate
        FROM surveys S
        INNER JOIN people P ON (P.id = S.peopleId)
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        INNER JOIN surveyResponses SR ON (SR.surveyId = S.id)
        INNER JOIN questionSetItems QSI ON (QSI.id = SR.questionId)
        WHERE S.peopleId = ?
          AND S.accountId = ${clientAccountId}
          ${Number(days) !== 0 ? 'AND DATEDIFF(NOW(), S.createdAt) <= ?' : ''}
        GROUP BY QSI.id
        ORDER BY QSI.order ASC
    `,
      params: [peopleId ?? userId, days],
    })

    // Get all statistics for comparison...KA
    const compareQuery = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT QSI.question, AVG(SR.rating) AS averageScore,
          COUNT(S.id) AS reviewCount, MIN(S.createdAt) AS firstDate
        FROM surveys S
        INNER JOIN people P ON (P.id = S.peopleId)
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        INNER JOIN surveyResponses SR ON (SR.surveyId = S.id)
        INNER JOIN questionSetItems QSI ON (QSI.id = SR.questionId)
        WHERE S.peopleId = ?
          AND S.accountId = ${clientAccountId}
          ${Number(days) !== 0 ? 'AND DATEDIFF(NOW(), S.createdAt) BETWEEN ? AND ?' : ''}
        GROUP BY QSI.id
        ORDER BY QSI.order ASC
      `,
      params: [peopleId ?? userId, days + 1, days * 2],
    })

    let [questionStats, compareStats] = await Promise.all([questionQuery, compareQuery])

    // Calculate the change in score in the selected time period...KA
    if (questionStats.length) {
      questionStats = questionStats.map((s, index) => ({
        ...s,
        averageScore: (Number(s.averageScore) / 5) * 100,
        change: compareStats.length > index ? s.averageScore - compareStats[index].averageScore : 0,
      }))

      // Format compareStats scores...KA
      if (compareStats.length) {
        compareStats = compareStats.map(s => ({
          ...s,
          averageScore: (Number(s.averageScore) / 5) * 100,
        }))
      }

      const overallStats = {
        firstDate: questionStats[0].firstDate,
        overallChange: getOverallScore(questionStats) - getOverallScore(compareStats),
        overallScore: getOverallScore(questionStats),
      }

      res.json({ success: true, statistics: { overallStats, questionStats } })
    } else {
      res.json({ success: true })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

// Calculate the overall score of all questions...KA
const getOverallScore = scoresArray => {
  return scoresArray.reduce((a, b) => a + b.averageScore, 0) / scoresArray.length
}
