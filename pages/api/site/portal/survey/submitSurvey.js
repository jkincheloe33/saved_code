import axios from 'axios'
import { getSentimentScore } from '@serverHelpers/aws'
import { getRandomImageForPortal } from '@serverHelpers/wambi'
import {
  sendHotStreak_Email,
  sendPatientFeedbackAlert_Email,
  sendPerfectScore_Email,
  sendWambiFromPatient_Email,
} from '@serverHelpers/email'
import { sendHotStreak_SMS, sendPatientFeedbackAlert_SMS, sendPerfectScore_SMS, sendWambiFromPatient_SMS } from '@serverHelpers/sms'
const { selectUserLeaders } = require('@serverHelpers/query/selectUserLeaders')

import { CPC_STATUS, FEED_ITEM_STATUS, FEED_ITEM_TYPES, FOLLOW_UP_STATUS, PERFECT_SCORE, TRIGGERS, USER_NOTIFY_METHODS } from '@utils'

const { getHotStreakComplete } = require('@serverHelpers/survey/getHotStreakComplete')
const { getManagingGroups } = require('@serverHelpers/getManagingGroups')
const { handleChallenges } = require('@serverHelpers/challenges/handleChallenges')

const newsfeedNotification = require('@serverHelpers/notifications/newsfeed')
const surveyNotification = require('@serverHelpers/notifications/survey')

export default async (req, res) => {
  let isPositive, sentiment, sentimentSuccess, transaction

  try {
    const {
      body: { answers, comment, contactInfo, daisyInfo, gratitude, groupId, location, person, portalId, questionSetId },
      clientAccount: {
        host,
        id: clientAccountId,
        settings: {
          featureToggles: { notifications },
          surveys,
        },
      },
      reviewer,
    } = req

    // Get the portal the survey will be saved in, return id...JC
    const portalRes = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT id, notifyOnFeedback
        FROM portals
        WHERE shortUid = ?
      `,
      params: [portalId],
    })

    const overallScore = answers.reduce((acc, currentValue) => acc + currentValue.rating, 0) / answers.length
    const perfectScore = overallScore === PERFECT_SCORE

    // Insert into survey and survey responses...JC
    let surveyEditObj = {
      comment: comment.trim() || null,
    }

    let surveyNoEditObj = {
      accountId: clientAccountId,
      botSessionId: reviewer.botSessionId,
      groupId: groupId,
      overallScore,
      peopleId: person.id,
      portalId: portalRes.id,
      questionSetId,
      reviewerId: reviewer.id,
    }

    if (contactInfo) {
      const { contact, email, firstName, lastName, mobile } = contactInfo

      // regex replaces all non-numbers with an empty string...KA
      surveyEditObj = {
        ...surveyEditObj,
        email: email && contact ? email : null,
        firstName: firstName && contact ? firstName : null,
        lastName: lastName && contact ? lastName : null,
        mobile: mobile && contact ? mobile.replace(/[^\d]/g, '') : null,
      }

      surveyNoEditObj = {
        ...surveyNoEditObj,
        followUpStatus: contact ? FOLLOW_UP_STATUS.REQUESTED : FOLLOW_UP_STATUS.NONE,
      }
    }

    let hotStreakComplete = false
    let perfectScoreCount = 0

    if (perfectScore) {
      ;({ hotStreakComplete, perfectScoreCount } = await getHotStreakComplete({
        clientAccountId,
        hotStreakCount: surveys?.hotStreakCount,
        userId: person.id,
      }))
    }

    transaction = await wambiDB.beginTransaction()

    const insertRes = await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
          INSERT INTO surveys
          SET ?, hotStreakComplete = ${hotStreakComplete ? 1 : 0}
        `,
      params: [protectEdit(surveyEditObj, surveyNoEditObj, allowSurveyEdit)],
    })

    const surveyId = insertRes.insertId

    await wambiDB.executeNonQuery({
      transaction,
      commandText: /*sql*/ `
          INSERT INTO surveyResponses (surveyId, questionId, rating)
          VALUES ?
        `,
      params: [answers.map(a => [surveyId, a.questionId, a.rating])],
    })

    // If a user submitted a daisy award...KA
    if (daisyInfo?.comment) {
      const { awardTypeId, comment, email, firstName, lastName, mobile, nominatorType } = daisyInfo

      // regex replaces all non-numbers with an empty string...KA
      const daisyData = {
        awardTypeId,
        comment,
        metadata: JSON.stringify({ email, firstName, lastName, mobile: mobile.replace(/[^\d]/g, ''), nominatorType }),
        nominatorId: null,
        nomineeId: person.id,
        surveyId,
      }

      await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO awardNominations
          SET ?
        `,
        params: [protectEdit(daisyData, { accountId: clientAccountId }, allowDaisyEdit)],
      })
    }

    // If a reviewer submitted a CPC...JC
    if (gratitude) {
      // Pull random CPC image. Right now its the same as the img randomizer for a patient sending a CPC...JC
      const { image } = await getRandomImageForPortal(clientAccountId, 0)

      ;({ isPositive, sentiment, success: sentimentSuccess } = await getSentimentScore({ content: gratitude, req }))

      // Show Wambi, handle challenges, and send notifications when return isPositive is true or aws fails...CY
      isPositive = !sentimentSuccess || isPositive

      const insertCpcRes = await wambiDB.executeNonQuery({
        transaction,
        commandText: /*sql*/ `
          INSERT INTO cpc
          SET ?
        `,
        params: [
          {
            accountId: clientAccountId,
            content: gratitude,
            cpcTypeId: image?.cpcTypeId,
            reviewerId: reviewer.id,
            sentiment,
            status: isPositive ? CPC_STATUS.APPROVED : CPC_STATUS.HIDDEN,
            surveyId,
          },
        ],
      })

      const newCpcId = insertCpcRes.insertId

      if (insertCpcRes.affectedRows === 1) {
        const groups = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT DISTINCT PG.groupId AS id
            FROM peopleGroups PG
            INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
            WHERE PG.peopleId = ?
          `,
          params: [person.id],
        })

        const feedGroupsList = await getManagingGroups({ groups })

        // Save cpc to feedItems table (authorId being defaulted to null lets us know its a patient CPC feedItem)...JC
        const feedRes = await wambiDB.executeNonQuery({
          transaction,
          commandText: /*sql*/ `
            INSERT INTO feedItems
            SET ?
          `,
          params: [
            protectEdit(
              {
                content: gratitude,
              },
              {
                accountId: clientAccountId,
                cpcId: newCpcId,
                itemType: FEED_ITEM_TYPES.CPC,
                status: isPositive ? FEED_ITEM_STATUS.VISIBLE : FEED_ITEM_STATUS.HIDDEN,
              },
              allowCpcEdit
            ),
          ],
        })

        const newFeedId = feedRes.insertId

        // Use newsfeed ID to create feedGroups row, feedPeople row, and mediaLink entry for feedItem...JC
        if (newFeedId && groups.length) {
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              INSERT INTO feedPeople
              SET ?
            `,
            params: [{ feedId: newFeedId, peopleId: person.id }],
          })

          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              INSERT INTO feedGroups (feedId, groupId, isManaging)
              VALUES ?
            `,
            params: [feedGroupsList.map(({ id, isManaging }) => [newFeedId, id, isManaging])],
          })

          // Save image to mediaLink table...KA
          await wambiDB.executeNonQuery({
            transaction,
            commandText: /*sql*/ `
              INSERT INTO mediaLink
              SET ?
            `,
            params: [
              {
                mediaId: image.id,
                tableName: 'feedItems',
                tableKey: newFeedId,
                usage: 'banner',
              },
            ],
          })

          // Send wambi notification if the content is positive...CY
          if (isPositive) newsfeedNotification.sendWambi({ feedId: newFeedId, recipients: [person.id] }, clientAccountId)
        }

        // Send wambi sms and email notification if client account settings are turned on and the content is positive...CY
        if (isPositive && (notifications?.email || notifications?.sms)) {
          const notifData = await wambiDB.querySingle({
            queryText: /*sql*/ `
              SELECT P.id,
                IF(P.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.EMAIL_ONLY}), P.email, NULL) AS email,
                IF(P.notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.TEXT_ONLY}), P.mobile, NULL) AS mobile,
                CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS recipientName
              FROM people P
              INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
              WHERE P.id = ?
            `,
            params: [person.id],
          })

          const { email, mobile, recipientName } = notifData

          const cpcUrl = `https://${host}/newsfeed?feedId=${newFeedId}`

          if (email && notifications?.email) {
            const cpcContent = gratitude.split(' ').length > 5 ? `"${gratitude.split(' ').slice(0, 5).join(' ')}..."` : `"${gratitude}"`

            sendWambiFromPatient_Email({ clientAccountId, cpcContent, cpcUrl, email, recipientName })
          }

          if (mobile && notifications?.sms) sendWambiFromPatient_SMS({ clientAccountId, cpcUrl, to: [notifData] })
        }
      }

      if (isPositive && surveys?.disableWambiWebPublish !== true) {
        // Push the CPC data to the cpc.com site...JC
        const cpcPayload = {
          content: gratitude,
          fac_name: location.name,
          name: person.name,
          name_from: 'One Grateful Patient',
        }

        axios.post(`${process.env.CAREPOSTCARD_URL}/cpcs/legacy`, cpcPayload, {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    await wambiDB.commitTransaction(transaction)

    // User gets a low enough score to trigger patient feedback notifs (happens regardless of submitting feedback info)...JC
    if (answers.some(a => a.rating <= location.commentPromptThreshold)) {
      const reviewUrl = `https://${host}/profile?surveyId=${surveyId}`

      // Always send to portal notify on feedback list...JC
      if (portalRes?.notifyOnFeedback) {
        sendPatientFeedbackAlert_Email({ emails: portalRes.notifyOnFeedback, reviewUrl, revieweeName: person.name })
      }

      // Only send feedback to managers if client account settings are turned on...JC
      if (notifications?.email || notifications?.sms) {
        const managers = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT P.id, P.email, P.mobile,
              CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS managerName
            FROM people P
            INNER JOIN surveys S ON (S.id = ${surveyId} AND S.accountId = ${clientAccountId})
            INNER JOIN (
              ${selectUserLeaders({ clientAccountId, userId: person.id })}
            ) UM ON (P.id = UM.id)
            INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
            WHERE P.id <> ?
          `,
          params: [person.id],
        })

        if (managers.length) {
          if (notifications?.email && managers.some(m => m.email != null)) {
            const managersToEmail = managers.filter(m => m.email != null)
            sendPatientFeedbackAlert_Email({ managers: managersToEmail, reviewUrl, revieweeName: person.name })
          }
          if (notifications?.sms && managers.some(m => m.mobile != null)) {
            const managersToText = managers.filter(m => m.mobile != null)
            sendPatientFeedbackAlert_SMS({
              reviewUrl,
              to: managersToText,
            })
          }
        }
      }
    }

    if (perfectScore || hotStreakComplete || gratitude || daisyInfo?.comment) {
      handleChallenges({
        clientAccountId,
        isMe: false,
        req,
        triggers: [
          perfectScore && TRIGGERS.REVIEW_PERFECT_SCORE,
          hotStreakComplete && TRIGGERS.REVIEW_HOT_STREAK,
          gratitude && isPositive && TRIGGERS.CPC_RECEIVE_FROM_REVIEW,
          daisyInfo?.comment && TRIGGERS.REVIEW_GOT_NOMINATED,
        ],
        userId: person.id,
      })
    }

    if (reviewer?.collectorId) {
      handleChallenges({
        clientAccountId,
        isMe: false,
        req,
        triggers: [TRIGGERS.REVIEW_OWNER_COLLECT],
        userId: reviewer.collectorId,
      })
    }

    if (contactInfo?.contact) surveyNotification.surveyFollowUp({ accountId: clientAccountId, surveyId, userId: person.id })

    // Send perfect score/hot streak notifications...JC
    if (perfectScore) {
      const { email, firstName, mobile } = await wambiDB.querySingle({
        queryText: /*sql*/ `
          SELECT firstName,
            IF(notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.EMAIL_ONLY}), email, NULL) AS email,
            IF(notifyMethod IN (${USER_NOTIFY_METHODS.TEXT_AND_EMAIL}, ${USER_NOTIFY_METHODS.TEXT_ONLY}), mobile, NULL) AS mobile
          FROM people
          WHERE id = ?
        `,
        params: [person.id],
      })

      const url = `https://${host}`
      surveyNotification.perfectScore({ accountId: clientAccountId, surveyId, userId: person.id })
      if (email) sendPerfectScore_Email({ email, name: firstName, url })
      if (mobile) sendPerfectScore_SMS({ to: [{ mobile }], url })

      if (hotStreakComplete) {
        surveyNotification.hotStreak({ accountId: clientAccountId, surveyId, userId: person.id })
        surveyNotification.managerHotStreak({ accountId: clientAccountId, userId: person.id })
        if (email) sendHotStreak_Email({ email, name: firstName, perfectScoreCount, url })
        if (mobile) sendHotStreak_SMS({ to: [{ mobile }], url })
      }
    }

    return res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    if (transaction) await wambiDB.rollbackTransaction(transaction)
    return res.json({ success: false, msg: 'Error occurred; check server logs.' })
  }
}

const allowCpcEdit = ['content']
const allowDaisyEdit = ['awardTypeId', 'comment', 'metadata', 'nominatorId', 'nomineeId', 'surveyId']
const allowSurveyEdit = ['comment', 'email', 'firstName', 'lastName', 'mobile']

// This function allows only fields the end user is allowed to edit to be returned (could also do validation and rejection)
function protectEdit(row, mergeAfter, allowedEdits) {
  let validRow = {}
  for (let p in row) {
    if (allowedEdits.indexOf(p) > -1) {
      validRow[p] = row[p] === '' ? null : row[p]
    }
  }

  // mergeAfter is used for service specified defaults that may not be allowed to edit by end users (i.e. accountId)...EK
  if (mergeAfter != null) {
    validRow = {
      ...validRow,
      ...mergeAfter,
    }
  }

  return validRow
}
