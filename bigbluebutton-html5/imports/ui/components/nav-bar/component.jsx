import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import cx from 'classnames';
import { withModalMounter } from '/imports/ui/components/modal/service';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import { styles } from './styles.scss';
import Button from '../button/component';
import RecordingIndicator from './recording-indicator/container';
import TalkingIndicatorContainer from '/imports/ui/components/nav-bar/talking-indicator/container';
import SettingsDropdownContainer from './settings-dropdown/container';
import FullscreenService from '../fullscreen-button/service';

import DesktopShare from '../actions-bar/desktop-share/component';
import ActionsDropdown from './actions-dropdown/component';
import AudioControlsContainer from '../audio/audio-controls/container';
import JoinVideoOptionsContainer from '../video-provider/video-button/container';
import LeaveMeetingContainer from '../actions-bar/leave-meeting/container';
import CaptionsButtonContainer from '/imports/ui/components/actions-bar/captions/container';
import PresentationOptionsContainer from '../actions-bar/presentation-options/component';
import UserMessages from '../actions-bar/user-messages/component';

const intlMessages = defineMessages({
  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  /* toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  newMessages: {
    id: 'app.navBar.toggleUserList.newMessages',
    description: 'label for toggleUserList btn when showing red notification',
  },
  toggleChatLabel: {
    id: 'app.chat.titlePublic',
    description: 'Chat toggle button label',
  }, */
  fullscreenLabel: {
    id: 'app.navBar.settingsDropdown.fullscreenLabel',
    description: 'Make fullscreen option label',
  },
  fullscreenDesc: {
    id: 'app.navBar.settingsDropdown.fullscreenDesc',
    description: 'Describes fullscreen option',
  },
  exitFullscreenDesc: {
    id: 'app.navBar.settingsDropdown.exitFullscreenDesc',
    description: 'Describes exit fullscreen option',
  },
  exitFullscreenLabel: {
    id: 'app.navBar.settingsDropdown.exitFullscreenLabel',
    description: 'Exit fullscreen option label',
  },

  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  toggleChatLabel: {
    id: 'app.chat.titlePublic',
    description: 'Chat toggle button label',
  },
});

const propTypes = {
  // intl: intlShape.isRequired,
  presentationTitle: PropTypes.string,
  hasUnreadMessages: PropTypes.bool,
  shortcuts: PropTypes.string,
  noIOSFullscreen: PropTypes.bool,
  isMeteorConnected: PropTypes.bool.isRequired,
  handleToggleFullscreen: PropTypes.func.isRequired,
  mountModal: PropTypes.func.isRequired,


  activeChats: PropTypes.arrayOf(String).isRequired,
  compact: PropTypes.bool,
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  isPublicChat: PropTypes.func.isRequired,
  roving: PropTypes.func.isRequired,
};

const defaultProps = {
  presentationTitle: 'Default Room Title',
  hasUnreadMessages: false,
  shortcuts: '',
  noIOSFullscreen: true,
  isBreakoutRoom: false,

  compact: false,
};

const ALLOW_FULLSCREEN = Meteor.settings.public.app.allowFullscreen;

/* actions-bar */
const CHAT_ENABLED = Meteor.settings.public.chat.enabled;

class NavBar extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isFullscreen: false,
    };

    this.onFullscreenChange = this.onFullscreenChange.bind(this);
  }

  /* actions-bar */

  static handleToggleUserList() {
    if (Session.get('openPanel').includes('userlist')) {
      Session.set('openPanel', Session.get('openPanel').replace('userlist', ''));
    } else if (Session.get('openPanel').includes('chat')) {
      // Session.set('openPanel', '');
      Session.set('openPanel', Session.get('openPanel').replace('chat', ''));
    } else {
      Session.set('openPanel', Session.get('openPanel').concat('userlist'));
    }

    // Session.set('idChatOpen', '');
  }

  /* static handleToggleUserList() {
    Session.set(
      'openPanel',
      Session.get('openPanel') !== ''
        ? ''
        : 'userlist',
    );
    Session.set('idChatOpen', '');
  } */

  componentDidMount() {
    const {
      processOutsideToggleRecording,
      connectRecordingObserver,
    } = this.props;

    if (Meteor.settings.public.allowOutsideCommands.toggleRecording
      || getFromUserSettings('bbb_outside_toggle_recording', false)) {
      connectRecordingObserver();
      window.addEventListener('message', processOutsideToggleRecording);
    }

    document.documentElement.addEventListener('fullscreenchange', this.onFullscreenChange);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    document.documentElement.removeEventListener('fullscreenchange', this.onFullscreenChange);
  }

  onFullscreenChange() {
    const { isFullscreen } = this.state;
    const newIsFullscreen = FullscreenService.isFullScreen(document.documentElement);
    if (isFullscreen !== newIsFullscreen) {
      this.setState({ isFullscreen: newIsFullscreen });
    }
  }

  getFullscreenItem() {
    const {
      intl,
      noIOSFullscreen,
      handleToggleFullscreen,
    } = this.props;
    const { isFullscreen } = this.state;

    if (noIOSFullscreen || !ALLOW_FULLSCREEN) return null;

    let fullscreenLabel = intl.formatMessage(intlMessages.fullscreenLabel);
    let fullscreenDesc = intl.formatMessage(intlMessages.fullscreenDesc);
    let fullscreenIcon = 'fullscreen';
    if (isFullscreen) {
      fullscreenLabel = intl.formatMessage(intlMessages.exitFullscreenLabel);
      fullscreenDesc = intl.formatMessage(intlMessages.exitFullscreenDesc);
      fullscreenIcon = 'exit_fullscreen';
    }

    return (
      <Button
        key="list-item-fullscreen"
        icon={fullscreenIcon}
        label={fullscreenLabel}
        description={fullscreenDesc}
        ghost
        circle
        hideLabel
        className={styles.btn}
        onClick={handleToggleFullscreen}
      />
    );
  }

  render() {
    const {
      hasUnreadMessages,
      isExpanded,
      intl,
      shortcuts: TOGGLE_USERLIST_AK,
      mountModal,
      presentationTitle,
      amIModerator,
      isMeteorConnected,

      amIPresenter,
      handleShareScreen,
      handleUnshareScreen,
      isVideoBroadcasting,
      screenSharingCheck,
      enableVideo,
      isLayoutSwapped,
      toggleSwapLayout,
      handleTakePresenter,
      currentSlidHasContent,
      parseCurrentSlideContent,
      isSharingVideo,
      screenShareEndAlert,
      stopExternalVideoShare,
      screenshareDataSavingSetting,
      isCaptionsAvailable,
      isPollingEnabled,
      isThereCurrentPresentation,
      allowExternalVideo,
      presentations,
      setPresentation,
      podIds,
      compact,
      activeChats,
      isPublicChat,
      roving,
    } = this.props;


    /* const toggleBtnClasses = {};
    toggleBtnClasses[styles.btn] = true;
    toggleBtnClasses[styles.btnWithNotificationDot] = hasUnreadMessages; */

    /* let ariaLabel = intl.formatMessage(intlMessages.toggleUserListAria);
    ariaLabel += hasUnreadMessages ? (` ${intl.formatMessage(intlMessages.newMessages)}`) : ''; */

    /* actions-bar */

    const actionBarClasses = {};

    actionBarClasses[styles.centerWithActions] = amIPresenter;
    actionBarClasses[styles.center] = true;
    actionBarClasses[styles.mobileLayoutSwapped] = isLayoutSwapped && amIPresenter;

    const toggleBtnClasses = {};
    toggleBtnClasses[styles.btn] = true;
    // toggleBtnClasses[styles.btnWithNotificationDot] = hasUnreadMessages;

    const ariaLabel = intl.formatMessage(intlMessages.toggleUserListAria);
    // ariaLabel += hasUnreadMessages ? (` ${intl.formatMessage(intlMessages.newMessages)}`) : '';

    return (
      <div className={styles.navbar}>
        <div className={styles.top}>
          <div className={styles.left}>
            <SettingsDropdownContainer amIModerator={amIModerator} />
          </div>
          {/* <div className={styles.center}> */}
          <div className={cx(actionBarClasses)}>
            {/* <h1 className={styles.presentationTitle}>{presentationTitle}</h1>

            <RecordingIndicator
              mountModal={mountModal}
              amIModerator={amIModerator}
            /> */}

            <Button
              data-test="userListToggleButton"
              onClick={NavBar.handleToggleUserList}
              ghost
              circle
              hideLabel
              /* data-test={hasUnreadMessages ? 'hasUnreadMessages' : null} */
              label={intl.formatMessage(intlMessages.toggleUserListLabel)}
              aria-label={ariaLabel}
              icon="user"
              size="lg"
              className={cx(toggleBtnClasses)}
              aria-expanded={isExpanded}
              accessKey={TOGGLE_USERLIST_AK}
            />
            <RecordingIndicator
              mountModal={mountModal}
              amIModerator={amIModerator}
            />
            <DesktopShare {...{
              handleShareScreen,
              handleUnshareScreen,
              isVideoBroadcasting,
              amIPresenter,
              screenSharingCheck,
              screenShareEndAlert,
              isMeteorConnected,
              screenshareDataSavingSetting,
            }}
            />
            {isCaptionsAvailable
              ? (
                <CaptionsButtonContainer {...{ intl }} />
              )
              : null
            }
            {CHAT_ENABLED
              ? (<UserMessages
                {...{
                  isPublicChat,
                  activeChats,
                  compact,
                  intl,
                  roving,
                }}
              />
              ) : null
            }
            <ActionsDropdown {...{
              amIPresenter,
              amIModerator,
              isPollingEnabled,
              allowExternalVideo,
              handleTakePresenter,
              intl,
              isSharingVideo,
              stopExternalVideoShare,
              isMeteorConnected,
              presentations,
              setPresentation,
              podIds,
            }}
            />
          </div>
          <div className={styles.right}>
            {/* <Button
              data-test="userListToggleButton"
              onClick={NavBar.handleToggleUserList}
              ghost
              circle
              hideLabel
              data-test={hasUnreadMessages ? 'hasUnreadMessages' : null}
              label={intl.formatMessage(intlMessages.toggleUserListLabel)}
              aria-label={ariaLabel}
              icon="user"
              className={cx(toggleBtnClasses)}
              aria-expanded={isExpanded}
              accessKey={TOGGLE_USERLIST_AK}
            /> */}
            {this.getFullscreenItem()}
            {/* <Button
              data-test="chatToggleButton"
              // onClick={() => handleClickToggleChat(chat.userId)}
              ghost
              circle
              hideLabel
              label={intl.formatMessage(intlMessages.toggleChatLabel)}
              icon="chat"
              className={cx(styles.button)}
            /> */}
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.left} />
          <div className={styles.center} />
          <div className={styles.right}>
            <TalkingIndicatorContainer amIModerator={amIModerator} />
          </div>
        </div>
      </div>
    );
  }
}

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default withShortcutHelper(withModalMounter(injectIntl(NavBar)), 'toggleUserList');
