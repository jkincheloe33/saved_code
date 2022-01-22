const mjml = require('mjml')
import { fonts } from '@assets'

const giftConfirmationTemplate = async ({ attributeName, attributeValue, claimInstructions, clientAccountName, fullName, giftName }) => {
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
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Congratulations on claiming your gift, ${fullName}!
            </mj-text>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              It’s no small feat to deliver compassionate care to patients and wow your team day after day. Now that you claimed your hard-earned gift, here’s what’s next:
            </mj-text>
            <mj-spacer height="20px"/>
            <mj-text font-size="14px" line-height="20px">
              Gift Claimed: ${giftName}
            </mj-text>
            ${
              attributeName &&
              attributeValue &&
              `<mj-text font-size="14px" line-height="20px">${attributeName}: ${attributeValue}</mj-text>`
            }
            ${
              claimInstructions &&
              `<mj-text font-size="14px" line-height="20px">
              How to get it: ${claimInstructions}
            </mj-text>`
            }
            <mj-spacer height="20px"/>
            <mj-text font-size="14px" line-height="20px">
              Keep up the great work! We appreciate all you do for ${clientAccountName}.
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section padding-top="0">
          <mj-column>
            <mj-text padding-bottom="10px">Warmly,</mj-text>
            <mj-text padding-top="0">Your fans at ${clientAccountName}</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
  return {
    html: mjml(template).html,
    subject: '🎁 You claimed a gift, now snag it!',
  }
}

module.exports = giftConfirmationTemplate
