module.exports = {
  rejectRequest: ({ res, code = 400, msg = 'Bad Request' }) => {
    res.statusCode = code
    res.end(msg)
  },
  redirectRequest: ({ res, code = 302, location, msg = 'Found' }) => {
    res.writeHead(code, {
      Location: location,
    })
    res.end(msg)
  },
}
