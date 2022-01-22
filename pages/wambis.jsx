import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import moment from 'moment'
import { AgGridColumn, AgGridReact } from '@ag-grid-community/react'
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'
import { FEED_ITEM_STATUS_ARRAY } from '@utils'

import { colors, devices } from '@assets'
import {
  BrowseWambiFilter,
  BrowseWambiMenu,
  Card,
  FeedItemDetail,
  Layout,
  Loader,
  Modal,
  PopUp as PopUpBase,
  ReactionsPopUp,
  RealmFilter,
  Title,
  ViewDetailsWorkflow,
} from '@components'
import { useUserContext } from '@contexts'
import { api, coreApi } from '@services'
import { NEWSFEED_VIEW } from '@utils'

const DataWrapper = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 70vh;

  ${Title} {
    border-right: 0.5px solid ${colors.gray5};
    margin: 30px;
    padding-right: 30px;
  }
`

const FilterWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
`

const GridWrapper = styled.div`
  height: 87%;
  position: relative;
  width: 100%;

  .ag-header-viewport {
    background-color: transparent;

    .ag-header-cell {
      background-color: ${colors.blurple}20;
    }
  }

  .ag-row-even {
    cursor: pointer;
  }

  .ag-row-odd {
    cursor: pointer;
  }
`

const Header = styled.div`
  display: flex;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.white}E6;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  opacity: ${p => p.opacity};
  pointer-events: none;
  position: absolute;
  top: 0;
  transition: opacity 250ms ease;
  width: 100%;
  z-index: 3;
`

const MobileWrapper = styled.main`
  display: block;
  padding-top: 100px;

  @media (${devices.largeDesktop}) {
    display: none;
  }
`

const ModalContainer = styled.div`
  bottom: 0;
  height: 100%;
  left: 0;
  pointer-events: none;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 5;
`

const ModalInnerContainer = styled.div`
  height: 100%;
  pointer-events: none;
  position: relative;
  width: 100%;
`

const Overlay = styled.div`
  /* backdrop-filter: blur(8px);
  background-color: ${colors.white}BF; */
  background-color: ${colors.white}D9;
  bottom: 0;
  display: ${p => (p.showOverlay ? 'block' : 'none')};
  height: 100%;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 2;
`

const PopUp = styled(PopUpBase)`
  z-index: 5;
`

// const Search = styled(SearchBar)`
//   height: 37px;
//   margin: auto 30px;
// `

const Wrapper = styled.main`
  background-color: ${colors.white};
  display: none;
  height: 100%;
  min-height: 100vh;
  padding: 50px;

  @media (${devices.largeDesktop}) {
    background-color: ${colors.gray8};
    display: flex;
    flex-direction: column;
  }

  ${Title} {
    margin-bottom: 25px;
  }
`

const Wambis = () => {
  const { user } = useUserContext()

  const [active, setActive] = useState(NEWSFEED_VIEW.DETAILS)
  const [dropdownFilter, setDropdownFilter] = useState('')
  const [feedItem, setFeedItem] = useState(null)
  const [fields, setFields] = useState([])
  const [gridApi, setGridApi] = useState()
  const [groupFilter, setGroupFilter] = useState([])
  const [hiddenBtns, setHiddenBtns] = useState({
    hideWambi: false,
  })
  const [loading, setLoading] = useState(false)
  const [openConfirmation, setOpenConfirmation] = useState(false)
  const [reactionsData, setReactionsData] = useState(null)
  const [recipientsData, setRecipientsData] = useState(null)
  // const [searchInput, setSearchInput] = useState('')
  const [seeMoreComments, setSeeMoreComments] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [viewDetails, setViewDetails] = useState(false)
  const [viewDetailsData, setViewDetailsData] = useState(null)

  const ref = useRef()

  const getSingleCpc = async e => {
    setActive(NEWSFEED_VIEW.DETAILS)
    setLoading(true)
    const { feedId } = e.data

    const {
      data: { success, feedItem },
    } = await coreApi.post('/newsfeed/getFeedItem', { feedId })

    if (success) {
      setFeedItem(feedItem)
      setViewDetails(true)
      setViewDetailsData({
        component: FeedItemDetail,
        props: {
          feedItem,
          hideKabob: true,
          profile: user,
          setReactionsData,
          setRecipientsData,
          setShowReactions,
          setSeeMoreComments,
          setViewDetails,
        },
      })
    }

    setLoading(false)
  }

  const getDataSource = () => {
    return {
      rowCount: null,
      getRows: async params => {
        setLoading(true)

        const { endRow, filterModel: filter, sortModel: sort, startRow } = params

        const {
          data: { cpcs, fields, success },
        } = await api.post('/manager/getWambis', {
          endRow,
          dropdownFilter,
          gridFilter: filter,
          groupFilter: groupFilter.map(gf => gf.id),
          sort,
          startRow,
        })

        if (success) {
          let displayFields = fields.slice(2, fields.length)
          setFields(displayFields)

          displayFields.forEach(f => {
            if (f.isDate) {
              if (filter.Sent) {
                cpcs.forEach(r => (r[f.name] = r[f.name] ? moment(r[f.name]).format('lll') : '-'))
              } else {
                cpcs.forEach(r => (r[f.name] = r[f.name] ? moment(r[f.name]).fromNow() : '-'))
              }
            }
            if (f.name === 'status') {
              cpcs.forEach(r => {
                r[f.name] = FEED_ITEM_STATUS_ARRAY[r[f.name]]
              })
            }
          })

          // setTimeout fixes a weird timing issue due to how long our query takes to run...KA
          setTimeout(() => (cpcs.length === 0 ? gridApi.showNoRowsOverlay() : gridApi.hideOverlay()), 1)

          const lastRow = cpcs.length < endRow - startRow ? startRow + cpcs.length : -1

          params.successCallback(cpcs, lastRow)
        }
        setLoading(false)
      },
    }
  }

  const resetConfirmationContainer = () => {
    setOpenConfirmation(false)
    setHiddenBtns({ hideWambi: false })
  }

  useEffect(() => {
    gridApi?.setDatasource(getDataSource())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownFilter, groupFilter])

  return (
    <>
      <Overlay showOverlay={showOverlay} />
      <Layout full head='Recent Wambis' id='recent-cpcs-page'>
        <Wrapper>
          <Title fontSize='24px' id='review-cpcs-title' justifyContent='flex-start'>
            Recent Wambis
          </Title>
          <DataWrapper>
            <Header>
              <Title fontSize='24px' fontWeight={400} justifyContent='flex-start'>
                <RealmFilter filterGroups={groupFilter} setFilterGroups={setGroupFilter} setShowOverlay={setShowOverlay} />
              </Title>
              <FilterWrapper>
                <BrowseWambiFilter setDropdownFilter={setDropdownFilter} />
              </FilterWrapper>
              {/* <Search
              id='review-cpcs-search'
              label='review-cpcs-search'
              onChange={e => setSearchInput(e.target.value)}
              placeholder='Search by name, job type, or facility'
              value={searchInput}
            /> */}
            </Header>
            <GridWrapper className='ag-theme-alpine' id='cpcs-grid'>
              <AgGridReact
                cacheOverflowSize={2}
                defaultColDef={{
                  flex: 1,
                  resizable: true,
                  sortable: true,
                }}
                infiniteInitialRowCount={1}
                maxBlocksInCache={20}
                maxConcurrentDatasourceRequests={2}
                modules={[InfiniteRowModelModule]}
                onGridReady={params => setGridApi(params.api)}
                onRowClicked={getSingleCpc}
                overlayNoRowsTemplate={'<div style="font-size: 24px">No results</div>'}
                paginationPageSize={25}
                rowBuffer={0}
                rowModelType='infinite'
              >
                {fields.map(({ isDate, name }) => (
                  <AgGridColumn editable={false} field={name} filter={isDate ? false : 'agTextColumnFilter'} key={name} />
                ))}
              </AgGridReact>
              <LoaderWrapper opacity={loading ? 1 : 0}>
                <Loader />
              </LoaderWrapper>
            </GridWrapper>
          </DataWrapper>
        </Wrapper>
        <ModalContainer>
          <ModalInnerContainer>
            <Modal open={viewDetails} ref={ref}>
              <ViewDetailsWorkflow
                active={active}
                handleBack={() => {
                  setViewDetails(false)
                  resetConfirmationContainer()
                }}
                recipientsData={recipientsData}
                seeMoreComments={seeMoreComments}
                setActive={setActive}
                setViewDetailsData={setViewDetailsData}
                viewDetails={viewDetails}
                viewDetailsData={viewDetailsData}
              />
            </Modal>
            {feedItem && (
              <BrowseWambiMenu
                feedItem={feedItem}
                hiddenBtns={hiddenBtns}
                isOpen={viewDetails}
                modalRef={ref}
                openConfirmation={openConfirmation}
                resetConfirmationContainer={resetConfirmationContainer}
                setHiddenBtns={setHiddenBtns}
                setOpenConfirmation={setOpenConfirmation}
              />
            )}
          </ModalInnerContainer>
        </ModalContainer>
        <PopUp handleClose={() => setShowReactions(false)} isNested open={showReactions}>
          {reactionsData && <ReactionsPopUp {...reactionsData} />}
        </PopUp>
        <MobileWrapper>
          <Title>This page is not available on mobile</Title>
        </MobileWrapper>
      </Layout>
    </>
  )
}

export default Wambis
