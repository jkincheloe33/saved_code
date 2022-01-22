import { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { devices } from '@assets'
import { DynamicContainer, Loader, NotificationItem, Title as TitleBase } from '@components'
import { coreApi } from '@services'
import { PRIORITY_NOTIFICATIONS, uId } from '@utils'

const InfiniteNotificationsScroll = styled(InfiniteScroll)`
  display: flex;
  flex-direction: column;
`

const Title = styled(TitleBase)`
  padding: 23px;
`

const Wrapper = styled(DynamicContainer)`
  padding-bottom: 120px;

  @media (${devices.tablet}) {
    padding-bottom: 60px;
  }

  @media (${devices.largeDesktop}) {
    padding-bottom: 20px;
  }
`

const NotificationList = ({ active, setNotificationDetail, withTitle = false }) => {
  const [loadMore, setLoadMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(0)
  const [wasViewed, setWasViewed] = useState(false)

  const getMore = async () => {
    const {
      data: { notificationData, success },
    } = await coreApi.post('/notifications/list', { page })

    if (success) {
      setLoadMore(notificationData.length >= 20)
      setPage(page + 1)
      setNotifications([...notifications, ...notificationData])
    } else {
      setLoadMore(false)
    }
  }

  useEffect(() => {
    const getInitial = async () => {
      setLoading(true)
      const {
        data: { notificationData, success },
      } = await coreApi.post('/notifications/list', { page })

      if (success) {
        setLoadMore(notificationData.length >= 20)
        setPage(1)
        setNotifications(notificationData)
      } else {
        setLoadMore(false)
      }
      setLoading(false)
    }
    if (active && !wasViewed) {
      setWasViewed(true)
      getInitial()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, wasViewed])

  const scrollId = uId('scrollable-notification')

  return (
    <Wrapper fixed id={scrollId} outer>
      {withTitle && <Title justifyContent='start'>Notifications</Title>}
      {loading ? (
        <Loader />
      ) : (
        <InfiniteNotificationsScroll
          dataLength={notifications.length}
          hasMore={loadMore}
          loader={<Loader />}
          next={getMore}
          scrollableTarget={scrollId}
        >
          {notifications.length > 0 ? (
            notifications.map((n, i) => (
              <NotificationItem
                key={i}
                notification={n}
                setNotificationDetail={setNotificationDetail}
                wasViewed={wasViewed && !active && !PRIORITY_NOTIFICATIONS.some(type => type === n.type)}
              />
            ))
          ) : (
            <div>
              <Title>No new notifications</Title>
            </div>
          )}
        </InfiniteNotificationsScroll>
      )}
    </Wrapper>
  )
}

NotificationList.propTypes = {
  active: PropTypes.bool,
  setNotificationDetail: PropTypes.func.isRequired,
  withTitle: PropTypes.bool,
}

export default NotificationList
