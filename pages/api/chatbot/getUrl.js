// This is the 2nd endpoint chatbot users hit to create or update a chatbot session, and create a portal link...JC
import { v4 as uuidv4 } from 'uuid'
import { USER_STATUS } from '@utils'

export default async (req, res) => {
  try {
    let { chatCode, chatNameFilter, mobile, portalShortUid } = req.body
    chatCode = chatCode.trim()

    // Create a new chatBotSession everytime a chatbot user gets a URL...JC
    const newChatBotSession = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO chatBotSessions (chatCode, mobile, personName)
        VALUES (?, ?, ?)
      `,
      params: [chatCode, mobile, chatNameFilter],
    })

    const portalAccount = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT CA.host, P.accountId
        FROM portals P
        INNER JOIN clientAccounts CA ON (P.accountId = CA.id)
        WHERE P.shortUid = ?
      `,
      params: [portalShortUid],
    })

    if (portalAccount == null) {
      return res.json({ success: false, msg: 'Missing or invalid portal shortUid' })
    }

    let trackedUser = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT *
        FROM reviewers
        WHERE mobile = ?
          AND accountId = ${portalAccount.accountId}
      `,
      params: [mobile],
    })

    if (!trackedUser) {
      // User is not tracked and hasn't used bot before. Track them...JC
      trackedUser = {
        chatCode,
        mobile,
      }
      const shortUid = uuidv4().split('-').reverse()[0]

      // Save tracked user..JC
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO reviewers (accountId, chatCode, chatNameFilter, mobile, shortUid, lastChatSessionId)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        params: [portalAccount.accountId, chatCode, chatNameFilter, mobile, shortUid, newChatBotSession.insertId],
      })

      trackedUser.shortUid = shortUid
    } else {
      let userLinkedToMobile = false
      if (!trackedUser.peopleId) {
        // If user is linked to that mobile, set their reviewer record to use that peopleId...JC
        userLinkedToMobile = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT P.id
            FROM people P
            INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${portalAccount.accountId})
            WHERE mobile = ?
              AND P.status = ${USER_STATUS.ACTIVE}
              AND P.isSelfRegistered = 0
          `,
          params: [mobile],
        })
      }

      const updateData = {
        lastChatSessionId: newChatBotSession.insertId,
        chatCode,
        chatNameFilter,
        expired: 0,
        mobile,
        ...(userLinkedToMobile && { isVolunteer: 0, peopleId: userLinkedToMobile.id }),
      }

      if (trackedUser && !trackedUser.shortUid) {
        const shortUid = uuidv4().split('-').reverse()[0]
        updateData.shortUid = shortUid
        trackedUser.shortUid = shortUid
      }

      // Update tracked user...JC
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE reviewers
          SET ?
          WHERE id = ?
        `,
        params: [updateData, trackedUser.id],
      })
    }

    res.json({
      success: true,
      // Note: The portalUrl host is calculated not from the req origin because the wambi bot only calls a base non-client account specific DNS...EK
      portalUrl: `${portalAccount.host.includes('localhost:30') ? 'http://' : 'https://'}${
        portalAccount.host
      }/api/site/portal?id=${portalShortUid}&sid=${trackedUser.shortUid}`,
    })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
