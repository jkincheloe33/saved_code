const { CPC_TYPES_STATUS, CPC_TYPES_WHO_CAN_SEND, USER_STATUS } = require('../../utils/types')

const getCreateWambiData = async ({ accountId, user, wambiDB }) => {
  // Get data need to generate a Wambi...CY
  const getPeopleId = wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT PG.peopleId FROM (
        SELECT GI.groupId
        FROM peopleGroups PG
        INNER JOIN groupIndex GI ON (GI.fromGroupId = PG.groupId)
        INNER JOIN people P ON (PG.peopleId = P.id AND P.status = ${USER_STATUS.ACTIVE})
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${accountId})
        WHERE PG.peopleId = ${user.id}
      ) G
      INNER JOIN peopleGroups PG WHERE (G.groupId = PG.groupId AND PG.peopleId <> ${user.id})
    `,
  })

  const getBanner = wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT id FROM media
      WHERE accountId = ${accountId}
        AND category = 'cpc/banner'
    `,
  })

  const getWambiTypes = wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT id FROM cpcTypes
      WHERE accountId = ${accountId}
        AND endDate IS NULL
        AND status = ${CPC_TYPES_STATUS.ACTIVE}
        AND whoCanSend > ${CPC_TYPES_WHO_CAN_SEND.ANYONE}
    `,
  })

  const getWambiValue = wambiDB.query({
    queryText: /*sql*/ `
      SELECT id
      FROM clientValues
      WHERE accountId = ${accountId}
    `,
  })

  const [peopleId, mediaId, cpcTypeId, values] = (
    await Promise.all([getPeopleId, getBanner, getWambiTypes, getWambiValue])
  ).flatMap(value => Object.values(value))

  return {
    peopleId,
    mediaId,
    cpcTypeId,
    values,
  }
}

const getWambiIds = async ({ newFeedId, wambiDB }) => {
  const { cpcId } = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT cpcId
      FROM feedItems
      WHERE id = ${newFeedId}
    `,
  })

  return {
    cpcId,
    newFeedId,
  }
}

module.exports = {
  getCreateWambiData,
  getWambiIds,
}
