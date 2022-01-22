import { REWARD_GIFT_STATUS } from '@utils/types'
const selectRewardAttributes = require('@serverHelpers/rewards/selectRewardAttributes')
const selectRewardDetails = require('@serverHelpers/rewards/selectRewardDetails')
const crypto = require('crypto')

export default async (req, res) => {
  const {
    body: { rewardProgressId },
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  let transaction

  try {
    // Pull and verify the rewardProgress record...EK
    const rewardProgress = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT RP.*
        FROM rewardProgress RP
        WHERE RP.id = ?
          AND RP.accountId = ${clientAccountId}
          AND RP.peopleId = ${userId}
          -- This progress record is complete...
          AND RP.completedAt IS NOT NULL
          -- But not played...EK
          AND RP.playedAt IS NULL
      `,
      params: [rewardProgressId],
    })

    if (rewardProgress == null) {
      console.log('Bad rewardProgressId: ', rewardProgressId)
      return res.json({ success: false, msg: `There was an issue retrieving your reward. Please play again soon. (${rewardProgressId})` })
    }

    // Calculate the level that this person is playing at (number of progress complete vs level config)
    const playLevels = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT RL.id, RL.level
        FROM (
          SELECT COUNT(RP.playedAt) AS progressPlayed
          FROM rewardProgress RP
          WHERE RP.accountId = ${clientAccountId}
            AND RP.peopleId = ${userId}
          GROUP BY RP.peopleId
      ) I
      LEFT JOIN rewardLevels RL ON (RL.accountId = ${clientAccountId} AND RL.requiredPlays <= I.progressPlayed)
      `,
    })

    if (playLevels.length) {
      // Calculate the gifts that are available (under that level above, with inventory - if needed, and dates match)
      const rewardGiftsAvailable = await wambiDB.query({
        queryText: /*sql*/ `
          SELECT DISTINCT RG.*, RL.level, RL.probabilityMultiplier
          FROM rewardGifts RG
          LEFT JOIN rewardGiftGroups RGG ON (RG.id = RGG.rewardGiftId)
          LEFT JOIN groupIndex GI ON (RGG.groupId = GI.groupId OR RGG.groupId IS NULL)
          INNER JOIN peopleGroups PG ON (GI.fromGroupId = PG.groupId AND PG.peopleId = ${userId})
          INNER JOIN rewardLevels RL ON (RL.accountId = ${clientAccountId} AND RG.rewardLevelId = RL.id)
          WHERE
            -- The gifts that are in the level(s) that were played
            RG.rewardLevelId IN (?)
            -- Check dates
            AND (RG.startDate IS NULL OR RG.startDate < CURRENT_TIMESTAMP)
            AND (RG.endDate IS NULL OR RG.endDate > CURRENT_TIMESTAMP)
            -- Check inventory
            AND (RG.inventory IS NULL OR RG.inventory > 0)
            -- Check status
            AND RG.status = ${REWARD_GIFT_STATUS.ACTIVE}
        `,
        params: [playLevels.map(({ id }) => id)],
      })

      // Multiplies each gift by its parent level's probability multiplier to increase probability of it showing up...KA
      const multipliedGifts = rewardGiftsAvailable.flatMap(rwa => new Array(rwa.probabilityMultiplier).fill(rwa))

      // Based on the gifts available we pick one using a random number based on the seed (or actually use the seed) above.
      const randomIndex = rewardGiftsAvailable.length === 0 ? 0 : crypto.randomInt(0, multipliedGifts.length)
      const giftRewarded = multipliedGifts[randomIndex]

      if (giftRewarded != null) {
        transaction = await wambiDB.beginTransaction()
        // Once we have picked a gift, we need to create a rewardClaim record for that gift and the person who "won" it.
        const rewardClaim = await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO rewardClaims (rewardGiftId, claimedBy, expiresAt)
            VALUES (
              ${giftRewarded.id},
              ${userId},
              IF (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${
                giftRewarded.expiresInDays || 14
              } DAY) < IFNULL(?, CURRENT_TIMESTAMP) AND ? IS NOT NULL,
                ?,
                DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ${giftRewarded.expiresInDays || 14} DAY)
              )
            )
          `,
          params: [giftRewarded.endDate, giftRewarded.endDate, giftRewarded.endDate],
        })

        // We need to update the rewardProgress record so we know what level they played, won and the linked rewardClaim record, and playedAt need to be set
        await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            UPDATE rewardProgress
            SET
              playedAt = CURRENT_TIMESTAMP,
              winLevelId = ${giftRewarded.rewardLevelId},
              maxLevelId = ${playLevels.sort((a, b) => b.level - a.level)[0].id},
              rewardClaimId = ${rewardClaim.insertId}
            WHERE id = ${rewardProgress.id}
          `,
        })

        await wambiDB.commitTransaction(transaction)

        // Return to the client the gift they won (same response as the getReward endpoint)
        // Using executeNonQuery to read the record from the write DB...EK
        const [reward] = await wambiDB.executeNonQuery({
          commandText: /*sql*/ `
            ${selectRewardDetails(clientAccountId)}
            WHERE RC.id = ${rewardClaim.insertId}
          `,
        })

        // Convert 1 || 0 to true or false for the client...PS
        if (reward) {
          const { hasInventory } = reward
          reward.hasInventory = hasInventory > 0 || hasInventory === null

          if (reward.itemNumber) {
            reward.attributes = await wambiDB.query({
              queryText: /*sql*/ `
                ${selectRewardAttributes({ clientAccountId, reward })}
              `,
            })
          }

          if (reward.hasInventory) res.json({ success: true, reward })
          else res.json({ success: false, msg: 'This reward no longer has inventory. Please play again soon.' })
        } else {
          res.json({ success: false, msg: 'There was an issue retrieving your reward. Please play again soon.' })
        }
      } else {
        res.json({ success: false, msg: 'There is no gift available for this play. Please play again soon.' })
      }
    } else {
      res.json({ success: false, msg: 'An error occurred; Please play again soon.' })
    }
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    return { success: false, msg: 'Error occurred; Check server logs' }
  }
}
