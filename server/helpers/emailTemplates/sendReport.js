const mjml = require('mjml')
import { fonts } from '@assets'

const sendReport = async ({ name }) => {
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
            Hi ${name}!
            </mj-text>
            <mj-spacer height="20px"/>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Attached is your report.
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
  }
}

module.exports = sendReport
