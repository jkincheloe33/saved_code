const path = require('path')
const nextImages = require('next-images') //used as a wrapper to import svgs directly in Next.js

module.exports = nextImages({
  // Disables "X-Powered-By: Next.js" header to hide this from clients...EK
  poweredByHeader: false,
  env: {
    ROOTPATH: __dirname,
  },
  webpack: config => {
    // Define resolution aliases to simplify imports...EK
    config.resolve.alias['@assets'] = path.resolve(__dirname, '.', 'assets')
    config.resolve.alias['@components'] = path.resolve(__dirname, '.', 'components')
    config.resolve.alias['@contexts'] = path.resolve(__dirname, '.', 'contexts')
    config.resolve.alias['@serverHelpers'] = path.resolve(__dirname, '.', 'server/helpers')
    config.resolve.alias['@services'] = path.resolve(__dirname, '.', 'services')
    config.resolve.alias['@utils'] = path.resolve(__dirname, '.', 'utils')

    return config
  },
})
