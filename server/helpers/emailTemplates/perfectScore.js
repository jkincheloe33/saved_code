const mjml = require('mjml')
import { colors, fonts } from '@assets'

const perfectScore = async ({ name, url }) => {
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
            <mj-text font-size="14px" line-height="20px">
            Way to go, ${name}! You received a perfect Wambi score for delivering outstanding care.
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              This calls for a celebration! <a style='color:${colors.blurple}; cursor=pointer;' href='${url}'>Click here</a>
              to log into Wambi and check out your cheer.
            </mj-text>
            <mj-spacer height="20px"/>
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
    subject: '🌟 Way to Wambi! 🌟 Congrats on a perfect score!',
  }
}

module.exports = perfectScore
