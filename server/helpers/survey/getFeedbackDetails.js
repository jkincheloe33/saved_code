const { selectLeaderPeople } = require('@serverHelpers/query/selectLeaderPeople')

module.exports = {
  getFeedbackDetails: async ({ clientAccountId, req, surveyId, updatedFeedback, userId }) => {
    try {
      // Avoid expensive join if we already checked this when updating feedback..JC
      const getLeaderPeopleJoin = !updatedFeedback
        ? `INNER JOIN (
            ${selectLeaderPeople({ clientAccountId, userId })}
          ) PM ON (S.peopleId = PM.id)`
        : ''

      const [surveyInfo] = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          SELECT S.id, S.comment, S.followUpStatus, S.followUpAt, S.createdAt, S.mobile, S.email,
          CONCAT(S.firstName, ' ', S.lastName) AS reviewerName,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS recipientName,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
              CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS recipientImage,
          CONCAT(IFNULL(NULLIF(PF.displayName, ''), PF.firstName), ' ', PF.lastName) AS followUpBy,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MF.category, '/', MF.uid, '.', MF.ext),
              CONCAT(LEFT(IFNULL(NULLIF(PF.displayName, ''), PF.firstName), 1), LEFT(PF.lastName, 1))) AS followUpByImage,
          IFNULL(NULLIF(P.jobTitleDisplay, ''), P.jobTitle) AS jobTitle
          FROM surveys S
          INNER JOIN people P ON (S.peopleId = P.id)
          LEFT JOIN people PF ON (S.followUpBy = PF.id)
          ${getLeaderPeopleJoin}
          LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
          LEFT JOIN media M ON (ML.mediaId = M.id) 
          LEFT JOIN mediaLink MLF ON (PF.id = MLF.tableKey AND MLF.usage = 'thumbnail' AND MLF.tableName = 'people')
          LEFT JOIN media MF ON (MLF.mediaId = MF.id) 
          WHERE S.id = ? 
            AND S.accountId = ${clientAccountId}
          GROUP BY S.id
        `,
        params: [surveyId],
      })

      if (surveyInfo) {
        const responses = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            SELECT SR.questionId, SR.rating, QSI.question
            FROM surveyResponses SR
            INNER JOIN questionSetItems QSI ON (QSI.id = SR.questionId)
            WHERE SR.surveyId = ?
            ORDER BY QSI.order ASC
          `,
          params: [surveyId],
        })

        const notes = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            SELECT SN.id, SN.note, SN.createdAt,
            CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS authorName,
            IFNULL(
              CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext),
              CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))
            ) AS authorImage
            FROM surveyNotes SN
            INNER JOIN people P ON (SN.authorId = P.id)
            LEFT JOIN mediaLink ML ON (P.id = ML.tableKey AND ML.usage = 'thumbnail' AND ML.tableName = 'people')
            LEFT JOIN media M ON (ML.mediaId = M.id)
            WHERE SN.surveyId = ?
            ORDER BY SN.createdAt ASC
          `,
          params: [surveyId],
        })

        return { success: true, surveyDetails: { ...surveyInfo, notes, responses } }
      }

      return { success: false, msg: 'Error getting survey details' }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of getFeedbackDetails', error, req })
      return { success: false, msg: 'Error occurred; check server logs.' }
    }
  },
}
