import { signJwt } from '@serverHelpers/security'
import { redirectRequest } from '@serverHelpers/responses'
import { setCookie } from '@utils'

// Our chatbot portal 'routing' endpoint that issues a review token before re-routing to portal page...JC
const reviewTokenDuration = '1h'

export default async (req, res) => {
  try {
    const {
      query: { id, sid },
    } = req

    let location = `${req.headers.origin}/portal?id=${id}`

    // Using executeNonQuery because of a timing issue after getUrl hits write db...KA
    const reviewer = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT id, chatNameFilter, lastChatSessionId, isVolunteer, peopleId
        FROM reviewers
        WHERE shortUid = ?
          AND expired = 0
      `,
      params: [sid],
    })

    if (reviewer.length) {
      const { chatNameFilter: name, isVolunteer } = reviewer[0]

      const reviewTkn = signJwt(
        {
          r: [reviewer[0].id, reviewer[0].lastChatSessionId],
        },
        reviewTokenDuration
      )

      setCookie({ res, token: reviewTkn, tokenAlias: 'review_tkn' })

      // Update to expired on a delay. On mobile users can tap the link to load a preview screen, which hits this endpoint.
      // We need to prevent expiring the link until they fully enter the app and bypass verification...JC
      setTimeout(() => {
        wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            UPDATE reviewers
            SET expired = 1
            WHERE shortUid = ?
          `,
          params: [sid],
        })
      }, 30000)

      // Redirect chatbot user to portal page with portalshortUid...JC
      if (name) location += `&name=${name}`
      if (isVolunteer) location += '&isVolunteer=true'

      redirectRequest({ res, location })
    } else {
      redirectRequest({ res, location })
    }
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false, msg: 'Error, please check server logs.' })
  }
}
