import React from 'react';
import PropTypes from 'prop-types';

import Gantt from 'ibm-gantt-chart';

import './GanttChart.scss';

export default class GanttChart extends React.PureComponent {
  static propTypes = {
    config: PropTypes.shape({}).isRequired,
    className: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object]),
    style: PropTypes.shape({}),
  };

  static defaultProps = {
    className: undefined,
    style: undefined,
  };

  componentDidMount() {
    this.gantt = new Gantt(this.node, this.props.config);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.config !== this.props.config) {
      this.node.childNodes.forEach(child => child.remove()); // remove previous Gantt
      this.gantt = new Gantt(this.node, this.props.config);
    }
  }

  componentWillUnmount() {
    this.node = undefined;
    this.gantt = undefined;
  }

  render() {
    const { className, style } = this.props;
    return (
      <div
        ref={node => (this.node = node)}
        className={className ? `ibm-gantt-chart-react ${className}` : 'ibm-gantt-chart-react'}
        style={style}
      />
    );
  }
}
