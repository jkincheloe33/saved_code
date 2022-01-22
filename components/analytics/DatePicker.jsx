import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import DateRangePicker from '@wojtekmaj/react-daterange-picker/dist/entry.nostyle'

import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css'
import 'react-calendar/dist/Calendar.css'

import { CalendarIcon, colors, shadows } from '@assets'
import { Checkbox, CtaFooter, Dropdown, DropdownButton, PillButton, Text } from '@components'
import { getDateRanges, handleClickOut } from '@utils'

const Container = styled.div`
  height: 100%;
  overflow: auto;
  padding-bottom: 100px;
`

const DatePickerWrapper = styled.div`
  position: relative;
  z-index: 4;

  // react-daterange-picker and react-calendar css overrides...PS
  .react-daterange-picker {
    background: white;
    border-radius: 22px;
    left: calc(100% + 22px);
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;

    .react-daterange-picker__wrapper {
      border: 1px solid ${colors.gray5};
      border-radius: 22px;
      box-shadow: ${shadows.card};
      color: ${colors.gray3};
      padding: 5px 5px;
      .react-daterange-picker__inputGroup {
        flex-grow: 0;
        min-width: 0;
        color: ${colors.gray3};
      }
    }

    .react-calendar__tile--active {
      background: ${colors.blurple};
      color: white;

      &:hover,
      &:focus {
        background: ${colors.blurple};
      }
    }

    .react-calendar__tile--now {
      background: ${colors.gray8};

      &:hover,
      &:focus {
        background: ${colors.gray8};
      }
    }

    .react-calendar__month-view__days__day--neighboringMonth {
      color: ${colors.gray3};
    }

    .react-daterange-picker__calendar {
      .react-calendar {
        border: 1px solid ${colors.gray5};
        border-radius: 20px;
        box-shadow: ${shadows.card};
        margin-top: 10px;
      }
    }
  }
`

const Row = styled.div`
  cursor: pointer;
  display: flex;

  &:not(:first-of-type) {
    margin-top: 20px;
  }
`

const Wrapper = styled.div`
  border-radius: 12px;
  margin: auto 30px auto 0;
  position: relative;
`

const DatePicker = ({ dates, filterLoadingState, hidden, index, onChange, setDateRange, setFilterLoadingState, showDateRange, value }) => {
  // this is used to change which box is checked before applying the changes...JK
  const [checkedValue, setCheckedValue] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const options = useMemo(() => [...getDateRanges().options, { name: 'Custom', value: 'Custom' }], [])
  const name = useMemo(() => options.find(option => option.value === value)?.name, [options, value])

  handleClickOut(ref, () => setOpen(false))

  // if not already true, this will set its loading state to true on mount...JK
  useEffect(() => {
    !filterLoadingState[index] && setFilterLoadingState && setFilterLoadingState(wls => ({ ...wls, [index]: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLoadingState])

  useEffect(() => {
    setCheckedValue(value)
  }, [value])

  // needed to conditionally render to allow the useEffect to fire and set its loading state to true if this filter is hidden...JK
  return (
    <>
      {hidden ? null : (
        <Wrapper>
          <DatePickerWrapper ref={ref}>
            <DropdownButton
              active={open}
              displayText={name}
              icon={CalendarIcon}
              onClick={() => setOpen(open => !open)}
              spacing='0 0 0 10px'
            />
            <Dropdown open={open} small>
              <Container>
                {options.map((option, i) => (
                  <Row key={i}>
                    <Checkbox checked={checkedValue === option.value} onChange={() => setCheckedValue(option.value)} spacing='0 12px 0 0' />
                    <Text
                      color='coolGray'
                      fontWeight={checkedValue === option.value ? 700 : 400}
                      onClick={() => setCheckedValue(option.value)}
                    >
                      {option.name}
                    </Text>
                  </Row>
                ))}
              </Container>
              <CtaFooter>
                <PillButton
                  full
                  onClick={() => {
                    onChange(checkedValue)
                    setOpen(false)
                  }}
                  text='Apply'
                />
              </CtaFooter>
            </Dropdown>
            {showDateRange && (
              <DateRangePicker
                onChange={e => setDateRange({ startDate: e ? e[0] : undefined, endDate: e ? e[1] : undefined, key: 'Custom' })}
                value={[dates.startDate, dates.endDate]}
              />
            )}
          </DatePickerWrapper>
        </Wrapper>
      )}
    </>
  )
}

DatePicker.propTypes = {
  dates: PropTypes.object,
  filterLoadingState: PropTypes.object,
  hidden: PropTypes.bool,
  index: PropTypes.number,
  onChange: PropTypes.func,
  setDateRange: PropTypes.func,
  setFilterLoadingState: PropTypes.func,
  showDateRange: PropTypes.bool,
  value: PropTypes.string,
}

export default DatePicker
