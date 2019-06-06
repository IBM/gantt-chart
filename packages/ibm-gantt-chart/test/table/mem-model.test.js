describe('Model test', function() {
  describe('Use minimal table implementation', function() {
    before(function() {
      installDummyTable(Gantt);
    });

    it('Test resource with activities model', function() {
      return this.createGantt({ data: createResourceWidthActivitiesData() }).then(function(gantt) {});
    });

    it('Test resource and activities model', function() {
      return this.createGantt({ data: createResourceActivityData() }).then(function(gantt) {});
    });

    it('Test resource + activities + reservation model', function() {
      return this.createGantt({ data: createResourceActivityReservationData() }).then(function(gantt) {});
    });
  });
});
