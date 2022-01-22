import PropTypes from 'prop-types'

import {
  AuthProvider,
  CelebrationProvider,
  DraftProvider,
  EditPostProvider,
  LangProvider,
  LessonsProvider,
  PostProvider,
  ProfileProvider,
  ReactionsProvider,
  RefreshDataProvider,
  ResizeProvider,
  ReviewerProvider,
  RewardProvider,
  SpacingProvider,
  ToastProvider,
  UserProvider,
} from '@contexts'

import { GlobalStyle } from '@assets'

const WambiApp = ({ Component, pageProps }) => {
  return (
    <AuthProvider>
      <CelebrationProvider>
        <UserProvider>
          <RefreshDataProvider>
            <ResizeProvider>
              <ToastProvider>
                <DraftProvider>
                  <ProfileProvider>
                    <SpacingProvider>
                      <ReactionsProvider>
                        <LessonsProvider>
                          <PostProvider>
                            <EditPostProvider>
                              <LangProvider>
                                <RewardProvider>
                                  <ReviewerProvider>
                                    <GlobalStyle />
                                    <Component {...pageProps} />
                                  </ReviewerProvider>
                                </RewardProvider>
                              </LangProvider>
                            </EditPostProvider>
                          </PostProvider>
                        </LessonsProvider>
                      </ReactionsProvider>
                    </SpacingProvider>
                  </ProfileProvider>
                </DraftProvider>
              </ToastProvider>
            </ResizeProvider>
          </RefreshDataProvider>
        </UserProvider>
      </CelebrationProvider>
    </AuthProvider>
  )
}

WambiApp.propTypes = {
  Component: PropTypes.any,
  pageProps: PropTypes.any,
}

export default WambiApp
