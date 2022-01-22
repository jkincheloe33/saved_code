import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import moment from 'moment'

import { colors, devices, DowntickIcon, multiplier, NotickIcon, UptickIcon } from '@assets'
import { FeatureWidget, Image, Paragraph, Text, Timeframe } from '@components'
import { api } from '@services'

const AnimationWrapper = styled.div`
  opacity: ${p => (p.changing ? 0 : 1)};
  transition: opacity 250ms ease;
`

const OverallText = styled(Text)`
  font-size: 28px;
`

const OverallTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: auto 0;
  width: auto;
`

const OverallWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 17px 20px;

  @media (${devices.mobile}) {
    margin: 17px 30px;
  }

  img {
    margin: auto 5px;
    width: 22px;
  }
`

const PatientVoiceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  overflow: hidden;
`

const Question = styled(Paragraph)`
  flex: 1;
  margin-right: 20px;
  width: 70%;

  @media (${devices.mobile}) {
    margin-right: 25px;
  }
`

const StatRow = styled.div`
  background-color: ${colors.gray8};
  border-radius: 15px;
  display: flex;
  margin: ${multiplier * 2}px 0;
  padding: ${multiplier * 2}px;

  &:last-of-type {
    margin-bottom: 0;
  }
`

const TickerImg = styled(Image)`
  margin: auto 5px;
`

const TimeWrapper = styled.div`
  margin-top: 16px;

  @media (${devices.largeDesktop}) {
    margin-top: 0;
  }
`

const ValuesWrapper = styled.div`
  display: flex;
  justify-content: ${p => (p.all ? 'flex-end' : 'flex-start')};
  margin: ${p => (p.all ? 'auto 9px auto 0' : 'auto 0')};
`

const Wrapper = styled.div`
  align-items: center;
  display: flex;
`

const timePeriods = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'ALL', days: 0 },
]

const PatientVoiceWidget = ({ peopleId }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [changing, setChanging] = useState(false)
  const [statistics, setStatistics] = useState(null)

  const isAll = timePeriods[activeTab].days === 0

  useEffect(() => {
    const getPatientVoice = async () => {
      const {
        data: { statistics, success },
      } = await api.post('/profile/getPatientVoice', { days: timePeriods[activeTab].days, peopleId })

      if (success) setStatistics(statistics)
    }

    setChanging(true)

    getPatientVoice()

    setTimeout(() => {
      setChanging(false)
    }, 250)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const getDateText = firstDate => {
    if (isAll) {
      return `${moment(firstDate).format('MMM YYYY')} - Present`
    } else if (timePeriods[activeTab].days >= 365) {
      return `${moment().subtract(timePeriods[activeTab].days, 'days').format('MMM YYYY')} - ${moment().format('MMM YYYY')}`
    } else {
      return `${moment().subtract(timePeriods[activeTab].days, 'days').format('MMM DD')} - ${moment().format('MMM DD')}`
    }
  }

  if (statistics) {
    const {
      overallStats: { firstDate, overallChange, overallScore },
      questionStats,
    } = statistics

    return (
      <FeatureWidget border title='Patient Voice'>
        <PatientVoiceWrapper>
          <TimeWrapper>
            <Timeframe active={activeTab} bgColor='gray8' ranges={timePeriods.map(t => t.label)} setActive={setActiveTab} shadow={false} />
          </TimeWrapper>
          <AnimationWrapper changing={changing}>
            <OverallWrapper>
              <OverallTextWrapper>
                <Text color='gray1' fontWeight={600}>
                  Overall Score
                </Text>
                <Text color='gray3'>{getDateText(firstDate)}</Text>
              </OverallTextWrapper>
              <Wrapper>
                <OverallText color='gray1'>{overallScore.toFixed(1)}%</OverallText>
                {!isAll && (
                  <Image alt='overall ticker' src={overallChange > 0 ? UptickIcon : overallChange < 0 ? DowntickIcon : NotickIcon} />
                )}
              </Wrapper>
            </OverallWrapper>
            {questionStats.map(({ averageScore, change, question }, i) => (
              <StatRow key={i}>
                <Question fontSize='14px'>{question}</Question>
                <ValuesWrapper all={isAll}>
                  <Text color='gray1' fontWeight={500}>
                    {averageScore.toFixed(1)}%
                  </Text>
                  {!isAll && <TickerImg alt={`stat ticker ${i}`} src={change > 0 ? UptickIcon : change < 0 ? DowntickIcon : NotickIcon} />}
                </ValuesWrapper>
              </StatRow>
            ))}
          </AnimationWrapper>
        </PatientVoiceWrapper>
      </FeatureWidget>
    )
  } else {
    return null
  }
}

PatientVoiceWidget.propTypes = {
  peopleId: PropTypes.number,
}

export default PatientVoiceWidget
