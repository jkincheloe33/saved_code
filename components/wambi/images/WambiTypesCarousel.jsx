import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components'

import { CarouselArrow, colors, devices } from '@assets'
import { Image, Loader, PillButton, Title as TitleBase } from '@components'
import { useResizeContext } from '@contexts'
import { coreApi } from '@services'

import SingleImage from './SingleImage'

const ARROW_RATIO = 40
const CAROUSEL_HEIGHT = 226
const PAGE_LIMIT = 5
const SPACING = 22

const Arrow = styled.div`
  align-items: center;
  background: ${colors.white};
  border-radius: 50%;
  box-shadow: -9px 0px 15px rgb(89 114 215 / 15%);
  cursor: pointer;
  display: none;
  height: ${ARROW_RATIO}px;
  justify-content: center;
  left: ${p => (p.back ? '0' : 'auto')};
  opacity: ${p => (p.hide ? 0 : 1)};
  pointer-events: ${p => (p.hide ? 'none' : 'auto')};
  position: absolute;
  right: ${p => (p.back ? 'auto' : '0')};
  top: 40.5px;
  transform: ${p => (p.back ? 'rotate(180deg)' : '')};
  transform-origin: center center;
  transition: all 500ms ease;
  width: ${ARROW_RATIO}px;
  z-index: 1;

  &:hover {
    transform: scale(0.9) ${p => (p.back ? 'rotate(180deg)' : '')};
  }

  @media (${devices.largeDesktop}) {
    display: flex;
  }
`

const ListWrapper = styled.div`
  flex: 1;
  position: relative;
`

const Title = styled(TitleBase)`
  flex: 1;
  margin-right: 11px;
  padding-left: ${SPACING}px;
`

const TitleWrapper = styled.div`
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  padding: 0 20px 24px 0;

  @media (${devices.largeDesktop}) {
    padding-right: 0;
  }
`

const VariableList = styled(VariableSizeList)`
  scrollbar-width: none;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (${devices.desktop}) {
    padding-bottom: 0;
  }
`

const ViewAll = styled(PillButton)`
  // temporary override since this is a temporary design...JK
  box-shadow: none !important;
  filter: none !important;
`

const Wrapper = styled.div`
  display: ${p => (p.hide ? 'none' : 'flex')};
  flex-direction: column;
  height: ${CAROUSEL_HEIGHT}px;
  overflow: hidden;
  padding: 24px 0 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${colors.gray3}20;
  }
`

const WambiTypesCarousel = ({ description, handleSelect, handleViewCategory, id, name }) => {
  const [loadMoreTypes, setLoadMoreTypes] = useState(true)
  const [page, setPage] = useState(0)
  const [ready, setReady] = useState(false)
  const [types, setTypes] = useState([])

  const { windowWidth } = useResizeContext()

  // can't store in state due to rerenders when newsfeed list has to recalculate a newsfeed item's size when it changes due to SeeMore or new comments...JK
  const itemSize = useMemo(() => () => {}, [])
  const listRef = useRef(null)
  const outerRef = useRef(null)

  const getContent = index => {
    const content = !isItemLoaded(index) ? (
      <Loader />
    ) : (
      <SingleImage
        containerWidth={outerRef?.current?.offsetWidth}
        handleSelect={handleSelect}
        handleSize={handleSize}
        image={types[index]}
        index={index}
        key={index}
      />
    )
    return content
  }

  const getMoreTypes = async () => {
    const {
      data: { success, types: newTypes },
    } = await coreApi.post('/wambi/types/getWambiTypes', { page, themeId: id })
    if (success) {
      // PAGE_LIMIT is the limit per request, so we need this check to prevent more requests from being made...JK
      setLoadMoreTypes(newTypes.length === PAGE_LIMIT)
      setTypes([...types, ...newTypes])
      setPage(page => page + 1)
    } else {
      setLoadMoreTypes(false)
    }
  }

  // scrolls VariableSizeList left/right the distance of one image...JK
  const handleScrollLeft = () => (outerRef.current.scrollLeft = outerRef.current.scrollLeft - itemSize[0])
  const handleScrollRight = () => (outerRef.current.scrollLeft = outerRef.current.scrollLeft + itemSize[0])

  const handleSize = useCallback(
    (index, number) => {
      if (itemSize[index] === number) return
      itemSize[index] = number
      if (listRef?.current) listRef.current.resetAfterIndex(index)
    },
    [itemSize]
  )

  const isItemLoaded = index => !loadMoreTypes || index < types.length

  useEffect(() => {
    // resets scroll position to zero in case user resizes window. without this reset, you could have images partially cut off when resizing from mobile to desktop...JK
    if (outerRef?.current) outerRef.current.scrollLeft = 0
  }, [windowWidth])

  useEffect(() => {
    const getInitialTypes = async () => {
      const {
        data: { success, types },
      } = await coreApi.post('/wambi/types/getWambiTypes', { page, themeId: id })
      if (success) {
        // PAGE_LIMIT is the limit per request, so we need this check to prevent more requests from being made...JK
        setLoadMoreTypes(types.length === PAGE_LIMIT)
        setTypes(types)
        setPage(1)
        // Added because InfiniteLoader was running getMoreTypes on mount and this was the only fix that prevented it...JK
        setReady(true)
      } else {
        setLoadMoreTypes(false)
      }
    }

    getInitialTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Wrapper hide={types.length === 0}>
      <TitleWrapper>
        <Title fontSize='18px' justifyContent='flex-start'>
          {name}
        </Title>
        <ViewAll inverted onClick={() => handleViewCategory({ description, id, name })} small text='View all' />
      </TitleWrapper>
      {ready && (
        <ListWrapper>
          {types.length > 3 && (
            <Arrow back id={`cpc-types-back-${id}`} onClick={handleScrollLeft}>
              <Image alt='Carousel Arrow' src={CarouselArrow} />
            </Arrow>
          )}
          <InfiniteLoader
            itemCount={loadMoreTypes ? types.length + 1 : types.length}
            isItemLoaded={index => isItemLoaded(index)}
            loadMoreItems={getMoreTypes}
          >
            {({ onItemsRendered, ref }) => (
              <AutoSizer ref={ref}>
                {({ height, width }) => (
                  <VariableList
                    height={height}
                    itemCount={loadMoreTypes ? types.length + 1 : types.length}
                    itemSize={index => itemSize[index] ?? 186}
                    layout='horizontal'
                    onItemsRendered={onItemsRendered}
                    outerRef={outerRef}
                    ref={listRef}
                    width={width}
                  >
                    {({ index, style }) => (types[index] ? <div style={style}>{getContent(index)}</div> : <div style={style} />)}
                  </VariableList>
                )}
              </AutoSizer>
            )}
          </InfiniteLoader>
          {types.length > 3 && (
            <Arrow id={`cpc-types-forward-${id}`} onClick={handleScrollRight}>
              <Image alt='Carousel Arrow' src={CarouselArrow} />
            </Arrow>
          )}
        </ListWrapper>
      )}
    </Wrapper>
  )
}

WambiTypesCarousel.propTypes = {
  description: PropTypes.string,
  handleSelect: PropTypes.func.isRequired,
  handleViewCategory: PropTypes.func.isRequired,
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
}

export default WambiTypesCarousel
