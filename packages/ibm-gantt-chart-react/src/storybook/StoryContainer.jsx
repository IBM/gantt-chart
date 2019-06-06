import React from 'react';
import PropTypes from 'prop-types';

import './StoryContainer.scss';

// useless with mainFields: ['source'],
// import 'ibm-gantt-chart/dist/ibm-gantt-chart.css';

const propTypes = {
  story: PropTypes.func.isRequired,
};

const defaultProps = {};

// do nothing just adding StoryContainer.scss globally
const StoryContainer = ({ story }) => story();

StoryContainer.propTypes = propTypes;
StoryContainer.defaultProps = defaultProps;

export default StoryContainer;
