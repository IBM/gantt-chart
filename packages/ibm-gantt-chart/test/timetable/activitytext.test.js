describe('Clipping of activity text', function() {
  const ACTIVITY_TEXT_CLASSNAME = 'activity-text';

  function createTextBox(boxText) {
    const cont = document.createElement('div');
    cont.style.width = '200px';
    cont.style.height = '23px';
    cont.style.overflow = 'hidden';
    cont.style.background = 'yellow';
    cont.style.border = '1px solid black';
    cont.style.marginBottom = '20px';
    cont.style.position = 'relative';

    const marker = document.createElement('span');
    marker.style.display = 'inline-block';
    marker.style.width = '1px';
    marker.style.height = '50px';
    marker.style.float = 'left';
    cont.appendChild(marker);

    const text = document.createElement('span');
    text.style.display = 'inline-block';
    text.style.float = 'left';
    text.style.whiteSpace = 'nowrap';
    text.className = ACTIVITY_TEXT_CLASSNAME;
    text.appendChild(document.createTextNode(boxText));
    cont.appendChild(text);
    return cont;
  }

  it('Should show an empty Gantt', function() {
    const separator = document.createElement('div');
    separator.borderBottom = '2px solid black';
    document.body.insertBefore(separator, document.body.childNodes[0]);
    const longBox = createTextBox('This is a very very very very super very very long text');
    document.body.insertBefore(longBox, separator);

    const shortBox = createTextBox('Short text');
    document.body.insertBefore(shortBox, separator);

    expect(longBox.getElementsByClassName(ACTIVITY_TEXT_CLASSNAME)[0].offsetTop > 0).to.be.true;
    expect(shortBox.getElementsByClassName(ACTIVITY_TEXT_CLASSNAME)[0].offsetTop > 0).to.be.false;
  });
});
