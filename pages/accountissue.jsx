import { OopsImage } from '@assets'
import { ErrorPageLayout } from '@components'

const AccountIssue = () => (
  <ErrorPageLayout
    image={OopsImage}
    support
    text='It appears your account is not setup correctly. Please contact your administrator or submit a support ticket.'
    title='Oops!'
  />
)

export default AccountIssue
