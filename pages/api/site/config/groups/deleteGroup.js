import deleteGroup from '@serverHelpers/groups/delete'

export default async (req, res) => {
  const {
    body: { deletingGroup, delTargetGroup },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const { msg, success } = await deleteGroup({
      clientAccountId,
      deletingGroup,
      delTargetGroup,
      req,
    })

    res.json({ msg, success })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
