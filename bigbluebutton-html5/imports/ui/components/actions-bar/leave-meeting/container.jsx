import React from 'react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import LeaveMeeting from './component';
import { meetingIsBreakout } from '/imports/ui/components/app/service';

const LeaveMeetingContainer = props => (
  <LeaveMeeting {...props} />
);

export default withTracker((props) => {
  return {
    amIModerator: props.amIModerator,
    isMeteorConnected: Meteor.status().connected,
    isBreakoutRoom: meetingIsBreakout(),
  };
})(LeaveMeetingContainer);
