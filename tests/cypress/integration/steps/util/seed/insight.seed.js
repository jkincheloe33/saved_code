import { login } from './helper'
import { types } from '../../../../support/imports'

export const addInsight = () => {
  const addInsightTask = async ({ me, clientAccountId }) => {
    const { INSIGHT_STATUS, INSIGHT_TYPE } = types

    return cy.task('executeNonQuery', {
      commandText: /*sql*/ `
        INSERT INTO insights (accountId, peopleId, content, type, status) 
        VALUES (${clientAccountId}, ${me.id}, 'open cpc', ${INSIGHT_TYPE.SEND_CPC}, ${INSIGHT_STATUS.ACTIVE});
      `,
    })
  }

  login({ task: addInsightTask })
}
