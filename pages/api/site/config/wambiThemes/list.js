import { CPC_TYPES_STATUS } from '@utils'

export default async (req, res) => {
  const {
    clientAccount: { id: clientAccountId },
  } = req
  try {
    const themes = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT CT.id, CT.name, CT.description, CT.order, CT.limitToHotStreak,
          COUNT(CTT.id) AS typesCount
        FROM cpcThemes CT
        LEFT JOIN cpcTypes CTT ON (CTT.cpcThemeId = CT.id AND CTT.status = ${CPC_TYPES_STATUS.ACTIVE})
        WHERE CT.accountId = ${clientAccountId}
        GROUP BY CT.id
        ORDER BY CT.order
      `,
    })

    res.json({ success: true, themes })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
