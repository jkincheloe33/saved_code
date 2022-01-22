const mjml = require('mjml')
import { fonts } from '@assets'

const raffleWinner = async ({ claimInstructions, clientAccountName, giftName, giftUrl, name }) => {
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
              Congratulations ${name}!
            </mj-text>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
                Woohoo!
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
                It's your lucky day! You won the raffle for ${giftName}. We're so excited for you!
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              How to get it: ${claimInstructions}
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              <a href="${giftUrl}">Click here</a> to claim now!
            </mj-text>
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
    subject: '🎁 You won a raffle!',
  }
}

module.exports = raffleWinner
