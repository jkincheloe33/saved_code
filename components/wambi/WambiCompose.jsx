import { useEffect, useState } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CalendarIcon2, multiplier, NoImage } from '@assets'
import { AlertBanner, Card as CardBase, CtaFooter, DynamicContainer, Layout, PillButton, Tag, TextArea, WambiBanner } from '@components'
import { useDraftContext, usePostContext } from '@contexts'
import { coreApi } from '@services'
import { CpcWorkflowType } from '@utils'

const Card = styled(CardBase)`
  margin-top: 20px;
  padding: 0 22px 22px;
`

const StyledTextArea = styled(TextArea)`
  margin-top: 25px;
  min-height: 135px;
  padding-top: 22px;
`

const Wrapper = styled(DynamicContainer)`
  padding: 0 22px 140px;
`

const WambiCompose = ({ active, cpcData, cpcScreens, cta, recipientCount, scheduledAt, setActive, setCpcData, setScheduledAt }) => {
  const [preview, setPreview] = useState([])
  const { cpcDraftData } = useDraftContext()
  const { selectedCpcTheme, skipCpcSearch } = usePostContext()
  const { excludedRecipients, groups, recipients } = cpcData

  const { invalidRecipients, invalidType } = { ...cpcDraftData }

  // previously selected recipients/groups are no longer available and the user has not added any new recipients or groups...JK
  const recipientsError = invalidRecipients && groups.length === 0 && recipients.length === 0
  // previously selected cpc image is no longer available and the user has not added a new image...JK
  const typeError = invalidType && !cpcData.type

  const errors = [`${recipientsError ? 'Recipient(s) no longer available' : ''}`, `${typeError ? 'Design no longer available' : ''}`]

  // calculates what images/names to display...PS & JK
  const displayPreview = groupMembers => {
    if (recipients.length && groupMembers?.length) return recipients.concat(groupMembers)
    else if (recipients.length) return recipients
    return groupMembers
  }

  useEffect(() => {
    // gets the images for the WambiBanner recipients...JK
    const getRecipientsPreview = async () => {
      // if there's less than 3 recipients, we fetch images for groupMembers...PS & JK
      if (groups.length && recipients.length < 3) {
        const {
          data: { groupMembers, success },
        } = await coreApi.post('/wambi/groups/getMemberPreview', {
          recipients,
          groups,
          excludedRecipients,
        })
        if (success) {
          setPreview(displayPreview(groupMembers))
        }
      } else setPreview(displayPreview())
    }

    if (active === cpcScreens.COMPOSE) getRecipientsPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return (
    <Layout
      cta={cta}
      dark
      handleBack={() => setActive(selectedCpcTheme ? cpcScreens.THEME_DETAILS : cpcScreens.IMAGES)}
      id='cpc-compose'
      inner
      noFooter
      title='Send a Wambi'
    >
      <Wrapper>
        {(recipientsError || typeError) && <AlertBanner errors={errors} />}
        <Card>
          <WambiBanner
            banner={cpcData.type?.src ?? NoImage}
            cpcScreens={cpcScreens}
            recipients={preview?.slice(0, 3)}
            recipientCount={recipientCount + recipients.length}
            setActive={setActive}
            skip={skipCpcSearch}
          />
          <StyledTextArea
            id='compose-cpc-message-input'
            name='message'
            onChange={e => setCpcData(cd => ({ ...cd, content: e.target.value }))}
            placeholder={cpcData.type?.exampleText ?? 'Write your message...'}
            rows={5}
            value={cpcData.content}
          />
        </Card>
      </Wrapper>
      <CtaFooter column>
        {scheduledAt && (
          <Tag
            handleDelete={() => setScheduledAt(null)}
            icon={CalendarIcon2}
            spacing={`0 0 ${multiplier * 2}px`}
            text={`Scheduled for ${moment(scheduledAt.date).format('MMM D')} at ${scheduledAt.time}`}
          />
        )}
        <PillButton
          disabled={!cpcData.content || !(groups.length + recipients.length) || recipientsError || typeError || !preview?.length}
          full
          id='cpc-compose-next-btn'
          onClick={() => setActive(cpcScreens.EXTRAS)}
          text='Next'
        />
      </CtaFooter>
    </Layout>
  )
}

WambiCompose.propTypes = {
  ...CpcWorkflowType,
  recipientCount: PropTypes.number,
}

export default WambiCompose
