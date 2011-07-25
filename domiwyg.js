/**
 * DOMIWYG Script: domiwyg.js
 * Based on DOMcraft
 * 
 * @author Christoffer Lindahl <christoffer@kekos.se>
 * @date 2011-07-12
 * @version 1.0
 */

function removeTag(element)
  {
  var first_child = firstChildElement(element), 
    ret = 0;

  if (first_child)
    {
    element.parentNode.insertBefore(first_child.cloneNode(1), element.nextSibling);
    element.parentNode.removeChild(element);
    ret = 1;
    }

  return ret;
  }

var domiwyg = {
  tool_btns: [['Source', 'Visa/dölj källkoden'], ['Link', 'Skapa/ändra länk'], ['Image', 'Infoga bild'], ['Ulist', 'Infoga punktlista'], ['Olist', 'Infoga numrerad lista'], ['Table', 'Infoga tabell']],
  allowed: {a: {href: 0}, blockquote: {}, div: {}, em: {}, h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, h6: {}, img: {alt: 0, src: 0}, li: {}, ol: {}, p: {}, span: {}, strong: {}, ul: {}},
  allowed_global: {'class': 0, id: 0, title: 0},
  lang: {err_format_support1: 'The format command ', err_format_support2: ' was not supported by your browser.', err_number_format: 'You must enter a number.'},

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
    self.nodeInArea = dw.nodeInArea;
    self.format = dw.format;
    self.cmdSource = dw.cmdSource;
    self.cmdLink = dw.cmdLink;
    self.createLink = dw.createLink;
    self.cmdImage = dw.cmdImage;
    self.cmdUlist = dw.cmdUlist;
    self.cmdOlist = dw.cmdOlist;
    self.cmdTable = dw.cmdTable;

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
      c, child, tag_name, attributes, a, 
      attribute_name;

    /* Walk through all elements in domarea */
    for (c = 0; c < children.length; c++)
      {
      child = children[c];
      tag_name = child.tagName.toLowerCase();

      /* Remove disallowed tags */
      if (!(tag_name in dw.allowed))
        {
        if (removeTag(child))
          continue;
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
      var selection = window.getSelection();
      this.caret = { anchorNode: selection.anchorNode, anchorOffset: selection.anchorOffset, 
        focusNode: selection.focusNode, focusOffset: selection.focusOffset };
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

  nodeInArea: function(node)
    {
    while (node.nodeName.toLowerCase() != 'body')
      {
      if (node == this.domarea)
        {
        return 1;
        }

      node = node.parentNode;
      }

    return 0;
    },

  format: function(cmd, arg)
    {
    if (typeof arg == 'undefined')
      arg = null;

    try
      {
      document.execCommand(cmd, false, arg);
      }
    catch (e)
      {
      alert(domiwyg.lang.err_format_support1 + cmd + domiwyg.lang.err_format_support2);
      }

    this.domarea.focus();
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
    boxing.show('<h1>Infoga länk</h1>'
      + '<p>Skriv in adressen dit länken ska leda. Välj även vilket protokoll som ska användas.</p>'
      + '<p><select id="link_protocol">'
      + '    <option value="">samma webbplats</option>'
      + '    <option value="http:">http: (webbsida)</option>'
      + '    <option value="https:">https: (säker sida)</option>'
      + '    <option value="mailto:">mailto: (e-post)</option>'
      + '    <option value="ftp:">ftp: (filöverföring)</option>'
      + '  </select> <input type="text" id="link_url" value="www.example.com" /></p>'
      + '<p>Om du vill ta bort en länk, markera <strong>hela</strong> länken och lämna fältet tomt här ovan.</p>'
      + '<p><button id="btn_create_link" class="hide-boxing">OK</button> <button class="hide-boxing">Avbryt</button></p>', 400, 190);

    var self = this, selected, element, node_name = null, link, colon;

    if (window.getSelection)
      {
      selected = window.getSelection();
      if (self.nodeInArea(selected.focusNode))
        {
        element = selected.focusNode.parentNode;
        node_name = element.nodeName.toLowerCase();
        }
      }
    else if (document.selection)
      {
      selected = document.selection.createRange();
      element = selected.parentElement();
      if (self.nodeInArea(element))
        {
        node_name = element.nodeName.toLowerCase();
        }
      }

    self.storeCursor();
    elem('link_url').focus();

    if (node_name)
      {
      if (node_name == 'a')
        {
        link = element.getAttribute('href');
        if (link.indexOf(':') < 0 || link.indexOf(':') > 6)
          {
          elem('link_protocol').value = '';
          elem('link_url').value = link;
          }
        else
          {
          colon = link.indexOf(':') + 1;
          elem('link_protocol').value = link.substring(0, colon);
          elem('link_url').value = link.substring(colon);
          }
        }
      else
        element = null;

      addEvent(elem('btn_create_link'), 'click', function()
        {
        self.createLink(element);
        });
      }
    else
      {
      boxing.hide();
      }
    },

  createLink: function(element)
    {
    var protocol = elem('link_protocol').value, 
      url = elem('link_url').value;

    this.restoreCursor();

    if (url == '')
      {
      if (element)
        removeTag(element);
      }
    else
      {
      url = url.replace(/^[a-z]{3,6}:(\/\/)?/ig, '');
      if (protocol != 'mailto:' && protocol != '' && url.indexOf('//') != 0)
        url = '//' + url;

      if (element)
        element.setAttribute('href', protocol + url);
      else
        this.format('createlink', protocol + url);
      }
    },

  cmdImage: function()
    {
    },

  cmdUlist: function()
    {
    this.format('insertunorderedlist');
    },

  cmdOlist: function()
    {
    this.format('insertorderedlist');
    },

  cmdTable: function()
    {
    }
  };