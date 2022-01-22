const mjml = require('mjml')
import { colors, fonts } from '@assets'

const patientFeedbackAlert = async ({ managerName, reviewUrl, revieweeName }) => {
  let template = `
    <mjml>
      <mj-head >
        <mj-attributes>
          <mj-text font-family="${fonts.family}, ${fonts.secondary}, Roboto"/>
        </mj-attributes>
      </mj-head>
      <mj-body>
        <mj-section>
          <mj-column>
          ${
            managerName &&
            `<mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Hi ${managerName},
            </mj-text>`
          }
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              ${revieweeName} has received:
            </mj-text>
            <mj-spacer height="20px"/>
            <mj-text font-size="14px" line-height="20px">
              - A low score. Check in to see how they are doing and how you may be able to help remove any obstacles that are in their way. A compassionate response could make a big difference.
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              - A potentially negative comment. Consider rounding to ensure any issues are resolved.
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              - A request to be contacted. Follow up on the request to ensure any issues are resolved and that ${revieweeName} gets the support they need.
            </mj-text>
            <mj-spacer height="20px"/>
            <mj-button background-color="${colors.blurple}" border-radius="14px" href="${reviewUrl}">
              See the review now
            </mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
  return {
    html: mjml(template).html,
    subject: 'Action required for service recovery',
  }
}

module.exports = patientFeedbackAlert
