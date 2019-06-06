describe('Core', function() {
  const { expect } = chai;

  describe('Use minimal table implementation', function() {
    it('Should show an empty Gantt', function() {
      return this.createGantt().then(function(gantt) {});
    });
  });
});
