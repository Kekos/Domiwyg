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
  styles: ['background-attachment', 'background-clip', 'background-color', 'background-image', 'background-origin', 'background-position', 'background-position-x', 'background-position-y', 'background-repeat', 'background-size', 'border-bottom-color', 'border-bottom-style', 'border-bottom-width', 'border-left-color', 'border-left-style', 'border-left-width', 'border-right-color', 'border-right-style', 'border-right-width', 'border-top-color', 'border-top-style', 'border-top-width', 'border-bottom-left-radius', 'border-bottom-right-radius', 'border-top-left-radius', 'border-top-right-radius', 'bottom', 'box-shadow', 'color', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'letter-spacing', 'line-height', 'opacity', 'outline-color', 'outline-style', 'outline-width', 'outline-offset', 'padding-bottom', 'padding-left', 'padding-right', 'padding-top', 'right', 'text-align', 'text-decoration', 'text-indent', 'text-shadow', 'text-transform', 'vertical-align', 'white-space', 'word-spacing', 'word-wrap'],

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
    self.edit = null;
    self.caret = null;
    self.suppress_stop = 0;

    self.save = dw.save;
    self.init = dw.init;
    self.clicking = dw.clicking;
    self.addElement = dw.addElement;
    self.editElement = dw.editElement;
    self.findElement = dw.findElement;
    self.stopEdit = dw.stopEdit;
    self.keyStrokes = dw.keyStrokes;

    self.init();
    },

  save: function()
    {
    return this.domarea.innerHTML;
    },

  init: function()
    {
    var self = this, 
      app = self.app;

    app.appendChild(toDOMnode('<div class="domiwyg-toolbar"></div>'));
    self.edit = app.appendChild(toDOMnode('<textarea class="domiwyg-edit"></textarea>'));
    self.domarea = app.appendChild(toDOMnode('<div class="domiwyg-area"></div>'));
    self.domarea.innerHTML = self.textarea.value;

    addEvent(app, 'click', self.clicking, self);
    addEvent(self.edit, 'blur', self.stopEdit, self);
    addEvent(self.edit, 'keyup', self.keyStrokes, self);
    /*addEvent(self.edit, 'click', function(e)
      {
      this.caret = this.edit.selectionStart;
      }, self);*/
    },

  clicking: function(e)
    {
    var targ = getTarget(e), 
      cls = targ.className;
//elem('debug').innerHTML = cls;
    if (cls.indexOf('domiwyg-edit') < 0)
      {
      if (cls.indexOf('domiwyg-area') < 0 && cls.indexOf('domiwyg-app') < 0)
        this.editElement(targ);
      else
        this.stopEdit();
      }
    },

  addElement: function(node_name)
    {
    var self = this, elm;

    elm = document.createElement(node_name);
    elm.appendChild(document.createTextNode(' '));
    this.cur_elm.parentNode.insertBefore(elm, self.cur_elm.nextSibling);

    self.editElement(elm);
    },

  editElement: function(elm)
    {
    var self = this, edit = self.edit, 
      style = edit.style, 
      styles = domiwyg.styles, 
      computed_styles, s, camel_style, 
      yoffset, xoffset, docelem = document.documentElement, 
      text, selection, selection_edit, start, end;

    if (elm && elm.childNodes.length == 1)
      {
      function camelize(a,b)
        {
        return b.toUpperCase();
        }

      if (self.cur_elm != null)
        self.stopEdit();

      self.cur_elm = elm;
      self.suppress_stop = 1;

      computed_styles = elm.currentStyle || getComputedStyle(elm, null);
      for (s = 0; s < styles.length; s++)
        {
        camel_style = styles[s].replace(/\-([a-z])/g, camelize);

        if (computed_styles.getPropertyValue)
          style[camel_style] = computed_styles.getPropertyValue(styles[s]);
        else if (typeof computed_styles[camel_style] != 'undefined')
          style[camel_style] = computed_styles[camel_style];
        }

      if (style.backgroundColor == 'transparent')
        style.backgroundColor = '#fff';

      if (window.pageXOffset)
        {
        yoffset = pageYOffset;
        xoffset = pageXOffset;
        }
      else
        {
        yoffset = docelem.scrollTop;
        xoffset = docelem.scrollLeft;
        }

      text = elm.textContent || elm.innerText;
      if (text == ' ')
        text = '';

      style.display = 'block';

      if (text != '')
        {
        if (window.getSelection)
          {
          selection = window.getSelection();
          }
        else if (document.selection)
          {
          selection = document.selection.createRange();
          edit.focus();
          start = selection.getBookmark();
          }
        }

      edit.value = text;
      style.top = elm.getBoundingClientRect().top + yoffset - 2 + 'px';
      style.left = elm.getBoundingClientRect().left + xoffset - 1 + 'px';
      style.width = elm.offsetWidth + 5 + 'px';
      style.height = (elm.offsetHeight > 0 ? elm.offsetHeight + 2 : 20) + 'px';

      if (text != '')
        {
        if (window.getSelection)
          {
          start = selection.anchorOffset;
          end = selection.focusOffset;
          edit.selectionStart = self.caret = start;
          edit.selectionEnd = end;
          edit.focus();
          }
        else if (document.selection)
          {
          selection_edit = edit.createTextRange();
          selection_edit.moveToBookmark(start);
          selection_edit.select();
          }
        }

      setTimeout(function()
        {
        self.suppress_stop = 0;
        }, 100);
      }
    },

  findElement: function(elm, func_sibl, func_fl)
    {
    var prev_elm = elm;

    do
      {
      prev_elm = elm;
      elm = func_sibl(elm);
      if (!elm)
        {
        elm = prev_elm.parentNode;
        }
      else if (elm.childNodes.length > 1)
        {
        elm = func_fl(elm);
        }
//console.log('Node: ' + elm.nodeName + '#' + elm.id);
      if (elm.className.indexOf('domiwyg-area') > -1)
        return null;
      }
    while (elm.childNodes && elm.childNodes.length != 1);
//console.log('Found: ' + elm.nodeName + '#' + elm.id);
    return elm;
    },

  stopEdit: function()
    {
    var self = this, 
      edit = self.edit, 
      cur_elm = self.cur_elm;

    if (cur_elm && !self.suppress_stop)
      {
      if (edit.value == '')
        {
        cur_elm.parentNode.removeChild(cur_elm);
        }
      else
        {
        if (cur_elm.textContent)
          cur_elm.textContent = edit.value;
        else
          cur_elm.innerText = edit.value;
        }

      edit.style.display = 'none';
      self.cur_elm = null;
      self.suppress_stop = 0;
      }
    },

  keyStrokes: function(e)
    {
    var key = (e.keyCode ? e.keyCode : e.charCode), 
      self = this, caret_max = self.edit.value.length, 
      current_caret = self.edit.selectionStart;

    if (key == 13)
      {
      self.addElement(self.cur_elm.nodeName);
      returnFalse(e);
      }
    else if (current_caret === self.caret || current_caret === 0 || current_caret == caret_max)
      {
      if (key == 40) // Down
        self.editElement(self.findElement(self.cur_elm, nextNode, firstChildElement));
      else if (key == 38) // Up
        self.editElement(self.findElement(self.cur_elm, previousNode, lastChildElement));
      }
    else
      self.caret = current_caret;
    }
  };