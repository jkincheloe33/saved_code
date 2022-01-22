
/*
	Create client Account SQL Script
	Written By: Eric Kachelmeyer - April 29, 2021

    Creates a mostly empty client account (one default group type / root group / linked people).
*/

INSERT INTO clientAccounts (name, host, crmId, settings)
	VALUES ('NAME', 'dns.wambiapp.com', 'CRMID', '{"ssoProvider": null, "featureToggles": {}, "defaultGroupSettings": {}}')
;

SET @newClientAccountId = LAST_INSERT_ID();

INSERT INTO clientAccountPeople (accountId, peopleId, accessLevel)
	SELECT CA.id, P.id, 7
    FROM people P
    LEFT JOIN clientAccounts CA ON (CA.id = @newClientAccountId)
    WHERE P.hrId IN (
        'W00045',
        'W00048'
    )
    AND P.status = 1
;
    
INSERT INTO clientAccountPeople (accountId, peopleId, accessLevel)
	SELECT CA.id, P.id, 6
    FROM people P
    LEFT JOIN clientAccounts CA ON (CA.id = @newClientAccountId)
    WHERE P.hrId IN (
		'W00009',
        'W00014',
        'W00017',
        'W00021',
        'W00038',
        'W00040',
        'W00041',
        'W00044',
        'W00062'
	)
    AND P.status = 1
;
    
INSERT INTO clientAccountPeople (accountId, peopleId, accessLevel)
	SELECT CA.id, P.id, 5
    FROM people P
    LEFT JOIN clientAccounts CA ON (CA.id = @newClientAccountId)
    WHERE P.hrId IN (
        'W00008',
		'W00019'
	)
    AND P.status = 1
;

-- You can change the default group type name here
INSERT INTO groupTypes (accountId, name)
	SELECT CA.id, 'Health System'
    FROM clientAccounts CA
    WHERE CA.id = @newClientAccountId
;
    
-- You can change the default group name here of the above type...EK
INSERT INTO groups (accountId, groupTypeId, name, depth, runtimeSettings)
    SELECT CA.id, GT.id, 'Health System', 0, '{}'
    FROM clientAccounts CA
    INNER JOIN groupTypes GT ON (CA.id = GT.accountId)
    WHERE CA.id = @newClientAccountId
;
        
INSERT INTO groupIndex (groupId, depth, fromGroupId)
	SELECT G.id, 0, G.id
    FROM groups G
    WHERE G.accountId = @newClientAccountId
;

INSERT INTO peopleGroups (groupId, peopleId, level)
	SELECT G.id, P.id, 3
    FROM people P
    INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = @newClientAccountId)
    LEFT JOIN groups G ON (G.accountId = @newClientAccountId)
;