const ingestCustomTraits = async ({ clientAccountId, ingestionTableName, logger, tempTableFields }) => {
  // For each trait mapped, we need to create and then link traits (NOTE: We only add, we don't remove traits)
  const traitsMapped = tempTableFields.filter(f => f.startsWith('trait'))

  await logger.logInfo(`Handling ${traitsMapped.length} custom traits...`)

  for (let traitIdx = 0; traitIdx < traitsMapped.length; traitIdx++) {
    const [traitField] = traitsMapped[traitIdx].split(' ')
    const [, traitTypeId] = traitField.split('_')

    const traitType = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT *
        FROM traitTypes TT
        WHERE TT.id = ?
          AND TT.accountId = ${clientAccountId}
      `,
      params: [traitTypeId],
    })

    if (traitType == null) {
      await logger.logWarning(`Invalid trait type id for this client account (skipping): ${traitTypeId}`)
      continue
    } else {
      await logger.logInfo(`Ingesting custom trait type "${traitType.name}" (${traitTypeId})...`)
    }

    // Ensure that we have all the trait values that are in the import - create if missing...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO traits (traitTypeId, name)
          SELECT ${traitTypeId}, I.name
          FROM (
            SELECT DISTINCT DFI.trait_${traitTypeId} AS name
            FROM ${ingestionTableName} DFI
            WHERE NULLIF(DFI.trait_${traitTypeId}, '') IS NOT NULL
          ) I
          LEFT JOIN traits T ON (T.traitTypeId = ${traitTypeId} AND T.name = I.name)
          WHERE T.id IS NULL  -- Meaning that this trait values doesn't exist for this type...EK
        ;
      `,
    })

    // Link people to traits as identified in the import file - all possible trait values exist at this point (see above)...EK
    const traitsLinked = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        INSERT INTO peopleTraits (peopleId, traitId)
          SELECT DFI.peopleId, T.id
          FROM ${ingestionTableName} DFI
          INNER JOIN traits T ON (T.traitTypeId = ${traitTypeId} AND T.name = DFI.trait_${traitTypeId})
          LEFT JOIN (
            SELECT PT.id, DFI.peopleId
            FROM ${ingestionTableName} DFI
            INNER JOIN peopleTraits PT ON (DFI.peopleId = PT.peopleId)
            INNER JOIN traits T ON (PT.traitId = T.id AND T.traitTypeId = ${traitTypeId} AND T.name = DFI.trait_${traitTypeId})
          ) PT ON (DFI.peopleId = PT.peopleId)
          WHERE PT.id IS NULL  -- Where this person is not already linked to a given trait...EK
        ;
      `,
    })

    await logger.logInfo(`Traits linked: ${traitsLinked.affectedRows}`)

    // If a person is now linked to more than one trait within the trait type then we need to remove the old link...EK
    const oldTraitsLinksToRemove = await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        SELECT MIN(PT.id) AS id
        FROM peopleTraits PT
        INNER JOIN traits T ON (PT.traitId = T.id AND T.traitTypeId = ${traitTypeId})
        GROUP BY PT.peopleId
        HAVING COUNT(PT.id) > 1
      `,
    })

    if (oldTraitsLinksToRemove.length > 0) {
      await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE FROM peopleTraits
          WHERE id IN (${oldTraitsLinksToRemove.map(({ id }) => id).join(',')})
        `,
      })
    }

    // Handle the trait cross reference (where the trait value is consolidated or cleaned up into a different trait type for user display)...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        -- Create a temporary table with the source / target traits by person
        DROP TEMPORARY TABLE IF EXISTS traitCrossRefs;
        CREATE TEMPORARY TABLE traitCrossRefs AS
          SELECT XRef.peopleId, XRef.sourceTraitId, XRef.targetTraitId, XRef.targetTraitTypeId
          FROM (
            SELECT DFI.peopleId, T.id AS sourceTraitId, TM.id AS targetTraitId, TM.traitTypeId AS targetTraitTypeId
            FROM peopleTraits PT
            INNER JOIN ${ingestionTableName} DFI ON (PT.peopleId = DFI.peopleId)
            INNER JOIN traits T ON (PT.traitId = T.id AND T.traitTypeId = ${traitTypeId} AND T.crossRefId IS NOT NULL)
            INNER JOIN traits TM ON (T.crossRefId = TM.id)
          ) XRef
          LEFT JOIN peopleTraits PT ON (XRef.peopleId = PT.peopleId AND XRef.targetTraitId = PT.traitId)
          WHERE PT.id IS NULL
        ;

        -- Duplicate the table.. because.. well.. MySql 5.7...EK
        DROP TEMPORARY TABLE IF EXISTS traitCrossRefs2;
        CREATE TEMPORARY TABLE traitCrossRefs2 AS
          SELECT * FROM traitCrossRefs
        ;

        -- Remove any trait within the same trait type that the target is now pointing to (in case the person moved from one to another)
        DELETE PT
        FROM peopleTraits PT
        INNER JOIN traits T ON (PT.traitId = T.id)
        WHERE PT.peopleId IN (SELECT peopleId FROM traitCrossRefs)
          AND T.traitTypeId IN (SELECT DISTINCT targetTraitTypeId FROM traitCrossRefs2)
        ;

        -- Insert the trait cross references to link them to the consolidated trait identified by the crossRefId...EK
        INSERT INTO peopleTraits (peopleId, traitId)
          SELECT peopleId, targetTraitId
            FROM traitCrossRefs
        ;

        DROP TEMPORARY TABLE IF EXISTS traitCrossRefs;
      `,
    })
  }

  await logger.logInfo('Finished custom traits...')
}

module.exports = {
  ingestCustomTraits,
}
