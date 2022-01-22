const { USER_STATUS } = require('@utils/types')
const pageSize = 10

export default async (req, res) => {
  try {
    const {
      body: { page = 0 },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    const userHasManager = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        WHERE P.id = ${userId}
          AND P.reportsTo IS NOT NULL
          AND P.status = ${USER_STATUS.ACTIVE}
      `,
    })

    const peopleList = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id AS peopleId,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MT.category, '/', MT.uid, '.', MT.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
        LEFT JOIN media MT ON (ML.mediaId = MT.id)
        INNER JOIN (
          -- Get people who are in the same groups as me..JC
          SELECT DISTINCT P.id
          FROM people P
          INNER JOIN peopleGroups PG ON (P.id = PG.peopleId AND PG.groupId IN (
            SELECT PG.groupId FROM peopleGroups PG WHERE peopleId = ${userId}
          ))
          UNION (
            SELECT DISTINCT P.id
            FROM people P
            -- Get people who report to the same manager as me, or other people with no manager if I have none..JC
            WHERE P.reportsTo ${userHasManager ? ` = (SELECT P.reportsTo FROM people P WHERE P.id = ${userId})` : ' IS NULL'}
          )
        ) PL ON (P.id = PL.id)
        WHERE P.status = ${USER_STATUS.ACTIVE}
          AND P.id <> ${userId}
        HAVING thumbnailImage IS NOT NULL
        -- Sort by id as a fallback if there are users that have never signed in. Prevents dupes..JC
        ORDER BY P.lastLoginAt DESC, P.id
        LIMIT ?, ?
      `,
      params: [page * pageSize, pageSize],
    })

    res.json({ success: true, peopleList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
