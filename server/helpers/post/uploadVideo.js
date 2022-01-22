import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import { v4 as uuidv4 } from 'uuid'

import { uploadAndLinkMedia } from '@serverHelpers/media'

// The duration for video is 2mins max...PS
const durationLimit = 120

module.exports = {
  uploadVideo: async ({ clientAccount, file, res, sourceFile, tableKey, tableName }) => {
    // Initialize temp files...JC
    const uid = uuidv4()
    const outputFile = `./_temp/${uid}_output`
    const screenshotFile = `${uid}_screenshot.png`
    const screenshotPath = `./_temp/${screenshotFile}`

    try {
      // Check for length of video before conversion...PS
      const videoDuration = await new Promise(resolve => {
        ffmpeg.ffprobe(sourceFile, (err, metadata) => {
          resolve(metadata.streams[0].duration)
        })
      })

      if (videoDuration > durationLimit) {
        fs.unlinkSync(sourceFile)
        return res.json({ success: false, msg: 'The video you selected exceeds 2 minutes. Please choose another.' })
      }

      // Return to client, but continue processing...JC
      if (file) res.json({ msg: 'Video is processing', success: true })
      else return res.json({ msg: 'Video failed to process', success: false })

      // Process the video...JC
      const processVideo = new Promise((resolve, reject) => {
        ffmpeg(sourceFile)
          .format('mp4')
          .size('1080x?')
          .aspect('16:9')
          .autoPad('black')
          .on('end', () => {
            console.log('Finished processing video')
            const outputFileStats = fs.statSync(outputFile)
            const videoOutputStream = fs.createReadStream(outputFile)
            resolve({ outputFileStats, videoOutputStream })
          })
          .on('progress', progress => {
            console.log('Processing video: ' + progress.percent + '% done')
          })
          .on('error', e => {
            console.log('Processing video error', e)
            reject(e)
          })
          .output(outputFile)
          .run()
      })

      // Process the video screenshot...JC
      const processScreenshot = new Promise((resolve, reject) => {
        ffmpeg(sourceFile)
          .screenshots({
            timestamps: [1],
            filename: screenshotFile,
            folder: './_temp/',
            // Match size to our CPC Banner default...JC
            size: '1296x?',
          })
          .aspect('16:9')
          .autoPad('black')
          .on('progress', progress => {
            console.log('Processing video screenshot: ' + progress.percent + '% done')
          })
          .on('end', () => {
            console.log('Finished processing video screenshot')
            const screenshotOutputStream = fs.createReadStream(screenshotPath)
            resolve({ screenshotOutputStream })
          })
          .on('error', e => {
            console.log('Processing video screenshot error', e)
            reject(e)
          })
      })

      const [processVideoData, processScreenshotData] = await Promise.all([processVideo, processScreenshot])
      const { outputFileStats, videoOutputStream } = processVideoData
      const { screenshotOutputStream } = processScreenshotData

      // Update video ands screenshot lengths for helper...JC
      file.buffer.length = outputFileStats.size
      screenshotOutputStream.length = screenshotOutputStream._readableState.length

      // Upload video...JC
      await uploadAndLinkMedia({
        clientAccount,
        fileName: file.fileName,
        mediaBuffer: file.buffer,
        mediaCategory: 'announcement',
        mimeType: 'video/mp4',
        tableKey,
        tableName,
        usage: 'video',
        videoStream: videoOutputStream,
      })

      // Upload video screenshot...JC
      await uploadAndLinkMedia({
        clientAccount,
        fileName: screenshotFile,
        mediaBuffer: screenshotOutputStream,
        mediaCategory: 'videoStill',
        mimeType: 'image/png',
        tableKey,
        tableName,
        usage: 'banner',
      })

      // Cleanup deleting temp files...JC
      fs.unlinkSync(sourceFile)
      fs.unlinkSync(outputFile)
      fs.unlinkSync(screenshotPath)
    } catch (error) {
      if (fs.statSync(sourceFile)) fs.unlinkSync(sourceFile)
      if (fs.statSync(outputFile)) fs.unlinkSync(outputFile)
      if (fs.statSync(screenshotPath)) fs.unlinkSync(screenshotPath)
      throw new Error(error)
    }
  },
}
