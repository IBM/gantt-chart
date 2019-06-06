describe('Palette', function() {
  const colorbrewer = {
    YlGn: {
      3: ['#f7fcb9', '#addd8e', '#31a354'],
      4: ['#ffffcc', '#c2e699', '#78c679', '#238443'],
      5: ['#ffffcc', '#c2e699', '#78c679', '#31a354', '#006837'],
      6: ['#ffffcc', '#d9f0a3', '#addd8e', '#78c679', '#31a354', '#006837'],
      7: ['#ffffcc', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#005a32'],
      8: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#005a32'],
      9: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
    },
    YlGnBu: {
      3: ['#edf8b1', '#7fcdbb', '#2c7fb8'],
      4: ['#ffffcc', '#a1dab4', '#41b6c4', '#225ea8'],
      5: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'],
      6: ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8', '#253494'],
      7: ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'],
      8: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'],
      9: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
    },
  };

  function expectSameArrays(ar1, ar2) {
    expect(ar1.length).to.equal(ar2.length);
    for (let i = 0; i < ar1.length; i++) {
      expect(ar1[i]).to.equal(ar2[i]);
    }
  }

  function createPalette(oarams) {}

  it('Create palette from colorbrewer lib format', function() {
    const palette = new (Gantt.components.Palette.impl || Gantt.components.Palette)(colorbrewer.YlGn);

    Object.keys(colorbrewer.YlGn).forEach(function(key) {
      const colors = colorbrewer.YlGn[key];
      expectSameArrays(colors, palette.getColors(colors.length));
    });
    expectSameArrays(palette.getColors(10), colorbrewer.YlGn['9'].concat([colorbrewer.YlGn['9'][0]])); // compared result is orig array of size 9 + the first element of the same array. This is the current alog when asking more colors than defined with the palette.
    expectSameArrays(palette.getColors(2), ['#f7fcb9', '#addd8e']);
  });

  it('Create palette from a color array', function() {
    const colorArray = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'];
    const palette = new (Gantt.components.Palette.impl || Gantt.components.Palette)(colorArray);

    expectSameArrays(colorArray, palette.getColors(colorArray.length));
    expectSameArrays(colorArray.slice(0, 5), palette.getColors(5));
    expectSameArrays(colorArray.slice(0, 1), palette.getColors(1));
    expectSameArrays(palette.getColors(10), colorArray.concat(['#ffffd9', '#edf8b1'])); // compared result is orig array of size 8 + 2 first elements of the same array. This is the current alog when asking more colors than defined with the palette.
  });

  it('Create palette from a function', function() {
    const colorArray = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84'];
    const palette = new (Gantt.components.Palette.impl || Gantt.components.Palette)(function(count) {
      return count >= 0 && count <= colorArray.length ? colorArray.slice(0, count) : colorArray;
    });

    expectSameArrays(colorArray, palette.getColors(colorArray.length));
    expectSameArrays(colorArray.slice(0, 5), palette.getColors(5));
    expectSameArrays(colorArray.slice(0, 1), palette.getColors(1));
    expectSameArrays(palette.getColors(10), colorArray.concat(['#ffffd9', '#edf8b1'])); // compared result is orig array of size 8 + 2 first elements of the same array. This is the current alog when asking more colors than defined with the palette.
  });
});
