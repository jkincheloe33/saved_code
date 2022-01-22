import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices } from '@assets'
import { Checkbox, Image, InitialsBox, Modal, Paragraph, PillButton, Select, TermsModal, Text } from '@components'
import { api } from '@services'
import { useLangContext, useReviewerContext } from '@contexts'
import { PEOPLE_GROUP_PRIMARY_TYPES, useStore } from '@utils'

const Accept = styled(Text)`
  margin-left: 10px;
  text-align: left;

  a {
    color: ${colors.digitalBlue};
    font-size: 13px;
    margin-left: 3px;

    @media (${devices.tablet}) {
      font-size: 18px;
    }
  }
`

const AcceptTermsContainer = styled.div`
  align-items: center;
  display: flex;
  margin: 1rem 0;
`

const EmployeeImage = styled(Image)`
  border-radius: 12px;
  width: 160px;
`

const Error = styled(Text)`
  padding-bottom: 20px;
`

const Filter = styled(Select)`
  margin: 20px 0;
  padding-right: 45px;
`

const Name = styled(Paragraph)`
  margin-top: 15px;
`

const Title = styled(Text)`
  padding-bottom: 30px;
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: auto;
  margin: auto;
  max-height: 90vh;
  overflow: auto;
  padding: 2rem;
  position: relative;
  text-align: center;
  width: 80vw;

  @media (${devices.mobile}) {
    justify-content: flex-start;
    width: 90vw;
  }

  @media (${devices.tablet}) {
    justify-content: space-between;
    max-height: 692px;
    padding: 2rem 3rem;
    width: 522px;
  }
`

const EmployeeModal = ({ groupFilter, id, image, name, onClick, onClose, reviewData, setReviewData, title, toggle }) => {
  const { getText } = useLangContext()
  const { reviewer } = useReviewerContext()
  const { acceptedTermsAt } = { ...reviewer }

  const [acceptedTerms, setAcceptedTerms] = useState(true)
  const [employeeGroups, setEmployeeGroups] = useState([])
  const [employeeGroupFilter, setEmployeeGroupFilter] = useState('')
  const [showTerms, setShowTerms] = useState(false)

  // Terms verified are reviews coming from the wambi platform...CY
  const [
    setStore,
    {
      portalState,
      portalState: { termsVerified },
    },
  ] = useStore()

  useEffect(() => {
    const getEmployeeGroups = async () => {
      const {
        data: { groups, success },
      } = await api.get(`portal/employee/groupList?employeeId=${id}&groupId=${reviewData?.location.id}`)

      if (success) {
        setEmployeeGroups(groups)

        const primaryGroup = groups.find(g => g.isPrimary === PEOPLE_GROUP_PRIMARY_TYPES.COST)

        if (groups.length === 1) setEmployeeGroupFilter(groups[0].id)
        else if (groupFilter) setEmployeeGroupFilter(groupFilter)
        else if (primaryGroup) setEmployeeGroupFilter(primaryGroup.id)
      }
    }

    if (toggle) getEmployeeGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggle])

  useEffect(() => {
    setReviewData(data => ({ ...data, noQuestions: false }))
  }, [employeeGroupFilter, setReviewData])

  const handleClick = async () => {
    const defaultGroup = employeeGroups.find(g => g.isPrimary === PEOPLE_GROUP_PRIMARY_TYPES.COST) || employeeGroups[0]
    // eslint-disable-next-line quotes
    onClick(employeeGroupFilter === getText("I don't know") ? defaultGroup.id : employeeGroupFilter)

    // Added timeout so terms checkbox doesn't flash on Begin Review click...KA
    setTimeout(() => setStore({ portalState: { ...portalState, termsVerified: true } }), 2000)
  }

  const handleClickOut = () => {
    if (!showTerms) {
      onClose()
      setReviewData(data => ({ ...data, groupId: '', noQuestions: false }))
      if (!groupFilter) setEmployeeGroupFilter('')
      if (!termsVerified && acceptedTermsAt == null) setAcceptedTerms(false)
    }
  }

  const acceptTerms = () => {
    setAcceptedTerms(true)
    setShowTerms(false)
  }

  return (
    <>
      <Modal animationType='slideUp' handleClose={handleClickOut} onClickOut={handleClickOut} open={toggle} small>
        <Wrapper>
          {image?.length === 2 ? (
            <InitialsBox fontSize='56px' height='160px' initials={image} radius='12px' width='160px' />
          ) : (
            <EmployeeImage alt='Employee profile image' src={image} />
          )}
          <Name fontSize={['14px', '16px']} fontWeight={700} maxLines={1}>
            {name}
          </Name>
          <Title fontSize={['14px', '16px']}>{title}</Title>
          {employeeGroups.length > 1 && (
            <div>
              <Text>{getText('Where were you cared for?')}</Text>
              <Filter
                id='employee-groups-filter'
                onChange={e => setEmployeeGroupFilter(e.target.value)}
                // eslint-disable-next-line quotes
                options={[{ name: getText("I don't know") }, ...employeeGroups.map(group => ({ name: group.name, value: group.id }))]}
                title={getText('Select one')}
                value={employeeGroupFilter}
              />
            </div>
          )}
          {!termsVerified && acceptedTermsAt == null && (
            <AcceptTermsContainer>
              <Checkbox checked={acceptedTerms} id='employee-modal-checkbox' onChange={() => setAcceptedTerms(at => !at)}></Checkbox>
              <Accept noClamp>
                {getText('I accept the')}
                <a onClick={() => setShowTerms(true)}>{getText('Terms and Conditions')}</a>
              </Accept>
            </AcceptTermsContainer>
          )}
          {reviewData?.noQuestions && (
            <Error color='berry' noClamp>
              {getText('No question sets found for this person, please contact the administrator.')}
            </Error>
          )}
          <PillButton
            disabled={!acceptedTerms || !employeeGroupFilter || reviewData?.noQuestions}
            id='employee-modal-begin-review-btn'
            onClick={handleClick}
            text={getText('Begin')}
          />
        </Wrapper>
      </Modal>
      <TermsModal acceptTerms={acceptTerms} isNested isPortal showTerms={showTerms} />
    </>
  )
}

EmployeeModal.propTypes = {
  groupFilter: PropTypes.string,
  id: PropTypes.number,
  image: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func,
  onClose: PropTypes.func,
  reviewData: PropTypes.object,
  setReviewData: PropTypes.func,
  title: PropTypes.string,
  toggle: PropTypes.bool,
}

export default EmployeeModal
