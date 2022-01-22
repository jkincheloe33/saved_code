import { createSimpleWorkbook } from '@serverHelpers/excel'

export default async (req, res) => {
  const { asCSV } = req.body

  const allPeople = await wambiDB.query({
    queryText: /*sql*/ `
      SELECT P.id, P.hrId, P.loginId, P.firstName, P.lastName, CAP.accessLevel, P.displayName, P.jobTitle, P.email, P.mobile, P.hireDate,
        P.birthday, P.ssoId, CAP.hideFromPortal, CAP.isIncognito, P.status, P.jobTitleDisplay, P.isSelfRegistered
      FROM people P
      INNER JOIN clientAccountPeople CAP ON (P.id = CAP.peopleId AND CAP.accountId = ?)
      ORDER BY P.lastName, P.firstName ASC
    `,
    params: [req.clientAccount.id],
  })

  const { workbook } = createSimpleWorkbook({
    worksheetName: `People Export - ${req.clientAccount.name}`,
    columns: [
      { header: 'Id', key: 'id', width: 10 },
      { header: 'HR ID', key: 'hrId', width: 10 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Display Name', key: 'displayName', width: 20 },
      { header: 'Job Title', key: 'jobTitle', width: 20 },
      { header: 'Job Title Display', key: 'jobTitleDisplay', width: 20 },
      { header: 'Login Id', key: 'loginId', width: 40 },
      { header: 'SSO Id', key: 'ssoId', width: 40 },
      { header: 'Email', key: 'email', width: 40 },
      { header: 'Mobile', key: 'mobile', width: 20 },
      { header: 'Hire Date', key: 'hireDate', width: 20 },
      { header: 'Birth Date', key: 'birthday', width: 20 },
      { header: 'Hide from Portal', key: 'hideFromPortal', width: 20 },
      { header: 'Is Incognito', key: 'isIncognito', width: 20 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Is Self Registered', key: 'isSelfRegistered', width: 20 },
      { header: 'Access Level (Client)', key: 'accessLevel', width: 10 },
    ],
    rows: allPeople,
  })

  if (asCSV === true) {
    await workbook.csv.write(res)
  } else {
    await workbook.xlsx.write(res)
  }
  res.end()
}
