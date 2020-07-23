import React, { PureComponent } from 'react';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import Dropdown from '/imports/ui/components/dropdown/component';
import DropdownTrigger from '/imports/ui/components/dropdown/trigger/component';
import DropdownContent from '/imports/ui/components/dropdown/content/component';
import DropdownList from '/imports/ui/components/dropdown/list/component';
import DropdownListItem from '/imports/ui/components/dropdown/list/item/component';
import DropdownListSeparator from '/imports/ui/components/dropdown/list/separator/component';
import EndMeetingConfirmationContainer from '/imports/ui/components/end-meeting-confirmation/container';
import cx from 'classnames';
import { withModalMounter } from '/imports/ui/components/modal/service';
import { makeCall } from '/imports/ui/services/api';

import { styles } from '../styles';

const propTypes = {
  intl: intlShape.isRequired,
  mountModal: PropTypes.func.isRequired,
  isMeteorConnected: PropTypes.bool.isRequired,
  amIModerator: PropTypes.bool,
  isBreakoutRoom: PropTypes.bool,
};

const defaultProps = {
  amIModerator: false,
  isBreakoutRoom: false,
};

const intlMessages = defineMessages({
  leaveMeetingLabel: {
    // id: 'app.actionsBar.leaveMeetingLabel',
    id: 'app.navBar.settingsDropdown.leaveSessionLabel',
    description: 'Leave Meeting option label',
  },
  leaveMeetingDesc: {
    // id: 'app.actionsBar.leaveMeetingDesc',
    id: 'app.navBar.settingsDropdown.leaveSessionDesc',
    description: 'Describes leave meeting option',
  },
  endMeetingLabel: {
    id: 'app.navBar.settingsDropdown.endMeetingLabel',
    description: 'End meeting options label',
  },
  endMeetingDesc: {
    id: 'app.navBar.settingsDropdown.endMeetingDesc',
    description: 'Describes settings option closing the current meeting',
  },
});

class LeaveMeeting extends PureComponent {
  constructor(props) {
    super(props);

    // Set the logout code to 680 because it's not a real code and can be matched on the other side
    this.LOGOUT_CODE = '680';

    this.leaveMeeting = this.leaveMeeting.bind(this);
  }

  leaveMeeting() {
    document.dispatchEvent(new Event('exitVideo'));

    makeCall('userLeftMeeting');
    // we don't check askForFeedbackOnLogout here,
    // it is checked in meeting-ended component
    Session.set('codeError', this.LOGOUT_CODE);
    // mountModal(<MeetingEndedComponent code={LOGOUT_CODE} />);
  }

  renderLeaveMeeting() {
    const {
      intl, isMeteorConnected,
    } = this.props;

    const {
      allowLogout: allowLogoutSetting,
    } = Meteor.settings.public.app;

    const logoutOption = (
      <Button
        className={cx(styles.button)}
        icon="logout"
        label={intl.formatMessage(intlMessages.leaveMeetingLabel)}
        color="danger"
        description={intl.formatMessage(intlMessages.leaveMeetingDesc)}
        size="lg"
        circle
        hideLabel
        onClick={() => this.leaveMeeting()}
      />
    );
    const shouldRenderLogoutOption = (isMeteorConnected && allowLogoutSetting)
      ? logoutOption
      : null;

    return _.compact([
      shouldRenderLogoutOption,
    ]);
  }

  renderEndMeeting() {
    const {
      intl, isMeteorConnected, amIModerator, isBreakoutRoom, mountModal,
    } = this.props;

    const {
      allowLogout: allowLogoutSetting,
    } = Meteor.settings.public.app;

    const allowedToEndMeeting = amIModerator && !isBreakoutRoom;

    const logoutOption = (
      <DropdownListItem
        key="list-item-logout"
        icon="logout"
        label={intl.formatMessage(intlMessages.leaveMeetingLabel)}
        description={intl.formatMessage(intlMessages.leaveMeetingDesc)}
        onClick={() => this.leaveMeeting()}
      />
    );

    const shouldRenderLogoutOption = (isMeteorConnected && allowLogoutSetting)
      ? logoutOption
      : null;

    return _.compact([
      // (isMeteorConnected ? <DropdownListSeparator key={_.uniqueId('list-separator-')} /> : null),
      allowedToEndMeeting && isMeteorConnected
        ? (<DropdownListItem
          key="list-item-end-meeting"
          icon="application"
          label={intl.formatMessage(intlMessages.endMeetingLabel)}
          description={intl.formatMessage(intlMessages.endMeetingDesc)}
          onClick={() => mountModal(<EndMeetingConfirmationContainer />)}
        />
        )
        : null,
      shouldRenderLogoutOption,
    ]);
  }

  render() {
    const {
      intl,
      amIModerator,
      isMeteorConnected,
    } = this.props;

    return (
      amIModerator && isMeteorConnected
        ? (
          <Dropdown>
            <DropdownTrigger>
              <Button
                className={cx(styles.button)}
                icon="logout"
                label={intl.formatMessage(intlMessages.leaveMeetingLabel)}
                color="danger"
                description={intl.formatMessage(intlMessages.leaveMeetingDesc)}
                size="lg"
                circle
                hideLabel

              // FIXME: Without onClick react proptypes keep warning
              // even after the DropdownTrigger inject an onClick handler
                onClick={() => null}
              />
            </DropdownTrigger>
            <DropdownContent placement="top right">
              <DropdownList>
                {this.renderEndMeeting()}
              </DropdownList>
            </DropdownContent>
          </Dropdown>
        )
        : this.renderLeaveMeeting()
    );
  }
}

LeaveMeeting.propTypes = propTypes;

export default withModalMounter(injectIntl(LeaveMeeting));
