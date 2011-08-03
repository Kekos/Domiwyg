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
  var fragment = document.createDocumentFragment();

  while (element.firstChild)
    {
    fragment.appendChild(element.firstChild);
    }

  element.parentNode.insertBefore(fragment, element);
  element.parentNode.removeChild(element);
  }

function canHaveBlockElement(element)
  {
  var blocks = {blockquote: 0, div: 0, form: 0, td: 0};
  return (element.tagName.toLowerCase() in blocks);
  }

var domiwyg = {
  tool_btns: [['Source', 'Toggle source editing'], ['Link', 'Create/edit link'], ['Image', 'Insert image'], ['Ulist', 'Insert unordered list'], ['Olist', 'Insert ordered list'], ['Table', 'Insert table']],
  styles: [['<p></p>', 1, 'Paragraph'], ['<h1></h1>', 1, 'Header 1'], ['<h2></h2>', 1, 'Header 2'], ['<h3></h3>', 1, 'Header 3'], ['<h4></h4>', 1, 'Header 4'], ['<h5></h5>', 1, 'Header 5'], 
    ['<h6></h6>', 1, 'Header 6'], ['<blockquote></blockquote>', 1, 'Blockquote']],
  allowed: {a: {href: 0}, blockquote: {}, div: {}, em: {}, h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, h6: {}, img: {alt: 0, src: 0}, li: {}, ol: {}, p: {}, span: {}, strong: {}, table: {}, tr: {}, td: {}, ul: {}},
  allowed_global: {'class': 0, id: 0, title: 0},
  lang: {err_format_support1: 'The format command ', err_format_support2: ' was not supported by your browser.', err_number_format: 'You must enter a number.', 
    no_elem_active: '(no element selected)', tag_a: 'Link', tag_blockquote: 'Blockquote', tag_div: 'Container', tag_em: 'Emphasized', tag_h1: 'Header 1', tag_h2: 'Header 2', 
    tag_h3: 'Header 3', tag_h4: 'Header 4', tag_h5: 'Header 5', tag_h6: 'Header 6', tag_img: 'Image', tag_li: 'List element', tag_ol: 'Ordered list', tag_p: 'Paragraph', 
    tag_span: 'Span', tag_strong: 'Strong', tag_table: 'Table', tag_tr: 'Table row', tag_td: 'Table cell', tag_ul: 'Unordered list', cssclass: 'Class'},

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
    self.domcrumbs = null;
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
    self.updateDomCrumbs = dw.updateDomCrumbs;
    self.addStylingElement = dw.addStylingElement;
    self.keyStrokes = dw.keyStrokes;
    self.storeCursor = dw.storeCursor;
    self.restoreCursor = dw.restoreCursor;
    self.nodeInArea = dw.nodeInArea;
    self.getSelectedAreaElement = dw.getSelectedAreaElement;
    self.getFirstContainer = dw.getFirstContainer;
    self.format = dw.format;
    self.cmdSource = dw.cmdSource;
    self.cmdLink = dw.cmdLink;
    self.createLink = dw.createLink;
    self.cmdImage = dw.cmdImage;
    self.insertImage = dw.insertImage;
    self.cmdUlist = dw.cmdUlist;
    self.cmdOlist = dw.cmdOlist;
    self.cmdTable = dw.cmdTable;
    self.insertTable = dw.insertTable;

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
        removeTag(child);
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
      app = self.app, domarea, t, 
      tool_btns = domiwyg.tool_btns, 
      tool_styles = domiwyg.styles, 
      tool_html = '<select class="domiwyg-styles-list"><option value="-1">-- Välj en stil --</option>', 
      toolbar;

    for (t = 0; t < tool_styles.length; t++)
      {
      tool_html += '<option value="' + t + '">' + tool_styles[t][2] + '</option>';
      }

    tool_html += '</select>';

    for (t = 0; t < tool_btns.length; t++)
      {
      tool_html += '<button class="dwcmd-' + tool_btns[t][0] + '" title="' + tool_btns[t][1] + '">' + tool_btns[t][1] + '</button>';
      }

    toolbar = app.appendChild(toDOMnode('<div class="domiwyg-toolbar">' + tool_html + '</div>'));
    self.domcrumbs = app.appendChild(toDOMnode('<div class="domiwyg-dom-crumbs">&nbsp;</div>'));
    domarea = self.domarea = app.appendChild(toDOMnode('<div class="domiwyg-area" contenteditable="true"></div>'));
    self.source_editor = app.appendChild(toDOMnode('<textarea class="domiwyg-source-editor hidden"></textarea>'));

    domarea.innerHTML = self.textarea.value;
    self.sanitize();

    addEvent(app, 'click', self.clicking, self);
    addEvent(app, 'keyup', self.keyStrokes, self);
    addEvent(domarea, 'click', self.updateDomCrumbs, self);
    addEvent(domarea, 'focus', function() { addClass(app, 'focus'); });
    addEvent(domarea, 'blur', function() { removeClass(app, 'focus'); });
    addEvent(domarea, 'keyup', self.updateDomCrumbs, self);
    addEvent(toolbar.getElementsByTagName('select')[0], 'change', self.addStylingElement, self);
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

    addClass(this.app, 'focus');
    },

  updateDomCrumbs: function(e)
    {
    var self = this, 
      element = getTarget(e), 
      crumbs = [], lang_name, text, 
      lang = domiwyg.lang, cls, id;

    if (e.keyCode)
      {
      element = self.getSelectedAreaElement();
      }

    if (self.cur_elm != element)
      {
      self.cur_elm = element;

      while (!hasClass(element, 'domiwyg-area'))
        {
        text = element.tagName.toLowerCase();
        lang_name = 'tag_' + text;
        if (lang_name in lang)
          text = lang[lang_name];

        cls = (element.className ? lang.cssclass + ': ' + element.className + ' ' : '');
        id = (element.id ? 'ID: ' + element.id : '');
        crumbs.push('<span' + (cls || id ? ' title="' + cls + id + '"' : '') + '>' + text + '</span>');

        element = element.parentNode;
        }

      crumbs.reverse();
      crumbs = crumbs.join(' &gt; ');
      self.domcrumbs.innerHTML = (crumbs || lang.no_elem_active);
      }
    },

  addStylingElement: function(e)
    {
    var self = this, 
      list = getTarget(e), 
      style = domiwyg.styles[list.value] || null, 
      range, fragment, 
      new_elem, ref_elem;

    if (style)
      {
      if (window.getSelection)
        {
        range = window.getSelection().getRangeAt(0);
        fragment = range.extractContents() || document.createDocumentFragment();
        new_elem = toDOMnode(style[0]);
        new_elem.appendChild(fragment);

        /* If the style is a block element */
        if (style[1])
          {
          ref_elem = range.startContainer;
          if (hasClass(ref_elem, 'domiwyg-area'))
            {
            range.insertNode(new_elem);
            }
          else
            {
            ref_elem = self.getFirstContainer(ref_elem);
            ref_elem.container.insertBefore(new_elem, ref_elem.reference);
            }
          }
        else
          {
          range.insertNode(new_elem);
          }
        }
      else if (document.selection)
        {
        range = document.selection.createRange();
        new_elem = toDOMnode(style[0]);

        /* First see if the returned range is a TextRange */
        if (range.htmlText)
          {
          new_elem.appendChild(toDOMnode(range.htmlText));

          /* If the style is a block element */
          if (style[1])
            {
            ref_elem = self.getFirstContainer(range.parentElement());
            ref_elem.container.insertBefore(new_elem, ref_elem.reference);
            range.pasteHTML('');
            }
          else
            {
            range.pasteHTML(new_elem.innerHTML);
            }
          }
        else // controlRange
          {
          ref_elem = range(0);
          new_elem.appendChild(ref_elem.cloneNode(1));

          ref_elem.parentNode.insertBefore(new_elem, ref_elem);
          ref_elem.parentNode.removeChild(ref_elem);
          }
        }
      }

    list.value = -1;
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

  getSelectedAreaElement: function()
    {
    var selection, element = null;

    if (window.getSelection)
      {
      selection = window.getSelection();
      if (this.nodeInArea(selection.focusNode))
        {
        element = selection.focusNode.parentNode;
        }
      }
    else if (document.selection)
      {
      selection = document.selection.createRange();
      element = selection.parentElement();
      if (!this.nodeInArea(element))
        {
        element = null;
        }
      }

    return element;
    },

  getFirstContainer: function(element)
    {
    var container = element;
    element = {container: element, reference: null};

    while (1)
      {
      if (container.nodeType == 1 && canHaveBlockElement(container))
        break;

      element.reference = element.container;
      container = element.container = container.parentNode;
      }

    return element;
    },

  format: function(cmd, arg)
    {
    if (typeof arg == 'undefined')
      arg = null;

    try
      {
      document.execCommand(cmd, 0, arg);
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
      /* Turn off source editing */
      domarea.innerHTML = source_editor.value;
      self.sanitize();
      removeClass(btn, 'active');
      removeClass(domarea, 'hidden');
      addClass(source_editor, 'hidden');
      domarea.focus();
      }
    else
      {
      /* Turn on source editing */
      source_editor.value = self.prettyHtml();
      addClass(btn, 'active');
      addClass(domarea, 'hidden');
      removeClass(source_editor, 'hidden');
      source_editor.focus();
      }
    },

  cmdLink: function()
    {
    var self = this, 
      element = self.getSelectedAreaElement(), 
      node_name = null, link, colon;

    if (element)
      {
      node_name = element.nodeName.toLowerCase();
      self.storeCursor();

      boxing.show('<h1>Infoga länk</h1>'
        + '<p>Skriv in adressen dit länken ska leda. Välj även vilket protokoll som ska användas.</p>'
        + '<p><select id="dw_link_protocol">'
        + '    <option value="">samma webbplats</option>'
        + '    <option value="http:">http: (webbsida)</option>'
        + '    <option value="https:">https: (säker sida)</option>'
        + '    <option value="mailto:">mailto: (e-post)</option>'
        + '    <option value= "ftp:">ftp: (filöverföring)</option>'
        + '  </select> <input type="text" id="dw_link_url" value="www.example.com" /></p>'
        + '<p>Om du vill ta bort en länk, markera <strong>hela</strong> länken och lämna fältet tomt här ovan.</p>'
        + '<p><button id="btn_create_link" class="hide-boxing">OK</button> <button class="hide-boxing">Avbryt</button></p>', 400, 190);
      elem('dw_link_url').focus();

      if (node_name)
        {
        if (node_name == 'a')
          {
          link = element.getAttribute('href');
          if (link.indexOf(':') < 0 || link.indexOf(':') > 6)
            {
            elem('dw_link_protocol').value = '';
            elem('dw_link_url').value = link;
            }
          else
            {
            colon = link.indexOf(':') + 1;
            elem('dw_link_protocol').value = link.substring(0, colon);
            elem('dw_link_url').value = link.substring(colon);
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
      }
    },

  createLink: function(element)
    {
    var self = this, 
      protocol = elem('dw_link_protocol').value, 
      url = elem('dw_link_url').value;

    self.restoreCursor();

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
        {
        element.setAttribute('href', protocol + url);
        }
      else
        {
        setTimeout(function()
          {
          self.format('createlink', protocol + url);
          }, 100); // Workaround for bug in Firefox (it throws an error even if the format command actually runs)
        }
      }
    },

  cmdImage: function()
    {
    var self = this;

    if (self.getSelectedAreaElement())
      {
      self.storeCursor();

      boxing.show('<h1>Infoga bild</h1>'
        + '<p>Skriv in adressen till bilden.</p>'
        + '<p>Bild-URL: <input type="text" id="dw_img_url" value="" /></p>'
        + '<p><button id="btn_insert_image" class="hide-boxing">OK</button> <button class="hide-boxing">Avbryt</button></p>', 400, 110);

      elem('dw_img_url').focus();
      addEvent(elem('btn_insert_image'), 'click', self.insertImage, self);
      }
    },

  insertImage: function()
    {
    var url = elem('dw_img_url').value;

    this.restoreCursor();

    if (url != '')
      {
      this.format('insertimage', url);
      }
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
    var self = this, element = self.getSelectedAreaElement();

    if (element)
      {
      self.storeCursor();

      boxing.show('<h1>Infoga tabell</h1>'
        + '<p class="domiwyg-form"><label for="dw_num_rows">Antal rader:</label> <input type="text" id="dw_num_rows" value="" />'
        + '  <label for="dw_num_cols">Antal kolumner:</label> <input type="text" id="dw_num_cols" value="" /></p>'
        + '<p><button id="btn_insert_table" class="hide-boxing">OK</button> <button class="hide-boxing">Avbryt</button></p>', 400, 110);

      elem('dw_num_rows').focus();
      addEvent(elem('btn_insert_table'), 'click', function()
        {
        self.insertTable(element);
        });
      }
    },

  insertTable: function(element)
    {
    var rows = parseInt(elem('dw_num_rows').value, 10), 
      cols = parseInt(elem('dw_num_cols').value, 10), 
      doc = document, r, c, 
      table = doc.createElement('table'), tr, td;

    this.restoreCursor();

    if (rows > 0 && cols > 0)
      {
      for (r = 0; r < rows; r++)
        {
        tr = doc.createElement('tr');
        table.appendChild(tr);
        for (c = 0; c < cols; c++)
          {
          td = doc.createElement('td');
          td.appendChild(doc.createTextNode('Cell'));
          tr.appendChild(td);
          }
        }

      element.parentNode.insertBefore(table, element);
      }
    }
  };