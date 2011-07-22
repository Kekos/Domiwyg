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
  allowed: {a: {href: 0}, blockquote: {}, div: {}, em: {}, h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, h6: {}, img: {alt: 0, src: 0}, li: {}, ol: {}, p: {}, span: {}, strong: {}, ul: {}},
  allowed_global: {'class': 0, id: 0, title: 0},

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
    self.caret = null;

    self.save = dw.save;
    self.sanitize = dw.sanitize;
    self.prettyHtml = dw.prettyHtml;
    self.init = dw.init;
    self.clicking = dw.clicking;
    self.addElement = dw.addElement;
    self.keyStrokes = dw.keyStrokes;
    self.storeCursor = dw.storeCursor;
    self.restoreCursor = dw.restoreCursor;

    self.init();
    },

  save: function()
    {
    this.sanitize()
    return this.prettyHtml();
    },

  sanitize: function()
    {
    var dw = domiwyg, 
      children = this.domarea.getElementsByTagName('*'), 
      c, child, tag_name, first_child, attributes, a, 
      attribute_name;

    /* Walk through all elements in domarea */
    for (c = 0; c < children.length; c++)
      {
      child = children[c];
      tag_name = child.tagName.toLowerCase();

      /* Remove disallowed tags */
      if (!(tag_name in dw.allowed))
        {
        first_child = firstChildElement(child);
        if (first_child)
          {
          child.parentNode.insertBefore(first_child.cloneNode(1), child.nextSibling);
          child.parentNode.removeChild(child);
          continue;
          }
        }
      /* Remove empty tags */
      else if (tag_name != 'img' && !child.childNodes.length)
        {
        child.parentNode.removeChild(child);
        }

      /* Remove disallowed attributes */
      attributes = child.attributes;
      for (a = 0; a < attributes.length; a++)
        {
        attribute_name = attributes[a].name;
        if (!(attribute_name in dw.allowed[tag_name]) && !(attribute_name in dw.allowed_global))
          {
          child.removeAttribute(attribute_name);
          }
        }
      }
    },

  prettyHtml: function(e)
    {
    var html = this.domarea.innerHTML.replace(/<\/?(\w+)((?:[^'">]*|'[^']*'|"[^"]*")*)>/g,
      function(tag_body, tag_name, tag_attr)
        {
        tag_attr = tag_attr.replace(/(\w+)(=+)(\w+)/g, '$1$2"$3"'); // Insert " around attribute values where missing
        tag_name = tag_name.toLowerCase();
        var closing_tag = (tag_body.match(/^<\//));
        if (closing_tag)
          tag_body = '</' + tag_name + '>';
        else
          tag_body = '<' + tag_name + tag_attr + '>';
        return tag_body;
        });

    return html.replace(/<img([^>]*)>/ig, '<img$1 />');
    },

  init: function()
    {
    var self = this, 
      app = self.app;

    app.appendChild(toDOMnode('<div class="domiwyg-toolbar"></div>'));
    self.domarea = app.appendChild(toDOMnode('<div class="domiwyg-area" contenteditable="true"></div>'));
    self.domarea.innerHTML = self.textarea.value;

    addEvent(app, 'click', self.clicking, self);
    addEvent(app, 'keyup', self.keyStrokes, self);
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

    if (e.ctrlKey && key == 86)
      {
      self.storeCursor();
      setTimeout(function()
        {
        self.sanitize();
        self.restoreCursor();
        }, 100);
      }
    /*else if (key == 40) // Down
      self.editElement(self.findElement(self.cur_elm, nextNode, firstChildElement));
    else if (key == 38) // Up
      self.editElement(self.findElement(self.cur_elm, previousNode, lastChildElement));*/
    },

  storeCursor: function()
    {
    if (window.getSelection)
      {
      this.caret = window.getSelection();
      }
    else if (document.selection)
      {
      this.caret = document.selection.createRange().getBookmark();
      }
    },

  restoreCursor: function()
    {
    var range, self = this, 
      caret = self.caret;

    if (window.getSelection)
      {
      range = document.createRange();
      range.setStart(caret.anchorNode, caret.anchorOffset);
      range.setEnd(caret.focusNode, caret.focusOffset);
      window.getSelection().addRange(range);
      }
    else if (document.selection)
      {
      range = document.selection.createRange();
      range.moveToBookmark(caret);
      range.select();
      }

    self.caret = null;
    }
  };