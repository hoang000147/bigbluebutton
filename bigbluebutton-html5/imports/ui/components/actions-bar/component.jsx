import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import cx from 'classnames';
import { styles } from './styles.scss';
import { defineMessages, injectIntl } from 'react-intl';
import { withModalMounter } from '/imports/ui/components/modal/service';
import withShortcutHelper from '/imports/ui/components/shortcut-help/service';
import getFromUserSettings from '/imports/ui/services/users-settings';
import Button from '../button/component';
import DesktopShare from './desktop-share/component';
import ActionsDropdown from './actions-dropdown/component';
import AudioControlsContainer from '../audio/audio-controls/container';
import JoinVideoOptionsContainer from '../video-provider/video-button/container';
import LeaveMeetingContainer from './leave-meeting/container'; 
import CaptionsButtonContainer from '/imports/ui/components/actions-bar/captions/container';
import PresentationOptionsContainer from './presentation-options/component';
import RecordingIndicator from './recording-indicator/container';
import UserMessages from './user-messages/component';

const intlMessages = defineMessages({
  toggleUserListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'Toggle button label',
  },
  toggleUserListAria: {
    id: 'app.navBar.toggleUserList.ariaLabel',
    description: 'description of the lists inside the userlist',
  },
  /* newMessages: {
    id: 'app.navBar.toggleUserList.newMessages',
    description: 'label for toggleUserList btn when showing red notification',
  }, */
  toggleChatLabel: {
    id: 'app.chat.titlePublic',
    description: 'Chat toggle button label',
  },
});

const propTypes = {
  // hasUnreadMessages: PropTypes.bool,
  shortcuts: PropTypes.string,
  isMeteorConnected: PropTypes.bool.isRequired,
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
  hasUnreadMessages: false,
  shortcuts: '',
  compact: false,
};

const CHAT_ENABLED = Meteor.settings.public.chat.enabled;

class ActionsBar extends PureComponent {
  static handleToggleUserList() {
    Session.set(
      'openPanel',
      Session.get('openPanel') !== ''
        ? ''
        : 'userlist',
    );
    Session.set('idChatOpen', '');
  }

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
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const {
      amIPresenter,
      handleShareScreen,
      handleUnshareScreen,
      isVideoBroadcasting,
      amIModerator,
      screenSharingCheck,
      enableVideo,
      isLayoutSwapped,
      toggleSwapLayout,
      handleTakePresenter,
      intl,
      currentSlidHasContent,
      parseCurrentSlideContent,
      isSharingVideo,
      screenShareEndAlert,
      stopExternalVideoShare,
      screenshareDataSavingSetting,
      isCaptionsAvailable,
      isMeteorConnected,
      isPollingEnabled,
      isThereCurrentPresentation,
      allowExternalVideo,
      presentations,
      setPresentation,
      podIds,
      //leaveMeeting,
      mountModal,
      isExpanded,
      shortcuts: TOGGLE_USERLIST_AK,
      // hasUnreadMessages,
      compact,
      activeChats,
      isPublicChat,
      roving,
   } = this.props;

    const actionBarClasses = {};

    actionBarClasses[styles.centerWithActions] = amIPresenter;
    actionBarClasses[styles.center] = true;
    actionBarClasses[styles.mobileLayoutSwapped] = isLayoutSwapped && amIPresenter;

    const toggleBtnClasses = {};
    toggleBtnClasses[styles.btn] = true;
    // toggleBtnClasses[styles.btnWithNotificationDot] = hasUnreadMessages;

    let ariaLabel = intl.formatMessage(intlMessages.toggleUserListAria);
    // ariaLabel += hasUnreadMessages ? (` ${intl.formatMessage(intlMessages.newMessages)}`) : '';

    return (
      <div className={styles.actionsbar}>
        <div className={styles.left}>
          <AudioControlsContainer />
          {enableVideo
            ? (
              <JoinVideoOptionsContainer />
            )
            : null}
        </div>
        <div className={cx(actionBarClasses)}>
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
          <Button
            data-test="userListToggleButton"
            onClick={ActionsBar.handleToggleUserList}
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
          {isLayoutSwapped
            ? (
              <PresentationOptionsContainer
                toggleSwapLayout={toggleSwapLayout}
                isThereCurrentPresentation={isThereCurrentPresentation}
              />
            )
            : null
          }
          <LeaveMeetingContainer />
        </div>
      </div>
    );
  }
}

ActionsBar.propTypes = propTypes;
ActionsBar.defaultProps = defaultProps;
export default withShortcutHelper(withModalMounter(injectIntl(ActionsBar)), 'toggleUserList');
