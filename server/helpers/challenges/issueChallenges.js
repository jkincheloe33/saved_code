const notification = require('../notifications/challenges')
const { CHALLENGE_STATUS, CHALLENGE_WHO_CAN_COMPLETE } = require('../../../utils/types')

module.exports = {
  issueChallenges: async ({ clientAccountId, req, userId }) => {
    let transaction

    try {
      // Get a person's traits to check against challenge traits...JC
      const personTraitsQuery = wambiDB.query({
        queryText: /*sql*/ `
          SELECT PT.traitId
          FROM peopleTraits PT
          WHERE PT.peopleId = ?
        `,
        params: [userId],
      })

      // Get a list of new challenges to assign to the user.
      // If there are challenge groups, check user is in the realm of that group...JC
      let newChallengesQuery = wambiDB.query({
        queryText: /*sql*/ `
          SELECT C.id, C.title,
          GROUP_CONCAT(DISTINCT CTR.traitId) traits
          FROM challenges C
          LEFT JOIN challengeProgress CP ON (C.id = CP.challengeId AND CP.peopleId = ${userId})
          INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ${clientAccountId})
          LEFT JOIN challengeGroups CGR ON (CGR.challengeId = C.id)
          LEFT JOIN groupIndex GI ON (CGR.groupId = GI.groupId OR CGR.groupId IS NULL)
          INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId = ${userId})
          LEFT JOIN challengeTraits CTR ON (CTR.challengeId = C.id)
          WHERE CP.challengeId IS NULL
            AND C.status = ${CHALLENGE_STATUS.ACTIVE}
            AND (CURRENT_TIMESTAMP > C.startDate OR C.startDate IS NULL)
            AND (CURRENT_TIMESTAMP < C.endDate OR C.endDate IS NULL)
            AND (
              C.whoCanComplete = ${CHALLENGE_WHO_CAN_COMPLETE.ANYONE}
              -- Only for team members (check they don't own any groups)
              OR (C.whoCanComplete = ${CHALLENGE_WHO_CAN_COMPLETE.TEAM_MEMBERS}
                AND (
                  SELECT MAX(level)
                  FROM peopleGroups PG
                  INNER JOIN groups G ON (PG.groupId = G.id AND PG.peopleId = ${userId} AND G.accountId = ${clientAccountId})
                ) = ${CHALLENGE_WHO_CAN_COMPLETE.TEAM_MEMBERS}
              )
              -- Only for delegates/owners (check to see that they own at least one group)
              OR (C.whoCanComplete = ${CHALLENGE_WHO_CAN_COMPLETE.OWNERS}
                AND (
                  SELECT MAX(level)
                  FROM peopleGroups PG
                  INNER JOIN groups G ON (PG.groupId = G.id AND PG.peopleId = ${userId} AND G.accountId = ${clientAccountId})
                ) > ${CHALLENGE_WHO_CAN_COMPLETE.TEAM_MEMBERS}
              )
            )
          GROUP BY C.id
        `,
      })

      let [personTraits, newChallenges] = await Promise.all([personTraitsQuery, newChallengesQuery])

      // If there are challenge traits, check if user has all matching traits...JC
      newChallenges = newChallenges.filter(c => {
        if (c.traits) {
          const challengeTraits = c.traits.split(',')
          return challengeTraits.every(at => personTraits.some(pt => pt.traitId === Number(at)))
        }
        return true
      })

      if (newChallenges.length) {
        transaction = await wambiDB.beginTransaction()

        const newChallengeProgressRecords = await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO challengeProgress (challengeId, peopleId)
            VALUES ?
          `,
          params: [newChallenges.map(c => [c.id, userId])],
        })

        const newChallengeGoalProgressRecords = await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO challengeGoalProgress (challengeProgressId, challengeGoalId)
              SELECT CP.id challengeProgressId, CG.id challengeGoalId
              FROM challengeProgress CP
              LEFT JOIN challenges C ON (CP.challengeId = C.id)
              INNER JOIN challengeThemes CT ON (CT.id = C.challengeThemeId AND CT.accountId = ?)
              INNER JOIN challengeGoals CG ON (CG.challengeId = C.id AND CG.trigger IS NOT NULL)
              LEFT JOIN challengeGoalProgress CGP ON (CGP.challengeProgressId = CP.id)
              WHERE CP.peopleId = ?
                AND CGP.id IS NULL
          `,
          params: [clientAccountId, userId],
        })

        await wambiDB.commitTransaction(transaction)

        if (newChallengeProgressRecords.affectedRows > 0 && newChallengeGoalProgressRecords.affectedRows > 0) {
          notification.challenges(clientAccountId, newChallenges, userId)
          return { success: true, msg: 'Challenges Issued for this user' }
        } else {
          return { success: false, msg: 'Error creating challenges for user' }
        }
      } else {
        return { success: false, msg: 'No new challenges for this user' }
      }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of issueChallenges', error, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      return { success: false }
    }
  },
}
