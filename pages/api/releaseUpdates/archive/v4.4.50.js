export default async (req, res) => {
  try {
    await wambiDB.executeNonQuery({
      commandText: /*sql*/ `
        DROP FUNCTION IF EXISTS STRIP_NON_DIGIT;

        CREATE FUNCTION STRIP_NON_DIGIT(input VARCHAR(255))
        RETURNS VARCHAR(255)
        BEGIN
          DECLARE output   VARCHAR(255) DEFAULT '';
          DECLARE iterator INT          DEFAULT 1;
          WHILE iterator < (LENGTH(input) + 1) DO
            IF SUBSTRING(input, iterator, 1) IN ( '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ) THEN
              SET output = CONCAT(output, SUBSTRING(input, iterator, 1));
            END IF;
            SET iterator = iterator + 1;
        END WHILE;
        -- Strip out the 1 from existing '+1' characters that Twilio inserted
        RETURN IF(LENGTH(output) > 10, SUBSTR(output, 2), output);
        END;

        UPDATE reviewers
        SET mobile = STRIP_NON_DIGIT(mobile);

        DROP FUNCTION IF EXISTS STRIP_NON_DIGIT;
      `,
    })

    // Get all mobile dupe records...JC
    const dupeReviewers = await wambiDB.query({
      queryText: /*sql*/ `
        SELECT R.id, R.mobile, R.accountId
        FROM reviewers R
        INNER JOIN (
          SELECT mobile
          FROM reviewers
            WHERE mobile IS NOT NULL
            AND mobile <> ''
          GROUP BY mobile
          HAVING COUNT(id) > 1
          ) R2 ON R.mobile = R2.mobile
        WHERE R.mobile IS NOT NULL
          AND R.mobile <> ''
        -- To prioritize keeping entries with an email if they exist
        ORDER BY R.email DESC
      `,
    })

    // Link dupe records to the original one found. We will consolidate the dupes into the original record...JC
    const checkedMobileNums = []

    const reviewersToMerge = dupeReviewers.flatMap(r => {
      // Match mobile #s for the same client account here
      const existingReviewer = checkedMobileNums.find(e => e.mobile === r.mobile && e.accountId === r.accountId)
      if (!existingReviewer) {
        checkedMobileNums.push(r)
        // Filters out empty results from returning
        return []
      }
      return { originalId: existingReviewer.id, matchingId: r.id }
    })
    console.log('REVIEWERS TO MERGE', reviewersToMerge)

    // Merge dupes into original record...JC
    const updateReviewersRes = await updateReviewRecords(reviewersToMerge)
    console.log('UPDATED REVIEWER RECORDS', updateReviewersRes)

    const updateCpcRecordRes = await updateCpcRecords(reviewersToMerge)
    console.log('UPDATED CPC RECORDS', updateCpcRecordRes)

    // Reviewer mobile nums may be dupes, but there could also be no survey/cpc records for dupe numbers.
    // So only check if we have array of ids to cleanup
    if (reviewersToMerge.length) {
      // Delete from reviewers table now that they are unlinked...JC
      const deleteReviewersRes = await wambiDB.executeNonQuery({
        commandText: /*sql*/ `
          DELETE
          FROM reviewers
          WHERE id IN (?)
        `,
        params: [reviewersToMerge.map(r => r.matchingId)],
      })

      console.log('DELETED REVIEWER RECORDS', deleteReviewersRes)
    }

    res.json({ success: true })
  } catch (error) {
    logServerError({ error, req })
    res.json({ success: false })
  }
}

const updateReviewRecords = async reviewersToMerge => {
  return await wambiDB.executeNonQuery({
    commandText: reviewersToMerge
      .map(
        r => /*sql*/ `
          UPDATE surveys
          SET reviewerId = ${r.originalId}
          WHERE reviewerId = ${r.matchingId} `
      )
      .join(';\n'),
  })
}

const updateCpcRecords = async reviewersToMerge => {
  return await wambiDB.executeNonQuery({
    commandText: reviewersToMerge
      .map(
        r => /*sql*/ `
          UPDATE cpc
          SET reviewerId = ${r.originalId}
          WHERE reviewerId = ${r.matchingId} `
      )
      .join(';\n'),
  })
}
