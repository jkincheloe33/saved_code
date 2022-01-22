const pageLimit = 5
const { CPC_TYPES_STATUS } = require('@utils/types')

export default async (req, res) => {
  const {
    body: { page },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const themes = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT CTH.description, CTH.id, CTH.name
        FROM cpcThemes CTH
        INNER JOIN cpcTypes CT ON (CTH.id = CT.cpcThemeId AND CT.status = ${CPC_TYPES_STATUS.ACTIVE})
        INNER JOIN mediaLink ML ON (CT.id = ML.tableKey)
        WHERE CTH.accountId = ${clientAccountId}
        GROUP BY CTH.id
        ORDER BY CTH.order
        LIMIT ?, ?
      `,
      params: [page * pageLimit, pageLimit],
    })

    res.json({ success: true, themes })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
