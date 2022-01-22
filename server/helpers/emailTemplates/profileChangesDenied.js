const mjml = require('mjml')
import { fonts } from '@assets'

const profileChangesDenied = async ({ changesRequested, editProfileUrl, managerName, requestorName }) => {
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
              Let's get your profile update complete! ${managerName} has requested changes -- <a href="${editProfileUrl}">sign in now to review and resubmit</a>.
            </mj-text>
            ${
              changesRequested &&
              `<mj-text font-size="14px" line-height="20px">
              Manager's reason: ${changesRequested}
            </mj-text>`
            }
          </mj-column>
        </mj-section>
        <mj-section padding-top="0">
          <mj-column>
            <mj-text padding-bottom="10px">Warmly,</mj-text>
            <mj-text padding-top="0">The Wambi Team</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
  return {
    html: mjml(template).html,
    subject: 'Change requested! Complete now to finish your profile update',
  }
}

module.exports = profileChangesDenied
