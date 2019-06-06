describe('Activity chart constraints', function() {
  function toCssClass(name) {
    let index;
    while ((index = name.indexOf('.')) >= 0) {
      name = `${name.substring(0, index)}_${name.substring(index + 1)}`;
    }
    return name;
  }

  function consCssClass(cons) {
    return `${toCssClass(cons.from.id || cons.from)}_${toCssClass(cons.to.id || cons.to)}_Class`;
  }

  //
  // ConstraintChecker class
  //

  function Link(gantt, cons, nodes) {
    this.gantt = gantt;
    this.cons = cons;
    this.nodes = nodes;
    this.length = nodes.length;
    const mainVertNode = this.getMainVertNode();
    this.x = Number.parseInt(mainVertNode[0].style.left, 10) + 2; // + 2 because this x is for the constraint-link-ctnr that contains the visible constraint-link with a padding of 2
  }

  Link.prototype.getNode = function(id) {
    return this.gantt.ctsChecker.getNode(id);
  };

  Link.prototype.getFromHorizLink = function() {
    const actNode = this.getNode(this.cons.from);
    const top = actNode.top();
    const bottom = actNode.bottom();
    return this.nodes.filter(function() {
      if (!Gantt.utils.hasClass(this, 'constraint-horiz-link')) {
        return false;
      }
      const thisTop = Number.parseInt(this.style.top, 10);
      return top <= thisTop && thisTop <= bottom;
    });
  };

  Link.prototype.getToHorizLink = function() {
    const actNode = this.getNode(this.cons.to);
    const top = actNode.top();
    const bottom = actNode.bottom();
    return this.nodes.filter(function() {
      if (!Gantt.utils.hasClass(this, 'constraint-horiz-link')) {
        return false;
      }
      const thisTop = Number.parseInt(this.style.top, 10);
      return top <= thisTop && thisTop < bottom - 2;
    });
  };

  Link.prototype.getMainVertNode = function() {
    const fromNode = this.getNode(this.cons.from);
    const toNode = this.getNode(this.cons.to);
    const fromTop = fromNode.top();
    const fromBottom = fromNode.bottom();
    return this.nodes.filter(function() {
      if (!Gantt.utils.hasClass(this, 'constraint-vert-link')) {
        return false;
      }
      const y =
        Number.parseInt(this.style.top, 10) + (fromTop < toNode.top() ? 0 : Number.parseInt(this.offsetHeight, 10));
      return fromTop <= y && y <= fromBottom;
    });
  };

  Link.prototype.check = function() {
    let node = this.getFromHorizLink();
    expect(node.length).to.equal(1);

    node = this.getToHorizLink();
    expect(node.length).to.equal(1);
  };

  function Node(gantt, id) {
    this.gantt = gantt;
    this.node = document.getElementById(`timeTableRow_${id}${id}`);
    const pos = gantt.getTimeTableCoordinates(this.node, { x: 0, y: 0 });
    this.y = pos.y;
    this.x = pos.x;
  }

  Node.prototype.left = function() {
    return this.x;
  };

  Node.prototype.top = function() {
    return this.y;
  };

  Node.prototype.right = function() {
    return this.x + this.node.offsetWidth;
  };

  Node.prototype.bottom = function() {
    return this.y + this.node.offsetHeight;
  };

  function ConstraintChecker(gantt, cts) {
    this.gantt = gantt;
    this.cts = cts;
    this.nodeToLinkMargin = gantt.timeTable.ctsGraph.layout.horizLinkToNodeDist;
    this.linkToLinkMargin = gantt.timeTable.ctsGraph.layout.horizLinkToLinkDist;
    this.horizSwitchSideLinkToNodeDist = gantt.timeTable.ctsGraph.layout.horizSwitchSideLinkToNodeDist;
  }

  ConstraintChecker.prototype.getGrapherNode = function() {
    return $(this.gantt.node).find('.constraints-grapher');
  };

  ConstraintChecker.prototype.checkConstraints = function() {
    if (this.cts) {
      let totalCount = 0;
      for (var i = 0, count = this.cts.length; i < count; i++) {
        totalCount += this.checkConstraint(this.cts[i]);
      }
      expect(this.getGrapherNode().children().length).to.equal(totalCount);
    }
  };

  ConstraintChecker.prototype.checkConstraint = function(cons) {
    const link = this.getLink(cons);
    if (cons.type === Gantt.constraintTypes.START_TO_END || cons.type === Gantt.constraintTypes.END_TO_START) {
      expect(link.length).to.equal(6);
    } else {
      expect(link.length).to.equal(4);
    }
    link.check();
    return link.length;
  };

  ConstraintChecker.prototype.getLink = function(cons) {
    if ($.isNumeric(cons)) {
      cons = this.cts[cons];
    }
    const selector = `.${consCssClass(cons)}`;
    return new Link(this.gantt, cons, this.getGrapherNode().find(selector));
  };

  ConstraintChecker.prototype.getNode = function(id) {
    return new Node(this.gantt, id);
  };

  ConstraintChecker.prototype.checkBetween = function(value, minValue, maxValue) {
    expect(value >= minValue).to.be.true;
    expect(value <= maxValue).to.be.true;
  };

  function createProjectActivityConstraintGantt(test, cts) {
    const config = createProjectActivityChartConfig({
      success: {
        constraints(allCts) {
          return cts || allCts;
        },
      },
    });
    config.constraints = {
      renderer: {
        css: consCssClass,
      },
    };
    return test.createGantt(config).then(function(gantt) {
      gantt.ctsChecker = new ConstraintChecker(gantt, cts);
      gantt.ctsChecker.checkConstraints();
      return gantt.ctsChecker;
    });
  }

  it('Simple right constraint', function() {
    return createProjectActivityConstraintGantt(this, [
      {
        from: 'A-1',
        to: 'A-2',
        type: Gantt.constraintTypes.END_TO_START,
      },
    ]).then(function(ctsChecker) {
      const node = ctsChecker.getNode('A-1.3');
      expect(ctsChecker.getLink(0).x).to.equal(node.right() + ctsChecker.nodeToLinkMargin);
    });
  });

  it('Right constraint over second right constraint', function() {
    return createProjectActivityConstraintGantt(this, [
      { from: 'A-1', to: 'A-2', type: Gantt.constraintTypes.END_TO_START },
      { from: 'A-1.1.2', to: 'A-1.3', type: Gantt.constraintTypes.END_TO_END },
    ]).then(function(ctsChecker) {
      expect(ctsChecker.getLink(0).x).to.equal(ctsChecker.getLink(1).x + ctsChecker.linkToLinkMargin);
    });
  });

  it('Group of right constraint over second right constraint', function() {
    return createProjectActivityConstraintGantt(this, [
      { from: 'A-1', to: 'A-2', type: Gantt.constraintTypes.END_TO_START },
      { from: 'A-1.1', to: 'A-2', type: Gantt.constraintTypes.END_TO_START },
      { from: 'A-1.1.2', to: 'A-1.3', type: Gantt.constraintTypes.END_TO_END },
    ]).then(function(ctsChecker) {
      expect(ctsChecker.getLink(0).x).to.equal(ctsChecker.getLink(1).x);
      expect(ctsChecker.getLink(0).x).to.equal(ctsChecker.getLink(2).x + ctsChecker.linkToLinkMargin);
    });
  });

  it('Start to start constraint', function() {
    return createProjectActivityConstraintGantt(this, [
      { from: 'A-1', to: 'A-2', type: Gantt.constraintTypes.START_TO_START },
    ]).then(function(ctsChecker) {
      expect(ctsChecker.getLink(0).x).to.equal(ctsChecker.getNode('A-1').x - ctsChecker.nodeToLinkMargin);
    });
  });

  it('Start to start over other start constraint', function() {
    return createProjectActivityConstraintGantt(this, [
      { from: 'A-1', to: 'A-2', type: Gantt.constraintTypes.START_TO_START },
      { from: 'A-1.1.1', to: 'A-3', type: Gantt.constraintTypes.START_TO_START },
    ]).then(function(ctsChecker) {
      expect(ctsChecker.getLink(0).x).to.equal(ctsChecker.getLink(1).x - ctsChecker.linkToLinkMargin);
    });
  });

  it('Start to start group over other start constraint', function() {
    return createProjectActivityConstraintGantt(this, [
      { from: 'A-1', to: 'A-2', type: Gantt.constraintTypes.START_TO_START },
      { from: 'A-1.1', to: 'A-2', type: Gantt.constraintTypes.START_TO_START },
      { from: 'A-1.1.2', to: 'A-1.3', type: Gantt.constraintTypes.START_TO_START },
    ]).then(function(ctsChecker) {
      if (ctsChecker.getLink(2).x < ctsChecker.getNode('A-1').x) {
        // Depends on the time scale
        expect(ctsChecker.getLink(0).x).to.equal(ctsChecker.getLink(2).x - ctsChecker.linkToLinkMargin);
      } else {
        expect(ctsChecker.getLink(0).x).to.equal(Math.min(ctsChecker.getNode('A-1').x) - ctsChecker.nodeToLinkMargin);
      }
    });
  });

  it('Start complex', function() {
    return createProjectActivityConstraintGantt(this, [
      { from: 'A-1', to: 'A-2', type: Gantt.constraintTypes.START_TO_START },
      { from: 'A-1.1', to: 'A-2', type: Gantt.constraintTypes.START_TO_START },
      { from: 'A-1.1.1', to: 'A-2', type: Gantt.constraintTypes.START_TO_END },
      { from: 'A-1.2', to: 'A-1.1', type: Gantt.constraintTypes.START_TO_END },
    ]).then(function(ctsChecker) {
      expect(ctsChecker.getLink(0).x).to.equal(ctsChecker.getLink(3).x - ctsChecker.linkToLinkMargin);
      expect(ctsChecker.getLink(3).x).to.equal(ctsChecker.getLink(2).x - ctsChecker.linkToLinkMargin);
    });
  });

  it('All projects sample', function() {
    return createProjectActivityConstraintGantt(this).then(function(ctsChecker) {});
  });
});
