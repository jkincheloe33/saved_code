import { INSIGHT_STATUS, INSIGHT_TYPE } from '@utils/types'

const imageRef = {
  [INSIGHT_TYPE.SEND_SPECIFIC_PEOPLE_CPC]: 'people',
}

// Create metadata to get images...CY
const _compileImageBundle = links => ({ id, type }) => {
  const insightType = Object.values(INSIGHT_TYPE).find(e => e === type)
  //Allow to render new insights or insights without images..CY
  if (insightType == null || imageRef[insightType] == null) return { tableName: null, tableKey: null, usage: null, insightId: null }
  const { tableKey, tableName } = links.find(({ insightId, usage }) => insightId === id && imageRef[insightType] === usage)
  return { tableName, tableKey, usage: 'thumbnail', insightId: id }
}

export default async (req, res) => {
  try {
    const {
      session: { userId },
      clientAccount: { id: clientAccountId },
    } = req

    let images = []
    const insightLifespan = 7

    // Expire old insight before getting list of insights...CY
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE insights
        SET expiredAt = CURRENT_TIMESTAMP,
          status = ${INSIGHT_STATUS.EXPIRED}
        WHERE peopleId = ${userId}
          AND accountId = ${clientAccountId}
          AND DATEDIFF(createdAt, CURRENT_TIMESTAMP) > ${insightLifespan}
      `,
    })

    // Use executeNonQuery here to read from the update above...EK
    const insights = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT id, content, type, actionText
        FROM insights
        WHERE peopleId = ${userId}
          AND accountId = ${clientAccountId}
          AND status = ${INSIGHT_STATUS.ACTIVE}
      `,
    })

    if (insights.length) {
      const links = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT insightId, tableName, tableKey, IL.usage
          FROM insightLinks IL
          WHERE insightId IN (?)
        `,
        params: [insights.map(({ id }) => id)],
      })

      const imageBundle = _compileImageBundle(links)
      const nonPeopleImageBundle = insights.map(imageBundle).filter(({ tableName }) => tableName !== 'people')
      const peopleImageBundle = insights.map(imageBundle).filter(({ tableName }) => tableName === 'people')

      // Get non people image...CY
      if (nonPeopleImageBundle.length > 0) {
        let imageData = []
        const insightWithImage = nonPeopleImageBundle.filter(({ tableName, tableKey, usage }) => tableName && tableKey && usage)

        const insightWithoutImage = nonPeopleImageBundle
          .filter(({ tableName, tableKey, usage }) => !(tableName && tableKey && usage))
          .map(({ notificationId }) => ({ image: null, notificationId }))

        if (insightWithImage.length) {
          imageData = await wambiDB.query({
            queryText: /*sql*/ `
              SELECT 
                ML.tableKey, ML.tableName, ML.usage,
                CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS image
              FROM mediaLink ML
              INNER JOIN media M ON (ML.mediaId = M.id)
              WHERE (ML.tableName, ML.tableKey, ML.usage) IN (?)
            `,
            params: [nonPeopleImageBundle.map(e => [e.tableName, e.tableKey, e.usage])],
          })
        }

        const nonPeopleImages = insightWithImage.map(({ insightId, tableKey, tableName, usage }) => ({
          insightId,
          image: imageData.find(e => e.tableKey === tableKey && e.tableName === tableName && e.usage === usage)?.image,
        }))

        images = [...images, ...nonPeopleImages, ...insightWithoutImage]
      }

      // Get people image or initials...CY
      if (peopleImageBundle.length > 0) {
        const imageData = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT P.id AS tableKey,
              IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS image
            FROM people P
            LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail')
            LEFT JOIN media M ON (ML.mediaId = M.id)
            WHERE P.id IN (?)
          `,
          params: [peopleImageBundle.map(e => [e.tableKey])],
        })

        const peopleImages = peopleImageBundle.map(({ insightId, tableKey }) => ({
          insightId,
          image: imageData.find(e => e.tableKey === tableKey)?.image,
        }))

        images = [...images, ...peopleImages]
      }

      insights.forEach(insight => {
        insight.links = links.filter(({ insightId }) => insight.id === insightId)
        insight.image = images.find(({ insightId }) => insight.id === insightId)?.image
      })
    }

    res.json({ success: true, insights })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to get list of insights' })
  }
}
