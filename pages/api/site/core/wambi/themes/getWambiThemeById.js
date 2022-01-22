const { CPC_TYPES_STATUS } = require('@utils/types')

export default async (req, res) => {
  const {
    body: { cpcThemeId },
    clientAccount: { id: clientAccountId },
    session: { userId: userSessionId },
  } = req

  try {
    const theme = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT CTH.description, CTH.id, CTH.name
        FROM cpcThemes CTH
        INNER JOIN cpcTypes CT ON (CTH.id = CT.cpcThemeId
          AND CT.status = ${CPC_TYPES_STATUS.ACTIVE}
          AND IFNULL(CT.startDate, CURDATE()) <= CURDATE()
          AND IFNULL(CT.endDate, CURDATE()) >= CURDATE()
        )
        INNER JOIN peopleGroups PG ON (PG.peopleId = ${userSessionId} AND PG.level >= CT.whoCanSend)
        INNER JOIN mediaLink ML ON (CT.id = ML.tableKey)
        WHERE CTH.accountId = ${clientAccountId} AND CTH.id = ?
      `,
      params: [cpcThemeId],
    })

    res.json({ success: true, theme })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
