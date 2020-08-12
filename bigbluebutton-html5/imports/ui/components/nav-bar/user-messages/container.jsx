import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import UserMessages from './component';
import Service from '../service';

const UserMessagesContainer = props => <UserMessages {...props} />;

export default withTracker(() => {
  const checkUnreadMessages = () => {
    const activeChats = Service.getActiveChats();
    const hasUnreadMessages = activeChats
      .filter(chat => chat.userId !== Session.get('idChatOpen'))
      .some(chat => chat.unreadCounter > 0);
    return hasUnreadMessages;
  };

  const hasUnreadMessages = checkUnreadMessages();

  return {
    activeChatId: Session.get('idChatOpen'),
    chatPanelOpen: Session.get('openPanel') === 'chat',
    hasUnreadMessages,
  };
})(UserMessagesContainer);
