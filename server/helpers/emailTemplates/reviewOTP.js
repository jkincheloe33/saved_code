const mjml = require('mjml')
import { colors, EmailLogo, fonts } from '@assets'

const reviewOTP = async ({ codeOTP, helpSupportUrl }) => {
  let template = `
  <mjml>
    <mj-head>
      <mj-attributes>
        <mj-text font-family="${fonts.family}, ${fonts.secondary}, Roboto"/>      </mj-attributes>
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
            Hello
          </mj-text>
          <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
            This is the one-time-passcode you requested. Please enter this code to continue.
          </mj-text>
          <mj-spacer height="20px"/>
          <mj-text align="center" font-size="24px" font-weight="400" letter-spacing="10px" line-height="29px">${codeOTP}</mj-text>
          <mj-spacer height="20px"/>
          <mj-text font-size="14px" line-height="20px">
            This message was sent by the Wambi platform system upon request from someone attempting to access the portal with your email address. If this was not you, please disregard this message.
          </mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding-top="0">
        <mj-column>
          <mj-text>
            If you have any concerns, please <a style="color:${colors.blurple}; cursor=pointer;" href="${helpSupportUrl}">contact us</a>.
          </mj-text>
          <mj-spacer height="25px"/>
          <mj-text>Team Wambi</mj-text>
          <mj-spacer height="45px" />
          <mj-divider border-color="${colors.gray5}" border-width="0.5px"></mj-divider>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
  `
  return {
    html: mjml(template).html,
    subject: 'Your Wambi Review Access Code',
  }
}

module.exports = reviewOTP
