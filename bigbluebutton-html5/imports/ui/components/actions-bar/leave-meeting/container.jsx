import React from 'react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import LeaveMeeting from './component';

const LeaveMeetingContainer = ({ children, ...props }) => (
  <LeaveMeeting {...props}>
    {children}
  </LeaveMeeting>
);

export default withTracker((props) => {
  return {
    isMeteorConnected: Meteor.status().connected,
  };
})(LeaveMeetingContainer);
