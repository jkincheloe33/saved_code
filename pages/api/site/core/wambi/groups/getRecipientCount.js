import { USER_STATUS } from '@utils/types'

export default async (req, res) => {
  try {
    let {
      body: { excludedRecipients = [], groups = [], recipients = [] },
      clientAccount: { id: clientAccountId },
      session: { userId },
    } = req

    if (!groups.length) return res.json({ success: false, msg: 'No groups provided' })

    // Also exclude selected recipients from query so we don't pull them again...JC
    excludedRecipients = [...excludedRecipients, ...recipients.map(({ id }) => id)]
    const exclusionClause = excludedRecipients.length ? `AND P.id NOT IN (${wambiDB.escapeValue(excludedRecipients)})` : ''

    const groupList = groups.filter(g => !g.isRealm).map(({ id }) => id)
    const realmGroupList = groups.filter(g => g.isRealm).map(({ id }) => id)

    const peopleJoin = `
      INNER JOIN people P ON (P.id = PG.peopleId
        AND P.status = ${USER_STATUS.ACTIVE}
        AND P.id <> ${userId}
          ${exclusionClause}
      )
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId
        AND CAP.accountId = ${clientAccountId}
        AND CAP.isIncognito = 0
      )
    `

    // Remove duplicates and compare users in realm groups and groups...CY
    const { groupRecipientCount } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT COUNT(peopleId) AS groupRecipientCount
        FROM (
          -- Pull people from groups...CY
          SELECT PG.peopleId
          FROM peopleGroups PG
          INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
          ${peopleJoin}
          WHERE PG.groupId IN (?)

          UNION

          -- Pull people from realm groups...CY
          SELECT PG.peopleId
          FROM peopleGroups PG
          INNER JOIN groupIndex GI ON (PG.groupId = GI.fromGroupId AND GI.groupId IN (?))
          INNER JOIN groups G ON (G.id = GI.groupId AND G.accountId = ${clientAccountId})
          ${peopleJoin}
        ) AS totalRecipientCount
      `,
      params: [groupList.length ? groupList : 0, realmGroupList.length ? realmGroupList : 0],
    })

    res.json({ groupRecipientCount, success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
