describe('Table implementation', () => {
  describe('Use minimal table implementation', () => {
    beforeAll(() => {
      installDummyTable(Gantt);
    });
    afterAll(() => {
      uninstallDummyTable(Gantt);
    });
    it('Simple', function testSimple() {
      const memModel = createResourceWidthActivitiesData();
      return createGantt({ data: memModel }).then((gantt) => {
        const tableBody = gantt.table.getTableBody();
        const rows = tableBody.querySelectorAll('tr');
        expect(rows.length).to.equal(memModel.resources.data.length);
      });
    });
  });
});
