import moveGroup from '@serverHelpers/groups/move'

export default async (req, res) => {
  const {
    body: { moveTargetGroup, movingGroup },
    clientAccount: { id: clientAccountId },
  } = req

  try {
    const { msg, newDepth, success } = await moveGroup({ clientAccountId, movingGroup, newParentGroup: moveTargetGroup, req })
    res.json({ msg, newDepth, success })
  } catch (error) {
    logServerError({ error, req })
    res.json({ msg: 'Error moving group', success: false })
  }
}
