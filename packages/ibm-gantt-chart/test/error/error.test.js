describe('Error', () => {
  const { expect } = chai;

  // Shared state for all tests
  let errors, errorCtnr, errorNodes = [];

  beforeAll(function setup() {
    // Create error container in DOM
    errorCtnr = document.createElement('div');
    errorCtnr.id = 'errorCtnr';
    const initContent = document.createElement('span');
    initContent.id = 'initErrorContent';
    initContent.textContent = 'This is some text that should disappear when error is raised';
    errorCtnr.appendChild(initContent);
    document.body.insertBefore(errorCtnr, document.body.firstChild);

    // Initialize error handler
    const ErrorClass = Gantt.components.ErrorHandler.impl || Gantt.components.ErrorHandler;
    errors = new ErrorClass(errorCtnr, {});
    errorNodes = [];
  });

  afterAll(function teardown() {
    if (errorCtnr.parentNode) {
      errorCtnr.parentNode.removeChild(errorCtnr);
    }
  });

  function throwError() {
    throw 'This is an error message';
  }

  function codeError() {
    const i = toto.titi;
  }

  describe('Adding error', () => {
    it('Should show an error in the error list', () => {
      expectInDom('initErrorContent', true);
      try {
        throwError();
      } catch (e) {
        errorNodes.push(errors.addError(e, 'My fault'));
      }

      expectInDom('initErrorContent', false);
      expect(errorCtnr.childNodes.length).to.equal(1);
      expect(errorNodes.length).to.equal(1);
      expectNotNull(errorNodes[0]);

      try {
        throwError();
      } catch (e) {
        errorNodes.push(errors.addError(e, 'It is not me its him'));
      }

      try {
        codeError();
      } catch (e) {
        errorNodes.push(errors.addError(e, 'Again my fault'));
      }

      expect(errorNodes.length).to.equal(3);
      expectInDom(errorNodes[2], true);

      try {
        codeError();
      } catch (e) {
        errorNodes.push(errors.addError(e, 'My last one promess'));
      }
    });
  });

  describe('Removing error', () => {
    it('Should remove an error by API', () => {
      errors.removeError(errorNodes[0]);
      expectInDom(errorNodes[0], false);
      errorNodes.splice(0, 1);
    });

    it('Should remove an error from UI', () => {
      const removeBtn = errorNodes[0].querySelector('.remove-error-btn');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      removeBtn.dispatchEvent(clickEvent);
      expectInDom(errorNodes[0], false);
      errorNodes.splice(0, 1);
    });
  });

  describe('Show error details', () => {
    it('Should collapse error details', () => {
      const node = errorNodes[0].querySelector('.error-desc');
      expectInDom(node, true);
      expectVisible(node, true);
      const detailsBtn = errorNodes[0].querySelector('.error-details-btn');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      detailsBtn.dispatchEvent(clickEvent);
      expectVisible(node, false);
    });

    it('Should expand error details', () => {
      const node = errorNodes[0].querySelector('.error-desc');
      expectInDom(node, true);
      expectVisible(node, false);
      const detailsBtn = errorNodes[0].querySelector('.error-details-btn');
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      detailsBtn.dispatchEvent(clickEvent);
      expectVisible(node, true);
    });
  });
});
