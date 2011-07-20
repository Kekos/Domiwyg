/**
 * DOMIWYG Script: domiwyg.js
 * Based on DOMcraft
 * 
 * @author Christoffer Lindahl <christoffer@kekos.se>
 * @date 2011-07-12
 * @version 1.0
 */

function toRange(sel)
  {
  if (sel.getRangeAt)
    return sel.getRangeAt(0);
  else if (document.selection)
    return sel.createRange();
  else
    {
    var range = document.createRange();
    range.setStart(sel.anchorNode, sel.anchorOffset);
    range.setEnd(sel.focusNode, sel.focusOffset);
    return range;
    }
  }

var domiwyg = {
  //styles: ['background-attachment', 'background-clip', 'background-color', 'background-image', 'background-origin', 'background-position', 'background-position-x', 'background-position-y', 'background-repeat', 'background-size', 'border-bottom-color', 'border-bottom-style', 'border-bottom-width', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right-color', 'border-right-style', 'border-right-width', 'border-top-color', 'border-top-style', 'border-top-width', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-top-left-radius', 'border-top-right-radius', 'bottom', 'box-shadow', 'color', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'letter-spacing', 'line-height', 'opacity', 'outline-color', 'outline-style', 'outline-width', 'outline-offset', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'right', 'text-align', 'text-decoration', 'text-indent', 'text-shadow', 'text-transform', 'vertical-align', 'white-space', 'word-spacing', 'word-wrap'],
  allowed: {a: 1, blockquote: 1, div: 1, em: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, img: 1, li: 1, ol: 1, p: 1, span: 1, strong: 1, ul: 1},

  find: function()
    {
    var textareas = document.getElementsByTagName('textarea'), 
      t, textarea, app;

    for (t = 0; t < textareas.length; t++)
      {
      textarea = textareas[t];
      if (textarea.className.indexOf('use-domiwyg') > -1)
        {
        app = textarea.parentNode.insertBefore(toDOMnode('<div id="domiwyg_' + 
          textarea.id + '" class="domiwyg-app"></div>'), textarea);

        textarea.domiwyg = new domiwyg.area(textarea, app);
        textarea.className = textarea.className.replace(/\buse-domiwyg\b/, 'has-domiwyg');
        }
      }
    },

  area: function(textarea, app)
    {
    var dw = domiwyg,
      self = this;

    self.textarea = textarea;
    self.app = app;
    self.domarea = null;
    self.cur_elm = null;

    self.save = dw.save;
    self.sanitize = dw.sanitize;
    self.init = dw.init;
    self.clicking = dw.clicking;
    self.addElement = dw.addElement;
    self.keyStrokes = dw.keyStrokes;

    self.init();
    },

  save: function()
    {
    this.sanitize();
    return this.domarea.innerHTML;
    },

  sanitize: function()
    {
    var children = this.domarea.getElementsByTagName('*'), 
      c, child, first_child;

    for (c = 0; c < children.length; c++)
      {
      if (children[c].tagName.toLowerCase() in domiwyg.allowed)
        {
        }
      else
        {
        first_child = firstChildElement(children[c]);
        if (first_child)
          {
          children[c].parentNode.appendChild(first_child.cloneNode(1));
          children[c].removeNode(first_child);
          }
        }
      }
    },

  init: function()
    {
    var self = this, 
      app = self.app;

    app.appendChild(toDOMnode('<div class="domiwyg-toolbar"></div>'));
    self.edit = app.appendChild(toDOMnode('<textarea class="domiwyg-edit"></textarea>'));
    self.domarea = app.appendChild(toDOMnode('<div class="domiwyg-area" contenteditable="true"></div>'));
    self.domarea.innerHTML = self.textarea.value;

    addEvent(app, 'click', self.clicking, self);
    addEvent(self.edit, 'keyup', self.keyStrokes, self);
    },

  clicking: function(e)
    {
    var targ = getTarget(e), 
      cls = targ.className;
//elem('debug').innerHTML = cls;
    if (cls.indexOf('domiwyg-edit') < 0)
      {
      /*if (cls.indexOf('domiwyg-area') < 0 && cls.indexOf('domiwyg-app') < 0)
        this.editElement(targ);
      else
        this.stopEdit();*/
      }
    },

  addElement: function(node_name)
    {
    var self = this, elm;

    elm = document.createElement(node_name);
    elm.appendChild(document.createTextNode(' '));
    this.cur_elm.parentNode.insertBefore(elm, self.cur_elm.nextSibling);
    },

  keyStrokes: function(e)
    {
    var key = (e.keyCode ? e.keyCode : e.charCode), 
      self = this;

    if (key == 13)
      {
      self.addElement(self.cur_elm.nodeName);
      returnFalse(e);
      }
    /*else if (key == 40) // Down
      self.editElement(self.findElement(self.cur_elm, nextNode, firstChildElement));
    else if (key == 38) // Up
      self.editElement(self.findElement(self.cur_elm, previousNode, lastChildElement));*/
    }
  };