const mjml = require('mjml')
import { fonts } from '@assets'

const individualWambiFromManager = async ({ cpcContent, cpcUrl, recipientName, senderName }) => {
  let template = `
    <mjml>
      <mj-head>
        <mj-attributes>
          <mj-text font-family="${fonts.family}, ${fonts.secondary}, Roboto"/>
        </mj-attributes>
      </mj-head>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Congratulations ${recipientName}!
            </mj-text>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Keep up the great work -- it's taking you places! ${senderName} recognized you.
            </mj-text>
            <mj-spacer height="20px"/>
            <mj-text font-size="14px" line-height="20px">
              Here's a sneak peek: ${cpcContent}
            </mj-text>
            <mj-spacer height="20px"/>
            <mj-text font-size="14px" line-height="20px">
              <a href="${cpcUrl}">Click here</a> to check out your Wambi!
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section padding-top="0">
          <mj-column>
            <mj-text padding-bottom="5px">With Joy,</mj-text>
            <mj-text padding-top="0">Team Wambi</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `

  return {
    html: mjml(template).html,
    subject: `${senderName} sent you a very special Wambi!`,
  }
}

module.exports = individualWambiFromManager
