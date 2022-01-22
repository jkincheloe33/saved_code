const { getGroupPeople } = require('@serverHelpers/groupPeople')

export default async (req, res) => {
  const {
    body: { groupId, page },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const { personList } = await getGroupPeople({
      clientAccountId,
      groupId,
      limit: 10,
      page,
    })

    res.json({ success: true, personList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
