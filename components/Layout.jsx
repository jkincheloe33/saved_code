import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { colors, breakpoints, devices } from '@assets'
import {
  AcceptTerms,
  CelebrationPopUp,
  ComposeShareWambi,
  DynamicContainer,
  EditPostWorkflow,
  EditWambiWorkflow,
  InnerHeader,
  LessonsWorkflow,
  Loader,
  MainNav,
  MobileFooter,
  Modal,
  PostWorkflow,
  Profile,
  RewardWorkflow,
  SpotlightReel,
  Toast,
  WambiWorkflow,
} from '@components'
import {
  useAuthContext,
  useDraftContext,
  useEditPostContext,
  useLessonsContext,
  usePostContext,
  useProfileContext,
  useResizeContext,
  useRewardContext,
  useSpacingContext,
  useToastContext,
} from '@contexts'

// prettier-ignore
const Container = styled.section`
  align-items: flex-start;
  display: flex;
  height: ${p => (p.auto ? 'auto' : '100%')};
  justify-content: space-between;
  margin: 0 auto;
  max-width: 1920px;
  overflow: ${p => (p.scroll || p.auto ? 'auto' : 'hidden')};
  position: relative;
  width: 100%;

  @media (${devices.largeDesktop}) {
    ${p => !p.inner && !p.stretch && `
      padding: 0 20px;
    `}

    ${p => p.full && `
      padding: 0;
    `}

    ${p => (p.isPortal || p.stretch) && `
      max-width: none;
    `}
  }

  @media (${devices.xxlDesktop}) {
    ${p => !p.inner && !p.isPortal && !p.stretch && `
      padding: 0 50px;
    `}
  }
`

const HighLevelModal = styled(Modal)`
  z-index: 15;
`

const LoaderWrapper = styled.div`
  align-items: center;
  background-color: ${colors.gray8};
  bottom: 0;
  display: flex;
  height: 100%;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  width: 100%;
`

// prettier-ignore
const MainContent = styled.div`
  flex: 1;
  height: ${p => (p.auto ? 'auto' : '100%')};
  margin: 0 auto;
  max-width: ${p => (p.full ? 'none' : '740px')};
  overflow: ${p => (p.scroll || p.auto ? 'auto' : 'hidden')};
  width: ${p => (p.full ? '100%' : '33.3%')};

  @media (${devices.largeDesktop}) {
    ${p => p.inner && !p.dark && `
      background-color: ${colors.white};
      border-radius: 20px;
      max-width: none;
    `}
  }
`

const ScrollContainer = styled(DynamicContainer)`
  padding-bottom: ${p => (p.extraSpace ? '75px' : 0)};
`

const SideBar = styled.div`
  display: none;
  flex: 0 0 375px;
  height: 100%;
  // this is needed to prevent box-shadow in children from being cut off due to overflow: auto
  // lowering padding-x to 10px and negative 10px margin left/right allows the SideBar content area to remain the same size...JK
  margin-left: ${p => (p.right ? 0 : '-10px')};
  margin-right: ${p => (p.right ? '-10px' : 0)};
  overflow: auto;
  padding: 50px 10px 25px;

  @media (${devices.largeDesktop}) {
    display: block;
  }
`

// prettier-ignore
const Wrapper = styled.main`
  background-color: ${p => (p.isPortal && !p.inner) || p.dark ? colors.gray8 : colors.white};
  height: ${p => (p.auto ? 'auto' : '100%')};
  min-height: 100vh;
  // for IOS Mobile to account for navigation bars...JK
  min-height: -webkit-fill-available;
  padding-bottom: ${p => p.spacingBottom}px;
  padding-top: ${p => p.spacingTop && !p.isPortal && `${p.spacingTop}px`};
  position: relative;

  @media (${devices.largeDesktop}) {
    background-color: ${p => p.inner && !p.dark ? colors.white : colors.gray8};
    max-height: ${p => p.inner ? '100%' : 'none'};
    min-height: ${p => p.inner ? 0 : '100vh'};
    padding-bottom: 0;
  }
`

const Layout = ({
  auto = false,
  children,
  className,
  dark = false,
  fixed = false,
  full = false,
  head,
  inner = false,
  isPortal = false,
  leftColumn,
  loading = false,
  noFooter = false,
  noHeader = false,
  rightColumn,
  scroll = false,
  stories = false,
  stretch = false,
  title,
  ...props
}) => {
  const [isBubbleActive, setIsBubbleActive] = useState(true)
  const [isIOS, setIsIOS] = useState(false)

  const { clientAccount, isAuthenticated } = useAuthContext()
  const { setShowDraftsList } = useDraftContext()
  const { setShowEditCpcWorkflow, showEditCpcWorkflow, showEditPostWorkflow, setShowEditPostWorkflow } = useEditPostContext()
  const { setShowLessons, showLessons } = useLessonsContext()
  const {
    selectedRecipient,
    setShowPostWorkflow,
    setShowSendCpc,
    showPostWorkflow,
    showSendCpc,
    showShareCpc,
    skipCpcSearch,
  } = usePostContext()
  const { showProfile } = useProfileContext()
  const { windowWidth } = useResizeContext()
  const {
    getRewardDetail,
    openRewardWorkflow,
    rewardDetails,
    rewardScreens,
    selectedActive,
    setSelectedActive,
    setOpenRewardWorkflow,
  } = useRewardContext()
  const { footerHeight, innerHeaderHeight, mobileHeaderHeight } = useSpacingContext()
  const { showToast, toastData } = useToastContext()
  const { isReady, pathname, query, replace } = useRouter()

  useEffect(() => {
    // checks if user is on IOS...JK
    const isIOS = /iPad|iPhone|iPod/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(isIOS)
    // since all Portal pages remove overflow hidden, this is needed to add it back...JK
    document.documentElement.style.overflowY = 'hidden'
    document.body.style.overflowY = 'hidden'
  }, [])

  useEffect(() => {
    const getReward = async () => {
      await getRewardDetail({ rewardClaimId: query.rewardClaimId })
      setOpenRewardWorkflow(true)
      replace(pathname)
    }

    if (query?.rewardClaimId && isReady) getReward()
    if (query?.showRewardList && isReady) {
      setSelectedActive(rewardScreens.PROGRESS_REWARD_LIST)
      setOpenRewardWorkflow(true)
      replace(pathname)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, query])

  return (
    <>
      {isAuthenticated || pathname === '/auth/login' || isPortal ? (
        <Wrapper
          auto={auto}
          className={className}
          dark={dark}
          inner={inner}
          isPortal={isPortal}
          spacingBottom={noFooter ? 0 : footerHeight}
          spacingTop={inner ? innerHeaderHeight : mobileHeaderHeight}
        >
          {head && (
            <Head>
              <title>
                {head}
                {clientAccount?.name ? ` - ${clientAccount.name}` : ''}
              </title>
            </Head>
          )}
          {!noHeader && (inner ? <InnerHeader {...props} dark={dark} title={title} /> : <MainNav {...props} />)}
          {loading ? (
            <LoaderWrapper>
              <Loader />
            </LoaderWrapper>
          ) : (
            <ScrollContainer
              fixed={!isPortal && (!inner || fixed)}
              id='scroll-container'
              outer={!inner}
              extraSpace={!isPortal && (noHeader || (isIOS && !noFooter))}
            >
              <Container auto={auto} full={full} inner={inner} isPortal={isPortal} scroll={scroll} stretch={stretch}>
                {leftColumn && !inner && <SideBar>{leftColumn}</SideBar>}
                <MainContent
                  auto={auto}
                  dark={dark}
                  full={full && !leftColumn && !rightColumn}
                  id='main-content-scroll'
                  inner={inner}
                  scroll={scroll}
                >
                  {stories && <SpotlightReel />}
                  {children}
                </MainContent>
                {rightColumn && !inner && <SideBar right>{rightColumn}</SideBar>}
              </Container>
            </ScrollContainer>
          )}
          {!noFooter && (
            <>
              <MobileFooter />
              <AcceptTerms />
              <HighLevelModal open={showProfile}>
                <Profile />
              </HighLevelModal>
              <HighLevelModal open={showSendCpc || showPostWorkflow}>
                {showSendCpc ? (
                  <WambiWorkflow handleBack={() => setShowSendCpc(false)} selectedProfile={selectedRecipient} skip={skipCpcSearch} />
                ) : (
                  <PostWorkflow
                    handleBack={() => {
                      setShowPostWorkflow(false)
                      setShowDraftsList(false)
                    }}
                  />
                )}
              </HighLevelModal>
              <HighLevelModal open={showEditCpcWorkflow}>
                <EditWambiWorkflow handleBack={() => setShowEditCpcWorkflow(false)} />
              </HighLevelModal>
              <HighLevelModal open={showShareCpc} shrink>
                <ComposeShareWambi />
              </HighLevelModal>
              <HighLevelModal open={showLessons} xl>
                <LessonsWorkflow handleBack={() => setShowLessons(false)} />
              </HighLevelModal>
              <CelebrationPopUp />
              <Modal
                full={isBubbleActive}
                handleClose={isBubbleActive ? () => setOpenRewardWorkflow(false) : null}
                open={openRewardWorkflow}
              >
                <RewardWorkflow
                  bubbleAmount={windowWidth < breakpoints.largeDesktop ? 20 : 30}
                  isBubbleActive={isBubbleActive}
                  rewardClaimId={Number(query?.rewardClaimId) || null}
                  selectedActive={selectedActive}
                  sentReward={rewardDetails}
                  setIsBubbleActive={setIsBubbleActive}
                />
              </Modal>
              <HighLevelModal open={showEditPostWorkflow}>
                <EditPostWorkflow handleBack={() => setShowEditPostWorkflow(false)} />
              </HighLevelModal>
              <Toast {...toastData} open={showToast} />
            </>
          )}
        </Wrapper>
      ) : (
        <LoaderWrapper>
          <Loader />
        </LoaderWrapper>
      )}
    </>
  )
}

Layout.propTypes = {
  auto: PropTypes.bool,
  children: PropTypes.any,
  className: PropTypes.string,
  dark: PropTypes.bool,
  fixed: PropTypes.bool,
  full: PropTypes.bool,
  head: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  id: PropTypes.string,
  inner: PropTypes.bool,
  isPortal: PropTypes.bool,
  leftColumn: PropTypes.any,
  loading: PropTypes.bool,
  noFooter: PropTypes.bool,
  noHeader: PropTypes.bool,
  rightColumn: PropTypes.any,
  scroll: PropTypes.bool,
  stories: PropTypes.bool,
  stretch: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

export default Layout
