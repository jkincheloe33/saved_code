import mailchimp from '@mailchimp/mailchimp_marketing'
import { EMAIL_CAMPAIGN_SYNC_STATUS, GROUP_ACCESS_LEVELS, USER_STATUS } from '@utils'

const API_LIMIT = 500 // maximum amount of requests allowed at 1 time. see https://mailchimp.com/developer/marketing/docs/fundamentals/#api-limits...JK
const ROW_LIMIT = 2500

export default async (req, res) => {
  const { clientAccount, systemSettings } = req
  const {
    integrations: {
      mailchimp: { apiKey, audienceId, disabled, server },
    },
  } = { ...systemSettings, ...clientAccount.settings }

  let currentPage = 0
  let totalNewMembers = 0

  if (disabled !== true) {
    console.log(`================== Begin sync for ${clientAccount.name} ==================`)

    mailchimp.setConfig({
      apiKey,
      server,
    })

    try {
      // mailchimp api is throttled to 500 items per request and 10 connections max to the api at one time,
      // so we have an infinite loop that pages until we've queried all people on the client account...EK & JK
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const people = await wambiDB.query({
          queryText: /*sql*/ `
            SELECT DISTINCT P.email, P.firstName, P.id, P.jobTitle, P.lastName, P.status, CA.host, CA.name AS accountName, MAX(PG.level) AS groupAccessLevel
            FROM people P
            INNER JOIN clientAccountPeople CAP ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccount.id})
            INNER JOIN clientAccounts CA ON (CA.id = CAP.accountId)
            INNER JOIN peopleGroups PG ON (PG.peopleId = P.id)
            WHERE NULLIF(P.email, '') IS NOT NULL
              AND P.emailCampaignId IS NULL
              AND P.enableEmailCampaignSync = ${EMAIL_CAMPAIGN_SYNC_STATUS.ENABLED}
            GROUP BY P.id
            LIMIT ${currentPage * ROW_LIMIT}, ${ROW_LIMIT}
          `,
        })

        if (people.length > 0) {
          // setting up the expected fields for mailchimp...JK
          const members = people.map(p => ({
            email_address: p.email,
            email_type: 'html',
            merge_fields: {
              CACCOUNT: p.host,
              FNAME: p.firstName,
              JOB_TITLE: p.jobTitle ?? '',
              LNAME: p.lastName,
              ORG_NAME: p.accountName,
              SOURCE: 'Platform',
              U_STATUS: p.status === USER_STATUS.ACTIVE ? 'Active' : 'Inactive',
              USER_TYPE: p.groupAccessLevel === GROUP_ACCESS_LEVELS.TEAM_MEMBER ? 'Employee' : 'Leader',
              WAMBI_ID: p.id,
            },
            status: 'subscribed',
          }))

          // to not exceed API_LIMIT, break up into chunks. see API_LIMIT above...EK
          const numberOfWorkers = Math.ceil(members.length / API_LIMIT)
          await Promise.all(
            [...Array(numberOfWorkers)].map((_, workerIdx) => {
              return mailchimp.lists
                .batchListMembers(audienceId, {
                  members:
                    workerIdx < numberOfWorkers
                      ? members.slice(API_LIMIT * workerIdx, API_LIMIT * (workerIdx + 1))
                      : members.slice(API_LIMIT * workerIdx),
                  update_existing: true,
                })
                .then(res => {
                  if (res.new_members.length > 0) {
                    // storing each person's mailchimp id in the people table...JK
                    const updateList = res.new_members
                      .map(m => {
                        return `
                          UPDATE people
                          SET emailCampaignId = ${wambiDB.escapeValue(m.id)}
                          WHERE id = ${m.merge_fields.WAMBI_ID};
                        `
                      })
                      .join('\n')

                    wambiDB.executeNonQuery({
                      commandText: /*sql*/ `
                        ${updateList}
                      `,
                    })

                    totalNewMembers += res.new_members.length

                    console.log(
                      `================== Successfully synced a chunk of ${res.new_members.length} new user(s). ==================`
                    )
                  }

                  // an array of objects, each representing an email address that could not be added to the list or updated and an error message providing more details...JK
                  if (res.errors?.length > 0) {
                    console.error('Error syncing emails. Check server logs')
                    logServerError({ error: res.errors, req })
                  }
                })
                .catch(error => {
                  logServerError({ error, req })
                })
            })
          )

          if (people.length < ROW_LIMIT) break
          currentPage = currentPage + 1
        } else {
          console.log(`All users in ${clientAccount.name} already synced!`)
          break
        }
      }

      if (totalNewMembers > 0) res.json({ msg: `Successfully synced ${totalNewMembers} new user(s).`, success: true })
      else res.json({ msg: `All users in ${clientAccount.name} already synced!`, success: true })
    } catch (error) {
      logServerError({ error, req })
      res.json({ msg: 'Error syncing email campaign. Check server logs', success: false })
    }
  } else {
    console.log('Email Campaign Sync disabled for this account.')
    res.json({ msg: 'Email Campaign Sync disabled for this account.', success: true })
  }
}
