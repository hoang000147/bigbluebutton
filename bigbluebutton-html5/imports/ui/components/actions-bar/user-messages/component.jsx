import React, { PureComponent } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import cx from 'classnames';
// import { styles } from '/imports/ui/components/user-list/user-list-content/styles';
//import { styles } from './styles';
import { styles } from '../styles';
import { findDOMNode } from 'react-dom';
import ChatListItemContainer from '../chat-list-item/container';
import { withModalMounter } from '/imports/ui/components/modal/service';
import Button from '/imports/ui/components/button/component';
import Dropdown from '/imports/ui/components/dropdown/component';
import DropdownTrigger from '/imports/ui/components/dropdown/trigger/component';
import DropdownContent from '/imports/ui/components/dropdown/content/component';
import DropdownList from '/imports/ui/components/dropdown/list/component';
import DropdownListItem from '/imports/ui/components/dropdown/list/item/component';
import DropdownListSeparator from '/imports/ui/components/dropdown/list/separator/component';

const propTypes = {
  activeChats: PropTypes.arrayOf(String).isRequired,
  compact: PropTypes.bool,
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  isPublicChat: PropTypes.func.isRequired,
  roving: PropTypes.func.isRequired,
  hasUnreadMessages: PropTypes.bool,
};

const defaultProps = {
  compact: false,
  hasUnreadMessages: false,
};

const listTransition = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  appear: styles.appear,
  appearActive: styles.appearActive,
  leave: styles.leave,
  leaveActive: styles.leaveActive,
};

const intlMessages = defineMessages({
  messagesTitle: {
    id: 'app.userList.messagesTitle',
    description: 'Title for the messages list',
  },
  chatLabel: {
    id: 'app.chat.label',
    description: 'chat label',
  },
});

class UserMessages extends PureComponent {
  constructor() {
    super();

    this.state = {
      selectedChat: null,
    };

    this.activeChatRefs = [];

    this.changeState = this.changeState.bind(this);
    this.rove = this.rove.bind(this);
  }

  componentDidMount() {
    const { compact } = this.props;
    if (!compact) {
      this._msgsList.addEventListener(
        'keydown',
        this.rove,
      );
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { selectedChat } = this.state;

    if (selectedChat && selectedChat !== prevState.selectedChat) {
      const { firstChild } = selectedChat;
      if (firstChild) firstChild.focus();
    }
  }

  getActiveChats() {
    const {
      activeChats,
      compact,
      isPublicChat,
    } = this.props;

    let index = -1;

    return activeChats.map(chat => (
      <CSSTransition
        classNames={listTransition}
        appear
        enter
        exit={false}
        timeout={0}
        component="div"
        // className={cx(styles.chatsList)}
        key={chat.userId}
      >
        <div ref={(node) => { this.activeChatRefs[index += 1] = node; }}>
          <ChatListItemContainer
            isPublicChat={isPublicChat}
            compact={compact}
            chat={chat}
            tabIndex={-1}
          />
        </div>
      </CSSTransition>
    ));
  }

  changeState(ref) {
    this.setState({ selectedChat: ref });
  }

  rove(event) {
    const { roving } = this.props;
    const { selectedChat } = this.state;
    const msgItemsRef = findDOMNode(this._msgItems);
    roving(event, this.changeState, msgItemsRef, selectedChat);
  }

  render() {
    const {
      intl,
      compact,
      hasUnreadMessages,
    } = this.props;

    const btnWithNotificationDot = {};
    btnWithNotificationDot[styles.btn] = true;
    btnWithNotificationDot[styles.btnWithNotificationDot] = hasUnreadMessages;

    return (
      /* <div className={styles.messages}>
        <div className={styles.container}>
          {
            !compact ? (
              <h2 className={styles.smallTitle}>
                {intl.formatMessage(intlMessages.messagesTitle)}
              </h2>
            ) : (
              <hr className={styles.separator} />
            )
          }
        </div>
        <div
          role="tabpanel"
          tabIndex={0}
          className={styles.scrollableList}
          ref={(ref) => { this._msgsList = ref; }}
        > */
          /* <div 
            className={styles.list}
            ref={(ref) => { this._msgsList = ref; }}
          > */
          <Dropdown>
            <DropdownTrigger>
              <Button
                className={cx(btnWithNotificationDot)}
                icon="chat"
                label={intl.formatMessage(intlMessages.chatLabel)}
                size="lg"
                circle
                hideLabel
                ghost
                data-test={hasUnreadMessages ? 'hasUnreadMessages' : null}

                // FIXME: Without onClick react proptypes keep warning
                // even after the DropdownTrigger inject an onClick handler
                onClick={() => null}
              />
            </DropdownTrigger>
            <DropdownContent placement="top right">
              <DropdownList>
                <div
                  className={styles.list}
                  ref={(ref) => { this._msgsList = ref; }}
                >
                  <TransitionGroup ref={(ref) => { this._msgItems = ref; }}>
                    {this.getActiveChats()}
                  </TransitionGroup>
                </div>
              </DropdownList>
            </DropdownContent>
          </Dropdown>
            /* <TransitionGroup ref={(ref) => { this._msgItems = ref; }}>
              {this.getActiveChats()}
            </TransitionGroup> 
          </div>  */
        /* </div>
       </div> */
    );
  }
}

UserMessages.propTypes = propTypes;
UserMessages.defaultProps = defaultProps;

export default UserMessages;
