const { getUserGroups } = require('@serverHelpers/user/groups')
const { GROUP_ACCESS_LEVELS } = require('@utils')

export default async (req, res) => {
  try {
    const {
      clientAccount: { id: clientAccountId },
      session: { isSSO, userId },
    } = req

    const wambiUser = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT P.*, MT.mimeType, MT.uploadName,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MO.category, '/', MO.uid, '.', MO.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS originalImage,
          IFNULL(CONCAT('${process.env.MEDIA_CDN}/', MT.category, '/', MT.uid, '.', MT.ext),
            CONCAT(LEFT(IFNULL(NULLIF(P.displayName, ''), P.firstName), 1), LEFT(P.lastName, 1))) AS thumbnailImage,
          CONCAT('${process.env.MEDIA_CDN}/', MP.category, '/', MP.uid, '.', MP.ext) AS pendingThumbnail,
          GROUP_CONCAT(G.name ORDER BY G.name separator ', ') groupName,
          CONCAT(IFNULL(NULLIF(P.displayName, ''), P.firstName), ' ', P.lastName) AS name,
          MAX(PG.level) AS groupAccessLevel,
          CAP.accessLevel AS clientAccessLevel, CAP.clientTermsAt
        FROM people P
        LEFT JOIN mediaLink MLO ON (P.id = MLO.tableKey AND MLO.usage = 'original' AND MLO.tableName = 'people')
        LEFT JOIN media MO ON (MLO.mediaId = MO.id)
        LEFT JOIN mediaLink MLT ON (P.id = MLT.tableKey AND MLT.usage = 'thumbnail' AND MLT.tableName = 'people')
        LEFT JOIN media MT ON (MLT.mediaId = MT.id)
        LEFT JOIN mediaLink MLP ON (P.id = MLP.tableKey AND MLP.usage = 'pendingThumbnail' AND MLP.tableName = 'people')
        LEFT JOIN media MP ON (MLP.mediaId = MP.id)
        INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
        INNER JOIN groups G ON (G.id = PG.groupId AND G.accountId = ${clientAccountId})
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        WHERE P.id = ${userId}
      `,
    })

    const isManager = await wambiDB.querySingle({
      queryText: /*sql*/ `
        SELECT 1 AS isManager
        FROM people P
        INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ${clientAccountId})
        WHERE P.reportsTo = ${userId}
      `,
    })

    wambiUser.isLeader = Boolean(isManager) || wambiUser.groupAccessLevel > GROUP_ACCESS_LEVELS.TEAM_MEMBER

    // Check if the user have to set a password or login with SSO...CY
    wambiUser.hasPassword = Boolean(wambiUser.passwordHash) || isSSO

    const { userGroups } = await getUserGroups({ clientAccountId, userId })

    // These are properties that shouldn't go to the client...EK
    const blockedProperties = [
      'code',
      'codeExpires',
      'emailCampaignId',
      'enableEmailCampaignSync',
      'passwordHash',
      'ssoId',
      'w3Id',
      'w3ManagerId',
      'w3pecks',
      'w3pecksTotal',
    ]

    blockedProperties.forEach(p => (wambiUser[p] = undefined))

    // Push whether this user logged in with SSO down to the client (used to help route if the session is expired)...EK
    wambiUser.isSSO = isSSO

    // Add user groups for current account...JC
    wambiUser.groups = userGroups

    res.json(wambiUser)
  } catch (error) {
    logServerError({ error, req })
    res.json({})
  }
}
