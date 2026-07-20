describe('Model test', () => {
  describe('Use minimal table implementation', () => {
    beforeAll(() => {
      installDummyTable(Gantt);
    });

    it('Test resource with activities model', function testResourceWithActivitiesModel() {
      return createGantt({ data: createResourceWidthActivitiesData() }).then((gantt) => {});
    });

    it('Test resource and activities model', function testResourceAndActivitiesModel() {
      return createGantt({ data: createResourceActivityData() }).then((gantt) => {});
    });

    it('Test resource + activities + reservation model', function testResourceActivitiesReservationModel() {
      return createGantt({ data: createResourceActivityReservationData() }).then((gantt) => {});
    });
  });
});
