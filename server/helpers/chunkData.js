module.exports = {
  chunkDataset: async ({ connection, commandText, dataRows, rowSelector, pageSize = 10000 }) => {
    let page = 0
    const pagedRes = []

    while (page * pageSize <= dataRows.length) {
      const pageRows = dataRows.slice(page * pageSize, (page + 1) * pageSize)
      if (pageRows.length > 0) {
        const insertRes = await connection.executeNonQuery({
          commandText,
          params: [pageRows.map(rowSelector)],
        })
        pagedRes.push(insertRes)
      }
      page++
    }

    return pagedRes
  },
}
