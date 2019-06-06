describe('Milestones', function() {
  const { expect } = chai;

  describe('Use minimal table implementation', function() {
    it('Should show an empty Gantt', function() {
      const memModel = createResourceWidthActivitiesData({
        generateResources: { resourceCounts: [10, 2] },
        createActivities(resId) {
          return [
            {
              id: (resId === 'zero' ? 50 : resId) * 1000,
              name: 'Milestone start',
              start: minDate + 1000 * 3600 * 24,
              end: minDate + 1000 * 3600 * 24,
            },
            {
              id: (resId === 'zero' ? 50 : resId) * 1000 + 1,
              name: 'Milestone end',
              start: minDate + 1000 * 3600 * 24 * 4,
              end: minDate + 1000 * 3600 * 24 * 4,
            },
          ];
        },
      });
      return this.createGantt({
        data: memModel,
        timeTable: {
          renderer: [
            {
              background() {
                return '#00ff00';
              },
            },
          ],
        },
      }).then(function(gantt) {
        // noinspection JSUnresolvedVariable
        expect(sameColors($('.milestone .shape').css('backgroundColor'), '#00ff00')).to.be.true;
      });
    });
  });
});
