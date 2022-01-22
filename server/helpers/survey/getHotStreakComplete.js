import { PERFECT_SCORE } from '@utils'

module.exports = {
  getHotStreakComplete: async ({ clientAccountId, hotStreakCount = 3, userId }) => {
    if (hotStreakCount === 0) return false

    const { perfectScoreCount } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT COUNT(*) AS perfectScoreCount
        FROM surveys
        WHERE peopleId = ${userId}
          AND accountId = ${clientAccountId}
          AND hotStreakComplete = 0
          -- Get the last hot streak or non-perfect score...JC/CY
          AND createdAt > IFNULL((
            SELECT createdAt
            FROM surveys
            WHERE (hotStreakComplete = 1 OR overallScore < ${PERFECT_SCORE})
              AND peopleId = ${userId}
              AND accountId = ${clientAccountId}
            ORDER BY createdAt DESC
            LIMIT 1
          ), 0)
      `,
    })

    // Add one to perfect score count to account for incoming perfect score...CY
    // Check greater-than to retroactively check for hot streak...CY
    return { hotStreakComplete: perfectScoreCount + 1 >= hotStreakCount, perfectScoreCount: perfectScoreCount + 1 }
  },
}
