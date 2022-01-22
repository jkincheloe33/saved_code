import { USER_STATUS } from '@utils/types'

module.exports = {
  getCelebrations: async ({ userId, clientAccountId, daysLaterLimit = 28, page = 0, pageLimit, clientTzOffset }) => {
    const tzOffset = `${clientTzOffset / -60}:00`

    // Pull the celebrations list (currently: anniversarys and birthdays)...JC
    const celebrationsSelect = `
      P.id,
      CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
      IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image,
      G.name AS groupName,
    `

    const celebrationsJoin = `
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
      INNER JOIN (
        -- Get all people in users group...CY
        SELECT P.id
        FROM people P
        INNER JOIN peopleGroups PG ON (P.id = PG.peopleId AND PG.groupId IN (
          SELECT groupId
          FROM peopleGroups
          WHERE peopleId = ${userId}
        ))
        -- Get people that the user reportsTo...CY
        UNION (
          SELECT id
          FROM people
          WHERE reportsTo = ${userId}
        )
      ) P2 ON (P2.id = P.id)
      INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
      INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
      LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.tableName = 'people' AND ML.usage = 'thumbnail')
      LEFT JOIN media M ON (ML.mediaId = M.id)
    `

    // returns number of days from today. if celebrationType is within the same year as clientTime and after today's date, this will be a positive number. Otherwise this will be a negative number...JC & JK
    const daysLater = celebrationType =>
      `DATEDIFF(DATE(CONCAT_WS('-', YEAR(@clientTime), MONTH(${celebrationType}), DAY(${celebrationType}))), @clientTime)`

    const [, celebrations] = await wambiDB.query({
      queryText: /*sql*/ `
        SET @clientTime := CONVERT_TZ(NOW(),'UTC',?);
        SELECT DISTINCT
          ${celebrationsSelect}
          DATE_FORMAT(CONCAT_WS('-', YEAR(@clientTime), MONTH(P.hireDate), DAY(P.hireDate)), '%m/%d') AS date,
          -- if daysLater returns a positive number, return daysLater. Otherwise, add 365 to daysLater (daysLater will be a negative number)
          -- example: if today's date is 09/01 and my hireDate is 08/31, daysLater would return -1. so we add 365 for a result of 364 daysLater...JC & JK
          IF(${daysLater('P.hireDate')} >= -7, ${daysLater('P.hireDate')}, 365 + ${daysLater('P.hireDate')}) AS daysLater,
          YEAR(@clientTime) - YEAR(P.hireDate) + IF(${daysLater('P.hireDate')} < -7, 1, 0) AS yearsAgo
        FROM people P
        ${celebrationsJoin}
        WHERE P.status = ${USER_STATUS.ACTIVE}
          AND P.hireDate IS NOT NULL
        GROUP BY P.id
        HAVING daysLater <= ${daysLaterLimit}
          AND daysLater >= -7
        UNION ALL
        (SELECT DISTINCT
          ${celebrationsSelect}
          DATE_FORMAT(CONCAT_WS('-', YEAR(@clientTime), MONTH(P.birthday), DAY(P.birthday)), '%m/%d') AS date,
          -- if daysLater returns a positive number, return daysLater. Otherwise, add 365 to daysLater (daysLater will be a negative number)
          -- example: if today's date is 09/01 and my birthday is 07/31, daysLater would return -32. so we add 365 for a result of 333 daysLater...JC & JK
          IF(${daysLater('P.birthday')} >= -7, ${daysLater('P.birthday')}, 365 + ${daysLater('P.birthday')}) AS daysLater,
          NULL
        FROM people P
        ${celebrationsJoin}
        WHERE
          P.status = ${USER_STATUS.ACTIVE}
          AND P.birthday IS NOT NULL
          AND P.birthdayPublic = 1
        GROUP BY P.id
        HAVING daysLater <= ${daysLaterLimit}
          AND daysLater >= -7
        )
        ORDER BY
          CASE
            WHEN daysLater = 0 THEN 0
            WHEN daysLater < 0 THEN 1
            WHEN daysLater > 0 THEN 2
          END ASC, daysLater ASC
        LIMIT ?, ?
      `,
      params: [tzOffset, page * pageLimit, pageLimit],
    })

    return celebrations
  },
}
