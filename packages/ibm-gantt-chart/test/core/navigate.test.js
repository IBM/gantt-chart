describe('Navigation', function() {
  it('Navigate to resources', function() {
    const memModel = createResourceWidthActivitiesData({ generateResources: { resourceCounts: [30, 3, 2] } });
    return this.createGantt({ data: memModel }).then(function(gantt) {
      const test = new GanttTest(gantt);

      let row = gantt.getFirstVisibleRow();
      expect(row.id).to.equal('Id_0');
      gantt.ensureRowVisible('Id_0_1_0');
      row = gantt.getFirstVisibleRow();
      expect(row.id).to.equal('Id_0');

      gantt.ensureRowVisible('Id_3_0');
      // vertical scrolling is necessary
      row = gantt.getFirstVisibleRow();
      expect(row.id).to.equal('Id_3_0');

      gantt.toggleCollapseRow('Id_5_0', true);
      expect(gantt.isRowVisible('Id_5_0_0')).to.be.false;

      gantt.setFirstVisibleRow('Id_5_0');
      row = gantt.getFirstVisibleRow();
      expect(row.id).to.equal('Id_5_0');

      gantt.setFirstVisibleRow('Id_2_0');
      row = gantt.getFirstVisibleRow();
      expect(row.id).to.equal('Id_2_0');

      gantt.ensureRowVisible('Id_5_0_0');
      row = gantt.getFirstVisibleRow();
      expect(row.id).to.equal('Id_5_0_0');
    });
  });

  it('Collapse two levels', function() {
    const memModel = createResourceWidthActivitiesData({ generateResources: { resourceCounts: [1, 3, 2] } });
    return this.createGantt({ data: memModel }).then(function(gantt) {
      const test = new GanttTest(gantt);

      const row = gantt.getFirstVisibleRow();
      expect(row.id).to.equal('Id_0');
      test.checkRowVisible('Id_0', true);
      gantt.toggleCollapseRow('Id_0', true);
      expect(gantt.isRowVisible('Id_0_0_0')).to.be.false;
      test.checkRowVisible('Id_0_0_0', false);
    });
  });
});
