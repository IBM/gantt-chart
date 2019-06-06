describe('Error', function() {
  const { expect } = chai;

  before(function() {
    $('body').prepend(
      '<div id="errorCtnr"><span id="initErrorContent">This is some text that should disappear when error is raised</span></div>'
    );

    // runs before all tests in this block
    const errorClass = Gantt.components.ErrorHandler.impl || Gantt.components.ErrorHandler;
    this.errors = new errorClass(document.getElementById('errorCtnr'), {});
    this.$errorCtnr = $('#errorCtnr');
    this.errorNodes = [];
  });

  after(function() {
    this.$errorCtnr.remove();
  });

  function throwError() {
    throw 'This is an error message';
  }

  function codeError() {
    const i = toto.titi;
  }

  describe('Adding error', function() {
    it('Should show an error in the error list', function() {
      expectInDom('initErrorContent', true);
      try {
        throwError();
      } catch (e) {
        this.errorNodes.push(this.errors.addError(e, 'My fault'));
      }

      expectInDom('initErrorContent', false);
      expect(this.$errorCtnr[0].childNodes.length).to.equal(1);
      expect(this.errorNodes.length).to.equal(1);
      expectNotNull(this.errorNodes[0]);

      try {
        throwError();
      } catch (e) {
        this.errorNodes.push(this.errors.addError(e, 'It is not me its him'));
      }

      try {
        codeError();
      } catch (e) {
        this.errorNodes.push(this.errors.addError(e, 'Again my fault'));
      }

      expect(this.errorNodes.length).to.equal(3);
      expectInDom(this.errorNodes[2], true);

      try {
        codeError();
      } catch (e) {
        this.errorNodes.push(this.errors.addError(e, 'My last one promess'));
      }
    });
  });

  describe('Removing error', function() {
    it('Should remove an error by API', function() {
      this.errors.removeError(this.errorNodes[0]);
      expectInDom(this.errorNodes[0], false);
      this.errorNodes.splice(0, 1);
    });

    it('Should remove an error from UI', function() {
      $(this.errorNodes[0])
        .find('.remove-error-btn')
        .trigger('click');
      expectInDom(this.errorNodes[0], false);
      this.errorNodes.splice(0, 1);
    });
  });

  describe('Show error details', function() {
    it('Should collapse error details', function() {
      const node = $(this.errorNodes[0]).find('.error-desc');
      expectInDom(node, true);
      expectVisible(node, true);
      $(this.errorNodes[0])
        .find('.error-details-btn')
        .trigger('click');
      expectVisible(node, false);
    });

    it('Should expand error details', function() {
      const node = $(this.errorNodes[0]).find('.error-desc');
      expectInDom(node, true);
      expectVisible(node, false);
      $(this.errorNodes[0])
        .find('.error-details-btn')
        .trigger('click');
      expectVisible(node, true);
    });
  });
});
