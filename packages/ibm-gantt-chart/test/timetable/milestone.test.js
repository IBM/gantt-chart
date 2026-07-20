describe('Milestones', () => {
  const { expect } = chai;

  describe('Use minimal table implementation', () => {
    it('Should show an empty Gantt', function testShouldShowEmptyGantt() {
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
      return createGantt({
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
      }).then((gantt) => {
        // Get milestone element and check its background color
        const milestoneShape = document.querySelector('.milestone .shape');
        expect(milestoneShape).to.exist;
        const bgColor = window.getComputedStyle(milestoneShape).backgroundColor;
        expect(sameColors(bgColor, '#00ff00')).to.be.true;
      });
    });
  });
});
