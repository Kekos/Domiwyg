/**
 * DOMIWYG Script: domiwyg.js
 * Based on DOMcraft
 * 
 * @author Christoffer Lindahl <christoffer@kekos.se>
 * @date 2011-07-12
 * @version 1.0
 */

var domiwyg = {
  tool_btns: [['Source', 'Visa/dölj källkoden'], ['Link', 'Skapa/ändra länk'], ['Image', 'Infoga bild'], ['Ulist', 'Infoga punktlista'], ['Olist', 'Infoga numrerad lista'], ['Table', 'Infoga tabell']],
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
    self.source_editor = null;
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
    self.cmdSource = dw.cmdSource;

    self.init();
    },

  save: function()
    {
    var self = this;

    if (!hasClass(self.source_editor, 'hidden'))
      self.domarea.innerHTML = self.source_editor.value;

    self.sanitize()
    return self.prettyHtml();
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
      child.removeAttribute('style');
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
      app = self.app, t, 
      tool_btns = domiwyg.tool_btns, tool_html = '';

    for (t = 0; t < tool_btns.length; t++)
      {
      tool_html += '<button class="dwcmd-' + tool_btns[t][0] + '" title="' + tool_btns[t][1] + '">' + tool_btns[t][1] + '</button>';
      }

    app.appendChild(toDOMnode('<div class="domiwyg-toolbar">' + tool_html + '</div>'));
    self.domarea = app.appendChild(toDOMnode('<div class="domiwyg-area" contenteditable="true"></div>'));
    self.source_editor = app.appendChild(toDOMnode('<textarea class="domiwyg-source-editor hidden"></textarea>'));
    self.domarea.innerHTML = self.textarea.value;
    self.sanitize();

    addEvent(app, 'click', self.clicking, self);
    addEvent(app, 'keyup', self.keyStrokes, self);
    },

  clicking: function(e)
    {
    var targ = getTarget(e), 
      cls = targ.className, space;

    if (cls.indexOf('dwcmd-') > -1)
      {
      space = cls.indexOf(' ');
      this['cmd' + cls.substring(6, (space > 0 ? space : undefined))](targ);
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
    },

  cmdSource: function(btn)
    {
    var self = this, domarea = self.domarea, 
      source_editor = self.source_editor;

    if (hasClass(btn, 'active'))
      {
      domarea.innerHTML = source_editor.value;
      self.sanitize();
      removeClass(btn, 'active');
      removeClass(domarea, 'hidden');
      addClass(source_editor, 'hidden');
      }
    else
      {
      source_editor.value = self.prettyHtml();
      addClass(btn, 'active');
      addClass(domarea, 'hidden');
      removeClass(source_editor, 'hidden');
      }
    },

  cmdLink: function()
    {
    },

  cmdImage: function()
    {
    },

  cmdUlist: function()
    {
    },

  cmdOlist: function()
    {
    },

  cmdTable: function()
    {
    }
  };