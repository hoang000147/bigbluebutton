import React, { PureComponent } from 'react';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import _ from 'lodash';
import PropTypes from 'prop-types';
import Button from '/imports/ui/components/button/component';
import cx from 'classnames';
import { withModalMounter } from '../../modal/service';
import { makeCall } from '/imports/ui/services/api';

import { styles } from '../styles';

const propTypes = {
  intl: intlShape.isRequired,
  mountModal: PropTypes.func.isRequired,
  shortcuts: PropTypes.string,
  isMeteorConnected: PropTypes.bool.isRequired,
};

const intlMessages = defineMessages({
  leaveMeetingLabel: {
    id: 'app.actionsBar.leaveMeetingLabel',
    description: 'Leave Meeting option label',
  },
  leaveMeetingDesc: {
    id: 'app.actionsBar.leaveMeetingDesc',
    description: 'Describes leave meeting option',
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

  render() {
    const {
      intl,
    } = this.props;

    return (
      <span>
        { this.renderLeaveMeeting() }
      </span>
    );
  }
}

LeaveMeeting.propTypes = propTypes;

export default withModalMounter(injectIntl(LeaveMeeting));
