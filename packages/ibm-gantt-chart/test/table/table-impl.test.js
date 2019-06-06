describe('Table implementation', function() {
  describe('Use minimal table implementation', function() {
    before(function() {
      installDummyTable(Gantt);
    });
    after(function() {
      uninstallDummyTable(Gantt);
    });
    it('Simple', function() {
      const memModel = createResourceWidthActivitiesData();
      return this.createGantt({ data: memModel }).then(function(gantt) {
        expect($(gantt.table.getTableBody()).find('tr').length).to.equal(memModel.resources.data.length);
      });
    });
  });
});
