const mjml = require('mjml')
import { fonts } from '@assets'

const raffleConfirmationTemplate = async ({ attributeName, attributeValue, claimInstructions, clientAccountName, giftName }) => {
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
              You have entered a raffle! Odds are, you just might win - good luck!
            </mj-text>
            <mj-spacer height="10px"/>
            <mj-text font-size="14px" line-height="20px">
                ${giftName}
            </mj-text>
            ${
              attributeName &&
              attributeValue &&
              `<mj-text font-size="14px" line-height="20px">${attributeName}: ${attributeValue}</mj-text>`
            }
            ${
              claimInstructions
                ? `<mj-text font-size="14px" line-height="20px">
              Details: ${claimInstructions}
            </mj-text>`
                : `
            <mj-text font-size="14px" line-height="20px">
                Raffle winners will be notified by email once selected.
            </mj-text>`
            }
          </mj-column>
        </mj-section>
        <mj-section padding-top="0">
          <mj-column>
            <mj-text padding-bottom="10px">Joyfully,</mj-text>
            <mj-text padding-top="0">Your fans at ${clientAccountName}</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `
  return {
    html: mjml(template).html,
    subject: '🎁 Raffle entry success!',
  }
}

module.exports = raffleConfirmationTemplate
