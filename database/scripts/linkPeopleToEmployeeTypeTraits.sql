select * from clientAccounts;

SET @clientAccountId = 15;

SET @teamMemberTraitId = (SELECT T.id
FROM traits T
INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = @clientAccountId AND TT.name = 'Employee Type')
WHERE T.name = 'Team Member')
;

SET @leaderMemberTraitId = (SELECT T.id
FROM traits T
INNER JOIN traitTypes TT ON (T.traitTypeId = TT.id AND TT.accountId = @clientAccountId AND TT.name = 'Employee Type')
WHERE T.name = 'Leader')
;

INSERT INTO peopleTraits (peopleId, traitId)
	SELECT P.id, IF(MAX(PG.level) = 3, @leaderMemberTraitId, @teamMemberTraitId)
	FROM people P
	INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = @clientAccountId)
	INNER JOIN peopleGroups PG ON (P.id = PG.peopleId)
	GROUP BY P.id