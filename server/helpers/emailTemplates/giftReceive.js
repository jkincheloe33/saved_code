const mjml = require('mjml')
import { fonts } from '@assets'

const giftReceive = async ({ clientAccountName, giftUrl, recipient }) => {
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
              Congratulations ${recipient}!
            </mj-text>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              You must be pretty special because someone sent you a surprise!
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              <a href="${giftUrl}">Click here</a> to check out your surprise!
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
    subject: '🎁 Gift Alert! Someone just sent you a surprise',
  }
}

module.exports = giftReceive
