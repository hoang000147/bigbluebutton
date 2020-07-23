import Auth from '/imports/ui/services/auth';
import { makeCall } from '/imports/ui/services/api';
import RecordMeetings from '/imports/api/meetings';

import Users from '/imports/api/users';
import Meetings from '/imports/api/meetings';
import Breakouts from '/imports/api/breakouts';
import { getVideoUrl } from '/imports/ui/components/external-video-player/service';
import UnreadMessages from '/imports/ui/services/unread-messages';
import GroupChat from '/imports/api/group-chat';
import { GroupChatMsg } from '/imports/api/group-chat-msg';
import _ from 'lodash';
import logger from '/imports/startup/client/logger';
import Storage from '/imports/ui/services/storage/session';

const processOutsideToggleRecording = (e) => {
  switch (e.data) {
    case 'c_record': {
      makeCall('toggleRecording');
      break;
    }
    case 'c_recording_status': {
      const recordingState = (RecordMeetings.findOne({ meetingId: Auth.meetingID })).recording;
      const recordingMessage = recordingState ? 'recordingStarted' : 'recordingStopped';
      this.window.parent.postMessage({ response: recordingMessage }, '*');
      break;
    }
    default: {
      // console.log(e.data);
    }
  }
};

const connectRecordingObserver = () => {
  // notify on load complete
  this.window.parent.postMessage({ response: 'readyToConnect' }, '*');
};


/* actions-bar */
const USER_CONFIG = Meteor.settings.public.user;
const ROLE_MODERATOR = USER_CONFIG.role_moderator;
const DIAL_IN_USER = 'dial-in-user';
const CHAT_CONFIG = Meteor.settings.public.chat;
const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
const CLOSED_CHAT_LIST_KEY = 'closedChatList';

const mapActiveChats = (chat) => {
  const currentUserId = Auth.userID;

  if (chat.sender !== currentUserId) {
    return chat.sender;
  }

  const { chatId } = chat;

  const userId = GroupChat.findOne({ chatId }).users.filter(user => user !== currentUserId);

  return userId[0];
};

const sortChatsByName = (a, b) => {
  if (a.name.toLowerCase() < b.name.toLowerCase()) {
    return -1;
  } if (a.name.toLowerCase() > b.name.toLowerCase()) {
    return 1;
  } if (a.userId.toLowerCase() > b.userId.toLowerCase()) {
    return -1;
  } if (a.userId.toLowerCase() < b.userId.toLowerCase()) {
    return 1;
  }

  return 0;
};

const sortChatsByIcon = (a, b) => {
  if (a.icon && b.icon) {
    return sortChatsByName(a, b);
  } if (a.icon) {
    return -1;
  } if (b.icon) {
    return 1;
  }

  return 0;
};

const sortChats = (a, b) => {
  let sort = sortChatsByIcon(a, b);

  if (sort === 0) {
    sort = sortChatsByName(a, b);
  }

  return sort;
};

const isPublicChat = chat => (
  chat.userId === 'public'
);

const getActiveChats = (chatID) => {
  const privateChat = GroupChat
    .find({ users: { $all: [Auth.userID] } })
    .fetch()
    .map(chat => chat.chatId);

  const filter = {
    chatId: { $ne: PUBLIC_GROUP_CHAT_ID },
  };

  if (privateChat) {
    filter.chatId = { $in: privateChat };
  }

  let activeChats = GroupChatMsg
    .find(filter)
    .fetch()
    .map(mapActiveChats);

  if (chatID) {
    activeChats.push(chatID);
  }

  activeChats = _.uniq(_.compact(activeChats));
  activeChats = Users
    .find({ userId: { $in: activeChats } })
    .map((op) => {
      const activeChat = op;
      activeChat.unreadCounter = UnreadMessages.count(op.userId);
      activeChat.name = op.name;
      activeChat.isModerator = op.role === ROLE_MODERATOR;
      return activeChat;
    });

  const currentClosedChats = Storage.getItem(CLOSED_CHAT_LIST_KEY) || [];
  const filteredChatList = [];

  activeChats.forEach((op) => {
    // When a new private chat message is received, ensure the conversation view is restored.
    if (op.unreadCounter > 0) {
      if (_.indexOf(currentClosedChats, op.userId) > -1) {
        Storage.setItem(CLOSED_CHAT_LIST_KEY, _.without(currentClosedChats, op.userId));
      }
    }

    // Compare activeChats with session and push it into filteredChatList
    // if one of the activeChat is not in session.
    // It will pass to activeChats.
    if (_.indexOf(currentClosedChats, op.userId) < 0) {
      filteredChatList.push(op);
    }
  });
  activeChats = filteredChatList;

  activeChats.push({
    userId: 'public',
    name: 'Public Chat',
    icon: 'group_chat',
    unreadCounter: UnreadMessages.count(PUBLIC_GROUP_CHAT_ID),
  });

  return activeChats
    .sort(sortChats);
};

const roving = (event, changeState, elementsList, element) => {
  this.selectedElement = element;
  const menuOpen = Session.get('dropdownOpen') || false;

  if (menuOpen) {
    const menuChildren = document.activeElement.getElementsByTagName('li');

    if ([KEY_CODES.ESCAPE, KEY_CODES.ARROW_LEFT].includes(event.keyCode)) {
      document.activeElement.click();
    }

    if ([KEY_CODES.ARROW_UP].includes(event.keyCode)) {
      menuChildren[menuChildren.length - 1].focus();
    }

    if ([KEY_CODES.ARROW_DOWN].includes(event.keyCode)) {
      for (let i = 0; i < menuChildren.length; i += 1) {
        if (menuChildren[i].hasAttribute('tabIndex')) {
          menuChildren[i].focus();
          break;
        }
      }
    }

    return;
  }
  if ([KEY_CODES.ESCAPE, KEY_CODES.TAB].includes(event.keyCode)) {
    document.activeElement.blur();
    changeState(null);
  }

  if (event.keyCode === KEY_CODES.ARROW_DOWN) {
    const firstElement = elementsList.firstChild;
    let elRef = element ? element.nextSibling : firstElement;
    elRef = elRef || firstElement;
    changeState(elRef);
  }

  if (event.keyCode === KEY_CODES.ARROW_UP) {
    const lastElement = elementsList.lastChild;
    let elRef = element ? element.previousSibling : lastElement;
    elRef = elRef || lastElement;
    changeState(elRef);
  }

  if ([KEY_CODES.ARROW_RIGHT, KEY_CODES.SPACE, KEY_CODES.ENTER].includes(event.keyCode)) {
    document.activeElement.firstChild.click();
  }
};

const hasPrivateChatBetweenUsers = (senderId, receiverId) => GroupChat
  .findOne({ users: { $all: [receiverId, senderId] } });

const getGroupChatPrivate = (senderUserId, receiver) => {
  if (!hasPrivateChatBetweenUsers(senderUserId, receiver.userId)) {
    makeCall('createGroupChat', receiver);
  }
};

const getBreakouts = () => Breakouts.find({ parentMeetingId: Auth.meetingID })
  .fetch()
  .sort((a, b) => a.sequence - b.sequence);

const currentBreakoutUsers = user => !Breakouts.findOne({
  'joinedUsers.userId': new RegExp(`^${user.userId}`),
});

const filterBreakoutUsers = filter => users => users.filter(filter);

const getUsersNotAssigned = filterBreakoutUsers(currentBreakoutUsers);

const takePresenterRole = () => makeCall('assignPresenter', Auth.userID);

export default {
  connectRecordingObserver: () => connectRecordingObserver(),
  processOutsideToggleRecording: arg => processOutsideToggleRecording(arg),

  isPublicChat,
  roving,
  getActiveChats,
  getGroupChatPrivate,
  hasPrivateChatBetweenUsers,
  amIPresenter: () => Users.findOne({ userId: Auth.userID },
    { fields: { presenter: 1 } }).presenter,
  amIModerator: () => Users.findOne({ userId: Auth.userID },
    { fields: { role: 1 } }).role === ROLE_MODERATOR,
  meetingName: () => Meetings.findOne({ meetingId: Auth.meetingID },
    { fields: { 'meetingProp.name': 1 } }).meetingProp.name,
  users: () => Users.find({
    connectionStatus: 'online',
    meetingId: Auth.meetingID,
    clientType: { $ne: DIAL_IN_USER },
  }).fetch(),
  isBreakoutEnabled: () => Meetings.findOne({ meetingId: Auth.meetingID },
    { fields: { 'breakoutProps.enabled': 1 } }).breakoutProps.enabled,
  isBreakoutRecordable: () => Meetings.findOne({ meetingId: Auth.meetingID },
    { fields: { 'breakoutProps.record': 1 } }).breakoutProps.record,
  toggleRecording: () => makeCall('toggleRecording'),
  createBreakoutRoom: (numberOfRooms, durationInMinutes, record = false) => makeCall('createBreakoutRoom', numberOfRooms, durationInMinutes, record),
  sendInvitation: (breakoutId, userId) => makeCall('requestJoinURL', { breakoutId, userId }),
  breakoutJoinedUsers: () => Breakouts.find({
    joinedUsers: { $exists: true },
  }, { fields: { joinedUsers: 1, breakoutId: 1, sequence: 1 }, sort: { sequence: 1 } }).fetch(),
  getBreakouts,
  getUsersNotAssigned,
  takePresenterRole,
  isSharingVideo: () => getVideoUrl(),
};
