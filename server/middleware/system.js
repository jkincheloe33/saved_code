// Current system setting (no more than 60 seconds delayed)
let systemSettings = null

// Every 60 seconds, refresh the system settings
setInterval(_watchSystem, 60 * 1000)

module.exports = {
  applySystemSettings: async req => {
    if (systemSettings == null) {
      await _watchSystem()
    }

    // Apply the system settings to every request object...EK
    req.systemSettings = systemSettings
    return true
  },
}

async function _watchSystem() {
  systemSettings = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT * from systemSettings
    `,
  })

  systemSettings = systemSettings.settings
}
