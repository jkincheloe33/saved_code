import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components'

import { DynamicContainer, Layout, PeopleTile } from '@components'
import { useLangContext, useProfileContext } from '@contexts'
import { coreApi } from '@services'
import { LANGUAGE_TYPE, NEWSFEED_VIEW } from '@utils'

const Wrapper = styled(DynamicContainer)`
  padding: 0 20px;
`

const RecipientsList = ({ cta, feedId, handleBack, setActive, setViewDetails }) => {
  const { getAccountLanguage } = useLangContext()
  const { setProfileType, setSelectedProfileId, setShowProfile } = useProfileContext()

  const [loadMore, setLoadMore] = useState(true)
  const [page, setPage] = useState(0)
  const [recipients, setRecipients] = useState([])

  const getContent = index => {
    const { id, image, isSelfRegistered, name, title } = recipients[index]

    return (
      <PeopleTile
        images={[image]}
        onClick={() => handleSelect(id)}
        personId={id}
        subtitle={`${isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}${title ?? ''}`}
        title={name}
      />
    )
  }

  const getMore = async () => {
    const {
      data: { msg, recipientsList, success },
    } = await coreApi.post('/newsfeed/recipients', { feedId, page })

    if (success) {
      if (recipientsList.length > 0) {
        setPage(page + 1)
        return setRecipients([...recipients, ...recipientsList])
      }
      setLoadMore(false)
    } else {
      setLoadMore(false)
      console.warn(msg)
    }
  }

  const handleSelect = (id, type) => {
    if (id) {
      setActive(NEWSFEED_VIEW.DETAILS)
      setProfileType(type)
      setShowProfile(true)
      setSelectedProfileId(id)
      setViewDetails(false)
    }
  }

  const isItemLoaded = index => !loadMore || index < recipients.length

  useEffect(() => {
    const getInitial = async () => {
      const {
        data: { recipientsList, success },
      } = await coreApi.post('/newsfeed/recipients', { feedId, page })

      if (success) {
        if (recipientsList.length > 0) {
          setPage(page + 1)
          return setRecipients(recipientsList)
        }
      }
      setLoadMore(false)
    }

    getInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedId])

  return (
    <Layout cta={cta} handleBack={handleBack} id='recipients-list' inner noFooter title='Recipients'>
      <Wrapper id='scrollable-recipients'>
        <InfiniteLoader
          isItemLoaded={index => isItemLoaded(index)}
          itemCount={loadMore ? recipients.length + 1 : recipients.length}
          loadMoreItems={getMore}
          threshold={2}
        >
          {({ onItemsRendered, ref }) => (
            <AutoSizer ref={ref}>
              {({ height, width }) => (
                <FixedSizeList
                  height={height}
                  itemCount={loadMore ? recipients.length + 1 : recipients.length}
                  itemSize={65}
                  onItemsRendered={onItemsRendered}
                  width={width}
                >
                  {({ index, style }) => (recipients[index] ? <div style={style}>{getContent(index)}</div> : <div style={style} />)}
                </FixedSizeList>
              )}
            </AutoSizer>
          )}
        </InfiniteLoader>
      </Wrapper>
    </Layout>
  )
}

RecipientsList.propTypes = {
  cta: PropTypes.object,
  feedId: PropTypes.number,
  handleBack: PropTypes.func,
  setActive: PropTypes.func,
  setViewDetails: PropTypes.func,
}

export default RecipientsList
