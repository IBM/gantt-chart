const LOAD_RESOURCE_BAR_CLASS = 'load-resource-bar';
export const RESOURCE_LOAD_CLASS = 'resource-load';

export class Block {
  constructor(start, end, prev, next) {
    this.start = start;
    this.end = end;
    this.prev = prev;
    this.next = next;
    this.resNodes = [];
  }

  addResource(resNode) {
    this.resNodes.push(resNode);
  }

  insertBefore(start, end, resNode) {
    const block = new Block(start, end, this.prev, this);
    this.prev.next = block; // Always a previous as firstBlock initialized with a minimal date.
    this.prev = block;
    if (resNode) block.addResource(resNode);
    return block;
  }

  insertAfter(start, end, resNode) {
    if (this.next) {
      return this.next.insert(start, end, resNode);
    }
    const block = new Block(start, end, this, null);
    this.next = block;
    if (resNode) block.addResource(resNode);
    return block;
  }

  insert(start, end, resNode) {
    let block;
    if (start >= this.end) {
      return this.insertAfter(start, end, resNode);
    }
    if (start < this.start) {
      this.insertBefore(start, Math.min(this.start, end), resNode);
      if (end <= this.start) return undefined;
      start = this.start;
    }
    if (start > this.start) {
      this.insertBefore(this.start, start).resNodes = [].concat(this.resNodes);
      this.start = start;
    }
    if (end < this.end) {
      block = this.insertBefore(this.start, end);
      block.resNodes = this.resNodes.concat([resNode]);
      this.start = end;
      return block;
    }

    this.resNodes.push(resNode);

    if (end > this.end) {
      return this.insertAfter(this.end, end, resNode);
    }
    return this;
  }

  computeMax(useMaxLoad) {
    let max = 0;
    const usedRes = [];
    this.resNodes.forEach(node => {
      if (useMaxLoad) {
        if (usedRes.indexOf(node.resource) < 0) {
          usedRes.push(node.resource);
          max += node.maxLoad;
        }
      } else max += node.load;
    });
    this.max = max;
    return Math.max(max, this.next ? this.next.computeMax(useMaxLoad) : 0);
  }

  createVisItem(ctx) {
    // max, verticalPercentage, renderer
    if (!this.resNodes.length) return null;
    let tpl =
      '<div style="display: flex; flex-direction: column-reverse; height: 100%" class="' +
      LOAD_RESOURCE_BAR_CLASS +
      '">';
    let closing = '</div>';
    let max = ctx.max;
    let height = ctx.plotAreaHeight;
    // Only true if one resource selected => this.resNodes is always of size 1
    if (ctx.useMaxLoad && this.max) {
      tpl +=
        '<div style="display: flex; flex-direction: column-reverse; height: ' +
        Math.round((height = (height * this.max) / max)) +
        'px;" class="max-load">';
      max = this.max; // activities height are now proportional to their max load container height
      closing = '</div>' + closing;
    }
    for (let i = 0, res; i < this.resNodes.length; i++) {
      res = this.resNodes[i];
      tpl +=
        '<div style="background-color: ' +
        ctx.chartRenderer.background(res.resource, res.activity) +
        '; height: ' +
        Math.round((height * res.load) / max) +
        'px;" data-res-name="' +
        res.resource.name +
        '" data-act-name="' +
        (res.activity.name || '') +
        '" data-res-load="' +
        res.load +
        '"' +
        (res.maxLoad ? ' data-max-load="' + res.maxLoad + '"' : '') +
        ' class="' +
        RESOURCE_LOAD_CLASS +
        '"></div>';
    }
    tpl += closing;
    return {
      start: this.start,
      end: this.end,
      type: 'background',
      content: tpl,
    };
  }

  toString() {
    let s;
    if (this.start) {
      s =
        '[ start: ' +
        new Date(this.start).toLocaleDateString() +
        ' - end: ' +
        new Date(this.end).toLocaleDateString() +
        '(';
      s += this.resNodes.join(', ');
      s += ')]';
    } else {
      s = '';
    }
    return s + (this.next ? '\n     ' + this.next.toString() : '');
  }
}
