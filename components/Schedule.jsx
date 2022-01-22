import { useMemo, useRef, useState } from 'react'
import Calendar from 'react-calendar'
import moment from 'moment'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { CalendarIcon2, ClockSmallIcon, colors, devices, multiplier, shadows } from '@assets'
import { DropdownButton, PillButton, Text, Title } from '@components'
import { handleClickOut } from '@utils'

const ButtonWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
`

const CalendarWrapper = styled.div`
  display: ${p => (p.open ? 'block' : 'none')};
  left: 50%;
  position: absolute;
  top: 0;
  transform: translateX(-50%);

  // react-calendar css overrides...PS
  .react-calendar {
    background: white;
    border: 1px solid ${colors.gray5};
    border-radius: 14px;
    overflow: hidden;

    .react-calendar__tile--now {
      background-color: ${colors.lightBlue};
    }

    .react-calendar__tile--active {
      background: ${colors.blurple};
    }
  }
`

const ConfirmButton = styled(PillButton)`
  margin-bottom: ${multiplier * 2}px;
`

const ScheduleTitle = styled(Title)`
  margin-bottom: ${multiplier}px;
  text-align: center;
`

const SubText = styled(Text)`
  margin-bottom: ${multiplier * 2}px;
  text-align: center;
`

const TimeDropdown = styled.div`
  background-color: ${colors.white};
  border-radius: ${multiplier}px;
  bottom: 0;
  box-shadow: ${shadows.card};
  display: ${p => (p.open ? 'block' : 'none')};
  left: 50%;
  max-height: 140px;
  overflow-y: scroll;
  padding: ${multiplier}px ${multiplier * 3}px;
  position: absolute;
  transform: translateX(-50%);
  width: 100%;

  @media (${devices.tablet}) {
    padding: ${multiplier}px;
  }

  ul {
    margin: 0;
    padding: 0;
  }

  li {
    cursor: pointer;
    list-style: none;
    padding: 0 ${multiplier}px;

    &:hover {
      background-color: ${colors.lightestPurple};
    }
  }
`

const Wrapper = styled.div`
  padding: ${multiplier * 2}px ${multiplier * 3}px;
  position: relative;
`

const Schedule = ({ date: selectedDate, handleCancel, handleConfirm, onChange, setTime, submitting, subText, time, title }) => {
  const [openCalendar, setOpenCalendar] = useState(false)
  const [openTime, setOpenTime] = useState(false)

  // format date to look like July 4, 1999...PS
  const date = useMemo(() => selectedDate && moment(selectedDate).format('MMMM DD, YYYY'), [selectedDate])
  // create new date object...PS
  const { current: newDate } = useRef(new Date())
  // format date to look like July 4, 1999...PS
  const { current: today } = useRef(moment(newDate).format('MMMM DD, YYYY'))

  const calendarRef = useRef(null)
  const timeRef = useRef(null)

  const scheduleRefs = [calendarRef, timeRef]

  handleClickOut(scheduleRefs, () => {
    if (openCalendar) setOpenCalendar(false)
    if (openTime) setOpenTime(false)
  })

  // current hour plus 1...PS
  const now = newDate.getHours() + 1

  // create 24 hours list...PS
  const timeArray = Array.from({ length: 24 }, (now, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12
    const midDay = i >= 12 ? 'PM' : 'AM'
    return `${hour}:00 ${midDay}`
  })

  // exclude hours that are in the past...PS
  const futureTimes = timeArray.slice(now)

  const handleTimeList = () => {
    const timeList = today === date ? futureTimes : timeArray

    return timeList.map((t, i) => (
      <li
        key={i}
        onClick={() => {
          setTime(t)
          setOpenTime(false)
        }}
      >
        {t}
      </li>
    ))
  }

  return (
    <Wrapper>
      {title && <ScheduleTitle fontSize='20px'>{title}</ScheduleTitle>}
      {subText && <SubText color='gray1'>{subText}</SubText>}
      <DropdownButton
        icon={CalendarIcon2}
        displayText={date ? moment(date).format('MMMM DD, YYYY') : 'Schedule date'}
        onClick={() => setOpenCalendar(true)}
        spacing={'0 0 16px'}
      />

      {date && (
        <DropdownButton
          icon={ClockSmallIcon}
          displayText={time || 'Schedule time'}
          onClick={() => setOpenTime(true)}
          spacing={'0 0 16px'}
        />
      )}
      <ButtonWrapper>
        {handleConfirm && (
          <ConfirmButton
            disabled={submitting || !date || !time}
            full
            text='Schedule'
            onClick={() => handleConfirm({ scheduleSaved: true })}
            thin
          />
        )}
        {handleCancel && <PillButton buttonType='secondary' full onClick={handleCancel} text='Cancel' thin />}
      </ButtonWrapper>
      <CalendarWrapper open={openCalendar} ref={calendarRef}>
        <Calendar
          calendarType='US'
          minDate={futureTimes.length > 0 ? new Date() : new Date(Date.now() + 3600 * 1000 * 24)}
          onChange={onChange}
          onClickDay={() => {
            setOpenCalendar(false)
            setTime(null)
          }}
        />
      </CalendarWrapper>
      <TimeDropdown open={openTime} ref={timeRef}>
        <ul>{handleTimeList()}</ul>
      </TimeDropdown>
    </Wrapper>
  )
}

Schedule.propTypes = {
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  handleCancel: PropTypes.func,
  handleConfirm: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  setTime: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  subText: PropTypes.string,
  time: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  title: PropTypes.string,
}

export default Schedule
