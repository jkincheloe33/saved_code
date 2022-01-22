const TRAIT_TYPE_NAME = 'QA Trait Type'
const TRAIT_NAME = 'QA Trait'

const getTraits = async ({ clientAccountId, dashboardId, peopleId, wambiDB }) => {
  let traitType = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT *
      FROM traitTypes 
      WHERE accountId = ${clientAccountId}
        AND name = '${TRAIT_TYPE_NAME}'
    `,
  })

  if (!traitType) {
    const { insertId: id } = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO traitTypes (accountId, isReviewFilter, name) 
        VALUES (${clientAccountId}, 1, '${TRAIT_TYPE_NAME}')
      `,
    })

    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO traits (name, traitTypeId)
        VALUES ('${TRAIT_NAME}', ${id})
      `,
    })

    traitType = {
      id,
    }
  }

  const traits = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT *
      FROM traits
      WHERE traitTypeId = ${traitType.id}
    `,
  })

  // Check if all keys exist in the linkTable...CY
  if (dashboardId) {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE dashboards
        SET filterTraitTypeId = ${traitType.id}
        WHERE id = ${dashboardId}
      `,
    })
  }

  if (peopleId) {
    const peopleTrait = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT *
        FROM peopleTraits 
        WHERE peopleId = ${peopleId}
          AND traitId = ${traits[0].id}
      `,
    })

    if (!peopleTrait) {
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          INSERT INTO peopleTraits (peopleId, traitId)
          VALUES (${peopleId}, ${traits[0].id})
      `,
      })
    }
  }

  return { traits, traitType }
}

module.exports = {
  getTraits,
}
