import { FeatureWidget, PersonInfoWidget } from '@components'
import { useUserContext } from '@contexts'

const ProfileWidget = () => {
  const { user } = useUserContext()

  return (
    <FeatureWidget title='My Profile'>
      <PersonInfoWidget myProfile profile={user} />
    </FeatureWidget>
  )
}

export default ProfileWidget
