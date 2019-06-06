/* eslint-disable */
describe('Table loading', function() {
  describe('Load memory model', function() {
    it('Load memory model with resources and activities within resources', function() {
      return this.createGantt({ data: createResourceWidthActivitiesData() }).then(function(gantt) {});
    });
  });

  describe('Load memory model after initialization', function() {
    it.skip('Load memory model with resources and activities within resources', function() {
      this.timeout(10000);
      return this.createGantt({ data: createResourceWidthActivitiesData() }).then(function(gantt) {
        var hours = 3600000;
        var memModel = createResourceWidthActivitiesData({
          generateResources: { resourceCounts: [2, 1] },
          createActivities: function(resId, rowNum) {
            return [
              {
                id: (resId === 'zero' ? 50 : resId) * 1000,
                name: rowNum % 2 ? 'Even' : 'Odd', // index 0 if for row displayed as index 1
                start: minDate + hours * 24,
                end: minDate + hours * 24 + hours * 3,
              },
              {
                id: (resId === 'zero' ? 50 : resId) * 1000 + 1,
                name: rowNum % 2 ? 'Even' : 'Odd',
                start: minDate + hours * 24 * 4,
                end: minDate + hours * 24 * 4 + hours * 3,
              },
            ];
          },
        });
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            gantt.load(memModel).then(function(newRows) {
              if (newRows.length !== 4) {
                reject('Wrong number of rows: ' + newRows.length + ' instead of 4');
              }
              resolve();
            });
          }, 500);
        });
      });
    });
  });
});
