import { useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'

const BoldText = styled.span`
  font-weight: bold;
`

const BoldUnderlineText = styled.span`
  text-decoration: underline;
  font-weight: bold;
`

// Temp style switching until we refactor portal Terms in new task, to keep portal styles same until then...JC
const TermsContainer = styled.div`
  font-size: 12px;
  height: ${p => (p.full ? '100%' : '')};
  max-height: ${p => (p.full ? '' : '700px')};
  overflow: scroll;
  padding: 25px;
  text-align: left;
  width: ${p => (p.full ? '100vw' : '90vw')};

  @media (${devices.tablet}) {
    font-size: 14px;
    padding: 25px 25px 50px;
    width: 100%;
  }
`

const TermsMainHeader = styled.div`
  font-size: 20px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 20px;
`

const TermsHeader = styled.div`
  font-size: 18px;
  font-weight: bold;

  margin-bottom: 10px;
  text-decoration: underline;
`

const TermsSubHeader = styled.div`
  font-weight: bold;
  font-size: 16px;
  text-decoration: underline;
`

const TermsParagraph = styled.p`
  margin: 10px 0px;
`

const TermsLink = styled.span`
  color: #0066cc;
  text-decoration: underline;
`

const UnderlineText = styled.span`
  text-decoration: underline;
`

const Terms = ({ children, full = false, setScrolledToBottom }) => {
  const listInnerRef = useRef()

  const onScroll = () => {
    if (listInnerRef.current && setScrolledToBottom) {
      const { clientHeight, scrollHeight, scrollTop } = listInnerRef.current
      if (scrollTop + clientHeight > scrollHeight - 100) {
        setScrolledToBottom(true)
      }
    }
  }

  return (
    <TermsContainer full={full} onScroll={() => onScroll()} ref={listInnerRef}>
      <TermsMainHeader>GENERAL TERMS & CONDITIONS</TermsMainHeader>
      <TermsHeader>Terms and Conditions:</TermsHeader>
      <TermsSubHeader>General:</TermsSubHeader>
      <TermsParagraph>
        <BoldText>Last revised September 30, 2020.</BoldText> These terms and conditions (the <BoldText>“Terms”</BoldText>) govern your
        access to and use of our services, including those offered through our web-based caregiver recognition platform (the{' '}
        <BoldText>“Platform”</BoldText>), websites, and mobile applications (collectively, the <BoldText>“Site”</BoldText>). The terms{' '}
        <BoldText>“we,”</BoldText> <BoldText>“us,” </BoldText>and <BoldText>“Wambi”</BoldText> refer to Aetas Company, LLC DBA Wambi, LLC a
        Florida limited liability corporation headquartered in Philadelphia, Pennsylvania, which owns and operates the Site, including
        wambi.org and carepostcard.com (<BoldText>“carepostcard”</BoldText>). Do not access or use the Site if you are unwilling or unable
        to be bound by the Terms.
      </TermsParagraph>
      <TermsSubHeader>Eligibility:</TermsSubHeader>
      <TermsParagraph>
        This Site is not intended or designed for the use of children under the age of 13. We do not collect information from a person we
        actually know is a child under the age of 13.
      </TermsParagraph>
      <TermsSubHeader>Modification of Terms:</TermsSubHeader>

      <TermsParagraph>
        We may modify the Terms from time to time. You understand and agree that your access to or use of the Site is governed by the Terms
        effective at the time of your access to or use of the Site. If we make material changes to these Terms, we will notify you by
        posting a notice on the Site prior to the effective date of the changes. By continuing to access or use the Site after those changes
        become effective, you agree to the revised Terms.
      </TermsParagraph>

      <TermsSubHeader>Communications:</TermsSubHeader>
      <TermsParagraph>You agree to receive certain communications in connection with the Site. </TermsParagraph>

      <TermsSubHeader>Definitions:</TermsSubHeader>
      <TermsParagraph>
        <BoldText>“Content”</BoldText> means text, images, photos, audio, video, location data, and all other forms of data or communication
        contained on the Site. Content is for informational and survey purposes only.{' '}
        <UnderlineText>
          Always seek the advice of your physician or other qualified health care provider with questions you may have regarding a medical
          condition.
        </UnderlineText>
      </TermsParagraph>
      <TermsParagraph>
        <BoldText>“Your Content”</BoldText> means Content that you submit or transmit to, through, or in connection with the Site.
      </TermsParagraph>
      <TermsParagraph>
        <BoldText>“User Content”</BoldText> means Content that users submit or transmit to, through, or in connection with the Site.
      </TermsParagraph>
      <TermsParagraph>
        <BoldText>“Wambi Content”</BoldText> means Content that we create and make available in connection with the Site.
      </TermsParagraph>
      <TermsParagraph>
        <BoldText>“Third Party Content”</BoldText> means Content that originates from parties other than Wambi or its users, which is made
        available in connection with the Site.
      </TermsParagraph>
      <TermsParagraph>
        <BoldText>“Site Content”</BoldText> means all of the Content that is made available in connection with the Site, including Your
        Content, User Content, Third Party Content, and Wambi Content.
      </TermsParagraph>
      <TermsSubHeader>Use of Content:</TermsSubHeader>
      <TermsParagraph>
        By submitting communications or Your Content to the Site, you agree that such submission is nonconfidential for all purposes. You
        alone are responsible for Your Content, and once published, it cannot always be withdrawn. You assume all risks associated with Your
        Content, including anyone’s reliance on its quality, accuracy, or reliability, or any disclosure by you of information in Your
        Content that makes you personally identifiable or that identifies your personal health information, including, but not limited to,
        information regarding any medical condition(s).{' '}
        <BoldUnderlineText>
          You agree that you will not post personally identifiable and/or personal health information regarding any third party, including,
          but not limited to, a family member and/or friend.
        </BoldUnderlineText>{' '}
        You represent that you own, or have the necessary permissions to use and authorize the use of Your Content as described herein. You
        may not imply that Your Content is in any way sponsored or endorsed by Wambi.
      </TermsParagraph>
      <TermsParagraph>
        You may expose yourself to liability if, for example, Your Content contains material that is false, intentionally misleading, or
        defamatory; violates any third-party right, including any copyright, trademark, patent, trade secret, moral right, privacy right,
        right of publicity, or any other intellectual property or proprietary right; contains material that is unlawful, including illegal
        hate speech or pornography; exploits or otherwise harms minors; or violates or advocates the violation of any law or regulation.
      </TermsParagraph>
      <TermsParagraph>
        We may use Your Content in a number of different ways, including publicly displaying it, reformatting it, incorporating it into
        advertisements and other works, creating derivative works from it, promoting it, distributing it, and allowing others to do the same
        in connection with their own websites and media platforms. As such, you hereby irrevocably grant us worldwide, perpetual,
        non-exclusive, royalty-free, assignable, sublicensable, transferable rights to use Your Content for any purpose. Finally, you
        irrevocably waive, and cause to be waived, against Wambi and its users any claims and assertions of moral rights or attribution with
        respect to Your Content. By “use” we mean use, copy, publicly perform and display, reproduce, distribute, modify, translate, remove,
        analyze, commercialize, and prepare derivative works of Your Content.
      </TermsParagraph>
      <TermsParagraph>
        As between you and Wambi, you own Your Content. We own the Wambi Content, including but not limited to visual interfaces,
        interactive features, graphics, design, compilation, including, but not limited to, our compilation of User Content and other Site
        Content, computer code, products, software, aggregate user review ratings, and all other elements and components of the Site
        excluding Your Content, User Content and Third Party Content. We also own the copyrights, trademarks, service marks, trade names,
        and other intellectual and proprietary rights throughout the world (“IP Rights”) associated with the Wambi Content and the Site,
        which are protected by copyright, trade dress, patent, trademark laws and all other applicable intellectual and proprietary rights
        and laws. As such, you may not modify, reproduce, distribute, create derivative works or adaptations of, publicly display or in any
        way exploit any of the Wambi Content in whole or in part except as expressly authorized by us. Except as expressly and unambiguously
        provided herein, we do not grant you any express or implied rights, and all rights in and to the Site and the Wambi Content are
        retained by us.
      </TermsParagraph>
      <TermsParagraph>
        We reserve the right to remove, screen, edit, or reinstate User Content from time to time at our sole discretion for any reason or
        no reason, and without notice to you.{' '}
      </TermsParagraph>
      <TermsSubHeader>Privacy:</TermsSubHeader>
      <TermsParagraph>
        You represent that you have read and understood our
        <a rel='noreferrer' target='_blank' href='https://wambi.org/privacy-policy/'>
          {' '}
          <TermsLink>Privacy Policy.</TermsLink>
        </a>{' '}
      </TermsParagraph>
      <TermsParagraph>
        We may collect and store information about you when you access the Site. We use the information for a number of reasons such as:
        improving the Site’s quality, personalizing your experience, tracking usage of the Site, providing feedback to caregivers and/or
        hospitals, marketing the Site (including on social media), providing customer support, messaging you, backing up our systems and
        allowing for disaster recovery, enhancing the security of the Site, and complying with legal obligations.
      </TermsParagraph>
      <TermsSubHeader>Liability:</TermsSubHeader>
      <TermsParagraph>The use of the Site and the Content is at your own risk.</TermsParagraph>
      <TermsParagraph>
        When using the Site, information will be transmitted over a medium that may be beyond the control and jurisdiction of Wambi, its
        parent(s), and its successor(s). Accordingly, Wambi assumes no liability for or relating to the delay, failure, interruption, or
        corruption of any data or other information transmitted in connection with use of the Site.
      </TermsParagraph>
      <TermsParagraph>
        The Site and the content are provided on an &quot;as is&quot; basis. WAMBI, ITS PARENT(S), ITS LICENSORS, AND ITS SUCCESSOR(S), TO
        THE FULLEST EXTENT PERMITTED BY LAW, DISCLAIM ALL WARRANTIES, EITHER EXPRESS OR IMPLIED, STATUTORY OR OTHERWISE, INCLUDING BUT NOT
        LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT OF THIRD PARTIES&apos; RIGHTS, AND FITNESS FOR PARTICULAR
        PURPOSE.
      </TermsParagraph>
      <TermsParagraph>
        In no event shall Wambi, its parent(s), its licensors, its suppliers, or any third parties mentioned on the Site be liable for any
        damages (including, without limitation, incidental and consequential damages, personal injury/wrongful death, lost profits, or
        damages resulting from lost data or business interruption) resulting from the use of or inability to use the Site or the Content,
        whether based on warranty, contract, tort, or any other legal theory, and whether or not Wambi, its parent(s), its licensors, its
        successor(s), or any third parties mentioned on the Site are advised of the possibility of such damages. Wambi, its parent(s), its
        licensors, its successor(s), or any third parties mentioned on the Site shall be liable only to the extent of actual damages
        incurred by you, not to exceed U.S. $1000. Wambi, its parent(s), its licensors, its successor(s), or any third parties mentioned on
        the Site are not liable for any personal injury, including death, caused by your use or misuse of the Site or Content. Any claims
        arising in connection with your use of the Site or any Content must be brought within one (1) year of the date of the event giving
        rise to such action occurred. Remedies under these Terms and Conditions are exclusive and are limited to those expressly provided
        for in these Terms and Conditions.
      </TermsParagraph>
      <TermsSubHeader>Indemnity:</TermsSubHeader>
      <TermsParagraph>
        You agree to defend, indemnify, and hold Wambi, its parent(s), successor(s) and affiliate(s), and their officers, directors,
        employees, agents, licensors, and suppliers, harmless from and against any claims, actions or demands, liabilities and settlements
        including without limitation, reasonable legal expenses (including, but not limited to, attorneys’ fees and costs) and accounting
        fees, resulting from, or alleged to result from, your violation of these Terms and Conditions. This includes, but is not limited to,
        your disclosure of a third party’s personally identifiable information, personal health information, and/or any information
        protected by a third party’s right to privacy. Wambi reserves the right, at your expense, to assume the exclusive defense and
        control of any matter for which you are required to indemnify us and you agree to cooperate with our defense of these claims. You
        agree not to settle any such matter without the prior written consent of Wambi. Wambi will use reasonable efforts to notify you of
        any such claim, action or proceeding upon becoming aware of it.
      </TermsParagraph>
      <TermsSubHeader>Jurisdiction:</TermsSubHeader>
      <TermsParagraph>
        You expressly agree that exclusive jurisdiction for any dispute with Wambi, or in any way relating to your use of the Site, resides
        in the courts of the Commonwealth of Pennsylvania and you further agree and expressly consent to the exercise of personal
        jurisdiction in the courts of the Commonwealth of Pennsylvania in connection with any such dispute including any claim involving
        Wambi or its parent(s), affiliates, subsidiaries, employees, contractors, officers, directors, telecommunication providers, and
        content providers.
      </TermsParagraph>
      <TermsSubHeader>Miscellaneous:</TermsSubHeader>
      <TermsParagraph>
        These Terms and Conditions are governed by the internal substantive laws of the Commonwealth of Pennsylvania, without respect to its
        conflict of laws principles.{' '}
      </TermsParagraph>
      <TermsParagraph>
        If any provision of these Terms and Conditions is found to be invalid by any court having competent jurisdiction, the invalidity of
        such provision shall not affect the validity of the remaining provisions of these Terms and Conditions, which shall remain in full
        force and effect.
      </TermsParagraph>
      <TermsParagraph>
        No waiver of any of these Terms and Conditions shall be deemed a further or continuing waiver of such term or condition or any other
        term or condition.
      </TermsParagraph>
      <TermsParagraph>
        The Terms contain the entire agreement between you and us regarding the use of the Site, and supersede any prior agreement between
        you and us on such subject matter. The parties acknowledge that no reliance is placed on any representation made but not expressly
        contained in these Terms.
      </TermsParagraph>
      <TermsParagraph>
        The Terms, and any rights or obligations hereunder, are not assignable, transferable or sublicensable by you except with Wambi’s
        prior written consent, but may be assigned or transferred by us without restriction. Any attempted assignment by you shall violate
        these Terms and be void.
      </TermsParagraph>
      <TermsParagraph>The section titles in the Terms are for convenience only and have no legal or contractual effect.</TermsParagraph>
      {children}
    </TermsContainer>
  )
}

Terms.propTypes = {
  children: PropTypes.any,
  full: PropTypes.bool,
  setScrolledToBottom: PropTypes.func,
}

export default Terms
