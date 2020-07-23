import React from 'react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import Meetings from '/imports/api/meetings';
import Users from '/imports/api/users';
import Auth from '/imports/ui/services/auth';
import getFromUserSettings from '/imports/ui/services/users-settings';
import browser from 'browser-detect';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import userListService from '../user-list/service';
import Service from './service';
import NavBar from './component';
import FullscreenService from '../fullscreen-button/service';


import PresentationService from '/imports/ui/components/presentation/service';
import Presentations from '/imports/api/presentations';
import ActionsBar from '../actions-bar/component';
import ExternalVideoService from '/imports/ui/components/external-video-player/service';
import PresentationUploaderService from '/imports/ui/components/presentation/presentation-uploader/service';
import PresentationPodService from '/imports/ui/components/presentation-pod/service';
import CaptionsService from '/imports/ui/components/captions/service';
import {
  shareScreen,
  unshareScreen,
  isVideoBroadcasting,
  screenShareEndAlert,
  dataSavingSetting,
} from '../screenshare/service';

import MediaService, {
  getSwapLayout,
  shouldEnableSwapLayout,
} from '../media/service';


const PUBLIC_CONFIG = Meteor.settings.public;
const ROLE_MODERATOR = PUBLIC_CONFIG.user.role_moderator;

const BROWSER_RESULTS = browser();
const isSafari = BROWSER_RESULTS.name === 'safari';
const isIphone = navigator.userAgent.match(/iPhone/i);
const noIOSFullscreen = (isSafari && BROWSER_RESULTS.versionNumber < 12) || isIphone;

const NavBarContainer = ({ children, ...props }) => (
  <NavBar {...props}>
    {children}
  </NavBar>
);


/* actions bar */
const propTypes = {
  activeChats: PropTypes.arrayOf(String).isRequired,
  isPublicChat: PropTypes.func.isRequired,
  roving: PropTypes.func.isRequired,
};

const ActionsBarContainer = props => <ActionsBar {...props} />;
const POLLING_ENABLED = Meteor.settings.public.poll.enabled;

export default withTracker(({ chatID, compact }) => {
  const CLIENT_TITLE = getFromUserSettings('bbb_client_title', PUBLIC_CONFIG.app.clientTitle);

  const handleToggleFullscreen = () => FullscreenService.toggleFullScreen();

  let meetingTitle;
  const meetingId = Auth.meetingID;
  const meetingObject = Meetings.findOne({
    meetingId,
  }, { fields: { 'meetingProp.name': 1, 'breakoutProps.sequence': 1 } });

  if (meetingObject != null) {
    meetingTitle = meetingObject.meetingProp.name;
    let titleString = `${CLIENT_TITLE} - ${meetingTitle}`;
    if (meetingObject.breakoutProps) {
      const breakoutNum = meetingObject.breakoutProps.sequence;
      if (breakoutNum > 0) {
        titleString = `${breakoutNum} - ${titleString}`;
      }
    }
    document.title = titleString;
  }

  const checkUnreadMessages = () => {
    const activeChats = userListService.getActiveChats();
    const hasUnreadMessages = activeChats
      .filter(chat => chat.userId !== Session.get('idChatOpen'))
      .some(chat => chat.unreadCounter > 0);
    return hasUnreadMessages;
  };

  const { connectRecordingObserver, processOutsideToggleRecording } = Service;
  const currentUser = Users.findOne({ userId: Auth.userID }, { fields: { role: 1 } });
  const openPanel = Session.get('openPanel');
  const isExpanded = openPanel !== '';
  const amIModerator = currentUser.role === ROLE_MODERATOR;
  const hasUnreadMessages = checkUnreadMessages();
  const activeChatId = Session.get('idChatOpen');

  return {
    // amIModerator,
    isExpanded,
    currentUserId: Auth.userID,
    processOutsideToggleRecording,
    connectRecordingObserver,
    meetingId,
    presentationTitle: meetingTitle,
    hasUnreadMessages,
    activeChatId,
    handleToggleFullscreen,
    noIOSFullscreen,
    isMeteorConnected: Meteor.status().connected,

    activeChats: Service.getActiveChats(chatID),
    isPublicChat: Service.isPublicChat,
    roving: Service.roving,
    compact,
    amIPresenter: Service.amIPresenter(),
    amIModerator: Service.amIModerator(),
    stopExternalVideoShare: ExternalVideoService.stopWatching,
    handleShareScreen: onFail => shareScreen(onFail),
    handleUnshareScreen: () => unshareScreen(),
    isVideoBroadcasting: isVideoBroadcasting(),
    screenSharingCheck: getFromUserSettings('bbb_enable_screen_sharing', Meteor.settings.public.kurento.enableScreensharing),
    enableVideo: getFromUserSettings('bbb_enable_video', Meteor.settings.public.kurento.enableVideo),
    isLayoutSwapped: getSwapLayout() && shouldEnableSwapLayout(),
    toggleSwapLayout: MediaService.toggleSwapLayout,
    handleTakePresenter: Service.takePresenterRole,
    currentSlidHasContent: PresentationService.currentSlidHasContent(),
    parseCurrentSlideContent: PresentationService.parseCurrentSlideContent,
    isSharingVideo: Service.isSharingVideo(),
    screenShareEndAlert,
    screenshareDataSavingSetting: dataSavingSetting(),
    isCaptionsAvailable: CaptionsService.isCaptionsAvailable(),
    isPollingEnabled: POLLING_ENABLED,
    isThereCurrentPresentation: Presentations.findOne({ meetingId: Auth.meetingID, current: true },
      { fields: {} }),
    allowExternalVideo: Meteor.settings.public.externalVideoPlayer.enabled,
    presentations: PresentationUploaderService.getPresentations(),
    setPresentation: PresentationUploaderService.setPresentation,
    podIds: PresentationPodService.getPresentationPodIds(),
  };
})(injectIntl(NavBarContainer));
