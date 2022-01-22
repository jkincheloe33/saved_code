const { getGroupWambis } = require('@serverHelpers/wambi')
const { getGroupPeople } = require('@serverHelpers/groupPeople')

export default async (req, res) => {
  try {
    const {
      body: { groupId, page = 0 },
      clientAccount: { id: clientAccountId },
    } = req

    const groups = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT DISTINCT G.id, GI.depth, G.name,
          CONCAT(LEFT(G.name, 1 )) AS thumbnailImage
        FROM groups G
        INNER JOIN groupIndex GI ON (G.id = GI.groupId AND GI.fromGroupId = ?)
        INNER JOIN groupTypes GT ON (GT.id = G.groupTypeId)
        WHERE G.accountId = ${clientAccountId}
        ORDER BY GI.depth DESC
      `,
      params: [groupId],
    })

    const groupInfo = {
      groupName: groups.length > 1 ? groups[1].name : groups[0].name,
      id: groups[0].id,
      name: groups[0].name,
      thumbnailImage: groups[0].thumbnailImage,
      type: 'group',
    }

    const { cpcList, success: groupCpcSuccess } = await getGroupWambis({
      clientAccountId,
      groupId,
      limit: 2,
      page,
      req,
    })

    if (!groupCpcSuccess) return res.json({ success: false, msg: 'Error getting group profile' })

    const { personList } = await getGroupPeople({
      clientAccountId,
      groupId,
      limit: 10,
      page,
    })

    res.json({ success: true, groupInfo, cpc: cpcList, personList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
