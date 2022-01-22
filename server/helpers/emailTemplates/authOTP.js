const mjml = require('mjml')
import { colors, EmailLogo, fonts } from '@assets'

const authOTP = async ({ codeOTP, helpSupportUrl, minutes, name }) => {
  let template = `
  <mjml>
    <mj-head>
      <mj-attributes>
        <mj-text font-family="${fonts.family}, ${fonts.secondary}, Roboto"/>
      </mj-attributes>
    </mj-head>
    <mj-body>
      <mj-section padding-bottom="1px">
        <mj-column>
          <mj-image src="${EmailLogo}" width="120px"/>
        </mj-column>
      </mj-section>
      <mj-section>
        <mj-column>
          <mj-text align="left" color="${colors.blurple}" font-size="18px" font-weight="700" line-height="42px">
            Hi${name ? `, ${name}` : ''}!
          </mj-text>
          <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
            Thank you for verifying your Wambi account. Your one-time code will expire after ${minutes} minutes.
          </mj-text>
          <mj-spacer height="20px"/>
          <mj-text align="center" font-size="24px" font-weight="400" letter-spacing="10px" line-height="29px">${codeOTP}</mj-text>
          <mj-spacer height="20px"/>
          <mj-text font-size="14px" line-height="20px">
            This message was sent by the Wambi platform system upon request from someone attempting to sign in with your email address. If this was not you, please disregard this message.
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding-top="0">
        <mj-column>
          <mj-text>
            If you have any concerns, please <a style="color:${colors.blurple}; cursor=pointer;" href="${helpSupportUrl}">contact us</a>.
          </mj-text>
          <mj-spacer height="25px"/>
          <mj-text>The Wambi Team</mj-text>
          <mj-spacer height="45px" />
          <mj-divider border-color="${colors.gray5}" border-width="0.5px"></mj-divider>
          <mj-spacer height="45px" />
          <mj-text font-size="12px" line-height="17px">The information contained in this email message is intended only for the personal and confidential use of the recipient named above.</mj-text>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  `
  return {
    html: mjml(template).html,
    subject: 'Your Wambi Access Code',
  }
}

module.exports = authOTP
