const { CPC_TYPES_STATUS, INSIGHT_STATUS, INSIGHT_TYPE } = require('../../utils/types')

const createInsight = async ({ accountId, status = INSIGHT_STATUS.ACTIVE, user, wambiDB }) => {
  const insightData = {
    accountId,
    content: 'This is an insight',
    peopleId: user.id,
    type: INSIGHT_TYPE.SEND_CPC,
    status,
  }

  const insertedInsight = await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      INSERT INTO insights
      SET ?
    `,
    params: [insightData],
  })

  // pull cpcTypes for insight links...CY
  const cpcType = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT id
      FROM cpcTypes
      WHERE accountId = ${accountId}
        AND status = ${CPC_TYPES_STATUS.ACTIVE}
    `,
  })

  const insightLink = {
    insightId: insertedInsight.insertId,
    tableName: 'cpcTypes',
    tableKey: cpcType.id,
    usage: 'trigger',
  }

  await wambiDB.executeNonQuery({
    commandText: /*sql*/ `
      INSERT INTO insightLinks
      SET ?
    `,
    params: [insightLink],
  })

  return { ...insightData, id: insertedInsight.insertId, links: [insightLink] }
}

module.exports = {
  createInsight,
}
