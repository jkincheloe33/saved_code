import { useEffect, useState } from 'react'

import { useUserContext } from '@contexts'
import { Layout, Modal, NotificationList } from '@components'

const Notifications = () => {
  const [notificationDetail, setNotificationDetail] = useState(null)
  const { readNotification } = useUserContext()

  useEffect(() => {
    readNotification()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderComponent = ({ component, props }) => {
    const Component = component
    return <Component {...props} />
  }

  return (
    <Layout head='Notifications' id='notification'>
      <NotificationList active setNotificationDetail={setNotificationDetail} />
      <Modal open={notificationDetail !== null}>
        {notificationDetail &&
          renderComponent({
            component: notificationDetail.component,
            props: { handleBack: () => setNotificationDetail(null), ...notificationDetail.props },
          })}
      </Modal>
    </Layout>
  )
}

export default Notifications
