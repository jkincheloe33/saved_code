const { USER_STATUS } = require('@utils/types')

// Returns up to 3 recipients from groups if there are not enough recipients selected for cpc compose..JC
const LIMIT = 3

export default async (req, res) => {
  try {
    let {
      body: { excludedRecipients = [], groups = [], recipients = [] },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    if (!groups.length) return res.json({ success: false, msg: 'No groups provided' })

    const nonRealmGroups = groups.flatMap(g => (!g.isRealm ? g.id : []))
    const realmGroups = groups.flatMap(g => (g.isRealm ? g.id : []))

    // Also exclude selected recipients from query so we don't pull them again...JC
    excludedRecipients = [...excludedRecipients, ...recipients.map(({ id }) => id)]

    const [, , groupMembers] = await wambiDB.query({
      queryText: /*sql*/ `
        DROP TEMPORARY TABLE IF EXISTS groupMembers;

        -- Create table to get people data based on group and/or realm...CY
        CREATE TEMPORARY TABLE groupMembers(
          SELECT id, firstName, lastName, displayName
          FROM (
            ${
              nonRealmGroups.length
                ? /*sql*/ `
                  -- Gets all people from selected non-realm groups...KA
                  SELECT P.id, P.firstName, P.lastName, P.displayName
                  FROM people P
                  INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
                  INNER JOIN peopleGroups PG ON (PG.peopleId = P.id)
                  INNER JOIN groups G ON (PG.groupId = G.id
                    AND G.accountId = ${clientAccountId}
                    AND G.id IN (${nonRealmGroups})
                  )
                  WHERE P.id <> ${userId}
                    AND P.status = ${USER_STATUS.ACTIVE}
                    ${excludedRecipients.length ? `AND P.id NOT IN (${wambiDB.escapeValue(excludedRecipients)})` : ''}
                `
                : ''
            }

            -- Union if getting realm groups and nonRealm groups...CY
            ${realmGroups.length && nonRealmGroups.length ? 'UNION' : ''}

            ${
              realmGroups.length
                ? /*sql*/ `
                  -- Gets all people from selected realm groups...KA
                  SELECT P.id, P.firstName, P.lastName, P.displayName
                  FROM people P
                  INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
                  INNER JOIN peopleGroups PG ON (PG.peopleId = P.id)
                  INNER JOIN groupIndex GI ON (PG.groupid = GI.fromGroupId AND GI.groupId IN (${realmGroups}))
                  INNER JOIN groups G2 ON (G2.id = GI.groupId AND G2.accountId = ${clientAccountId})
                  WHERE P.id <> ${userId}
                    AND P.status = ${USER_STATUS.ACTIVE}
                    ${excludedRecipients.length ? `AND P.id NOT IN (${wambiDB.escapeValue(excludedRecipients)})` : ''}
                `
                : ''
            }
          ) AS memberUnionTable
          LIMIT ${LIMIT}
        );

        -- Get user name and image from temp table...CY
        SELECT DISTINCT GM.id,
          CONCAT(IFNULL(NULLIF(GM.displayName, ''), GM.firstName), ' ', GM.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MT.category, '/', MT.uid, '.', MT.ext),
            CONCAT(LEFT(IFNULL(NULLIF(GM.displayName, ''), GM.firstName), 1), LEFT(GM.lastName, 1))) AS thumbnailImage
        FROM groupMembers GM
        LEFT JOIN mediaLink MLT ON (GM.id = MLT.tableKey AND MLT.usage = 'thumbnail' AND MLT.tableName = 'people')
        LEFT JOIN media MT ON (MLT.mediaId = MT.id)
      `,
    })

    res.json({ success: true, groupMembers })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
