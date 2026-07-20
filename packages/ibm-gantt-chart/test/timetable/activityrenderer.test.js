describe('Rendering of activities', () => {
  it('Define row height', function testDefineRowHeight() {
    const memModel = createResourceWidthActivitiesData({ generateResources: { resourceCounts: [30, 3, 2] } });
    return createGantt({
      data: memModel,
      timeTable: {
        renderer: [
          {
            rowHeight(row) {
              return row.id.length < 6 ? 50 : 23;
            },
          },
        ],
      },
    }).then((gantt) => {
      const ctnr = getTimeTableRowContainer(gantt);
      const timeRows = ctnr.getElementsByClassName(TIME_TABLE_ROW_CLASS);
      expect(timeRows).to.have.length.of.at.least(1);

      for (
        var i = 0, timeRow, id, l = TIME_TABLE_ROW_ID_PREFIX.length, acts, actNodes, rowHeight;
        i < timeRows.length;
        i++
      ) {
        timeRow = timeRows[i];
        id = timeRow.id.substring(l);
        if (id.length < 6) {
          expect(Number.parseInt(timeRow.style.height, 10)).to.equal((rowHeight = 50));
        } else {
          expect((rowHeight = Number.parseInt(timeRow.style.height, 10))).to.not.equal(50);
        }
        actNodes = timeRow.getElementsByClassName(ACTIVITY_CLASS);
        if (actNodes.length) {
          expect(Number.parseInt(actNodes[0].style.height, 10)).to.equal(rowHeight - 4); // - topMargin - bottomMargin
        }
      }
    });
  });

  it('Use row layout', function testUseRowLayout() {
    const idNames = {
      10: 'Jane',
      28: 'Joe',
      29: 'Jack',
    };
    const rowHeights = {
      Jane: 50,
      Joe: 32,
      Jack: 100,
    };
    return createGantt(
      createHouseBuildingConfig({
        activitySubRows: 3,
        layoutStrategy: 'tile',
        rowHeight(row) {
          return rowHeights[idNames[row.id]] || 0;
        },
      })
    ).then((gantt) => {
      let row = getTimeTableRow(gantt, '10'); // Jane
      expect(row.offsetHeight).to.not.equal(50);
      row = getTimeTableRow(gantt, '28'); // Joe
      expect(row.offsetHeight).to.not.equal(rowHeights.Joe);
      row = getTimeTableRow(gantt, '29'); // Jack
      expect(row.offsetHeight).to.not.equal(rowHeights.Jane);
    });
  });
});
