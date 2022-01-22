import { login } from './helper'

export const termsUnsigned = () => {
  const termsUnsignedTask = ({ me }) => {
    return cy.task('executeNonQuery', {
      commandText: /*sql*/ `
        UPDATE people
        SET acceptedTermsAt = NULL
        WHERE id = ${me.id}
      `,
    })
  }
  login({ task: termsUnsignedTask })
}
