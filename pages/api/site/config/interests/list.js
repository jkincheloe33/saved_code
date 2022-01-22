export default async (req, res) => {
  let interestsForAccount = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT I.*, count(PI.peopleId) as members, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS icon
      FROM interests I
      LEFT JOIN peopleInterests PI on (I.id = PI.interestId)
      LEFT JOIN mediaLink ML ON (I.id = ML.tableKey AND ML.tableName = 'interests' AND ML.usage = 'icon')
      LEFT JOIN media M ON (ML.mediaId = M.id)
      WHERE I.accountId = ?
      GROUP BY I.id
    `,
    params: [req.clientAccount.id],
  })

  res.json(interestsForAccount)
}
