const { defaultLanguages, FEED_ITEM_STATUS, GROUP_ACCESS_LEVELS, LANGUAGE_TYPE } = require('@utils')
import { getAccountLanguageByType } from '../language'

const getWambis = async ({ clientAccountId, isMe, limit, page = 0, type, userId, userSessionId }) => {
  // If the user views another profile, FI.cpcId will limit the cpcs to only those that are public...PS

  let cpc = null
  let receivedCPCs = null
  let sentCPCs = null

  // Set full access if its your profile, and check other permissions below..CY/JC
  let hasFullAccess = isMe

  const patientLanguage =
    (await getAccountLanguageByType({ clientAccountId, type: LANGUAGE_TYPE.PATIENT })) ?? defaultLanguages[LANGUAGE_TYPE.PATIENT]

  if (!hasFullAccess) {
    const hasWambiGroupAccess = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1
        -- Calculate the owned realm(s) groups for the person running the query
        FROM peopleGroups PG
        INNER JOIN groupIndex GI ON (PG.groupId = GI.groupId AND PG.peopleId = ? AND PG.level > ${GROUP_ACCESS_LEVELS.TEAM_MEMBER})
        INNER JOIN groups G ON (GI.fromGroupId = G.id AND G.accountId = ?)
        -- See if the person who's profile we are viewing is within the realm defined above...EK
        INNER JOIN peopleGroups PG2 ON (PG2.groupId = G.id AND PG2.peopleId = ?)
      `,
      params: [userSessionId, clientAccountId, userId],
    })
    hasFullAccess = Boolean(hasWambiGroupAccess)
  }

  // Allow senders, recipients, and users looking at their own profile/users with group access to view private Wambis, otherwise only visible...JC
  const whereClause = `AND IF(
    SP.id = ${userSessionId}
      OR RP.id = ${userSessionId}
      OR ${hasFullAccess},
    FI.status <> ${FEED_ITEM_STATUS.HIDDEN},
    FI.status = ${FEED_ITEM_STATUS.VISIBLE}
  )`

  if (type === 'received' || type === 'both') {
    // get received CPCs..PS
    receivedCPCs = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT C.id, C.content, C.createdAt, FI.id AS feedId, FI.status,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
            CONCAT(LEFT(IFNULL(NULLIF(SP.displayName, ''), SP.firstName), 1), LEFT(SP.lastName, 1))) AS authorImg,
          IFNULL(CONCAT(IFNULL(NULLIF(SP.displayName, ''), SP.firstName), ' ', SP.lastName), '${patientLanguage}') AS sender,
          CONCAT(IFNULL(NULLIF(RP.displayName, ''), RP.firstName), ' ', RP.lastName) AS recipient,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner
        FROM cpc C
        LEFT JOIN people SP ON (SP.id = C.senderId)
        INNER JOIN feedItems FI ON (FI.cpcId = C.id)
        INNER JOIN feedPeople FP ON (FP.feedId = FI.id AND FP.peopleId = ${userId})
        INNER JOIN people RP ON (RP.id = FP.peopleId)
        LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'banner')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN mediaLink MLA ON (SP.id = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
        LEFT JOIN media MA ON (MLA.mediaId = MA.id)
        WHERE C.accountId = ${clientAccountId}
          ${whereClause}
        ORDER BY C.createdAt DESC
        LIMIT ?, ?
      `,
      params: [page * limit, limit],
    })

    if (receivedCPCs.length) {
      const recipientList = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT COUNT(peopleId) count, feedId
          FROM feedPeople
          WHERE feedId IN (${receivedCPCs.map(({ feedId }) => feedId)})
          GROUP BY feedId
        `,
      })

      receivedCPCs.forEach(cpc => (cpc.recipientCount = recipientList.find(({ feedId }) => feedId === cpc.feedId)?.count))
    }
  }

  if (type === 'sent' || type === 'both') {
    // get sent CPCs...PS
    sentCPCs = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT C.id, C.content, C.createdAt, C.senderId, FI.id AS feedId, FI.status,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MA.category, '/', MA.uid, '.', MA.ext),
            CONCAT(LEFT(IFNULL(NULLIF(SP.displayName, ''), SP.firstName), 1), LEFT(SP.lastName, 1))) AS authorImg,
          IFNULL(CONCAT(IFNULL(NULLIF(SP.displayName, ''), SP.firstName), ' ', SP.lastName), '${patientLanguage}') AS sender,
          CONCAT(IFNULL(NULLIF(RP.displayName, ''), RP.firstName), ' ', RP.lastName) AS recipient,
          CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS banner,
          CF.recipientCount
        FROM (
          SELECT C.id, COUNT(FP.id) AS recipientCount, MIN(FP.peopleId) AS recipientId
          FROM cpc C
          INNER JOIN feedItems FI ON (FI.cpcId = C.id)
          INNER JOIN feedPeople FP ON (FP.feedId = FI.id)
          WHERE C.senderId = ${userId}
          GROUP BY C.id
          ORDER BY C.createdAt DESC
        ) CF
        INNER JOIN cpc C ON (CF.id = C.id)
        INNER JOIN people SP ON (SP.id = C.senderId)
        INNER JOIN people RP ON (RP.id = CF.recipientId)
        INNER JOIN feedItems FI ON (FI.cpcId = C.id)
        LEFT JOIN mediaLink ML ON (FI.id = ML.tableKey AND ML.tableName = 'feedItems' AND ML.usage = 'banner')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        LEFT JOIN mediaLink MLA ON (SP.id = MLA.tableKey AND MLA.tableName = 'people' AND MLA.usage = 'thumbnail')
        LEFT JOIN media MA ON (MLA.mediaId = MA.id)
        WHERE C.accountId = ${clientAccountId}
          ${whereClause}
        LIMIT ?, ?
      `,
      params: [page * limit, limit],
    })
  }

  // combine both query results...PS
  if (type === 'both') {
    cpc = receivedCPCs
      .concat(sentCPCs)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
  } else if (type === 'sent') {
    cpc = sentCPCs
  } else if (type === 'received') {
    cpc = receivedCPCs
  }

  return { success: true, cpc }
}

module.exports = getWambis
