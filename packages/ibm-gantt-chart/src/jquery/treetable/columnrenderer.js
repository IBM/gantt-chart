import Gantt from '../../core/core';

const ColumnRendererPrototype = {
  createShape(activity, parentElt, ctx) {
    return parentElt;
  },

  getText(row) {
    return row.name;
  },

  drawContent(elt, icon, text, object, ctx) {
    // Done through the render method
    /* if (icon) {
            const img = document.createElement('img');
            img.className = 'image-content';
            img.src = icon;
            img.alt = '';
            img.style.float = 'left';
            elt.appendChild(img);
        }

        if (text) {
            elt.appendChild(document.createTextNode(text));
        } */
  },
};
export default ColumnRendererPrototype;
