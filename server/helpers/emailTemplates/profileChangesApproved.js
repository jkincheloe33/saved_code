const mjml = require('mjml')
import { fonts } from '@assets'
import { PROFILE_CHANGE_REQUEST_TYPE, PROFILE_CHANGE_REQUEST_TYPE_NAMES } from '@utils'

const profileChangesApproved = async ({ managerName, profileRequestType, requestorName, sendWambiUrl }) => {
  const template = `
    <mjml>
      <mj-head >
        <mj-attributes>
          <mj-text font-family="${fonts.family}, ${fonts.secondary}, Roboto"/>
        </mj-attributes>
      </mj-head>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Hi ${requestorName}!
            </mj-text>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Breaking news: ${managerName} has approved your ${PROFILE_CHANGE_REQUEST_TYPE_NAMES[profileRequestType]} change${
    profileRequestType === PROFILE_CHANGE_REQUEST_TYPE.NAME_AND_PHOTO ? 's' : ''
  }!
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              Sign in to Wambi and share some joy! <a href="${sendWambiUrl}">Click here</a>
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section padding-top="0">
          <mj-column>
            <mj-text padding-bottom="10px">With Gratitude,</mj-text>
            <mj-text padding-top="0">The Wambi Team</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
  return {
    html: mjml(template).html,
    subject: 'Way to Wambi! Your profile change is approved',
  }
}

module.exports = profileChangesApproved
