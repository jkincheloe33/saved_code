const mjml = require('mjml')
import { fonts } from '@assets'
import { getAccountLanguageByType } from '@serverHelpers/language'
import { defaultLanguages, LANGUAGE_TYPE } from '@utils'

const wambiFromPatient = async ({ clientAccountId, cpcContent, cpcUrl, recipientName }) => {
  const patientLanguage =
    (await getAccountLanguageByType({ clientAccountId, type: LANGUAGE_TYPE.PATIENT })) ?? defaultLanguages[LANGUAGE_TYPE.PATIENT]

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
              Hi ${recipientName}!
            </mj-text>
            <mj-text align="left" font-size="14px" font-weight="400" line-height="24px">
              Great job!
            </mj-text>
            <mj-text font-size="14px" line-height="20px">
              A ${patientLanguage.toLowerCase()} or family member has recognized you for providing exceptional care!
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
    subject: `A ${patientLanguage.toLowerCase()} sent you a Wambi!`,
  }
}

module.exports = wambiFromPatient
