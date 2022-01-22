const { login } = require('./helper')

export const addRewardProgress = () => {
  const addRewardProgressTask = ({ clientAccountId, me }) => {
    return cy
      .task('querySingle', {
        queryText: /*sql*/ `
          SELECT id 
          FROM rewardProgress
          WHERE peopleId = ${me.id} 
      `,
      })
      .then(res => {
        let updateQuery
        if (res)
          updateQuery = {
            commandText: /*sql*/ `
              UPDATE rewardProgress
              SET playedAt = NULL
              WHERE id = ${res.id} 
            `,
          }
        else
          updateQuery = {
            commandText: /*sql*/ `
              INSERT INTO rewardProgress (progress, peopleId, completedAt, accountId)
              VALUES (1000, ${me.id}, CURRENT_TIMESTAMP, ${clientAccountId})
            `,
          }

        cy.task('executeNonQuery', updateQuery)
      })
  }

  login({ task: addRewardProgressTask })
}
