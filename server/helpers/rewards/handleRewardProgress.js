const MAX_PROGRESS = 1000
const _getPercentages = value => Math.floor((value / MAX_PROGRESS) * 100)

// Get response reward percentage for progress bar...CY
const _getRewardPercentage = async ({ addedProgress, clientAccountId, userId }) => {
  if (!userId) return
  const userProgress = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT IFNULL(SUM(progress), 0) progress
      FROM rewardProgress
      WHERE peopleId = ? 
        AND accountId = ${clientAccountId}
        AND completedAt IS NULL
    `,
    params: [userId],
  })

  const addedPercentage = _getPercentages(addedProgress)
  const startedPercentage = _getPercentages(userProgress.progress % MAX_PROGRESS)

  /*
    - overallProgress: the progress bar should end up
    - startProgress: the progress bar start from ...CY
  */
  return { overallProgress: startedPercentage + addedPercentage, startProgress: startedPercentage }
}

module.exports = {
  // Update multiple users reward progress...CY
  updateProgress: async ({ clientAccountId, completedChallenges, req, triggers, userId, userIds }) => {
    let transaction = null

    try {
      let triggerIncrement = 0
      let challengeIncrement = 0
      const insertRewardProgressRecords = []

      // Get increment reward progress from triggers...CY
      if (triggers.length) {
        const triggerIncrementQuery = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT IFNULL(SUM(increment), 0) sum
            FROM rewardTriggers RT
            WHERE RT.accountId = ${clientAccountId}
              AND RT.trigger IN (?)
          `,
          params: [triggers],
        })

        triggerIncrement = triggerIncrementQuery.sum
      }

      // Get increment reward progress from challenges...CY
      if (completedChallenges.length) {
        const challengeIncrementQuery = await wambiDB.querySingle({
          queryText: /*sql*/ `
            SELECT IFNULL(SUM(rewardIncrement), 0) sum
            FROM challenges
            WHERE id IN (?)
          `,
          params: [completedChallenges.map(({ challengeId }) => challengeId)],
        })
        challengeIncrement = challengeIncrementQuery.sum
      }

      // Get the the total of overall reward progress from triggers and challenges...CY
      const addedProgress = parseInt(triggerIncrement) + parseInt(challengeIncrement)

      const rewardPercentages = await _getRewardPercentage({ addedProgress, clientAccountId, userId })

      if (addedProgress > 0) {
        // Get not completed reward progresses from users...CY
        const existingRewardProgressRecords = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT id, progress, peopleId
            FROM rewardProgress
            WHERE peopleId IN (?)
              AND accountId = ${clientAccountId}
              AND completedAt IS NULL
          `,
          params: [userIds],
        })

        userIds.forEach(id => {
          const userProgress = existingRewardProgressRecords.find(({ peopleId }) => peopleId === id)

          // If no completed challenge exist for a user, then push into a list to insert reward progress...CY
          if (userProgress == null) insertRewardProgressRecords.push({ userId: id, progress: addedProgress })
          else {
            // Calculate the extra progress from the existing progress and the added progress...CY
            const progressSum = addedProgress + userProgress.progress
            const newProgress = progressSum >= MAX_PROGRESS ? MAX_PROGRESS : progressSum
            const extraProgress = progressSum - newProgress

            if (extraProgress > 0) insertRewardProgressRecords.push({ userId: id, progress: extraProgress })
          }
        })

        transaction = await wambiDB.beginTransaction()

        // Update existing not completed progress...CY
        if (existingRewardProgressRecords.length) {
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              UPDATE rewardProgress
              SET completedAt = IF(progress + ${addedProgress} >= ${MAX_PROGRESS}, CURRENT_TIMESTAMP, NULL),
              progress = IF(progress + ${addedProgress} >= ${MAX_PROGRESS}, ${MAX_PROGRESS}, progress + ${addedProgress}) 
              WHERE id IN (?)
            `,
            params: [existingRewardProgressRecords.map(({ id }) => id)],
          })
        }

        if (insertRewardProgressRecords.length > 0) {
          // Generate insert rewardProgress data...CY
          const insertRewardProgress = insertRewardProgressRecords
            .map(({ userId, progress }) => {
              return Array.from({ length: Math.ceil(progress / MAX_PROGRESS) }, () => {
                const data = [
                  clientAccountId,
                  userId,
                  progress >= MAX_PROGRESS ? MAX_PROGRESS : progress,
                  progress >= MAX_PROGRESS ? 'CURRENT_TIMESTAMP' : 'NULL',
                ]
                progress -= MAX_PROGRESS
                return `(${data.join(',')})`
              })
            })
            .join(',')

          //Bulk insert rewardProgress...CY
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              INSERT INTO rewardProgress (accountId, peopleId, progress, completedAt)
              VALUES ${insertRewardProgress}
            `,
          })
        }

        await wambiDB.commitTransaction(transaction)
      }

      return { ...rewardPercentages, success: true }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of updateProgress', error, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      return { success: false }
    }
  },
  // Get a single user reward progress from triggers...CY
  getProgress: async ({ clientAccountId, req, userId }) => {
    try {
      const rewardProgress = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT SUM(progress) progress,
            COUNT(completedAt) completed,
            COUNT(playedAt) played
          FROM rewardProgress
          WHERE peopleId = ? 
            AND accountId = ${clientAccountId}
        `,
        params: [userId],
      })

      if (rewardProgress) {
        return {
          completed: rewardProgress.completed,
          currentProgress: _getPercentages(rewardProgress.progress % MAX_PROGRESS),
          plays: rewardProgress.completed - rewardProgress.played,
          success: true,
        }
      }

      // If new user does not have rewardProgress data...CY
      return {
        completed: 0,
        currentProgress: 0,
        plays: 0,
        success: true,
      }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of getProgress', error, req })
      return { success: false }
    }
  },
  convertPecks: async ({ clientAccountId, req, userId }) => {
    let transaction = null

    try {
      const { pecks } = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT IFNULL(w3pecks, 0) pecks
          FROM people
          WHERE id = ?
        `,
        params: [userId],
      })

      if (pecks) {
        transaction = await wambiDB.beginTransaction()
        let progress = pecks

        // Calculate and insert reward progress from pecks...CY
        const insertRewardProgress = Array.from({ length: Math.ceil(progress / MAX_PROGRESS) }, () => {
          const data = [
            clientAccountId,
            userId,
            progress >= MAX_PROGRESS ? MAX_PROGRESS : progress,
            progress >= MAX_PROGRESS ? 'CURRENT_TIMESTAMP' : 'NULL',
          ]
          progress -= MAX_PROGRESS
          return `(${data.join(',')})`
        }).join(',')

        const rewardProgressInsert = await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO rewardProgress (accountId, peopleId, progress, completedAt)
            VALUES ${insertRewardProgress}
          `,
        })

        if (rewardProgressInsert.affectedRows === Math.ceil(pecks / MAX_PROGRESS)) {
          // Set user's peck to null when done converting...CY
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              UPDATE people
              SET w3pecks = NULL
              WHERE id = ?
            `,
            params: [userId],
          })

          await wambiDB.commitTransaction(transaction)
        } else {
          await wambiDB.rollbackTransaction(transaction)
          return { success: false }
        }
      }

      return {
        convertedPecks: pecks > 0,
        peckPercentage: _getPercentages(pecks),
        success: true,
      }
    } catch (error) {
      logServerError({ additionalInfo: 'Error inside of convertPecks', error, req })
      if (transaction) await wambiDB.rollbackTransaction(transaction)
      return { success: false }
    }
  },
}
