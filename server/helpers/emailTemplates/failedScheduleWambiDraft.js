const mjml = require('mjml')
import { colors, fonts } from '@assets'

const failedScheduleWambiDraft = ({ name, url }) => {
  const template = `
  <mjml>
    <mj-head>
      <mj-attributes>
        <mj-text font-family='${fonts.family}, ${fonts.secondary}, Roboto' />
      </mj-attributes>
    </mj-head>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text align='left' font-size='14px' font-weight='400' line-height='24px'>
            Hi ${name}!
          </mj-text>
          <mj-spacer height='20px' />
          <mj-text align='left' font-size='14px' font-weight='400' line-height='24px'>
            The Wambi you scheduled to be sent needs to be updated.
          </mj-text>
          <mj-text align='left' font-size='14px' font-weight='400' line-height='24px'>
            <a style='color:${colors.blurple}; cursor=pointer;' href='${url}'>Click here</a>
            to make changes so your Wambi can take flight!
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding-top='0'>
        <mj-column>
          <mj-text padding-bottom='5px'>With Gratitude,</mj-text>
          <mj-text padding-top='0'>Team Wambi</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  `

  return {
    html: mjml(template).html,
    subject: 'Change requested! Your scheduled Wambi needs an update.',
  }
}

module.exports = failedScheduleWambiDraft
