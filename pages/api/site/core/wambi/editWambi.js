import { getSentimentScore } from '@serverHelpers/aws'

const { validateAuthor } = require('@serverHelpers/newsfeed/isAuthor')

export default async (req, res) => {
  const {
    body: {
      cpcData: { content, type },
      cpcId,
      feedId,
    },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  let transaction

  try {
    // check if user is author...JK
    const isAuthor = await validateAuthor({ clientAccountId, feedId, userId })

    // if user is not the author, return...JK
    if (!isAuthor) return res.json({ success: false, msg: 'This user does not have permission' })

    const { sentiment } = await getSentimentScore({ content, req })

    transaction = await wambiDB.beginTransaction()

    if (content || type) {
      // updates cpc content and cpcTypeId...JK
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE cpc
          SET ?
          WHERE id = ?
            AND accountId = ${clientAccountId}
        `,
        // only update content if content exists, and only update cpcTypeId if type exists...JK
        params: [
          {
            ...(content && {
              content,
              sentiment,
            }),
            ...(type && { cpcTypeId: type.id }),
          },
          cpcId,
        ],
      })
    }

    if (type) {
      // updates mediaLink mediaId...JK
      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          UPDATE mediaLink
          SET ?
          WHERE tableKey = ?
            AND tableName = 'feedItems'
            AND \`usage\` = 'banner'
        `,
        params: [{ mediaId: type.mediaId }, feedId],
      })
    }

    let updateCpcText = ''
    let updateCpcParams = [feedId]

    // If message exist, inject message since escapeValue render question marks as a parameter...CY
    if (content) {
      updateCpcText = 'content = ?,'
      updateCpcParams = [content, ...updateCpcParams]
    }
    // update feedItem...PS
    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
        UPDATE feedItems
        SET
          ${updateCpcText}
          editedAt = CURRENT_TIMESTAMP
        WHERE id = ?
          AND accountId = ${clientAccountId}
      `,
      params: updateCpcParams,
    })

    await wambiDB.commitTransaction(transaction)

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}
