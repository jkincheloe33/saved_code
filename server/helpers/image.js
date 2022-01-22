const Jimp = require('jimp')

module.exports = {
  resizeImage: async (mime, imgBuffer, finalWidth, finalHeight) => {
    let image = await Jimp.read(imgBuffer)
    image.resize(finalWidth, finalHeight, Jimp.AUTO)
    return await image.getBufferAsync(mime)
  },
  // Overlay with filters??
  // Lots of other cool Jimp image manipulations here...EK
}
