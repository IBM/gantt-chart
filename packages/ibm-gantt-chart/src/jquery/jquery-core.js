import $ from 'jquery';

import Gantt from '../core/core';

const allGantts = [];

const getGantt = node => {
  for (let i = 0, count = allGantts.length; i < count; ++i) {
    if (allGantts[i].node === node) {
      return allGantts[i];
    }
  }
  return null;
};

const removeGantt = gantt => {
  const index = allGantts.indexOf(gantt);
  if (index > -1) {
    allGantts.splice(index, 1);
  }
  return gantt;
};

Gantt.envReady = function() {
  return new Promise(function(resolve, reject) {
    $(document).ready(resolve);
  });
};

try {
  $.fn.Gantt = function(options) {
    const gantts = [];
    this.each(function() {
      let gantt = getGantt(this);
      if (gantt) {
        if (options) {
          gantt.destroy();
          removeGantt(gantt);
        } else {
          // Use the current gantt associated with this node as no configuration change has been specified.
          return;
        }
      }
      gantt = new Gantt(this, options);
      gantt.disconnect = () => {
        removeGantt(this);
      };
      gantts.push(gantt);
    });

    const ganttRef = gantts.length && gantts[0];
    const apiRef = (ganttRef && ganttRef.api && ganttRef.api()) || {};
    if (gantts.length === 1) {
      this.api = function() {
        return apiRef;
      };
    } else if (gantts.length > 0) {
      // TODO
    } else {
      this.api = function() {
        return {};
      };
    }
    $.extend(this, apiRef);
    return gantts.length && gantts[0];
  };
} catch (e) {
  console.error(e);
}
