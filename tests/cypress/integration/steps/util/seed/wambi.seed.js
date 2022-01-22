const { login } = require('./helper')

export const createWambi = () => {
  const createWambiRequest = ({ clientAccountId, me }) => {
    const group = me.groups[0]

    //Get data needed for create CPC...CY
    return cy
      .task('query', {
        queryText: /*sql*/ `
          SELECT PG.peopleId FROM peopleGroups PG 
          INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId}) 
          INNER JOIN groupIndex GI ON (G.id = GI.fromGroupId AND GI.groupId = ${group.id})
          WHERE PG.peopleId <> ${me.id}
          ORDER BY G.depth DESC 
          LIMIT 1;
          SELECT id FROM media WHERE accountId = ${clientAccountId} AND category = 'cpc/banner' LIMIT 1;
          SELECT id FROM cpcTypes WHERE accountId = ${clientAccountId} LIMIT 1;
          SELECT id FROM clientValues WHERE accountId = ${clientAccountId} LIMIT 1;
        `,
      })
      .then(res => {
        const [peopleId, mediaId, cpcTypeId, valuesId] = res.flatMap(value => Object.values(...value))

        cy.request('POST', `${Cypress.env('WAMBI_URL')}api/site/wambi/postWambi`, {
          cpcData: {
            message: `test${Math.floor(Math.random() * 9999)}`,
            nominate: false,
            recipients: [
              {
                id: peopleId,
              },
            ],
            shareOnNewsfeed: true,
            type: {
              id: cpcTypeId,
              mediaId,
            },
            values: [valuesId],
          },
        })
      })
  }

  login({ task: createWambiRequest })
}
