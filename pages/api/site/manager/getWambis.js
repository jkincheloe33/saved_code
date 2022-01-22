import { createSortClauseFromModel, createWhereFromFilter } from '@serverHelpers/gridFilters'
import { getAccountLanguageByType } from '@serverHelpers/language'
import { defaultLanguages, FEED_ITEM_STATUS, GROUP_ACCESS_LEVELS as levels, LANGUAGE_TYPE } from '@utils'

export default async (req, res) => {
  try {
    const {
      body: { dropdownFilter, endRow = 25, gridFilter = {}, groupFilter, sort = [], startRow = 0 },
      clientAccount: { id: clientAccountId },
      session: { userId: userSessionId },
    } = req

    const patientLanguage =
      (await getAccountLanguageByType({ clientAccountId, type: LANGUAGE_TYPE.PATIENT })) ?? defaultLanguages[LANGUAGE_TYPE.PATIENT]

    // Dropdown filter clauses...JC
    const whereClause = () => {
      switch (dropdownFilter) {
        case patientLanguage:
          return 'AND PS.firstName IS NULL'
        case 'Team Member':
          return 'AND PS.firstName IS NOT NULL'
        case 'Group':
          return 'AND FP.recipientCount > 1'
        case 'Individual':
          return 'AND FP.recipientCount = 1'
        default:
          return ''
      }
    }

    // Built in grid column filter clauses...JC
    const sortClause = createSortClauseFromModel(sort)
    const gridHavingClause = createWhereFromFilter(gridFilter)

    // Gets user realm group ids. Group filter limits the groups to the realm of the filtered groups only...JC
    let realmGroupIds = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT GI.fromGroupId AS groupId
        FROM (
          SELECT DISTINCT GI.fromGroupId
            FROM peopleGroups PG
            INNER JOIN groups G ON (PG.groupId = G.id AND G.accountId = ${clientAccountId})
            INNER JOIN groupIndex GI ON (G.id = GI.groupId)
            WHERE PG.peopleId = ${userSessionId}
              AND PG.level > ${levels.TEAM_MEMBER}
          ) GI
        INNER JOIN groupIndex GI2 ON (GI.fromGroupId = GI2.fromGroupId ${
          groupFilter?.length ? `AND GI2.groupId IN (${wambiDB.escapeValue(groupFilter)})` : ''
        })
      `,
    })

    if (!realmGroupIds.length) return res.json({ success: false, msg: 'User does not own any groups for this account' })

    realmGroupIds = realmGroupIds.map(rg => rg.groupId)

    const dateFilter = 'DATE_ADD(CURRENT_DATE, INTERVAL -7 DAY)'

    const { results, fields } = await wambiDB.queryWithFields({
      queryText: /*sql*/ `
        SELECT
          I.feedId, FI.cpcId,
          FI.createdAt 'Sent',
          FI.status,
          IFNULL(CONCAT(IFNULL(NULLIF(PS.displayName, ''), PS.firstName), ' ', PS.lastName), '${patientLanguage}') 'Sender',
          FI.content 'Message',
          FP.Recipient,
          FP.recipientCount
        FROM (
          SELECT FG.feedId
          FROM peopleGroups PG
          INNER JOIN groupIndex GI ON (PG.peopleId = ${userSessionId} AND PG.groupId = GI.groupId)
          INNER JOIN groups G ON (GI.fromGroupId = G.id AND G.accountId = ${clientAccountId})
          INNER JOIN feedGroups FG ON (G.id = FG.groupId ${
            realmGroupIds?.length ? `AND FG.groupId IN (${wambiDB.escapeValue(realmGroupIds)})` : ''
          })
          INNER JOIN feedItems FI ON (FG.feedId = FI.id AND FI.createdAt > ${dateFilter})
          GROUP BY FG.feedId
        ) I
        INNER JOIN feedItems FI ON (I.feedId = FI.id)
        LEFT JOIN people PS ON (FI.authorId = PS.id)
        INNER JOIN (
          SELECT FP.feedId, IF(FP.recipientCount > 1, 'Group', CONCAT(IFNULL(NULLIF(PR.displayName, ''), PR.firstName), ' ', PR.lastName)) 'Recipient', FP.recipientCount
          FROM (
            SELECT FP.feedId, MIN(FP.peopleId) recipientId, COUNT(FP.id) recipientCount
            FROM feedPeople FP
            INNER JOIN (
              SELECT FG.feedId
              FROM peopleGroups PG
              INNER JOIN groupIndex GI ON (PG.peopleId = ${userSessionId} AND PG.groupId = GI.groupId)
              INNER JOIN groups G ON (GI.fromGroupId = G.id AND G.accountId = ${clientAccountId})
              INNER JOIN feedGroups FG ON (G.id = FG.groupId ${
                realmGroupIds?.length ? `AND FG.groupId IN (${wambiDB.escapeValue(realmGroupIds)})` : ''
              })
              INNER JOIN feedItems FI ON (FG.feedId = FI.id AND FI.createdAt > ${dateFilter})
              GROUP BY FG.feedId
            ) FI ON (FP.feedId = FI.feedId)
            GROUP BY FP.feedId
          ) FP
          INNER JOIN people PR ON (FP.recipientId = PR.id)
        ) FP ON (I.feedId = FP.feedId)
        WHERE FI.status <> ${FEED_ITEM_STATUS.HIDDEN}
        ${whereClause()}
        GROUP BY FI.cpcId
        ${gridHavingClause && `HAVING ${gridHavingClause}`}
        ORDER BY ${sortClause ? sortClause : 'FI.createdAt DESC'}
        LIMIT ?, ?
      `,
      params: [startRow, endRow],
    })

    res.json({ success: true, cpcs: results, fields })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
