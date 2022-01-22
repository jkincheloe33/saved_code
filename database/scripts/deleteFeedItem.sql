
/*
	DELETE a feedItem and all associated reactions, comments, notifications, etc.
*/

SET @feedItemToDelete = 449853
;

SET @cpcIdToDelete = (SELECT cpcId FROM feedItems WHERE id = @feedItemToDelete)
;

DELETE FROM feedGroups WHERE feedId = @feedItemToDelete;
DELETE FROM feedPeople WHERE feedId = @feedItemToDelete;
DELETE FROM feedComments WHERE feedId = @feedItemToDelete;
DELETE FROM feedReactions WHERE feedId = @feedItemToDelete;

DELETE FROM feedItems WHERE id = @feedItemToDelete;

DELETE FROM cpcValues WHERE cpcId = @cpcIdToDelete;
DELETE FROM cpc WHERE id = @cpcIdToDelete;

-- NOTE: Doing the IN select is a very expensive operation, I usually run the in select by itself, and then run the delete on specified PKs...EK
DELETE
FROM notifications
WHERE id IN (
	-- 6064413, 6064699, 6064700
-- SELECT notificationId
-- FROM notificationLinks
-- WHERE tableKey = @feedItemToDelete
--   AND tableName = 'feedItems'
);


