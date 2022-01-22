import {
  associatePeopleWithCostGroups,
  cleanUpOldFiles,
  createIngestTableFromSources,
  deactivatePeople,
  generateCostGroupClientIds,
  getIngestFileKey,
  handleOrganizationGroups,
  ingestCustomTraits,
  ingestNewPeople,
  ingestPeopleUpdates,
  matchExistingPeople,
  parseIngestSourceFiles,
  reactivatePeople,
} from '@serverHelpers/ingest'

// Password for agency people
// More logic for more people

import { GROUP_ACCESS_LEVELS, USER_STATUS } from '@utils/types'
import { hashPassword } from '@serverHelpers/security'

export default async (req, res) => {
  const { clientAccount } = req

  try {
    // Verify that the request is for hmh client account...EK
    if (clientAccount.host.split('.')[0] !== 'uhealth') {
      return res.json({ msg: 'Incorrect client account DNS for UHEALTH ingestion.  Check the host in your request.', success: false })
    }

    // Get latest import file...EK
    const importFile = await getIngestFileKey('sftp-uhealth', 'csv')

    const agencyImportFile = await getIngestFileKey('sftp-uhealth-agency', 'xlsx')

    // Pull and parse the ingest file(s) and config(s) from the SFTP sources found above...EK
    const fileSources = await parseIngestSourceFiles([
      {
        configKey: 'configs/uhealth-config.json',
        importFileKey: importFile.Key,
      },
      {
        configKey: 'configs/uhealth-agency-config.json',
        importFileKey: agencyImportFile.Key,
      },
    ])

    // Init and populate the ingestion table...EK
    const ingestScope = await createIngestTableFromSources(clientAccount, fileSources, req)

    // CUSTOM: Add pilot flags to the ingest table to track what should be included and at what level of activity...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        ALTER TABLE ${ingestScope.ingestionTableName}
        ADD COLUMN activePilot TINYINT(4) NULL DEFAULT NULL AFTER custom_super_org,
        ADD COLUMN inactivePilot TINYINT(4) NULL DEFAULT NULL AFTER activePilot
        ;
      `,
    })

    // CUSTOM: We flag all people who are active in the pilot...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.activePilot = 1
        WHERE
          -- Must be in the building
          groups_site IN ('1063', '1075')
          -- Must have the job family
          AND
          (
            trait_67 IN (
              'Advanced Practice',
              'Environmental Services',
              'Food Services',
              'Nutrition Services',
              'Patient Experience & Services',
              'Social Services'
            )
            OR
            (
              trait_67 IN (
                'Allied Health',
                'Nursing',
                'Nursing - Administration',
                'Unit / Admin Support'
              )
              AND
              custom_super_org IN (
                -- Floors in UHealth Tower - East ('1063')
                'Sup-Org_003417', 'Sup-Org_003447', 'Sup-Org_105478', 	-- 6 North
                'Sup-Org_101550', 'Sup-Org_101551', 					-- 8 North
                'Sup-Org_101161', 'Sup-Org_101162',						-- 8 South
                'Sup-Org_100786', 'Sup-Org_100787',						-- 9 North
                'Sup-Org_101435', 'Sup-Org_101436',						-- 10 North
                'Sup-Org_003419', 'Sup-Org_003449',						-- 11 North

                -- Floors in Sylvester Cancer Center (SCCC) - ('1075')
                'Sup-Org_000646' , 'Sup-Org_000862', 'Sup-Org_000747',	-- Inpatient (2nd Floor)
                
                -- Agency nurses that float
                'Float'
              )
            )
          )
          AND
          (
            people_jobTitle IN (
              'Advanced Practice Registered Nurse',
              'Advanced Practice Registered Nurse - Fellow',
              'Advanced Practice Registered Nurse - PRN (U)',
              'Advanced Practice Registered Nurse (N)',
              'Advanced Practice Registered Nurse (U)',
              'Associate Chief Nursing Officer',
              'Case Manager',
              'Case Manager - PRN (U)',
              'Case Manager (U)',
              'Case Manager RN',
              'Case Manager RN (U)',
              'Certified Nursing Assistant - PRN (U)',
              'Certified Nursing Assistant 1',
              'Certified Nursing Assistant 1 - On Call (U)',
              'Certified Nursing Assistant 1 (U)',
              'Certified Nursing Assistant 2',
              'Certified Nursing Assistant 3 (U)',
              'Charge Nurse (U)',
              'Chief Nursing Officer - Hospital',
              'Clinical Dietitian',
              'Dietitian',
              'Director, Nursing',
              'Director, Respiratory Therapy',
              'Environmental Services Technician - PRN (U)',
              'Environmental Services Technician (U)',
              'Executive Director, Nursing',
              'Exercise Physiologist 2',
              'Food Service Supervisor',
              'Food Service Worker - Trayline (U)',
              'Licensed Practical Nurse (LPN)',
              'Licensed Practical Nurse (LPN) (U)',
              'Manager, Case Management',
              'Manager, Nursing',
              'Manager, Nutrition Services',
              'Manager, Respiratory Therapy',
              'Manager, Social Services',
              'Nurse Navigator',
              'Nurse Specialist',
              'Nursing Assistant (U)',
              'Nutrition Assistant (U)',
              'Patient Experience Coordinator (U)',
              'Patient Experience Representative',
              'Patient Experience Specialist',
              'Patient Experience Specialist (N)',
              'Patient Navigator',
              'Registered Nurse',					-- Agency file specific
              'Certified Nursing Assistant',		-- Agency file specific
              'Tele Tech',						-- Agency file specific
              'Registered Nurse - Per Diem',
              'Registered Nurse - Per Diem (U)',
              'Registered Nurse - Per Diem On Call (U)',
              'Registered Nurse - Specialty - Per Diem',
              'Registered Nurse 1',
              'Registered Nurse 1 - On Call (U)',
              'Registered Nurse 1 - Specialty',
              'Registered Nurse 1 - Specialty - On Call (U)',
              'Registered Nurse 1 - Specialty - On Call B (U)',
              'Registered Nurse 1 - Specialty (U)',
              'Registered Nurse 1 (U)',
              'Registered Nurse 2',
              'Registered Nurse 2 - On Call (U)',
              'Registered Nurse 2 - Specialty',
              'Registered Nurse 2 - Specialty - On Call (U)',
              'Registered Nurse 2 - Specialty - On Call B (U)',
              'Registered Nurse 2 - Specialty (U)',
              'Registered Nurse 2 (U)',
              'Registered Nurse 3',
              'Registered Nurse 3 - Specialty',
              'Registered Nurse 3 - Specialty - On Call (U)',
              'Registered Nurse 3 - Specialty - On Call B (U)',
              'Registered Nurse 3 - Specialty (U)',
              'Registered Nurse – Specialty – Per Diem (U)',
              'Registered Nurse – Specialty – Per Diem On Call (U)',
              'Respiratory Therapist',
              'Respiratory Therapist - Certified 1',
              'Respiratory Therapist - Certified 1 (U)',
              'Respiratory Therapist - Certified 2',
              'Respiratory Therapist - Registered 1',
              'Respiratory Therapist - Registered 2',
              'Respiratory Therapist - Registered 2 (U)',
              'Respiratory Therapist - Registered PRN (U)',
              'Social Worker - Per Diem (U)',
              'Social Worker (N)',
              'Social Worker, LCSW',
              'Social Worker, MSW',
              'Sr. Cardio Catheterization Technician (U)',
              'Sr. Clinical Dietitian',
              'Sr. Environmental Services Technician (U)',
              'Sr. Food Service Worker (U)',
              'Sr. Respiratory Therapist',
              'Sr. Respiratory Therapist - PRN (U)',
              'Sr. Respiratory Therapist (U)',
              'Sr. Surgical Technician - PRN (U)',
              'Supervisor, Advanced Practice Providers',
              'Supervisor, Environmental Services',
              'Supervisor, Nursing',
              'Supervisor, Nursing TP',
              'Supervisor, Social Services',
              'Supervisor, Transportation',
              'Surgical Assistant',
              'Telemetry Technician 1 (U)',
              'Unit Secretary - PRN (U)',
              'Unit Secretary - Specialty (U)',
              'Unit Secretary (U)'
            )
          )
        ;
      `,
    })

    // CUSTOM: Per FD 4601 - include all people who report to the super_org Sup-Org_000741 - UHealth Public Safety - UHT 1 -STA (Todd Blevins)
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.activePilot = 1
        WHERE custom_super_org IN ('Sup-Org_000741')
        ;
      `,
    })

    // CUSTOM: Per FD 4601 - Include Patient Experience & Services for ALL buildings (does overlap original criteria)...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.activePilot = 1
        WHERE custom_super_org IN ('Sup-Org_103790', 'Sup-Org_103853')
          AND trait_67 IN ('Patient Experience & Services')
          AND people_jobTitle IN (
            'Patient Experience Representative',
            'Patient Experience Specialist',
            'Patient Experience Specialist (N)'
          )
        ;
      `,
    })

    const manuallyAddedTraitId = clientAccount.host === 'uhealth.wambiapp.com' ? 716 : 0

    // CUSTOM: Ensure manually entered people are active in the pilot ...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE ${ingestScope.ingestionTableName} DFI
        SET DFI.activePilot = 1
        WHERE DFI.people_hrId IN (
          SELECT P.hrId
          FROM people P
          INNER JOIN peopleTraits PT ON (P.id = PT.peopleId AND PT.traitId = ${manuallyAddedTraitId})
        )
        ;
      `,
    })

    // CUSTOM: We now take those who are active and walk up the hierarchy to capture all managers not included but still need for the org hierarchy...EK
    let managersAdded = 1

    while (managersAdded > 0) {
      const managerUpdateRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          UPDATE ${ingestScope.ingestionTableName} DFI
          INNER JOIN (
            SELECT DISTINCT DFI.people_reportsTo
              FROM ${ingestScope.ingestionTableName} DFI
              LEFT JOIN ${ingestScope.ingestionTableName} DFI_MGR ON (DFI.people_reportsTo = DFI_MGR.people_hrId AND DFI_MGR.activePilot = 1)
              WHERE
                DFI.activePilot = 1
                AND DFI_MGR.id IS NULL
          ) I ON (DFI.people_hrId = I.people_reportsTo)
          SET DFI.activePilot = 1
          ;
        `,
      })

      managersAdded = managerUpdateRes.affectedRows
    }

    // CUSTOM: Now we can DELETE anyone not included either actively or inactively in the pilot...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DELETE DFI
        FROM ${ingestScope.ingestionTableName} DFI
        WHERE DFI.activePilot IS NULL
        ;
      `,
    })

    // Link people (MUST be ran before any other ingestion - split out so we can make ingest data changes before link occurs)...EK
    await matchExistingPeople(ingestScope)

    // Perform the actual import...EK
    await ingestNewPeople(ingestScope)
    await ingestPeopleUpdates(ingestScope)
    await reactivatePeople(ingestScope, 'AND DFI.activePilot = 1')
    await ingestCustomTraits(ingestScope)

    // NOTE: Temporary only link to building due to multiple issues with Floor/sub group relationships...EK
    await generateCostGroupClientIds(ingestScope, 'DFI.groups_site')
    // NOTE: Because everyone is at the building level, all are level 1 unless we manually update their membership level
    await associatePeopleWithCostGroups(ingestScope, `${GROUP_ACCESS_LEVELS.TEAM_MEMBER}`)

    // CUSTOM: This account has a trait linked to people who are manually added that we ignore during the deactivate process...EK
    await deactivatePeople(
      ingestScope,
      /*sql*/ `
      AND P.email NOT LIKE '%wambi.org%'
    `
    )

    // CUSTOM: Per FD 4470 - There are executives that are not explicitly included in the pilot, but should be active and incognito...EK
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        UPDATE people P
        SET P.status = 1,
          P.deactivatedAt = NULL
        WHERE P.hrId IN ('50063834', '50050908', '50093110', '50023627', '54143991')
        ;

        UPDATE clientAccountPeople CAP
        INNER JOIN people P ON (CAP.peopleId = P.id AND CAP.accountId = ${clientAccount.id})
        SET CAP.isIncognito = 1
        WHERE P.hrId IN ('50093110', '50023627', '54143991')
        ;
      `,
    })

    // Handle organization hierarchy updates...EK
    await handleOrganizationGroups(ingestScope, {
      rootLeaderHrId: '54143991',
      orgGroupTypeId: 124,
      groupNameFormula: 'CONCAT(DO.fullName, "\'s Team")',
    })

    // Auto assign agency passwords (Which will default to their CANE ID)
    // CUSTOM: Agency users do not have SSO, so new users must be set a default password...EK

    // This calculates users who have no password so they can be set...EK
    const usersWithBlankPasswords = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT P.id, P.hrId
        FROM people P
        WHERE P.id IN (
          SELECT DFI.peopleId
          FROM ${ingestScope.ingestionTableName} DFI
          WHERE peopleGroups_level = 'Agency'
        )
        AND P.passwordHash IS NULL
        AND P.status = ${USER_STATUS.ACTIVE}
        ;
      `,
    })

    // Set the password for each person (here, it defaults to their hrId)...EK
    if (usersWithBlankPasswords.length > 0) {
      for (let i = 0; i < usersWithBlankPasswords.length; i++) {
        const person = usersWithBlankPasswords[i]
        person.passwordHash = await hashPassword(person.hrId)
      }

      // Execute the update statement to set the newly generated password hashes...EK
      await wambiDB.executeNonQuery({
        commandText: usersWithBlankPasswords
          .map(
            p => /*sql*/ `
              UPDATE people
              SET passwordHash = '${p.passwordHash}'
              WHERE id = ${p.id}
            `
          )
          .join(';\n'),
      })
    }

    // Remove old files (not including the files we just imported in case we need to reference them)...EK
    await cleanUpOldFiles('sftp-uhealth', [importFile.Key])

    // Resolve and return...EK
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
}
