describe('Rendering of activities', function() {
  it('Define row height', function() {
    const memModel = createResourceWidthActivitiesData({ generateResources: { resourceCounts: [30, 3, 2] } });
    return this.createGantt({
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
    }).then(function(gantt) {
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
          expect(timeRow.offsetHeight).to.equal((rowHeight = 50));
        } else {
          expect((rowHeight = timeRow.offsetHeight)).to.not.equal(50);
        }
        actNodes = timeRow.getElementsByClassName(ACTIVITY_CLASS);
        if (actNodes.length) {
          expect(actNodes[0].offsetHeight).to.equal(rowHeight - 4); // - topMargin - bottomMargin
        }
      }
    });
  });

  it('Use row layout', function() {
    const idNames = {
      '10': 'Jane',
      '28': 'Joe',
      '29': 'Jack',
    };
    const rowHeights = {
      Jane: 50,
      Joe: 32,
      Jack: 100,
    };
    return this.createGantt(
      createHouseBuildingConfig({
        activitySubRows: 3,
        layoutStrategy: 'tile',
        rowHeight(row) {
          return rowHeights[idNames[row.id]] || 0;
        },
      })
    ).then(function(gantt) {
      let row = getTimeTableRow(gantt, '10'); // Jane
      expect(row.offsetHeight).to.not.equal(50);
      row = getTimeTableRow(gantt, '28'); // Joe
      expect(row.offsetHeight).to.not.equal(rowHeights.Joe);
      row = getTimeTableRow(gantt, '29'); // Jack
      expect(row.offsetHeight).to.not.equal(rowHeights.Jane);
    });
  });
});
