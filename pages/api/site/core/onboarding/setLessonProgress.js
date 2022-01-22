// updates the lesson progress step and completedAt if the user reaches the final step of the lesson...JK
import { TRIGGERS } from '@utils/types'
const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')

export default async (req, res) => {
  const {
    body: { id, step },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    const activeLesson = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT LP.id, COUNT(LS.id) totalSteps
        FROM lessonProgress LP
        INNER JOIN lessons L ON (L.id = LP.lessonId AND L.accountId = ${clientAccountId})
        INNER JOIN lessonSteps LS ON (LS.lessonId = LP.lessonId)
        WHERE LP.lessonId = ?
          AND LP.peopleId = ${userId}
          AND LP.completedAt IS NULL
        GROUP BY LS.lessonId
      `,
      params: [id],
    })

    let completedChallenges = []
    let rewardProgress = {}

    if (activeLesson) {
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE lessonProgress LP
          SET step = IF(LP.step > ?, LP.step, ?),
            completedAt = IF(${activeLesson.totalSteps} = ? AND LP.completedAt IS NULL, CURRENT_TIMESTAMP, LP.completedAt)
          WHERE LP.id = ${activeLesson.id}
        `,
        params: [step, step, step],
      })

      if (activeLesson.totalSteps === step) {
        ;({ completedChallenges, rewardProgress } = await handleChallenges({
          clientAccountId: clientAccountId,
          req,
          triggers: [TRIGGERS.LESSON_COMPLETE],
          userId,
        }))
      }
    }

    res.json({ success: true, completedChallenges, rewardProgress })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
