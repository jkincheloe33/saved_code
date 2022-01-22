import styled from 'styled-components'
import PropTypes from 'prop-types'

import { AddReactionIcon, colors, devices, shadows } from '@assets'
import { Image, RoundButton, Text } from '@components'
import { useReactionsContext } from '@contexts'
import { numberFormatter, uId } from '@utils'

const AddEmoji = styled(RoundButton)`
  button {
    padding: 0 7px;
  }
`

// needed to make clickable area bigger for mobile...JK
const AddWrapper = styled.div`
  cursor: pointer;
  padding: 7px 7px 7px 3px;
  transition: transform 250ms ease;

  @media (${devices.desktop}) {
    &:hover {
      transform: scale(1.15);
    }
  }
`

const AvailableReactionsWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  margin: 0 auto;
  max-width: 414px;
  padding: 43px 7px 23px;
  position: relative;

  &::before {
    background-color: ${colors.gray7};
    border-radius: 40px;
    content: '';
    height: 5px;
    left: 50%;
    position: absolute;
    top: 18px;
    transform: translateX(-50%);
    width: 65px;
  }
`

const EmojiCircle = styled.div`
  align-items: center;
  background-color: ${p => (p.clicked ? colors.gray8 : colors.white)};
  border: ${p => (p.clicked ? `1px solid ${colors.gray4}` : 'none')};
  border-radius: 50px;
  box-shadow: ${p => (p.clicked ? 'none' : shadows.reaction)};
  cursor: pointer;
  display: flex;
  height: 30px;
  justify-content: center;
  margin: 7px 3px;
  min-width: 52px;
  padding: 0 11px;
`

const EmojiCount = styled(Text)`
  margin-left: 3px;
`

const EmojiWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  height: auto;
  margin: 3px 0px 3px -3px;
  width: calc(100% + 6px);
`

const NewReaction = styled(Image)`
  cursor: pointer;
  flex: 0 0 auto;
  flex-basis: calc(${100 / 7}% - 26px);
  margin: 13px;
  max-width: calc(${100 / 7}% - 26px);
  min-width: 30px;
  width: 100%;

  @media (${devices.desktop}) {
    transition: transform 150ms ease;

    &:hover {
      transform: scale(1.15);
    }
  }
`

const ReactionImg = styled(Image)`
  max-width: 25px;
  min-width: 18px;
`

const ReactionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`

export const ReactionsPopUp = ({ onNewReaction, setShowReactions }) => {
  const { availableReactions } = useReactionsContext()

  return (
    <AvailableReactionsWrapper>
      {availableReactions.map(r => (
        <NewReaction
          key={r.id}
          src={r.icon}
          onClick={() => {
            onNewReaction && onNewReaction(r)
            setShowReactions(false)
          }}
        />
      ))}
    </AvailableReactionsWrapper>
  )
}

const Reactions = ({ onNewReaction, onReactionClick, reactions, setReactionsData, setShowReactions }) => (
  <ReactionsWrapper>
    <EmojiWrapper>
      {reactions &&
        reactions.map((reaction, i) => (
          <EmojiCircle
            id={uId(reaction.name)}
            key={i}
            onClick={() => onReactionClick && onReactionClick(reaction)}
            clicked={reaction.feedReactionId != null}
          >
            <ReactionImg src={reaction.icon} alt={`Emoji for ${reaction.name}`} />
            <EmojiCount>{numberFormatter(reaction.count)}</EmojiCount>
          </EmojiCircle>
        ))}
      <AddWrapper
        id={uId('add-reaction')}
        onClick={() => {
          setReactionsData({ onNewReaction, setShowReactions })
          setShowReactions(true)
        }}
      >
        <AddEmoji iconWidth='25px' image={{ alt: 'add reaction icon', src: AddReactionIcon }} ratio='30px' />
      </AddWrapper>
    </EmojiWrapper>
  </ReactionsWrapper>
)

ReactionsPopUp.propTypes = {
  onNewReaction: PropTypes.func.isRequired,
  setShowReactions: PropTypes.func,
}

Reactions.propTypes = {
  onNewReaction: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  onReactionClick: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  reactions: PropTypes.array.isRequired,
  setReactionsData: PropTypes.func,
  setShowReactions: PropTypes.func,
}

export default Reactions
