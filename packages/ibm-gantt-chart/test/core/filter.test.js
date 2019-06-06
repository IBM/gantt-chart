describe('Filtering', function() {
  function createFilterModel() {
    const hours = 3600000;
    const memModel = createResourceWidthActivitiesData({
      generateResources: { resourceCounts: [10, 2] },
      createActivities(resId, rowNum) {
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
    return memModel;
  }
  it('Test filtering of activities and setHideEmptyRows', function() {
    return this.createGantt({ data: createFilterModel() }).then(function(gantt) {
      expect(gantt.getVisibleRows().length).to.equal(30);
      gantt.search('Odd', false, true);
      let newCount = gantt.getVisibleRows().length;
      expect(newCount).to.equal(30);
      gantt.setHideEmptyRows(true);
      newCount = gantt.getVisibleRows().length;
      expect(newCount).to.equal(20);
    });
  });

  it('Test config table.hideEmptyRows', function() {
    return this.createGantt({ data: createFilterModel(), table: { hideEmptyRows: true } }).then(function(gantt) {
      gantt.search('Odd', false, true);
      expect(gantt.getVisibleRows().length).to.equal(20);
    });
  });
});
