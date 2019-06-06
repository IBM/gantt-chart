export default function createXMLDataConfig(xmlPath, activityChart) {
  function xmlAttr(node, name) {
    const attr = node.attributes.getNamedItem(name);
    return attr && attr.nodeValue;
  }

  function xmlChildElts(parent, tagname) {
    const childNodes = parent.childNodes;
    const elts = [];
    for (let i = 0, count = childNodes.length, node; i < count; ++i) {
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
      const fmt = {},
        year = 'year',
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

  function processConstraints(xmlDoc) {
    const consts = [];
    const typeConvert = {
      'Start-Start': Gantt.constraintTypes.START_TO_START,
      'Start-End': Gantt.constraintTypes.START_TO_END,
      'End-Start': Gantt.constraintTypes.END_TO_START,
      'End-End': Gantt.constraintTypes.END_TO_END,
    };
    const roots = xmlDoc.getElementsByTagName('constraints');
    if (roots && roots.length) {
      xmlChildElts(roots[0], 'constraint').forEach(node => {
        consts.push({
          from: xmlAttr(node, 'from'),
          to: xmlAttr(node, 'to'),
          type: typeConvert[xmlAttr(node, 'type')],
        });
      });
    }
    return consts;
  }

  return {
    all() {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', xmlPath, true);

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
    reservations: {
      data: processReservations,
      activity: 'activity',
      resource: 'resource',
    },
    activities: {
      data: processActivities,
      start: 'start',
      end: 'end',
      name: 'name',
      parent: 'parent',
    },
    constraints: {
      data: processConstraints,
      from: 'from',
      to: 'to',
      type: 'type',
    },
  };
}
