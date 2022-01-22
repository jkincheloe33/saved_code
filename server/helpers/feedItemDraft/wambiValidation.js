import { getOwnedDraftGroups } from '@serverHelpers/feedItemDraft/getOwnedDraftGroups'
import { CPC_TYPES_STATUS, USER_STATUS } from '@utils/types'

const _validateType = async ({ clientAccountId, draftData, type, userId }) => {
  const validatedType = await wambiDB.querySingle({
    queryText: /*sql*/ `
      SELECT CT.exampleText, CT.id, CT.name, CT.cpcThemeId, CT.awardTypeId, A.name AS awardName,
        M.id AS mediaId, CONCAT('${process.env.MEDIA_CDN}/', M.category, '/', M.uid, '.', M.ext) AS src
      FROM cpcTypes CT
      INNER JOIN peopleGroups PG ON (PG.peopleId = ${userId} AND PG.level >= CT.whoCanSend)
      INNER JOIN mediaLink ML ON (ML.tableName = 'cpcTypes' AND ML.tableKey = CT.id)
      INNER JOIN media M ON (ML.mediaId = M.id AND M.accountId = ${clientAccountId})
      LEFT JOIN awardTypes A ON (A.id = CT.awardTypeId)
      WHERE CT.id = ${type.id}
        AND CT.status = ${CPC_TYPES_STATUS.ACTIVE}
        AND IFNULL(CT.startDate, CURDATE()) <= CURDATE()
        AND IFNULL(CT.endDate, CURDATE()) >= CURDATE()
        AND CT.accountId = ${clientAccountId}
    `,
  })

  // Replace with updated data, such as a new uploaded image...JC
  draftData.type = validatedType || null

  return validatedType
}

const _validateGroups = async ({ clientAccountId, draftData, excludedRecipients, groups, userId }) => {
  const excludedRecipientsClause = excludedRecipients.length ? `AND PG.peopleId NOT IN (${excludedRecipients})` : ''

  const validGroups = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT G.id
      FROM groups G
      -- Checks that there are still valid people in the group to send to...JC
      INNER JOIN peopleGroups PG ON (G.id = PG.groupId ${excludedRecipientsClause})
      INNER JOIN people P ON (P.id = PG.peopleId AND P.status = ${USER_STATUS.ACTIVE})
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
      WHERE G.id IN (${groups.map(g => g.id)})
    `,
  })

  const activeGroups = groups.filter(g => validGroups.find(eg => eg.id === g.id))

  if (!activeGroups.length) {
    draftData.groups = []
    return
  }

  const regGroups = activeGroups.filter(g => !g.isRealm)
  const realmGroups = activeGroups.filter(g => g.isRealm)

  let ownedRealmGroups = []

  // Filter out realm groups user no longer owns. Regular groups are allowed for anyone...JC
  if (realmGroups.length) {
    ;({ ownedDraftGroups: ownedRealmGroups } = await getOwnedDraftGroups({ clientAccountId, groups: realmGroups, userId }))
  }
  draftData.groups = [...regGroups, ...ownedRealmGroups]
}

const _validateRecipients = async ({ clientAccountId, draftData, excludedRecipients, recipients }) => {
  const activeRecipients = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT P.id
      FROM people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId} AND CAP.isIncognito = 0)
      WHERE P.id IN (${[...excludedRecipients, ...recipients.map(r => r.id)]})
        AND P.status = ${USER_STATUS.ACTIVE}
    `,
  })

  // Remove invalid users from both recipient/excluded arrays...JC
  if (recipients.length) draftData.recipients = recipients.filter(r => activeRecipients.find(ar => ar.id === r.id))
  if (excludedRecipients.length) draftData.excludedRecipients = excludedRecipients.filter(id => activeRecipients.find(ar => ar.id === id))
}

const _validateValues = async ({ draftData, values }) => {
  const existingCpcValues = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT id
      FROM cpcValues
      WHERE id IN (${values})
    `,
  })

  draftData.values = values.filter(id => existingCpcValues.find(ev => ev.id === id))
}

// If type is linked to an award, validate it whether user has nominated someone or not...JC
const _validateNomination = ({ draftData, draftType, validatedType }) => {
  const invalidNomination = !validatedType || validatedType?.awardTypeId !== draftType.awardTypeId
  if (invalidNomination) {
    draftData.type = { ...draftType, awardId: null, awardName: null }
    draftData.nominate = false
    draftData.nominateComment = ''
  }
}

module.exports = {
  validateWambiDraft: async ({ clientAccountId, draftData, userId }) => {
    const { excludedRecipients, content, groups, recipients, type, values } = draftData

    const originalGroups = groups
    const originalRecipients = recipients

    const [validatedType] = await Promise.all([
      type && _validateType({ clientAccountId, draftData, type, userId }),
      groups.length && _validateGroups({ clientAccountId, draftData, excludedRecipients, groups, userId }),
      (recipients.length || excludedRecipients.length) &&
        _validateRecipients({ clientAccountId, draftData, excludedRecipients, recipients }),
      values.length && _validateValues({ draftData, values }),
    ])

    if (type?.awardId) _validateNomination({ draftData, draftType: type, validatedType })

    const validOriginalRecipients = Boolean(originalGroups.length || originalRecipients.length)
    const validNewRecipients = Boolean(draftData.groups.length || draftData.recipients.length)

    // Validate dataset - shape new draft data by filtering out invalid data...JC
    const invalidRecipients = validOriginalRecipients && !validNewRecipients
    const invalidType = !draftData?.type
    const isValid = !(invalidRecipients || invalidType || !content)
    return { invalidRecipients, invalidType, isValid, validatedDraftData: draftData }
  },
}
