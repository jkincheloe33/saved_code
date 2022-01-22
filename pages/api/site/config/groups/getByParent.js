export default async (req, res) => {
  const {
    body: { parentGroupId },
    clientAccount,
  } = req

  try {
    let childGroups

    if (parentGroupId != null) {
      childGroups = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          SELECT G.*, COUNT(CG.id) AS childCount,
            IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), LEFT(G.name, 1)) AS originalImage
          FROM groups G
          LEFT JOIN groups CG ON (G.id = CG.parentGroupId)
          LEFT JOIN mediaLink ML ON (ML.tableKey = G.id AND ML.tableName = 'groups' AND ML.usage = 'thumbnail')
          LEFT JOIN media M ON (M.id = ML.mediaId)
          WHERE G.parentGroupId = ?
            AND G.accountId = ${clientAccount.id}
          GROUP BY G.id
          ORDER BY G.name ASC
        `,
        params: [parentGroupId],
      })
    } else {
      childGroups = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          SELECT G.*, COUNT(CG.id) AS childCount,
            IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext), LEFT(G.name, 1)) AS originalImage
          FROM groups G
          LEFT JOIN groups CG ON (G.id = CG.parentGroupId)
          LEFT JOIN mediaLink ML ON (ML.tableKey = G.id AND ML.tableName = 'groups' AND ML.usage = 'original')
          LEFT JOIN media M ON (M.id = ML.mediaId)
          WHERE G.parentGroupId IS NULL
            AND G.accountId = ${clientAccount.id}
          GROUP BY G.id
          ORDER BY G.name ASC
        `,
      })
    }

    res.json({ success: true, childGroups })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
