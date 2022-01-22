const { login } = require('./helper')

const _checkRewardExists = accountId => {
  return cy.task('query', {
    queryText: /*sql*/ `
      SELECT RG.name
      FROM rewardGifts RG
      WHERE RG.name = 'QA Reward'
        AND RG.accountId = ${accountId}
    `,
  })
}

const _createRewardLevel = accountId => {
  const data = { accountId, name: 'QA Reward Level', level: 0, requiredPlays: 1 }
  return cy.task('executeNonQuery', {
    commandText: /*sql*/ `
      INSERT INTO rewardLevels SET ?
    `,
    params: [data],
  })
}

const _insertReward = (accountId, rewardLevelId) => {
  const data = [accountId, rewardLevelId, 'QA Reward', Math.floor(Math.random() * 9999), 1, 'Size']

  return cy.task('executeNonQuery', {
    commandText: /*sql*/ `
      INSERT INTO rewardGifts (accountId, rewardLevelId, name, itemNumber, status, attributeName, attributeValue) VALUES ?
    `,
    params: [['small', 'medium'].map(e => data.concat(e))],
  })
}

export const createGiftReward = () => {
  const createGiftRewardTask = ({ clientAccountId }) => {
    return _checkRewardExists(clientAccountId).then(reward => {
      if (reward.length === 0) {
        _createRewardLevel(clientAccountId).then(level => {
          _insertReward(clientAccountId, level.insertId)
        })
      }
    })
  }
  login({ task: createGiftRewardTask })
}
