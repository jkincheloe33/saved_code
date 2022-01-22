const mjml = require('mjml')
import { fonts } from '@assets'
import { formatMobile } from '@utils'

//Send gift confirmation to party that need to be notified provided by the claim data (eg. Staples, HR, etc)...CY
const notifiedGiftConfirmation = async ({
  address,
  attributeName,
  attributeValue,
  clientAccountName,
  email,
  fullName,
  giftName,
  image,
  hrId,
  itemNumber,
  location,
  mobile,
  rewardClaimId,
  sku,
}) => {
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
              ${fullName} just claimed a gift!
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-top="20px">
              Gift Claimed: ${giftName}
            </mj-text>
            ${
              attributeName &&
              attributeValue &&
              `<mj-text font-size="14px" line-height="10px">${attributeName}: ${attributeValue}</mj-text>`
            }
            <mj-spacer height="20px"/>
            ${image && `<mj-image align='left' alt="Gift" src='${image}' width='120px' />`}
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Employee Name: ${fullName}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Employee ID #: ${hrId}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Employee Address: ${address}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Location: ${location}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Employee Email: ${email}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Employee Phone: ${formatMobile(mobile)}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Reward Claim #: ${rewardClaimId}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              Item #: ${itemNumber}
            </mj-text>
            <mj-text font-size="14px" line-height="10px" padding-bottom="0">
              SKU #: ${sku}
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
    subject: '🎁 Gift Alert! Someone just claimed a gift.',
  }
}

module.exports = notifiedGiftConfirmation
