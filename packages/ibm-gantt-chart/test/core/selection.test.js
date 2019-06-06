describe('Selection', function() {
  it('Test selection in table', function() {
    const memModel = createResourceWidthActivitiesData();
    return this.createGantt({ data: memModel }).then(function(gantt) {
      const test = new GanttTest(gantt);
      test.clickRow(1, true);
      expect(test.isRowSelected(1)).to.be.true;
      test.clickRow(2);
      expect(test.isRowSelected(1)).to.be.false;
      expect(test.isRowSelected(2)).to.be.true;
      test.clickRow(3, true);
      expect(test.isRowSelected(2)).to.be.true;
      expect(test.isRowSelected(3)).to.be.true;
      test.clickRow(5);
      expect(test.isRowSelected(2)).to.be.false;
      expect(test.isRowSelected(3)).to.be.false;
      expect(test.isRowSelected(5)).to.be.true;
    });
  });

  it('Test selection mutually exclusive between table and time table', function() {
    const memModel = createResourceWidthActivitiesData({
      getActivityCount(id, rowNum) {
        // Fix number of activities per resources
        return 3;
      },
    });
    const eventsCtrl = {
      events: [],

      selectActivities(activities, activity) {
        console.log('    -> selectActivities');
        this.events.push({ event: 'selectActivities', activity, activities: activities.slice(0) });
      },

      unselectActivities(activities) {
        console.log('    -> unselectActivities');
        this.events.push({ event: 'unselectActivities', activities: activities.slice(0) });
      },

      activitySelectionChanged(activities, activity) {
        console.log('    -> activitySelectionChanged');
        this.events.push({ event: 'activitySelectionChanged', activity, activities: activities.slice(0) });
      },

      selectRows(rows, row) {
        console.log('    -> selectRows');
        this.events.push({ event: 'selectRows', row, rows: rows.slice(0) });
      },

      unselectRows(rows, row) {
        console.log('    -> unselectRows');
        this.events.push({ event: 'unselectRows', row, rows: rows.slice(0) });
      },

      rowSelectionChanged(rows, row) {
        console.log('    -> rowSelectionChanged');
        this.events.push({ event: 'rowSelectionChanged', row, rows: rows.slice(0) });
      },

      clearEvents() {
        this.events = [];
      },

      checkEvents(events) {
        let index;
        let j = events.length - 1;
        for (var i = this.events.length - 1, thisEvent, paramEvent; i >= 0 && j >= 0; i--, j--) {
          this.checkSameEvents(this.events[i], events[j]);
        }
        expect(j === -1).to.be.true;
      },

      checkSameEvents(e1, e2) {
        expect(e1.event).to.equal(e2.event);
        if (e2.activity) {
          expect(e1.activity).to.equal(e2.activity);
        } else if (e2.row) {
          expect(e1.row).to.equal(e2.row);
        }

        if (e2.rows) {
          this.checkSameArrays(e2.rows, e1.rows);
        } else if (e2.activities) {
          this.checkSameArrays(e2.activities, e1.activities);
        }
      },

      checkSameArrays(a1, a2) {
        expect(a1.length).to.equal(a2.length);
        for (let i = 0; i < a1.length; i++) {
          expect(a1[i]).to.equal(a2[i]);
        }
      },
    };
    return this.createGantt({ data: memModel, selection: eventsCtrl }).then(function(gantt) {
      const test = new GanttTest(gantt);

      console.log('click row');
      test.clickRow(1, true);
      expect(test.isRowSelected(1)).to.be.true;
      eventsCtrl.checkEvents([
        { event: 'selectRows', rows: [test.getRow(1)] },
        { event: 'rowSelectionChanged', rows: [test.getRow(1)] },
      ]);

      console.log('click activity');
      test.clickActivity(0, 2);
      eventsCtrl.checkEvents([
        { event: 'rowSelectionChanged', rows: [] },
        { event: 'selectActivities', activities: [test.gantt.getActivity(0, 2)] },
        { event: 'activitySelectionChanged', activities: [test.gantt.getActivity(0, 2)] },
      ]);
      expect(test.isRowSelected(1)).to.be.false;
      expect(test.isActivitySelected(0, 2)).to.be.true;

      console.log('click another activity');
      test.clickActivity(1, 2);
      expect(test.isRowSelected(1)).to.be.false;
      expect(test.isActivitySelected(0, 2)).to.be.false;
      expect(test.isActivitySelected(1, 2)).to.be.true;
      eventsCtrl.checkEvents([
        { event: 'selectActivities', activities: [test.gantt.getActivity(1, 2)] },
        { event: 'activitySelectionChanged', activities: [test.gantt.getActivity(1, 2)] },
      ]);

      console.log('click row');
      test.clickRow(2);
      expect(test.isActivitySelected(1, 2)).to.be.false;
      expect(test.isRowSelected(2)).to.be.true;
      eventsCtrl.checkEvents([
        { event: 'activitySelectionChanged', activities: [] },
        { event: 'selectRows', rows: [test.getRow(2)] },
        { event: 'rowSelectionChanged', rows: [test.getRow(2)] },
      ]);

      console.log('click activity');
      test.clickActivity(0, 3);
      expect(test.isRowSelected(2)).to.be.false;
      expect(test.isActivitySelected(0, 3)).to.be.true;
      eventsCtrl.checkEvents([
        { event: 'rowSelectionChanged', rows: [] },
        { event: 'selectActivities', activities: [test.getActivity(0, 3)] },
        { event: 'activitySelectionChanged', activities: [test.getActivity(0, 3)] },
      ]);

      test.clickActivity(1, 3, true);
      expect(test.isActivitySelected(0, 3)).to.be.true;
      expect(test.isActivitySelected(1, 3)).to.be.true;

      test.clickActivity(0, 4);
      expect(test.isActivitySelected(1, 3)).to.be.false;
      expect(test.isActivitySelected(0, 4)).to.be.true;
    });
  });

  it('Test Double click', function() {
    const memModel = createResourceWidthActivitiesData();
    const dblClickListener = {
      lastDoubleClicked: null,
      activityDoubleClicked(e, act, date, row) {
        this.lastDoubleClicked = act;
        console.log(`Double click activity ${act}`);
      },

      rowDoubleClicked(row) {
        this.lastDoubleClicked = row;
        console.log(`Double click row ${act}`);
      },
    };
    return this.createGantt({ data: memModel, timeTable: { interactor: { click: dblClickListener } } }).then(function(
      gantt
    ) {
      const test = new GanttTest(gantt);
      test.doubleClickActivity(0, 4);
      expect(dblClickListener.lastDoubleClicked).to.equal(test.getActivity(0, 4));
    });
  });
});
