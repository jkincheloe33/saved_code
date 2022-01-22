import { useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { breakpoints, CarouselArrow, colors, devices, shadows } from '@assets'
import { Image, InitialsBox, Paragraph } from '@components'
import { useProfileContext, useResizeContext } from '@contexts'
import { coreApi } from '@services'

const ARROW_RATIO = 40
const HEIGHT = 113
const PADDING_MOBILE = 20
const PADDING_DESKTOP = 50
const WIDTH = 113

const Arrow = styled.div`
  align-items: center;
  background: ${colors.white};
  border-radius: 50%;
  box-shadow: ${shadows.card};
  cursor: pointer;
  display: none;
  height: ${ARROW_RATIO}px;
  justify-content: center;
  left: ${p => (p.back ? '10px' : 'auto')};
  opacity: ${p => (p.hide ? 0 : 1)};
  pointer-events: ${p => (p.hide ? 'none' : 'auto')};
  position: absolute;
  right: ${p => (p.back ? 'auto' : '10px')};
  top: ${(HEIGHT + PADDING_MOBILE * 2) / 2 - ARROW_RATIO / 2}px;
  transform: ${p => (p.back ? 'rotate(180deg)' : '')};
  transform-origin: center center;
  transition: all 250ms cubic-bezier(0.89, 0.01, 0.1, 0.98);
  width: ${ARROW_RATIO}px;

  &:hover {
    transform: scale(1.1) ${p => (p.back ? 'rotate(180deg)' : '')};
  }

  @media (${devices.largeDesktop}) {
    display: flex;
    top: ${(HEIGHT + PADDING_DESKTOP * 2) / 2 - ARROW_RATIO / 2}px;
  }

  @media (${devices.xlDesktop}) {
    left: ${p => (p.back ? '20px' : 'auto')};
    right: ${p => (p.back ? 'auto' : '20px')};
  }
`

const ImageBox = styled.div`
  background: url(${p => p.image}) no-repeat;
  background-position: center center;
  background-size: cover;
  border-radius: 17px;
  height: ${HEIGHT}px;
  position: relative;
  width: ${WIDTH}px;

  @media (${devices.largeDesktop}) {
    max-width: ${WIDTH}px;
    transition: transform 250ms ease;
    width: 100%;

    &:hover {
      transform: scale(0.95);
    }
  }
`

const InfiniteSpotlightScroll = styled(InfiniteScroll)`
  display: flex;
  // For IOS mobile z-index issue. Needs important to overwrite package default style...JK
  -webkit-overflow-scrolling: auto !important;
  transform: translateX(0);
  transition: transform 250ms cubic-bezier(0.89, 0.01, 0.1, 0.98);

  @media (${devices.largeDesktop}) {
    transform: translateX(-${p => p.active * p.width}px);
  }
`

const Initials = styled(InitialsBox)`
  @media (${devices.largeDesktop}) {
    max-width: ${WIDTH}px;
    min-width: 0;
    transition: transform 250ms ease;
    width: 100%;

    &:hover {
      transform: scale(0.95);
    }
  }
`

// prettier-ignore
const StoryPersonItem = styled.li`
  align-items: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0 1rem;
  transition: opacity 250ms cubic-bezier(.89,.01,.1,.98);

  span {
    align-items: center;
    display: flex;
    justify-content: space-around;
    text-align: center;
    width: ${WIDTH}px;
  }

  @media (${devices.largeDesktop}) {
    margin: 0;
    opacity: 0;

    ${p => p.width > 0 && `
      opacity: 1;
      width: calc(${p.width}px / 3);
    `}
  }

  @media (${devices.xlDesktop}) {
    ${p => p.width > 0 && `
      width: calc(${p.width}px / 5);
    `}
  }
`

const StoriesList = styled.ul`
  display: flex;
  margin: 0;
  overflow: auto;
  padding: 0;
  /* Edge and Firefox */
  -ms-overflow-style: none; /* Edge */
  scrollbar-width: none; /* Firefox */
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }

  @media (${devices.largeDesktop}) {
    overflow: hidden;
  }
`

const StoryWrapper = styled.div`
  padding: ${PADDING_MOBILE}px 0;

  @media (${devices.largeDesktop}) {
    padding: ${PADDING_DESKTOP}px 0;
  }
`

const TextWrapper = styled.div`
  padding-top: 20px;
  text-align: center;

  ${Paragraph} {
    display: block;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: ${WIDTH}px;
  }
`

const Wrapper = styled.div`
  position: relative;

  @media (${devices.largeDesktop}) {
    padding: 0 30px;
  }
`

const SpotlightReel = ({ className, setShowProfile }) => {
  const [active, setActive] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [spotlight, setSpotlightList] = useState([])
  const [width, setWidth] = useState(0)

  const ref = useRef(null)
  const { setProfileType, setSelectedProfileId } = useProfileContext()
  const { windowWidth } = useResizeContext()

  // calculates the number of carousel pages needed based on how many images are visible.
  // divide by the spotlight length and round to the nearest common demoninator...JK
  const carouselPages =
    spotlight && windowWidth >= breakpoints.xlDesktop ? Math.ceil(spotlight.length / 5) : spotlight && Math.ceil(spotlight.length / 4)

  useEffect(() => {
    const getSpotlightList = async () => {
      const {
        data: { peopleList, success },
      } = await coreApi.post('/newsfeed/spotlight/list', { page })
      if (success) {
        setSpotlightList(s => [...s, ...peopleList])
        setPage(1)
        setHasMore(peopleList.length !== 0)
      }
    }
    getSpotlightList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    handleResize()
  }, [spotlight, windowWidth])

  const getMore = async () => {
    const {
      data: { peopleList, success },
    } = await coreApi.post('/newsfeed/spotlight/list', { page })
    if (success) {
      setSpotlightList(s => [...s, ...peopleList])
      setPage(page + 1)
      setHasMore(peopleList.length !== 0)
    }
  }

  const handleNext = () => {
    if (hasMore) getMore()
    setActive(active => active + 1)
  }

  const handleResize = () => {
    if (ref && ref.current) setWidth(ref.current.clientWidth)
  }

  return (
    <Wrapper className={className}>
      <StoryWrapper>
        {spotlight?.length > 0 && (
          <StoriesList id='scrollableDiv' ref={ref}>
            <InfiniteSpotlightScroll
              active={active}
              dataLength={spotlight && spotlight.length}
              hasMore={hasMore}
              inverse={true}
              next={getMore}
              scrollThreshold={0.5}
              scrollableTarget='scrollableDiv'
              width={width}
            >
              {spotlight.map((item, i) => (
                <StoryPersonItem
                  key={i}
                  onClick={() => {
                    setSelectedProfileId(item.peopleId)
                    setProfileType(item.type)
                    setShowProfile(true)
                  }}
                  width={width}
                >
                  {item.thumbnailImage.length === 2 ? (
                    <Initials fontSize='44px' height={`${HEIGHT}px`} initials={item.thumbnailImage} radius='15px' width={`${WIDTH}px`} />
                  ) : (
                    <ImageBox image={item.thumbnailImage} />
                  )}
                  <TextWrapper>
                    <Paragraph fontSize={['14px', '16px']} fontWeight={600} maxLines={1}>
                      {item.name}
                    </Paragraph>
                  </TextWrapper>
                </StoryPersonItem>
              ))}
            </InfiniteSpotlightScroll>
            <Arrow back hide={active === 0} onClick={() => setActive(active => active - 1)}>
              <Image alt='Carousel Arrow' src={CarouselArrow} />
            </Arrow>
            <Arrow hide={carouselPages === active + 1} onClick={() => handleNext()}>
              <Image alt='Carousel Arrow' src={CarouselArrow} />
            </Arrow>
          </StoriesList>
        )}
      </StoryWrapper>
    </Wrapper>
  )
}

SpotlightReel.propTypes = {
  className: PropTypes.string,
  setShowProfile: PropTypes.func,
}

export default SpotlightReel
