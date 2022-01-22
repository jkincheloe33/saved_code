import { CPC_TYPES_STATUS, CPC_TYPES_WHO_CAN_SEND } from '@utils'

const getRandomImageForPortal = async (clientAccountId, previousId) => {
  const image = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT M.id,
        CONCAT('${process.env.MEDIA_CDN}/', category, '/', uid, '.', ext) AS src,
        CT.id AS cpcTypeId
      FROM media M
      INNER JOIN mediaLink ML ON (ML.mediaId = M.id AND ML.tableName = 'cpcTypes' AND ML.usage = 'banner')
      INNER JOIN cpcTypes CT ON (
        CT.id = ML.tableKey
        AND CT.whoCanSend IN (${CPC_TYPES_WHO_CAN_SEND.ANYONE}, ${CPC_TYPES_WHO_CAN_SEND.REVIEWER})
        AND CT.status = ${CPC_TYPES_STATUS.ACTIVE}
      )
      WHERE M.accountId = ${clientAccountId}
        AND M.category = 'cpc/banner'
        AND M.id <> ?
      ORDER BY RAND()
      LIMIT 1
    `,
    params: [previousId],
  })

  if (image) return { success: true, image }
  return { success: false, msg: 'No image found.' }
}

module.exports = getRandomImageForPortal
