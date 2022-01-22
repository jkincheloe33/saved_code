import { PEOPLE_GROUP_PRIMARY_TYPES } from '@utils'

// Gets the groups that the employee is in..JC
export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      query: { employeeId, groupId },
    } = req

    const groups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT G.*,
          PG.isPrimary
        FROM groups G
        INNER JOIN peopleGroups PG ON (PG.groupId = G.id
          AND PG.peopleId = ?
          AND PG.isPrimary <> ${PEOPLE_GROUP_PRIMARY_TYPES.ORG}
        )
        WHERE G.id IN (
          SELECT GI.fromGroupId
          FROM groupIndex GI
          WHERE GI.groupId = ?
        ) 
          AND G.accountId = ${clientAccountId}
          AND G.hideFromPortal = 0
      `,
      params: [employeeId, groupId],
    })

    res.json({ groups, success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
