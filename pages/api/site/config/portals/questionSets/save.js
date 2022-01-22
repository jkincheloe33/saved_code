import { recordAuditTrail } from '@serverHelpers/auditTrail'

export default async (req, res) => {
  const { order, portalQuestionSetId } = req.body
  try {
    const updateRes = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE portalQuestionSets PQS
        INNER JOIN portals P ON (P.id = PQS.portalId AND P.accountId = ?)
        SET PQS.order = ? 
        WHERE PQS.id = ?
      `,
      params: [req.clientAccount.id, order, portalQuestionSetId],
    })

    if (updateRes.changedRows === 1) {
      recordAuditTrail(req.session.userId, 'update', 'portalQuestionSets', portalQuestionSetId, { order })
    }

    res.json({ success: updateRes.changedRows === 1 })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
