import moment from 'moment-shortformat'
import numbro from 'numbro'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, devices, PatientHeartIcon } from '@assets'
import { Avatar, Text } from '@components'

const Arrow = styled.span`
  display: inline-block;
  height: 8px;
  position: relative;
  width: 6px;

  &::after {
    border-bottom: 4px solid transparent;
    border-left: 6px solid ${colors.gray1};
    border-top: 4px solid transparent;
    border-radius: 2px;
    content: '';
    left: 0;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
`

const CallOutWrapper = styled.div`
  display: flex;
`

const CreatedAt = styled(Text)`
  margin-right: 5px;
`

const Content = styled.div`
  flex: 1;
  margin-left: 13px;
`

const Names = styled(Text)`
  padding-right: 12px;
  position: relative;
`

const Transaction = styled.div`
  display: flex;
  padding-right: 40px;

  @media (${devices.desktop}) {
    padding-right: 0;
  }
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
`

// Design calls for diplaying the first name only. We need the full name elsewhere, so split(' ') is used instead of changing the query...JK
const DetailsTile = ({
  authorId,
  authorImg,
  authorName,
  createdAt,
  idPrefix,
  isPrivate = false,
  recipientCount,
  recipients,
  setViewDetails,
  type,
}) => {
  const fontSize = ['14px', '16px']
  const formattedRecipientsCount = `${numbro(recipientCount).format({ average: recipientCount > 999 })} people`

  return (
    <Wrapper>
      <Avatar image={authorImg ?? PatientHeartIcon} personId={authorId} ratio='50px' setViewDetails={setViewDetails} type={type} />
      <Content>
        <Transaction id={`${idPrefix}-transaction-title`}>
          <Names color='gray1' fontSize={fontSize} fontWeight={700} id={`${idPrefix}-author`} maxLines={2}>
            {authorName} <Arrow /> {recipientCount > 1 ? formattedRecipientsCount : recipients[0].name}
          </Names>
        </Transaction>
        <CallOutWrapper id={`${idPrefix}-callout-wrapper`}>
          {createdAt && (
            <CreatedAt color='gray1' fontSize={fontSize}>
              {moment(createdAt).fromNow()}
            </CreatedAt>
          )}

          {isPrivate && (
            <Text id={`${idPrefix}-private-text`} fontSize={fontSize}>
              (not shared on newsfeed)
            </Text>
          )}
        </CallOutWrapper>
      </Content>
    </Wrapper>
  )
}

DetailsTile.propTypes = {
  authorId: PropTypes.number,
  authorImg: PropTypes.string,
  authorName: PropTypes.string,
  createdAt: PropTypes.string,
  idPrefix: PropTypes.string,
  isPrivate: PropTypes.bool,
  recipientCount: PropTypes.number,
  recipients: PropTypes.array,
  setViewDetails: PropTypes.func,
  type: PropTypes.string,
}

export default DetailsTile
