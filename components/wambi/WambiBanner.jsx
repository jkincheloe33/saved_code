import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, EditIcon2, shadows } from '@assets'
import { Avatar, Image, PillButton, Text } from '@components'
import { useLangContext, usePostContext, useResizeContext } from '@contexts'
import { LANGUAGE_TYPE, numberFormatter, uId } from '@utils'

// original dimensions for cpc images
const BANNER_HEIGHT = 751
const BANNER_WIDTH = 1296
// returns percentage value for original height/width of banner image...JK
const BANNER_RATIO = BANNER_HEIGHT / BANNER_WIDTH

// prettier-ignore
const Banner = styled.div`
  background-image: url(${p => p.image});
  background-position: center center;
  background-size: cover;
  border: 1.5px solid ${colors.gray7};
  border-radius: 15px;
  box-shadow: ${shadows.cpc};
  cursor: ${p => p.showCursor ? 'pointer' : 'default'};
  height: 52vw;
  max-height: ${BANNER_HEIGHT}px;
  position: relative;
  width: calc(100% - 20px);

  ${p => p.width && `
    height: ${p.width * BANNER_RATIO}px;
  `}
`

const BannerWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
  position: relative;
  width: 100%;
`

const EditBanner = styled(Image)`
  bottom: 5px;
  cursor: pointer;
  position: absolute;
  right: 6px;
  width: 30px;
`

const EditRecipients = styled(Image)`
  border-radius: 50%;
  box-shadow: ${shadows.card};
  cursor: pointer;
  transform: translateX(-${p => p.length * 20}px);
  width: 30px;
  z-index: 3;

  ${p => p.length === 1 && 'transform: translate(-35px, -5px)'}
`

// prettier-ignore
const Recipient = styled(Avatar)`
  background-color: ${colors.white};
  pointer-events: none;
  position: relative;
  transform: translateX(-${p => p.index * 23}px);
  z-index: ${p => p.level};

  ${p => p.single && `
    border-radius: 15px;
  `}
`

const Recipients = styled.div`
  cursor: ${p => (p.onClick ? 'pointer' : 'auto')};
  padding-top: 45px;
`

const RecipientWrapper = styled.div`
  align-items: flex-end;
  bottom: ${p => (p.single ? '-30px' : '-20px')};
  cursor: ${p => (p.onClick ? 'pointer' : 'auto')};
  display: flex;
  position: absolute;
  left: 0;
`

const WambiBanner = ({
  banner,
  cpcScreens,
  handleBannerClick,
  handleRecipients,
  recipients = [],
  recipientCount,
  setActive,
  showCursor,
  skip = false,
  updateSize,
}) => {
  const { getAccountLanguage } = useLangContext()
  const { selectedCpcTheme } = usePostContext()
  const { windowWidth } = useResizeContext()

  const [bannerWidth, setBannerWidth] = useState(null)

  // need class selector to calculate banner height on newfeed. bannerRef needed to calculate banner height in detail view or when sending cpc...JK
  const bannerNode = document.getElementsByClassName('banner-wrapper')[0]
  const bannerRef = useRef()
  const single = recipientCount === 1

  useEffect(() => {
    if (bannerRef?.current) setBannerWidth(bannerRef.current.clientWidth)
  }, [windowWidth])

  return (
    <>
      <BannerWrapper className='banner-wrapper' ref={bannerRef}>
        <Banner
          image={banner}
          onClick={handleBannerClick && handleBannerClick}
          onLoad={updateSize && updateSize}
          showCursor={showCursor}
          width={bannerWidth || bannerNode?.clientWidth}
        >
          {setActive && (
            <EditBanner
              id='cpc-edit-banner-btn'
              onClick={() => setActive(selectedCpcTheme ? cpcScreens.THEME_DETAILS : cpcScreens.IMAGES)}
              src={EditIcon2}
            />
          )}
        </Banner>
        <RecipientWrapper onClick={handleRecipients && handleRecipients} single={single}>
          {recipientCount > 0 ? (
            recipients.map((recipient, i) => (
              <Recipient
                border
                image={recipient.image || recipient.thumbnailImage}
                index={i}
                key={i}
                level={3 - i}
                ratio={single ? '115px' : '63px'}
                shadow
                single={single}
              />
            ))
          ) : (
            <PillButton id='cpc-edit-recipients-btn' inverted onClick={() => setActive(cpcScreens.SEARCH)} text='Add recipients' thin />
          )}
          {setActive && recipientCount > 0 && !skip && (
            <EditRecipients
              id='cpc-edit-recipients-btn'
              length={recipientCount > 3 ? 3 : recipientCount}
              onClick={() => setActive(cpcScreens.SEARCH)}
              src={EditIcon2}
            />
          )}
        </RecipientWrapper>
      </BannerWrapper>
      {recipientCount > 0 && (
        <Recipients onClick={handleRecipients && handleRecipients}>
          <Text color='gray1' fontSize='18px' fontWeight={600} id={uId('recipient-names')} noClamp>
            {recipients.map((recipient, i) => {
              // these checks are needed to know whether to add commas or 'and' to properly separate out the names...JK
              const name =
                recipientCount === 1
                  ? recipient.name
                  : i === recipientCount - 1
                  ? `and ${recipient.name}`
                  : recipientCount === 2
                  ? `${recipient.name} `
                  : `${recipient.name}, `
              return name
            })}
            {recipientCount > 3 && ` and ${numberFormatter(recipientCount - 3)} ${recipientCount === 4 ? 'other' : 'others'}`}
          </Text>
          {recipientCount === 1 && recipients[0]?.title && (
            <Text>
              {recipients[0].isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}
              {recipients[0].title ?? ''}
            </Text>
          )}
        </Recipients>
      )}
    </>
  )
}

WambiBanner.propTypes = {
  banner: PropTypes.string.isRequired,
  cpcScreens: PropTypes.object,
  handleBannerClick: PropTypes.func,
  handleRecipients: PropTypes.func,
  recipientCount: PropTypes.number,
  recipients: PropTypes.array,
  setActive: PropTypes.func,
  showCursor: PropTypes.bool,
  skip: PropTypes.bool,
  updateSize: PropTypes.func,
}

export default WambiBanner
