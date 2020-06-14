import React from 'react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import LeaveMeeting from './component';

const LeaveMeetingContainer = ({ children, ...props }) => (
  <LeaveMeeting {...props}>
    {children}
  </LeaveMeeting>
);

export default withTracker(() => ({
  isMeteorConnected: Meteor.status().connected,
}))(LeaveMeetingContainer);
