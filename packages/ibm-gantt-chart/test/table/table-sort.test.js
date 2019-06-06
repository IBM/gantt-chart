/* eslint-disable */
describe('Table sorting', function() {
  function createSortingConfig() {
    var hours = 3600000;
    var getActivityId = function(resId, rowNum, index) {
      return 'act' + resId + '_' + index;
    };
    var getActivityName = function(resId, rowNum, index) {
      return resId + '-' + index;
    };
    var memModel = createResourceWidthActivitiesData({
      generateResources: {
        resourceCounts: [10, 3],
        customizeResource: function(res, parent, level, index) {
          res.capacity = index + 1;
          return res;
        },
      },
      createActivities: function(resId, rowNum) {
        return [
          {
            id: getActivityId(resId, rowNum, 0),
            name: getActivityName(resId, rowNum, 0),
            start: minDate + hours * 24,
            end: minDate + hours * 24 + hours * 3,
          },
          {
            id: getActivityId(resId, rowNum, 1),
            name: getActivityName(resId, rowNum, 1),
            start: minDate + hours * 24 * 4,
            end: minDate + hours * 24 * 4 + hours * 3,
          },
        ];
      },
    });
    var tableConfig = {
      columns: [
        {
          title: 'Capacity',
          renderer: {
            text: 'capacity',
          },
          /*text : "capacity",*/

          sortComparator: function(a, b) {
            if (!a.parent) {
              return 0;
            } else {
              return a.capacity < b.capacity ? -1 : a.capacity > b.capacity ? 1 : 0;
            }
          },
        },
      ],
    };
    return { data: memModel, table: tableConfig };
  }

  it('Sort third column', function() {
    this.timeout(5000);
    return this.createGantt(createSortingConfig()).then(function(gantt) {
      var ganttTest = new GanttTest(gantt);
      ganttTest.checkRowsDisplayed(['Id_0', 'Id_0_0', 'Id_0_1', 'Id_0_2', 'Id_1', 'Id_1_0']);
      ganttTest.sortColumn('Capacity');
      ganttTest.checkRowsDisplayed(['Id_0', 'Id_0_0', 'Id_0_1', 'Id_0_2', 'Id_1', 'Id_1_0']);
      ganttTest.sortColumn('Capacity');
      ganttTest.checkRowsDisplayed(['Id_0', 'Id_0_2', 'Id_0_1', 'Id_0_0', 'Id_1', 'Id_1_2']);
    });
  });
});
