import Gantt from 'ibm-gantt-chart';

import { storiesOf } from '@storybook/html'; // eslint-disable-line import/no-extraneous-dependencies

import '../stories.scss';

function createLoadChartGanttConfig(ctx) {
  function xmlAttr(node, name) {
    const attr = node.attributes.getNamedItem(name);
    return attr && attr.nodeValue;
  }

  function xmlChildElts(parent, tagname) {
    const childNodes = parent.childNodes;
    const elts = [];
    for (var i = 0, count = childNodes.length, node; i < count; ++i) {
      node = childNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE && (!tagname || tagname === node.tagName)) {
        elts.push(node);
      }
    }
    return elts;
  }
  function processResources(xmlDoc) {
    const resources = [];
    function readResources(xmlNode) {
      xmlChildElts(xmlNode, 'resource').forEach(node => {
        resources.push({
          id: xmlAttr(node, 'id'),
          name: xmlAttr(node, 'name'),
          quantity: xmlAttr(node, 'quantity'),
          parent: xmlAttr(xmlNode, 'id'),
        });
        readResources(node);
      });
    }
    readResources(xmlDoc.getElementsByTagName('resources')[0]);
    return resources;
  }

  function processActivities(xmlDoc) {
    const actsNode = xmlDoc.getElementsByTagName('activities')[0];
    function createDateParser(format) {
      let i = 0;
      const fmt = {};
      const year = 'year',
        month = 'month',
        day = 'day',
        hour = 'hour',
        min = 'min',
        secs = 'secs',
        millis = 'millis';
      const convertor = {
        yyyy: year,
        yy: year,
        y: year,
        M: month,
        MM: month,
        MMMM: month,
        d: day,
        dd: day,
        H: hour,
        HH: hour,
        m: min,
        mm: min,
        s: secs,
        ss: secs,
      };
      format.replace(/(yyyy|yy|y|M|MM|MMMM|dd|d|H|HH|m|mm|s|ss)/g, part => {
        fmt[convertor[part]] = i++;
      });
      return function(s) {
        if (!s) return null;
        const parts = s.match(/(\d+)/g);
        return new Date(
          parts[fmt[year]],
          parts[fmt[month]] - 1,
          parts[fmt[day]],
          parts[fmt[hour]],
          parts[fmt[min]],
          parts[fmt[secs]]
        ).getTime();
      };
    }
    const parseDate = createDateParser(xmlAttr(actsNode, 'dateFormat') || 'yyyy-mm-dd');

    const activities = [];
    let node;
    function readActivities(xmlNode) {
      xmlChildElts(xmlNode, 'activity').forEach(node => {
        activities.push({
          id: xmlAttr(node, 'id'),
          name: xmlAttr(node, 'name'),
          start: parseDate(xmlAttr(node, 'start')),
          end: parseDate(xmlAttr(node, 'end')),
          parent: xmlAttr(xmlNode, 'id'),
        });
        readActivities(node);
      });
    }
    readActivities(actsNode);
    return activities;
  }

  function processReservations(xmlDoc) {
    const resas = [];
    let node;
    function readReservations(xmlNode) {
      xmlChildElts(xmlNode, 'reservation').forEach(node => {
        resas.push({
          activity: xmlAttr(node, 'activity'),
          resource: xmlAttr(node, 'resource'),
        });
        readReservations(node);
      });
    }
    readReservations(xmlDoc.getElementsByTagName('reservations')[0]);
    return resas;
  }

  const base = (ctx && ctx.base) || '';
  function resourcePath(relativePath) {
    return base + relativePath;
  }

  return {
    data: {
      all() {
        return new Promise((resolve, reject) => {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', resourcePath('load_chart/load_chart.xml'), true);

          // If specified, responseType must be empty string or "document"
          // xhr.responseType = 'document';

          // overrideMimeType() can be used to force the response to be parsed as XML
          xhr.overrideMimeType('text/xml');

          xhr.onload = function() {
            if (xhr.readyState === xhr.DONE) {
              if (xhr.status === 200) {
                resolve(xhr.response);
              }
            }
          };
          xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
              resolve(xhr.responseXML);
            } else {
              reject({
                status: this.status,
                statusText: xhr.statusText,
              });
            }
          };
          xhr.onerror = function() {
            reject({
              status: this.status,
              statusText: xhr.statusText,
            });
          };
          xhr.send();
        });
      },
      resources: {
        data: processResources,
        parent: 'parent',
        name: 'name',
        id: 'id',
      },
      activities: {
        data: processActivities,
        start: 'start',
        end: 'end',
        name: 'name',
      },
      reservations: {
        data: processReservations,
        activity: 'activity',
        resource: 'resource',
      },
    },
    classes: 'load-chart-example',
    timeTable: {
      /* renderer : {

            } */
    },
    toolbar: [
      'title',
      'search',
      'separator',
      'mini',
      'separator',
      'fitToContent',
      'zoomIn',
      'zoomOut',
      'separator',
      'toggleLoadChart',
    ],
    loadResourceChart: {
      height: '150px',
      visible: false,
    },
    title: 'Load resource chart example',
  };
}

function customizeLoadChartGantt(gantt) {
  const synch = gantt.synchLayout({
    timeTableBoundsChanged(bounds) {},
    timeWindowChanged(start, end) {
      this.printTimeLine(`Time window: start: ${start}, end ${end}`);
    },
    timeLineSizeChanged(width, height) {
      this.printTimeLine(`Time line size changed: width: ${width}, height ${height}`);
    },
    timeLineInitialized() {
      this.printTimeLine('time line initialized');
    },
    timeLineScrolled(x) {
      console.log(`   time line scrolled ${x}`);
    },
    printTimeLine(message) {
      //   if (message) {
      //     console.log(message);
      //   }
      //   console.log(`    width: ${  this.getTimeLineWidth()  }, height: ${  this.getTimeLineHeight()}`);
      //   console.log(`    left: ${  this.getTimeLineScrollLeft()  }, time at left: ${  this.getTimeLine().getTimeAt(this.getTimeLineScrollLeft())}`);
    },
  });
}

storiesOf('Storybook|Examples', module).add('Load Resource Chart', () => {
  setTimeout(() => {
    new Gantt('gantt', createLoadChartGanttConfig()); // eslint-disable-line no-new
    customizeLoadChartGantt(gantt);
  }, 0);
  return '<div id="gantt"></div>';
});
