const mjml = require('mjml')
import { fonts } from '@assets'

const expiringSurprises = async ({ clientAccountName, rewardListUrl }) => {
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
              Don't let your surprise expire! After all, you earned it with lots of awesome gratitude and recognition.
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              <a href="${rewardListUrl}">Click here</a> to check out your surprise!
            </mj-text>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Enjoy your Wambi win!
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
    subject: '⏱ Reminder! Your surprise will expire soon.',
  }
}

module.exports = expiringSurprises
