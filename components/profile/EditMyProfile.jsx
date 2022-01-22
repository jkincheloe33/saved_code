import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import moment from 'moment'

import { CameraIcon, colors, devices, EditIcon2, shadows, StarIcon } from '@assets'
import {
  CtaFooter,
  DynamicContainer,
  Image,
  ImageEditorWorkflow,
  InitialsBox,
  Input,
  Layout,
  Modal,
  Paragraph,
  PillButton,
  Select,
  Switch,
  Text,
} from '@components'
import { useCelebrationContext, useLangContext, useToastContext, useUserContext } from '@contexts'
import { coreApi } from '@services'
import {
  formatDateByMonthDay,
  formatMobile,
  LANGUAGE_TYPE,
  PRONOUNS,
  PRONOUNS_ARRAY_NAMES,
  USER_NOTIFY_METHODS,
  USER_NOTIFY_METHODS_ARRAY_NAMES,
} from '@utils'

const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 25px;
`

const EditImageIcon = styled.div`
  background-color: ${colors.white};
  border-radius: 50%;
  box-shadow: ${shadows.card};
  cursor: pointer;
  height: 40px;
  padding: 8px;
  position: relative;
  transform: translate(58px, -30px);
  width: 40px;

  @media (${devices.mobile}) {
    transform: translate(90px, -30px);
  }
`

const InputIcon = styled(Image)`
  cursor: pointer;
  margin: auto 0 10px 0;
`

const InputRow = styled.div`
  display: flex;
`

const MyImageWrapper = styled.div`
  max-height: 120px;
  max-width: 120px;
  width: 100%; // needed for safari

  img {
    border-radius: 20px;
  }
`

const MyInfoText = styled.div`
  display: flex;
  flex-direction: column;
  margin: auto 0;
  padding: 5px 0 0 25px;
`

const MyInfoWrapper = styled.div`
  display: flex;
`

const NotificationsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 30px 0;

  svg {
    margin-right: 24px;
    width: 18px;
  }
`

const Overlay = styled.div`
  align-items: center;
  background-color: ${colors.gray1};
  box-shadow: ${shadows.card};
  border-radius: 20px;
  display: flex;
  opacity: 0.4;
  position: relative;
`

const OverlayText = styled.span`
  color: ${colors.white};
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
`

const PronounsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 30px 0 0;

  svg {
    margin-right: 24px;
    width: 18px;
  }
`

const SelectWrapper = styled.div`
  margin: 22px 0 35px;
`

const ShareBirthdayRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 5px;

  ${Paragraph} {
    padding-right: 10px;
  }
`

const TextRow = styled.div`
  display: flex;
`

const Wrapper = styled(DynamicContainer)`
  padding: 33px 0 75px;
`

const EditMyProfile = ({ active, cta, handleBack, setActive, setMobileOrEmail }) => {
  const { setCelebration } = useCelebrationContext()
  const { getAccountLanguage } = useLangContext()
  const { setToastData } = useToastContext()
  const { getUser, user } = useUserContext()

  const [changesSaved, setChangesSaved] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showEditProfileImage, setShowEditProfileImage] = useState(false)
  const [userData, setUserData] = useState({
    birthday: '',
    birthdayPublic: false,
    displayName: '',
    email: '',
    mobile: '',
    notifyMethod: 0,
    pronouns: null,
  })

  const canSubmit = useCallback(() => {
    //Make sure user cannot submit if the original and updated value is null...CY
    const _checkIsEmpty = key => (user[key] == null ? userData[key].length > 0 : true)
    const birthdayLength = formatDateByMonthDay(userData.birthday).length

    const validBirthday = birthdayLength === 0 || birthdayLength === 5

    // Check if data has changed before enabling button...KA
    const dataChanged =
      (userData.birthday !== moment(user.birthday).utc().format('MM/DD') && _checkIsEmpty('birthday')) ||
      userData.birthdayPublic !== !!user.birthdayPublic ||
      (userData.displayName !== (user.draftDisplayName || user.displayName) && _checkIsEmpty('displayName')) ||
      Number(userData.notifyMethod) !== user.notifyMethod ||
      userData.pronouns != user.pronouns

    if (validBirthday && dataChanged) return setDisabled(false)

    setDisabled(true)
  }, [userData, user])

  useEffect(() => {
    canSubmit()
  }, [canSubmit])

  useEffect(() => {
    if (active === 1) {
      setUserData({
        ...userData,
        email: user.email || '',
        mobile: user.mobile || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, user])

  useEffect(() => {
    const getLatestUser = async () => {
      setIsLoading(true)
      const latestUser = await getUser()

      if (latestUser) {
        setUserData({
          birthday: (latestUser.birthday && moment(latestUser.birthday).utc().format('MM/DD')) || '',
          birthdayPublic: !!latestUser.birthdayPublic,
          displayName: latestUser.draftDisplayName || latestUser.displayName || '',
          email: latestUser.email || '',
          mobile: latestUser.mobile || '',
          notifyMethod: latestUser.notifyMethod,
          pronouns: latestUser.pronouns,
        })
        setIsLoading(false)
      }
    }

    getLatestUser()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatBirthday = () => {
    if (user.birthday && userData.birthday) {
      return `${moment(user.birthday).format('YYYY')}-${userData.birthday.replace('/', '-')}`
    } else if (userData.birthday) {
      return `1900-${userData.birthday.replace('/', '-')}`
    } else {
      return null
    }
  }

  const handleChange = (target, value) => {
    setChangesSaved(false)
    setUserData(userData => ({ ...userData, [target]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setIsLoading(true)

    const {
      data: { completedChallenges, rewardProgress, success },
    } = await coreApi.post('/users/updateMe', {
      userData: {
        ...userData,
        birthday: formatBirthday(),
        birthdayPublic: Number(userData.birthdayPublic),
        displayName: userData.displayName || null,
        pronouns: userData.pronouns !== PRONOUNS_ARRAY_NAMES[PRONOUNS.NO_PREFERENCE] ? userData.pronouns : null,
      },
    })

    if (success) {
      setChangesSaved(true)
      await getUser()
      setCelebration({ completeChallenges: completedChallenges, rewardProgress })
      setToastData({
        callout: 'Changes submitted!',
        icon: StarIcon,
        id: 'edit-profile-toast',
        spin: true,
      })
    }
    handleBack()
  }

  return (
    <>
      <Layout cta={cta} handleBack={handleBack} id='edit-profile' inner loading={isLoading} noFooter title='Edit My Profile'>
        <Wrapper outer>
          <form onSubmit={handleSubmit}>
            <Content>
              <MyInfoWrapper>
                <MyImageWrapper>
                  {user?.pendingThumbnail ? (
                    <Overlay>
                      <OverlayText color='white'>Pending Approval</OverlayText>
                      <Image alt='profile image' src={user.pendingThumbnail} />
                    </Overlay>
                  ) : user.thumbnailImage.length > 2 ? (
                    <Image alt='profile image' src={user.thumbnailImage} />
                  ) : (
                    <InitialsBox fontSize='48px' height='120px' initials={user.thumbnailImage} radius='20px' width='120px' />
                  )}
                  <EditImageIcon onClick={() => setShowEditProfileImage(true)}>
                    <Image alt='camera icon' src={CameraIcon} />
                  </EditImageIcon>
                </MyImageWrapper>
                <MyInfoText>
                  <Text color='gray1' fontSize='20px' fontWeight={700}>
                    {user?.name}
                  </Text>
                  <Text>
                    {user?.isSelfRegistered ? `(${getAccountLanguage(LANGUAGE_TYPE.SELF_REGISTERED_USER)}) ` : ''}
                    {user?.jobTitle}
                  </Text>
                  <Paragraph color='gray3'>{user?.groupName}</Paragraph>
                </MyInfoText>
              </MyInfoWrapper>
              <InputRow>
                <Input
                  disabled
                  label='Email address'
                  showLabel
                  spacing='30px 0 10px'
                  type='email'
                  value={userData.email || 'Enter your email'}
                />
                {user && !user.isSelfRegistered ? (
                  <InputIcon
                    alt='Edit email icon'
                    id='profile-edit-email-icon'
                    onClick={() => {
                      setActive(active => active + 1)
                      setMobileOrEmail('email')
                    }}
                    src={EditIcon2}
                  />
                ) : null}
              </InputRow>
              {user && !user.isSelfRegistered ? (
                <InputRow>
                  <Input
                    disabled
                    label='Mobile number'
                    showLabel
                    spacing='10px 0'
                    type='tel'
                    value={formatMobile(userData.mobile) || 'Enter your mobile number'}
                  />
                  <InputIcon
                    alt='Edit mobile icon'
                    id='profile-edit-mobile-icon'
                    onClick={() => {
                      setActive(active => active + 1)
                      setMobileOrEmail('mobile')
                    }}
                    src={EditIcon2}
                  />
                </InputRow>
              ) : null}
              <InputRow>
                <Input
                  border
                  label='Display first name'
                  onChange={e => handleChange('displayName', e.target.value)}
                  showLabel
                  spacing='10px 0'
                  value={userData.displayName}
                />
              </InputRow>
              <PronounsWrapper>
                <TextRow>
                  <Text color='coolGray'>Pronouns</Text>
                </TextRow>
                <SelectWrapper>
                  <Select
                    id='pronouns-select'
                    onChange={e => handleChange('pronouns', e.target.value)}
                    options={PRONOUNS_ARRAY_NAMES.map(m => ({ name: m, value: m }))}
                    value={userData.pronouns ?? ''}
                  />
                </SelectWrapper>
              </PronounsWrapper>
              <InputRow>
                <Input
                  border
                  label='Birthday'
                  placeholder='MM/DD'
                  maxLength='5'
                  onChange={e => handleChange('birthday', e.target.value)}
                  showLabel
                  spacing='10px 0'
                  type='tel'
                  value={formatDateByMonthDay(userData.birthday)}
                />
              </InputRow>
              <ShareBirthdayRow>
                <Paragraph color='gray3' fontSize='14px'>
                  Celebrate my birthday on the newsfeed
                </Paragraph>
                <Switch
                  id='birthday-switch'
                  onChange={() => handleChange('birthdayPublic', !userData.birthdayPublic)}
                  value={userData.birthdayPublic}
                />
              </ShareBirthdayRow>
              <NotificationsWrapper>
                <TextRow>
                  <Text color='gray1'>Send me notifications</Text>
                </TextRow>
                <SelectWrapper>
                  <Select
                    id='notification-select'
                    onChange={e => handleChange('notifyMethod', e.target.value)}
                    options={USER_NOTIFY_METHODS_ARRAY_NAMES.map((m, i) => ({ name: m, value: i })).filter(nm =>
                      user?.isSelfRegistered
                        ? nm.value !== USER_NOTIFY_METHODS.TEXT_AND_EMAIL && nm.value !== USER_NOTIFY_METHODS.TEXT_ONLY
                        : true
                    )}
                    value={userData.notifyMethod ?? ''}
                  />
                </SelectWrapper>
              </NotificationsWrapper>
            </Content>
            <CtaFooter>
              <PillButton
                disabled={disabled || changesSaved}
                full
                id='save-profile-changes-btn'
                text={changesSaved ? 'Saved' : 'Save Changes'}
                type='submit'
              />
            </CtaFooter>
          </form>
        </Wrapper>
      </Layout>
      <Modal open={showEditProfileImage}>
        <ImageEditorWorkflow cta={cta} handleBack={() => setShowEditProfileImage(false)} height={250} profileToEdit={user} width={250} />
      </Modal>
    </>
  )
}

EditMyProfile.propTypes = {
  active: PropTypes.number,
  cta: PropTypes.object,
  handleBack: PropTypes.func.isRequired,
  setActive: PropTypes.func,
  setLockEditMyProfile: PropTypes.func,
  setMobileOrEmail: PropTypes.func,
}

export default EditMyProfile
