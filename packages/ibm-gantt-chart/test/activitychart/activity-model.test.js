describe('Activity chart model', () => {
  it('Should show an empty Gantt', function testShouldShowEmptyGantt() {
    const memModel = createActivityData({ generateActivities: { activityCounts: [30, 3, 2] } });
    return createGantt({ data: memModel, type: Gantt.type.ACTIVITY_CHART }).then((gantt) => {});
  });
});
