import React from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { injectIntl } from 'react-intl';
import { Session } from 'meteor/session';
import getFromUserSettings from '/imports/ui/services/users-settings';
import Auth from '/imports/ui/services/auth';
import Users from '/imports/api/users';
import PresentationService from '/imports/ui/components/presentation/service';
import Presentations from '/imports/api/presentations';
import ActionsBar from './component';
import Service from './service';
import ExternalVideoService from '/imports/ui/components/external-video-player/service';
import VideoService from '../video-provider/service';
import PresentationUploaderService from '/imports/ui/components/presentation/presentation-uploader/service';
import PresentationPodService from '/imports/ui/components/presentation-pod/service';
import userListService from '../user-list/service';
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

const propTypes = {
  activeChats: PropTypes.arrayOf(String).isRequired,
  isPublicChat: PropTypes.func.isRequired,
  roving: PropTypes.func.isRequired,
};

const ActionsBarContainer = ({ children, ...props }) => (
  <ActionsBar {...props}>
    {children}
  </ActionsBar>
);

// const ActionsBarContainer = props => <ActionsBar {...props} />;
const POLLING_ENABLED = Meteor.settings.public.poll.enabled;
const PUBLIC_CONFIG = Meteor.settings.public;
const ROLE_MODERATOR = PUBLIC_CONFIG.user.role_moderator;

export default withTracker(({ chatID, compact }) => {
  const checkUnreadMessages = () => {
    const activeChats = userListService.getActiveChats();
    const hasUnreadMessages = activeChats
      .filter(chat => chat.userId !== Session.get('idChatOpen'))
      .some(chat => chat.unreadCounter > 0);
    return hasUnreadMessages;
  };

  const currentUser = Users.findOne({ userId: Auth.userID }, { fields: { role: 1 } });
  const hasUnreadMessages = checkUnreadMessages();
  const amIModerator = currentUser.role === ROLE_MODERATOR;

  const activeChatId = Session.get('idChatOpen');

  return {
    amIModerator,
    currentUserId: Auth.userID,
    activeChats: Service.getActiveChats(chatID),
    isPublicChat: Service.isPublicChat,
    roving: Service.roving,
    compact,
    amIPresenter: Service.amIPresenter(),
    amIModerator: Service.amIModerator(),
    activeChatId,
    stopExternalVideoShare: ExternalVideoService.stopWatching,
    handleExitVideo: () => VideoService.exitVideo(),
    handleJoinVideo: () => VideoService.joinVideo(),
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
    isMeteorConnected: Meteor.status().connected,
    isPollingEnabled: POLLING_ENABLED,
    isThereCurrentPresentation: Presentations.findOne({ meetingId: Auth.meetingID, current: true },
      { fields: {} }),
    allowExternalVideo: Meteor.settings.public.externalVideoPlayer.enabled,
    presentations: PresentationUploaderService.getPresentations(),
    setPresentation: PresentationUploaderService.setPresentation,
    podIds: PresentationPodService.getPresentationPodIds(),
    hasUnreadMessages,
  };
})(injectIntl(ActionsBarContainer));
