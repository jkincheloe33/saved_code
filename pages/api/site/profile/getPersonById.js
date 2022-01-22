const getPersonDetails = require('@serverHelpers/user/getDetails')

export default async (req, res) => {
  const {
    body: { personId },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const person = await getPersonDetails({ clientAccountId, userId: personId })
    res.json({ success: true, person })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Failed to get user' })
  }
}
