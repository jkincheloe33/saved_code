import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, StarIcon } from '@assets'
import { Card as CardBase, CtaFooter, DynamicContainer, Layout, Loader, PillButton, TextArea, WambiBanner } from '@components'
import { useEditPostContext, useRefreshDataContext, useToastContext } from '@contexts'
import { coreApi } from '@services'

const Card = styled(CardBase)`
  margin-top: 20px;
  padding: 0 22px 22px;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}BF;
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  right: 0;
  top: 0;
  transform: opacity 250ms ease;
  z-index: 5;
`

const StyledTextArea = styled(TextArea)`
  margin-top: 25px;
  min-height: 135px;
  padding-top: 22px;
`

const Wrapper = styled(DynamicContainer)`
  padding: 0 22px 140px;
`

const EditWambiCompose = ({ cpcData, cpcScreens, cta, recipients, recipientCount, setActive, setCpcData }) => {
  const [submitting, setSubmitting] = useState(false)
  const { existingPostData, selectedCpcType } = useEditPostContext()
  const { refreshData } = useRefreshDataContext()
  const { setToastData } = useToastContext()

  const { banner, content, cpcId, id } = { ...existingPostData }

  // disables update button if none of the content has changed or textarea field is empty...JK
  const disabled =
    banner == cpcData?.media &&
    (content === cpcData.content || !cpcData.content) &&
    JSON.stringify(selectedCpcType) == JSON.stringify(cpcData?.type)

  const handleSubmit = async () => {
    setSubmitting(true)

    const updatedContent = content !== cpcData.content && cpcData.content
    const updatedType = JSON.stringify(selectedCpcType) != JSON.stringify(cpcData?.type) && cpcData.type

    const {
      data: { success },
    } = await coreApi.post('/wambi/editWambi', {
      cpcData: { content: updatedContent, type: updatedType },
      cpcId,
      feedId: id,
    })

    if (success) {
      // close modal and reset workflow state...JK
      cta.onClick()
      // hot reloads the feedItem so that a user immediately sees their changes...JK
      refreshData({ action: 'updateFeedItem', data: { feedId: id } })
      setToastData({
        callout: 'Wambi updated!',
        icon: StarIcon,
        id: 'edit-wambi-toast',
        spin: true,
      })
    }
    setSubmitting(false)
  }

  return (
    <>
      <Layout cta={cta} dark id='edit-cpc-compose' inner noFooter title='Edit your Wambi'>
        <Wrapper>
          <Card>
            <WambiBanner
              banner={cpcData.type?.src ?? ''}
              cpcScreens={cpcScreens}
              recipients={recipients?.slice(0, 3)}
              recipientCount={recipientCount}
              setActive={setActive}
              skip
            />
            <StyledTextArea
              id='edit-compose-cpc-message-input'
              name='content'
              onChange={e => setCpcData(cd => ({ ...cd, content: e.target.value }))}
              placeholder={cpcData?.type?.exampleText ?? 'Write your message...'}
              rows={5}
              value={cpcData.content}
            />
          </Card>
        </Wrapper>
        <CtaFooter>
          <PillButton disabled={disabled || submitting} full id='edit-cpc-compose-next-btn' onClick={() => handleSubmit()} text='Update' />
        </CtaFooter>
      </Layout>
      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>
    </>
  )
}

EditWambiCompose.propTypes = {
  cpcData: PropTypes.object,
  cpcScreens: PropTypes.object,
  cta: PropTypes.object,
  recipients: PropTypes.array,
  recipientCount: PropTypes.number,
  setActive: PropTypes.func,
  setCpcData: PropTypes.func,
}

export default EditWambiCompose
