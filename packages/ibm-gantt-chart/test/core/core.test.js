describe('Core', () => {
  const { expect } = chai;

  describe('Use minimal table implementation', () => {
    it('Should show an empty Gantt', function testShouldShowEmptyGantt() {
      return createGantt().then((gantt) => {});
    });
  });
});
