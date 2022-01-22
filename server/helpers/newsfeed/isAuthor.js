import { USER_STATUS } from '@utils'

module.exports = {
  validateAuthor: async ({ clientAccountId, feedId, userId }) => {
    // validate that user is the author...JK
    return await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId})
        INNER JOIN feedItems FI ON (FI.id = ? AND FI.authorId = P.id AND FI.accountId = ${clientAccountId})
        WHERE P.id = ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
      `,
      params: [feedId],
    })
  },
}
