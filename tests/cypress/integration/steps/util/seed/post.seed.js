const { login } = require('./helper')

export const createPost = ({ withPin = false }) => {
  const createPinPostTask = ({ clientAccountId, me, token }) => {
    return cy
      .task('querySingle', {
        queryText: /*sql*/ `
          SELECT PG.groupId AS id FROM peopleGroups PG
          INNER JOIN groups G ON (PG.groupId = G.id 
            AND PG.peopleId = ${me.id}
            AND G.accountId = ${clientAccountId} 
          )
      `,
      })
      .then(async res => {
        const formData = new FormData()
        formData.append('groups', `[${JSON.stringify(res)}]`)
        formData.append('traits', '[]')
        formData.append('post', 'Pin post from test')
        withPin && formData.append('pinDays', 9)

        const headers = new Headers()
        headers.append('Cookie', token)

        const fetchOption = {
          method: 'POST',
          headers,
          body: formData,
        }

        fetch(`${Cypress.env('WAMBI_URL')}api/site/newsfeed/announcements/postAnnouncement`, fetchOption)
          .then(response => response.json())
          .then(data => {
            console.log('Fetch response:', { data, withPin })
          })
      })
  }

  login({ task: createPinPostTask })
}

export const clearPinPost = () => {
  const clearPinPostTask = ({ me }) => {
    return cy.task('executeNonQuery', {
      commandText: /*sql*/ `
        UPDATE feedItems FI
        INNER JOIN feedGroups FG ON (FI.id = FG.feedId AND FG.groupId = ${me.groups[0].id})
        SET FI.status = 0
        WHERE FI.pinUntil > CURRENT_TIMESTAMP
      `,
    })
  }
  login({ task: clearPinPostTask })
}
