import { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { DynamicContainer, Layout, Modal } from '@components'
import FilterPost from './FilterPost'
import GroupSelector from './GroupSelector'
import TraitFilterInfo from './TraitFilterInfo'

const Wrapper = styled(DynamicContainer)`
  padding: 30px 20px;
`

const MultiGroupSelection = ({
  cta,
  handleBack,
  groups,
  selectedGroup,
  selectedTraits,
  setSelectedTraits,
  setSelectedGroup,
  setTraitsText,
  traitsText,
}) => {
  const [openTraits, setOpenTraits] = useState(false)
  return (
    <>
      <Layout
        cta={cta}
        handleBack={() => (selectedGroup.length === 0 ? alert('Please select a group') : handleBack())}
        id='multigroup-selection'
        inner
        noFooter
        title='Create a Post'
      >
        <Wrapper>
          <TraitFilterInfo selectedTraits={selectedTraits} setOpenTraits={setOpenTraits} traitsText={traitsText} />
          <GroupSelector groups={groups} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} />
        </Wrapper>
      </Layout>

      <Modal animationType='slideUp' isNested open={openTraits && selectedGroup.length > 0}>
        <FilterPost
          handleBack={() => setOpenTraits(false)}
          groups={selectedGroup}
          selectedTraits={selectedTraits}
          setSelectedTraits={setSelectedTraits}
          setTraitsText={setTraitsText}
        ></FilterPost>
      </Modal>
    </>
  )
}

MultiGroupSelection.propTypes = {
  cta: PropTypes.object,
  handleBack: PropTypes.func,
  groups: PropTypes.array,
  selectedGroup: PropTypes.array,
  selectedTraits: PropTypes.array,
  setSelectedGroup: PropTypes.func,
  setSelectedTraits: PropTypes.func,
  setTraitsText: PropTypes.func,
  traitsText: PropTypes.string,
}
export default MultiGroupSelection
