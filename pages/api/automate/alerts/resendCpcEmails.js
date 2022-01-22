// import { USER_NOTIFY_METHODS } from '@utils'
// import { sendGroupCpcFromManager_Email } from '@serverHelpers/email'

export default async (req, res) => {
  // let {
  //   clientAccount: { host, id: clientAccountId },
  // } = req

  try {
    // TEMP TO PREVENT ACCIDENTALLY CALLING...EK
    return res.json({ msg: 'Still hardcoded', success: false })

    // // This is the feed id that triggered the notif...EK
    // const newFeedId = 607692

    // // This is the sender user id
    // const userId = 84364

    // const { content: message } = await wambiDB.querySingle({
    //   queryText: /*sql*/ `
    //     SELECT id, content
    //     FROM feedItems
    //     WHERE id = ?
    //   `,
    //   params: [newFeedId],
    // })

    // const notifData = await wambiDB.query({
    //   queryText: /*sql*/ `
    //     SELECT PR.id,
    //       CONCAT(IFNULL(NULLIF(PR.displayName, ''), PR.firstName), ' ', PR.lastName) AS recipientName,
    //       IF(PR.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.EMAIL_ONLY}), PR.email, NULL) AS email,
    //       CONCAT(IFNULL(NULLIF(PS.displayName, ''), PS.firstName), ' ', PS.lastName) AS senderName
    //     FROM people PS
    //     INNER JOIN clientAccountPeople CAP ON (PS.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
    //     LEFT JOIN people PR ON (PR.id IN (SELECT peopleId FROM feedPeople WHERE feedId = ?))
    //     WHERE PS.id = ${userId}
    //   `,
    //   params: [newFeedId],
    // })

    // const cpcUrl = `https://${host}/newsfeed?feedId=${newFeedId}`

    // const emailData = {
    //   cpcContent: message.split(' ').length > 5 ? `"${message.split(' ').slice(0, 5).join(' ')}..."` : `"${message}"`,
    //   cpcUrl,
    //   email: notifData.map(({ email }) => email).join(','),
    //   senderName: 'HMH Culture Team',
    // }

    // await sendGroupCpcFromManager_Email(emailData)
    // res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Check server logs' })
  }
}
