import { parseMultipartFormData } from '@serverHelpers/parseMultiPart'
import { uploadAndLinkMedia } from '@serverHelpers/media'
import https from 'https'
import { removeDuplicates } from '@utils/general'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async (req, res) => {
  const { configUpload } = await parseMultipartFormData(req)

  const {
    clientAccount: { id: clientAccountId },
    session: { userId },
  } = req

  try {
    // Validate that this environment doesn't have any lessons, if so don't allow the import...EK
    const { lessonCount } = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT COUNT(*) AS lessonCount
        FROM lessons L
        WHERE L.accountId = ${clientAccountId}
        ;
      `,
    })

    if (lessonCount > 0) {
      return res.json({
        success: false,
        msg: 'This account already has lessons - to limit potential duplicates the import will not complete.',
      })
    }

    // Convert the payload to a JSON object which represents the items to import...EK
    const configPayload = JSON.parse(configUpload.buffer.toString())
    const { challengeThemes, cpcThemes, lessons, reactions, rewardTriggers } = configPayload

    const challengesImportRes = await importChallengeThemes(clientAccountId, challengeThemes, req)
    const cpcTypesImportRes = await importCPCThemes(clientAccountId, userId, cpcThemes, req)
    const lessonImportRes = await importLessons(clientAccountId, lessons, req)
    const reactionImportRes = await importReactions(clientAccountId, reactions, req)
    const rewardTriggersImportRes = await importRewardTriggers(clientAccountId, rewardTriggers, req)

    res.json({
      challenges: challengesImportRes.inserted,
      cpcTypes: cpcTypesImportRes.inserted,
      lessons: lessonImportRes.inserted,
      reactions: reactionImportRes.inserted,
      rewardTriggers: rewardTriggersImportRes.inserted,
      success: true,
    })
  } catch (error) {
    logServerError({ additionalInfo: 'Parent function errored out', error, excludeBody: true, req })
    res.json({ success: false, msg: 'Error occurred importing config; Check logs.' })
  }
}

async function importChallengeThemes(clientAccountId, challengeThemes, req) {
  try {
    if (challengeThemes.length > 0) {
      const importChallengeThemesRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO challengeThemes (accountId, \`name\`, \`description\`, templateTitle, templateDescription)
          VALUES ?
          ;
        `,
        params: [challengeThemes.map(ct => [clientAccountId, ct.name, ct.description, ct.templateTitle, ct.templateDescription])],
      })

      challengeThemes.forEach((th, i) => (th.newId = importChallengeThemesRes.insertId + i))

      const challenges = challengeThemes.flatMap(th => {
        // While we flatten the challenges, link each one to the new parent id in this account...EK
        th.challenges.forEach(c => (c.challengeThemeId = th.newId))
        return th.challenges
      })

      const importChallengesRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO challenges (challengeThemeId, ownerId, title, \`description\`, startDate, endDate, goalsNeeded, rewardIncrement, whoCanComplete, \`status\`)
          VALUES ?
          ;
        `,
        params: [
          challenges.map(c => [
            c.challengeThemeId,
            c.ownerId,
            c.title,
            c.description,
            c.startDate,
            c.endDate,
            c.goalsNeeded,
            c.rewardIncrement,
            c.whoCanComplete,
            c.status,
          ]),
        ],
      })

      challenges.forEach((c, i) => (c.newId = importChallengesRes.insertId + i))

      // Handle challenge theme / challenges images...EK
      const challengeImages = challengeThemes.flatMap(th =>
        th.challenges
          .filter(c => c.image != null)
          .map(c => {
            return {
              newId: th.newId, // We make this newId because that's what the uploadImage is expecting to be the "tableKey"
              challengeId: c.newId,
              image: c.image,
            }
          })
      )

      // Now calculate "DISTINCT" challenge images by theme...EK
      const distinctThemeImages = removeDuplicates(challengeImages, 'image')

      // Upload the image options to the challenge themes
      await importImages(
        clientAccountId,
        distinctThemeImages,
        {
          tableName: 'challengeThemes',
          mediaCategory: 'challengeThemes',
          usage: 'imageOption',
        },
        req
      )

      // Once the "DISTINCT" challenge theme images are uploaded, we need to link them to the individual challenges
      challengeImages.forEach(ci => {
        const themeImage = distinctThemeImages.find(themeImage => ci.image === themeImage.image)
        ci.newMediaId = themeImage?.newMediaId
      })

      // We take the above and actually link the media for the actual challenges...EK
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO mediaLink (mediaId, tableName, tableKey, \`usage\`)
          VALUES ?
          ;
        `,
        params: [challengeImages.map(ci => [ci.newMediaId, 'challenges', ci.challengeId, 'challenge'])],
      })

      // Challenge goals...EK
      const challengeGoals = challengeThemes.flatMap(th => {
        return th.challenges.flatMap(c => {
          c.goals.forEach(g => (g.challengeId = c.newId))
          return c.goals
        })
      })

      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO challengeGoals (challengeId, title, goal, \`trigger\`)
          VALUES ?
          ;
        `,
        params: [challengeGoals.map(g => [g.challengeId, g.title, g.goal, g.trigger])],
      })

      return {
        inserted: importChallengesRes.affectedRows,
      }
    } else {
      return {
        inserted: 0,
      }
    }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in import challenge themes', error, excludeBody: true, req })
    return {
      inserted: -1,
    }
  }
}

async function importCPCThemes(clientAccountId, userId, cpcThemes, req) {
  try {
    if (cpcThemes.length > 0) {
      const importCPCThemesRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO cpcThemes (accountId, \`name\`, \`description\`, \`order\`)
          VALUES ?
          ;
        `,
        params: [cpcThemes.map(r => [clientAccountId, r.name, r.description, r.order])],
      })

      cpcThemes.forEach((th, i) => (th.newId = importCPCThemesRes.insertId + i))

      // Handle the cpc types...EK
      const cpcTypes = cpcThemes.flatMap(th => {
        // While we flatten the cpc types, link each type to the new parent id in this account...EK
        th.types.forEach(t => (t.cpcThemeId = th.newId))
        return th.types
      })

      const importCPCTypesRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO cpcTypes (accountId, cpcThemeId, \`name\`, \`description\`, exampleText, startDate, endDate, whoCanSend, keywords, \`order\`, \`status\`, createdBy, updatedBy)
          VALUES ?
          ;
        `,
        params: [
          cpcTypes.map(t => [
            clientAccountId,
            t.cpcThemeId,
            t.name,
            t.description,
            t.exampleText,
            t.startDate,
            t.endDate,
            t.whoCanSend,
            t.keywords,
            t.order,
            t.status,
            userId,
            userId,
          ]),
        ],
      })

      cpcTypes.forEach((t, i) => (t.newId = importCPCTypesRes.insertId + i))

      // Pull the images for each record from the source -> target CDN...EK
      await importImages(
        clientAccountId,
        cpcTypes,
        {
          tableName: 'cpcTypes',
          mediaCategory: 'cpc/banner',
          usage: 'banner',
        },
        req
      )

      return {
        inserted: importCPCTypesRes.affectedRows,
      }
    } else {
      return {
        inserted: 0,
      }
    }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in import cpc themes', error, excludeBody: true, req })
    return {
      inserted: -1,
    }
  }
}

async function importLessons(clientAccountId, lessons, req) {
  try {
    if (lessons.length > 0) {
      const importLessonsRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO lessons (accountId, title, internalDescription, summary, \`order\`, whoCanSee, readMinutes, \`status\`)
          VALUES ?
          ;
        `,
        params: [
          lessons.map(r => [clientAccountId, r.title, r.internalDescription, r.summary, r.order, r.whoCanSee, r.readMinutes, r.status]),
        ],
      })

      lessons.forEach((r, i) => (r.newId = importLessonsRes.insertId + i))

      // Handle the lesson steps...EK
      const lessonSteps = lessons.flatMap(l => {
        // While we flatten the lesson steps, link each step to the new parent id in this account...EK
        l.steps.forEach(s => (s.lessonId = l.newId))
        return l.steps
      })

      const importLessonStepsRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO lessonSteps (lessonId, \`order\`, title, content)
          VALUES ?
          ;
        `,
        params: [lessonSteps.map(s => [s.lessonId, s.order, s.title, s.content])],
      })

      lessonSteps.forEach((r, i) => (r.newId = importLessonStepsRes.insertId + i))

      // Pull the images for each record from the source -> target CDN...EK
      await importImages(
        clientAccountId,
        lessons,
        {
          tableName: 'lessons',
          mediaCategory: 'lessons',
          usage: 'primary',
        },
        req
      )

      await importImages(
        clientAccountId,
        lessonSteps,
        {
          tableName: 'lessonSteps',
          mediaCategory: 'lessons/steps',
          usage: 'primary',
        },
        req
      )

      return {
        inserted: importLessonsRes.affectedRows,
      }
    } else {
      return {
        inserted: 0,
      }
    }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in download image worker function', error, excludeBody: true, req })
    return {
      inserted: -1,
    }
  }
}

async function importReactions(clientAccountId, reactions, req) {
  try {
    if (reactions.length > 0) {
      const importReactionsRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO reactions (accountId, name, status)
          VALUES ?
          ;
        `,
        params: [reactions.map(r => [clientAccountId, r.name, r.status])],
      })

      reactions.forEach((r, i) => (r.newId = importReactionsRes.insertId + i))

      // Pull the images for each reaction from the source -> target CDN...EK
      await importImages(
        clientAccountId,
        reactions,
        {
          tableName: 'reactions',
          mediaCategory: 'reactions',
          usage: 'icon',
        },
        req
      )

      return {
        inserted: importReactionsRes.affectedRows,
      }
    } else {
      return {
        inserted: 0,
      }
    }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in import reactions function', error, excludeBody: true, req })
    return {
      inserted: -1,
    }
  }
}

async function importRewardTriggers(clientAccountId, rewardTriggers, req) {
  try {
    if (rewardTriggers.length > 0) {
      const importRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO rewardTriggers (accountId, \`trigger\`, increment)
          VALUES ?
          ;
        `,
        params: [rewardTriggers.map(r => [clientAccountId, r.trigger, r.increment])],
      })

      rewardTriggers.forEach((r, i) => (r.newId = importRes.insertId + i))

      return {
        inserted: importRes.affectedRows,
      }
    } else {
      return {
        inserted: 0,
      }
    }
  } catch (error) {
    logServerError({ additionalInfo: 'Error in import reward triggers function', error, excludeBody: true, req })
    return {
      inserted: -1,
    }
  }
}

const MAX_IMAGE_WORKERS = 15
async function importImages(clientAccountId, records, link, req) {
  let imageResults = []

  // Ensure all records going into the image proxy have actual image properties...EK
  records = records.filter(rec => rec.image != null)

  // Calculate the worker set based on the max number of image workers...EK
  const workerSets = Math.ceil(records.length / MAX_IMAGE_WORKERS)

  for (let ws = 0; ws < workerSets; ws++) {
    console.log(`${((ws / workerSets) * 100).toFixed(2)}% complete...`)
    const imagesForSet = records.slice(ws * MAX_IMAGE_WORKERS, (ws + 1) * MAX_IMAGE_WORKERS)
    const imageWorkers = imagesForSet.map(record => _downloadImageWorker(clientAccountId, record, link, req))
    imageResults = [...imageResults, ...(await Promise.allSettled(imageWorkers))]
  }

  return imageResults

  async function _downloadImageWorker(clientAccountId, record, link, req) {
    return new Promise(resolve => {
      console.log('HTTP REQ: ' + record.image)
      try {
        https.get(record.image, async httpRes => {
          if (httpRes.statusCode >= 200 && httpRes.statusCode < 300) {
            const fileName = record.image.split('/').pop()

            // Await the download process so we can work with buffers in our existing CDN upload workflow...EK
            let httpResAsBuffer = Buffer.alloc(0)
            await new Promise((resolve, reject) => {
              httpRes.on('data', d => (httpResAsBuffer = Buffer.concat([httpResAsBuffer, d])))
              httpRes.on('end', resolve)
              httpRes.on('error', reject)
            })

            // Proxy this to the S3 CDN bucket...EK
            const uploadRes = await uploadAndLinkMedia({
              allowMultipleLinks: link.tableName === 'challengeThemes', // Challenge themes need to allow for multiple links...EK
              clientAccount: { id: clientAccountId },
              mediaBuffer: httpResAsBuffer,
              fileName,
              mimeType: httpRes?.headers['content-type'],
              ...link,
              tableKey: record.newId, // Note we set the tableKey to the new PK assigned to this imported record...EK
            })

            // Track the newly uploaded media Id on the record...EK
            record.newMediaId = uploadRes.mediaId

            resolve(uploadRes)
          } else {
            console.warn(`Image returned non-200 response (${httpRes.statusCode}) - ${record.image}`)
            resolve({ success: true }) // NOTE: Marking true since it was able to make the request.  The image not being available is not a fail state...EK
          }
        })
      } catch (error) {
        logServerError({ additionalInfo: 'Error in download image worker function', error, excludeBody: true, req })
        resolve({ success: false })
      }
    })
  }
}
