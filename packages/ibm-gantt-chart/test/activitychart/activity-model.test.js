describe('Activity chart model', function() {
  it('Should show an empty Gantt', function() {
    const memModel = createActivityData({ generateActivities: { activityCounts: [30, 3, 2] } });
    return this.createGantt({ data: memModel, type: Gantt.type.ACTIVITY_CHART }).then(function(gantt) {});
  });
});
