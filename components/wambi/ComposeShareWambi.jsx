import { useState } from 'react'
import styled from 'styled-components'

import { CheckmarkIcon5, colors, devices, multiplier } from '@assets'
import { Card, CtaFooter, DetailsTile, DynamicContainer, Layout, Loader, Paragraph, PillButton, TextArea, WambiBanner } from '@components'
import { useCelebrationContext, useLangContext, usePostContext, useRefreshDataContext, useToastContext } from '@contexts'
import { coreApi } from '@services'
import { LANGUAGE_TYPE } from '@utils'

const ContentCard = styled(Card)`
  padding: ${multiplier * 3}px;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => (p.submitting ? 1 : 0)};
  pointer-events: ${p => (p.submitting ? 'auto' : 'none')};
  position: fixed;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  // needed to sit over nav bar...JK
  z-index: 5;
`

const P = styled(Paragraph)`
  padding-top: ${multiplier * 2}px;
`

const ShareTextArea = styled(TextArea)`
  min-height: 70px;
`

const SharedWrapper = styled.div`
  border: 0.5px solid ${colors.gray5};
  border-radius: 20px;
  padding: ${multiplier * 2}px;
  pointer-events: none;
`

const Wrapper = styled(DynamicContainer)`
  background-color: ${colors.gray8};
  padding: ${multiplier * 3}px ${multiplier * 2}px ${multiplier * 16}px;

  @media (${devices.largeDesktop}) {
    background-color: transparent;
    width: 414px;
  }
`

const ComposeShareWambi = () => {
  const { setCelebration } = useCelebrationContext()
  const { getAccountLanguage } = useLangContext()
  const { setShareCpcData, setShowShareCpc, shareCpcData } = usePostContext()
  const { refreshData } = useRefreshDataContext()
  const { setToastData } = useToastContext()

  const [shareText, setShareText] = useState(shareCpcData?.content || '')
  const [submitting, setSubmitting] = useState(false)

  const { authorId, authorImg, authorName, banner, content, createdAt, id, recipientCount, recipients, type } = {
    ...shareCpcData?.linkedFeedItem,
  }

  const handleClose = () => {
    setShowShareCpc(false)
    // timeout gives modal time to close before removing content...JK
    setTimeout(() => setShareCpcData(null), 500)
  }

  const handleEdit = async () => {
    setSubmitting(true)

    const {
      data: { feedId, success },
    } = await coreApi.post('/wambi/editSharedWambi', { feedId: shareCpcData.feedId, content: shareText })

    if (success) {
      refreshData({ action: 'updateWambis', data: { feedId } })
      handleClose()
    }

    setSubmitting(false)
  }

  const handleShare = async () => {
    setSubmitting(true)

    const {
      data: { completedChallenges, feedId, rewardProgress, success },
    } = await coreApi.post('/wambi/shareWambi', { linkedFeedId: id, content: shareText })

    if (success) {
      refreshData({ action: 'updateWambis', data: { feedId } })
      setCelebration({ completeChallenges: completedChallenges, rewardProgress })

      setToastData({
        callout: 'Shared!',
        details: 'Your post has been added to the newsfeed.',
        gradient: {
          colors: [
            {
              color: 'mint',
              location: '30%',
            },
            {
              color: 'skyBlue',
              location: '100%',
            },
          ],
          position: 'to bottom',
        },
        icon: CheckmarkIcon5,
        id: 'shared-wambi-toast',
      })
      handleClose()
    }
    setSubmitting(false)
  }

  return (
    <Layout
      cta={{ onClick: handleClose, text: 'Close' }}
      id='share-wambi'
      inner
      noFooter
      title={shareCpcData?.feedId ? 'Edit' : 'Share Wambi'}
    >
      {shareCpcData && (
        <Wrapper>
          <ContentCard>
            <ShareTextArea
              grow
              onChange={e => setShareText(e.target.value)}
              placeholder='Say something about this Wambi...'
              value={shareText}
            />
            <SharedWrapper>
              <DetailsTile
                authorId={authorId}
                authorImg={authorImg}
                authorName={authorName ?? getAccountLanguage(LANGUAGE_TYPE.PATIENT)}
                createdAt={createdAt}
                idPrefix='share-cpc'
                recipients={recipients}
                recipientCount={recipientCount}
                type={type}
              />
              <WambiBanner banner={banner} recipients={recipients} recipientCount={recipientCount} />
              <P maxLines={3}>{content}</P>
            </SharedWrapper>
          </ContentCard>
          <CtaFooter>
            {shareCpcData?.feedId ? (
              <PillButton onClick={handleEdit} text='Update' thin />
            ) : (
              <PillButton onClick={handleShare} text='Share' thin />
            )}
          </CtaFooter>
        </Wrapper>
      )}
      <LoaderWrapper submitting={submitting}>
        <Loader />
      </LoaderWrapper>
    </Layout>
  )
}

ComposeShareWambi.propTypes = {}

export default ComposeShareWambi
