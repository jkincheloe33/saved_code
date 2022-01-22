import { useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import InfiniteScroll from 'react-infinite-scroll-component'

import { CelebrationItem, DynamicContainer, Layout, Loader } from '@components'
import { coreApi } from '@services'

const InfiniteCelebrationsScroll = styled(InfiniteScroll)`
  display: flex;
  flex-direction: column;
  padding: 2rem 0 1.6rem 0;
  // For IOS mobile z-index issue. Needs important to overwrite package default style..JK
  -webkit-overflow-scrolling: auto !important;
`

const Wrapper = styled(DynamicContainer)`
  padding: 0 20px;
`

const ViewAllCelebrations = ({ handleBack, open }) => {
  const [celebrations, setCelebrations] = useState([])
  const [page, setPage] = useState(0)
  const [loadMore, setLoadMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (open) getMore()
  }, [open, getMore])

  const getMore = useCallback(async () => {
    // This setIsLoading is a hack to fix the behavior with the Infinite Scroll library
    // It is displaying the Loader on mount when it shouldn't, so we manually hide it until user scrolls to the bottom.
    // May need to be investigated further, because in other components it works fine...JC
    setIsLoading(true)
    const {
      data: { success, newCelebrations },
    } = await coreApi.post('/newsfeed/celebrations/list', {
      page,
      clientTzOffset: new Date().getTimezoneOffset(),
      daysLaterLimit: 365,
      pageLimit: 20,
    })
    if (success) {
      if (newCelebrations.length === 0) return setLoadMore(false)

      // Update celebrations list to steam new data into celebration items...CY
      setCelebrations([...celebrations, ...newCelebrations])
      setPage(page + 1)
    }

    setIsLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <Layout
      cta={{ onClick: handleBack, text: 'Close' }}
      handleBack={handleBack}
      id='view-all-celebration'
      inner
      noFooter
      title='Celebrations'
    >
      <Wrapper id='scrollable-celebrations-feed'>
        <InfiniteCelebrationsScroll
          dataLength={celebrations.length}
          hasMore={loadMore}
          loader={isLoading && <Loader />}
          next={getMore}
          scrollableTarget='scrollable-celebrations-feed'
        >
          <CelebrationItem celebrationList={celebrations} handleBack={handleBack} viewAll={true} />
        </InfiniteCelebrationsScroll>
      </Wrapper>
    </Layout>
  )
}

ViewAllCelebrations.propTypes = {
  handleBack: PropTypes.func,
  open: PropTypes.bool,
}

export default ViewAllCelebrations
