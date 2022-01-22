import { USER_NOTIFY_METHODS } from '@utils'

module.exports = {
  handleBlacklist: async ({ id: recipientId, mobile }) => {
    try {
      // If a user unsubscribes from text messages, we should update their notifyMethod to None or Email Only...KA
      const updatePersonRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE people
          SET notifyMethod =
            CASE
              WHEN notifyMethod = ${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}
                THEN ${USER_NOTIFY_METHODS.EMAIL_ONLY}
              WHEN notifyMethod = ${USER_NOTIFY_METHODS.TEXT_ONLY}
                THEN ${USER_NOTIFY_METHODS.NONE}
              ELSE notifyMethod
            END
          WHERE id = ?
        `,
        params: [recipientId],
      })

      if (updatePersonRes.changedRows === 1) {
        console.error(`Unable to send SMS. Changing notify method for blacklisted user with id ${recipientId} and mobile number ${mobile}`)
        return { success: true }
      } else {
        console.error(`Unable to send SMS to user with id ${recipientId} and mobile number ${mobile}`)
        return { success: false }
      }
    } catch (error) {
      console.error(`Error sending SMS to user with id ${recipientId} and mobile number ${mobile}. `, error)
      return { success: false }
    }
  },
}
