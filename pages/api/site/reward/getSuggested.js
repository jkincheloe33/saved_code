import { getLocations } from '@serverHelpers/people'
const { USER_STATUS } = require('@utils/types')

const LIMIT = 3

// returns a max of ${limit} users in your group who haven't logged in the longest or at all...JK
export default async (req, res) => {
  try {
    const {
      body: { giftId },
      clientAccount,
      session: { userId },
    } = req

    // check if gift belongs to a group...PS
    const giftGroups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT groupId
        FROM rewardGiftGroups
        WHERE rewardGiftId = ?
      `,
      params: [giftId],
    })

    // Link by users in realm of reward groups...JC
    const giftGroupPeopleJoin = `
      INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
      INNER JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId AND GI.groupId IN (${giftGroups.map(g => g.groupId)}))
    `

    // Link by users with the same groups as my people groups...JC
    const myGroupPeopleJoin = `
      LEFT JOIN peopleGroups MYPG ON (MYPG.peopleId = ${userId})
      INNER JOIN peopleGroups PG ON (PG.groupId = MYPG.groupId AND P.id = PG.peopleId)
    `

    const suggestedPeople = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, IFNULL(NULLIF(P.jobTitleDisplay, ''), P.jobTitle) AS jobTitle,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccount.id} AND CAP.isIncognito = 0)
        ${giftGroups.length ? giftGroupPeopleJoin : myGroupPeopleJoin}
        LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
        LEFT JOIN media M ON (ML.mediaId = M.id)
        WHERE P.id <> ${userId}
          AND P.status = ${USER_STATUS.ACTIVE}
          AND P.isSelfRegistered = 0
        GROUP BY P.id
        ORDER BY P.lastLoginAt, name ASC
        LIMIT ${LIMIT}
      `,
    })

    if (suggestedPeople.length) {
      const locations = await getLocations(
        clientAccount,
        suggestedPeople.map(p => p.id),
        userId
      )

      // if locations was successful, match each person to their groupName
      // locations array always matches order of ids in suggestedPeople array...JK
      if (locations?.success) locations.groupNames.forEach((location, i) => (suggestedPeople[i].groupName = location.groupName))

      suggestedPeople.forEach(sl => (sl.isEligible = true))
    }

    res.json({ success: true, suggestedPeople })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
