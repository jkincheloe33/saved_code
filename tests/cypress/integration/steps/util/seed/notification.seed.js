import { login } from './helper'
import { types } from '../../../../support/imports'

export const clearNotifications = () => {
  const { NOTIFICATION_STATUS } = types
  const task = ({ clientAccountId, me }) => {
    return cy.task('executeNonQuery', {
      commandText: /*sql*/ `
        UPDATE notifications
        SET status = ${NOTIFICATION_STATUS.READ},
          readAt = CURRENT_TIMESTAMP
        WHERE peopleId = ${me.id}
          AND accountId = ${clientAccountId}
      `,
    })
  }

  login({ task })
}
