import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import { styles } from './styles';

const intlMessages = defineMessages({
  legendTitle: {
    id: 'app.meeting-ended.rating.legendVideoLabel',
    description: 'label for star feedback legend',
  },
  starLabel: {
    id: 'app.meeting-ended.rating.starLabel',
    description: 'label for feedback stars',
  },
});

const propTypes = {
  intl: intlShape.isRequired,
  videoOnRate: PropTypes.func.isRequired,
  total: PropTypes.string.isRequired,
};

class VideoRating extends Component {
  constructor(props) {
    super(props);
    this.videoClickStar = this.videoClickStar.bind(this);
  }

  shouldComponentUpdate() {
    // when component re render lost checked item
    return false;
  }

  videoClickStar(e) {
    const { videoOnRate } = this.props;
    videoOnRate(e);
  }

  renderStars(num) {
    const { intl } = this.props;

    return (
      <div className={styles.starRating}>
        <fieldset>
          <legend className={styles.legend}>{intl.formatMessage(intlMessages.legendTitle)}</legend>
          {
            _.range(num)
              .map(i => [
                (
                  <input
                    type="radio"
                    id={`${i + 1}star-video`}
                    name="video-rating"
                    value={i + 1}
                    key={_.uniqueId('star-video')}
                    onChange={() => this.videoClickStar(i + 1)}
                  />
                ),
                (
                  <label
                    htmlFor={`${i + 1}star-video`}
                    key={_.uniqueId('star-video')}
                    aria-label={`${i + 1} ${intl.formatMessage(intlMessages.starLabel)}`}
                  />
                ),
              ]).reverse()
          }
        </fieldset>
      </div>
    );
  }

  render() {
    const {
      total,
    } = this.props;
    return (
      <div className={styles.father}>
        {
          this.renderStars(total)
        }
      </div>
    );
  }
}

export default injectIntl(VideoRating);

VideoRating.propTypes = propTypes;
