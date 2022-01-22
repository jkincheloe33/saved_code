module.exports = {
  logServerError: ({ additionalInfo, error, excludeBody = false, req }) => {
    try {
      const logData = {
        additionalInfo,
        clientAccountId: req?.clientAccount?.id,
        endpoint: req?.url,
        error,
        requestBody: excludeBody ? undefined : req?.body,
        userId: req?.session?.userId,
      }

      console.error(`🚀 ~ ${JSON.stringify(logData)}`)
    } catch (e) {
      console.error('🚀 ~ Catch error in logServerError: ', e)
      console.error('🚀 ~ Hard error from request: ', error)
    }
  },
}
