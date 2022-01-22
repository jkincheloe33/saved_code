const { getCelebrations } = require('@serverHelpers/celebrations/getCelebrations')

export default async (req, res) => {
  try {
    const {
      body: { clientTzOffset, daysLaterLimit = 28, page = 0, pageLimit },
      session: { userId },
      clientAccount: { id: clientAccountId },
    } = req

    const newCelebrations = await getCelebrations({
      clientAccountId,
      clientTzOffset,
      daysLaterLimit,
      page,
      pageLimit: pageLimit <= 20 ? pageLimit : 20,
      userId,
    })

    res.json({ success: true, newCelebrations })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}
