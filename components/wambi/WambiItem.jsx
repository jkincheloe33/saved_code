import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, shadows } from '@assets'
import { DetailsTile, FeedItemDetail, Image, Paragraph } from '@components'
import { FEED_ITEM_STATUS, NEWSFEED_VIEW, uId } from '@utils'

const Banner = styled(Image)`
  border: 1.5px solid ${colors.gray7};
  border-radius: 15px;
  width: calc(100% - 22px);
`

const BannerWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 51px;
  position: relative;

  @media (${devices.largeDesktop}) {
    margin-top: auto;
    padding: 0 1rem 1rem;
  }
`

const DetailsWrapper = styled.div`
  display: flex;
  padding: 1rem;
`

const WambiContent = styled.div`
  background-color: ${colors.gray8};
  border: 0.5px solid ${colors.gray7};
  border-radius: 20px;
  bottom: 32px;
  box-shadow: ${shadows.card};
  left: 16px;
  max-width: 170px;
  overflow: hidden;
  padding: 0.5rem 1rem;
  position: absolute;

  @media (${devices.largeDesktop}) {
    bottom: 5px;
  }
`

const Wrapper = styled.div`
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 25px 0 10px;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${colors.gray7}B3;

    @media (${devices.largeDesktop}) {
      border-bottom: none;
    }
  }

  @media (${devices.largeDesktop}) {
    padding: 0 0 10px;
  }
`

const WambiItem = ({
  className,
  cpc,
  createdAt,
  cta,
  getSingle,
  handleBack,
  handleSize,
  index,
  profile,
  setActive,
  setViewDetails,
  setViewDetailsData,
}) => {
  const ref = useRef(null)

  const { authorId, authorImg, banner, content, recipient, recipientCount, sender, senderId, status } = cpc

  useEffect(() => {
    // used to get the height of each cpc item for virtualization list in cpc...JK
    setTimeout(() => {
      if (ref?.current && handleSize) handleSize(index, ref.current.clientHeight)
    }, 10)
  }, [handleSize, index])

  return (
    <Wrapper
      className={className}
      id={uId('cpc-item')}
      onClick={() => {
        const { feedId } = cpc
        setActive(NEWSFEED_VIEW.DETAILS)
        setViewDetailsData({
          component: FeedItemDetail,
          props: { authorId, cta, handleBack, profile, selectedFeedId: feedId, setViewDetails },
        })
        if (setViewDetails) setViewDetails(true)
        getSingle({ feedId })
      }}
      ref={ref}
    >
      <DetailsWrapper id='cpc-item-details-wrapper'>
        <DetailsTile
          authorImg={senderId === profile?.id ? profile?.thumbnailImage : authorImg}
          authorName={sender}
          createdAt={createdAt}
          idPrefix='cpc-item'
          isPrivate={status === FEED_ITEM_STATUS.NON_PUBLIC}
          recipientCount={recipientCount}
          recipients={[{ name: recipient }]}
          setViewDetails={setViewDetails}
        />
      </DetailsWrapper>
      <BannerWrapper>
        <Banner
          alt='cpc banner'
          id='cpc-item-banner'
          onLoad={() => ref?.current && handleSize && handleSize(index, ref.current.clientHeight)}
          src={banner}
        />
        <WambiContent>
          <Paragraph color='gray1' id='cpc-item-content-bubble' maxLines={3}>
            {content}
          </Paragraph>
        </WambiContent>
      </BannerWrapper>
    </Wrapper>
  )
}

WambiItem.propTypes = {
  className: PropTypes.string,
  cpc: PropTypes.object,
  createdAt: PropTypes.string,
  cta: PropTypes.object,
  getSingle: PropTypes.func,
  handleBack: PropTypes.func,
  handleSize: PropTypes.func,
  index: PropTypes.number,
  profile: PropTypes.object,
  setActive: PropTypes.func.isRequired,
  setViewDetails: PropTypes.func,
  setViewDetailsData: PropTypes.func.isRequired,
}

export default WambiItem
