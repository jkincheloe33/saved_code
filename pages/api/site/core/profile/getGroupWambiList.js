const { getGroupWambis } = require('@serverHelpers/wambi')

export default async (req, res) => {
  let {
    clientAccount: { id: clientAccountId },
    body: { groupId, page },
  } = req

  try {
    const { cpcList } = await getGroupWambis({
      clientAccountId,
      groupId,
      limit: 20,
      page,
      req,
    })

    res.json({ success: true, cpc: cpcList })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'An error occurred. Check system logs for details.' })
  }
}
