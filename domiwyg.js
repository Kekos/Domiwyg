/**
 * DOMIWYG Script: domiwyg.js
 * Based on DOMcraft
 * 
 * @author Christoffer Lindahl <christoffer@kekos.se>
 * @date 2012-10-22
 * @version 1.2
 */

function getOffsetTop(elem)
  {
  var off_top = elem.offsetTop, 
    off_parent = elem.offsetParent;

  while (off_parent)
    {
    off_top += off_parent.offsetTop;
    off_parent = off_parent.offsetParent;
    }

  return off_top;
  }

function getOffsetLeft(elem)
  {
  var off_left = elem.offsetLeft, 
    off_parent = elem.offsetParent;

  while (off_parent)
    {
    off_left += off_parent.offsetLeft;
    off_parent = off_parent.offsetParent;
    }

  return off_left;
  }

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
  dialog: null, 
  tool_btns: [['Source', 'toggle_src'], ['Link', 'create_link'], ['Image', 'insert_image'], ['Ulist', 'insert_ul'], ['Olist', 'insert_ol'], ['Table', 'insert_table']],
  styles: [['<p></p>', 1, 'tag_p'], ['<h1></h1>', 1, 'tag_h1'], ['<h2></h2>', 1, 'tag_h2'], ['<h3></h3>', 1, 'tag_h3'], ['<h4></h4>', 1, 'tag_h4'], ['<h5></h5>', 1, 'tag_h5'], 
    ['<h6></h6>', 1, 'tag_h6'], ['<blockquote></blockquote>', 1, 'tag_blockquote']],
  allowed: {a: {href: 0}, blockquote: {}, div: {}, em: {}, h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, h6: {}, img: {alt: 0, src: 0, width: 0, height: 0}, li: {}, ol: {}, p: {}, span: {}, strong: {}, table: {}, tr: {}, td: {}, ul: {}},
  allowed_global: {'class': 0, id: 0, title: 0},
  lang: {err_format_support1: 'The format command ', err_format_support2: ' was not supported by your browser.', err_number_format: 'You must enter a number.', 
    toggle_src: 'Toggle source editing', create_link: 'Create/edit link', insert_image: 'Insert image', insert_ul: 'Insert unordered list', insert_ol: 'Insert ordered list', insert_table: 'Insert table', 
    ok: 'OK', cancel: 'Cancel', info_link_dlg: 'Write the address to where the link will lead. Also choose which protocol that should be used.', same_site: 'within same site', website: 'website', 
    secure_site: 'secure site', email: 'e-mail', filetransfer: 'file transfer', info_link_delete: 'If you want to remove a link, select the <strong>entire</strong> link and leave the above field empty.', 
    info_image_dlg: 'Write the address to the image.', image_url: 'Image URL', num_rows: 'Number of rows', num_cols: 'Number of columns', 
    no_elem_active: '(no element selected)', tag_a: 'Link', tag_blockquote: 'Blockquote', tag_div: 'Container', tag_em: 'Emphasized', tag_h1: 'Header 1', tag_h2: 'Header 2', 
    tag_h3: 'Header 3', tag_h4: 'Header 4', tag_h5: 'Header 5', tag_h6: 'Header 6', tag_img: 'Image', tag_li: 'List element', tag_ol: 'Ordered list', tag_p: 'Paragraph', 
    tag_span: 'Span', tag_strong: 'Strong', tag_table: 'Table', tag_tr: 'Table row', tag_td: 'Table cell', tag_ul: 'Unordered list', cssclass: 'Class', select_style: '-- Select a style --'},

  showDialog: function(html, caller)
    {
    var dw = domiwyg,
      dialog = dw.dialog;

    if (!dialog)
      {
      dialog = dw.dialog = document.createElement('div');
      dialog.id = 'domiwyg_dialog';
      document.body.appendChild(dialog);
      addEvent(document, 'click', function(e)
        {
        var targ = getTarget(e);
        if (hasClass(targ, 'hide-dialog'))
          {
          returnFalse(e);
          dw.hideDialog();
          }
        });
      }

    dialog.innerHTML = html;
    dialog.style.display = 'block';
    dialog.style.top = getOffsetTop(caller) + caller.offsetHeight + 'px';
    dialog.style.left = getOffsetLeft(caller) + 'px';
    },

  hideDialog: function()
    {
    var dw = domiwyg;
    if (dw.dialog)
      {
      dw.dialog.style.display = 'none';
      dw.dialog.innerHTML = '';
      }
    },

  create: function(textarea)
    {
    var app = textarea.parentNode.insertBefore(toDOMnode('<div id="domiwyg_' + 
      textarea.id + '" class="domiwyg-app"></div>'), textarea);

    textarea.domiwyg = new domiwyg.area(textarea, app);
    removeClass(textarea, 'use-domiwyg');
    addClass(textarea, 'has-domiwyg');
    },

  find: function()
    {
    var textareas = document.getElementsByTagName('textarea'), 
      t, textarea;

    for (t = 0; t < textareas.length; t++)
      {
      textarea = textareas[t];
      if (hasClass(textarea, 'use-domiwyg'))
        {
        domiwyg.create(textarea);
        }
      }
    },

  append: function(textarea)
    {
    if (!hasClass(textarea, 'has-domiwyg'))
      {
      domiwyg.create(textarea);
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
    self.remove = dw.remove;
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

  remove: function()
    {
    var self = this;

    removeClass(self.textarea, 'has-domiwyg');
    self.textarea.value = self.save();
    self.textarea.domiwyg = null;
    self.app.parentNode.removeChild(self.app);
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
        --c;
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
        if (!(attribute_name in dw.allowed[tag_name]) && !(attribute_name in dw.allowed_global) && attribute_name.indexOf('data-') > 0)
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
      dw = domiwyg, lang = dw.lang, 
      tool_btns = dw.tool_btns, 
      tool_styles = dw.styles, 
      tool_html = '<select class="domiwyg-styles-list"><option value="-1">' + lang.select_style + '</option>', 
      toolbar;

    for (t = 0; t < tool_styles.length; t++)
      {
      tool_html += '<option value="' + t + '">' + lang[tool_styles[t][2]] + '</option>';
      }

    tool_html += '</select>';

    for (t = 0; t < tool_btns.length; t++)
      {
      tool_html += '<button class="dwcmd-' + tool_btns[t][0] + '" title="' + lang[tool_btns[t][1]] + '">' + lang[tool_btns[t][1]] + '</button>';
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
    addEvent(domarea, 'focus', function() { addClass(app, 'focus'); dw.hideDialog(); });
    addEvent(domarea, 'blur', function() { removeClass(app, 'focus'); });
    addEvent(domarea, 'keyup', self.updateDomCrumbs, self);
    addEvent(toolbar.getElementsByTagName('select')[0], 'change', self.addStylingElement, self);
    },

  clicking: function(e)
    {
    var targ = getTarget(e), 
      cls = targ.className, space;

    returnFalse(e);

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

  cmdLink: function(btn)
    {
    var self = this, 
      dw = domiwyg, 
      lang = dw.lang, 
      element = self.getSelectedAreaElement(), 
      node_name = null, link, colon;

    if (element)
      {
      node_name = element.nodeName.toLowerCase();
      self.storeCursor();

      dw.showDialog('<h1>' + lang.create_link + '</h1>'
        + '<p>' + lang.info_link_dlg + '</p>'
        + '<p><select id="dw_link_protocol">'
        + '    <option value="">' + lang.same_site + '</option>'
        + '    <option value="http:">http: (' + lang.website + ')</option>'
        + '    <option value="https:">https: (' + lang.secure_site + ')</option>'
        + '    <option value="mailto:">mailto: (' + lang.email + ')</option>'
        + '    <option value= "ftp:">ftp: (' + lang.filetransfer + ')</option>'
        + '  </select> <input type="text" id="dw_link_url" value="www.example.com" /></p>'
        + '<p>' + lang.info_link_delete + '</p>'
        + '<p><button id="btn_create_link" class="hide-dialog">' + lang.ok + '</button> <button class="hide-dialog">' + lang.cancel + '</button></p>', btn);
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
        dw.hideDialog();
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

  cmdImage: function(btn)
    {
    var self = this, 
      dw = domiwyg, 
      lang = dw.lang;

    if (self.getSelectedAreaElement())
      {
      self.storeCursor();

      dw.showDialog('<h1>' + lang.insert_image + '</h1>'
        + '<p>' + lang.info_image_dlg + '</p>'
        + '<p>' + lang.image_url + ': <input type="text" id="dw_img_url" value="" /></p>'
        + '<p><button id="btn_insert_image" class="hide-dialog">' + lang.ok + '</button> <button class="hide-dialog">' + lang.cancel + '</button></p>', btn);

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

  cmdTable: function(btn)
    {
    var self = this, 
      dw = domiwyg, 
      lang = domiwyg.lang, 
      element = self.getSelectedAreaElement();

    if (element)
      {
      self.storeCursor();

      dw.showDialog('<h1>' + lang.insert_table + '</h1>'
        + '<p class="domiwyg-form"><label for="dw_num_rows">' + lang.num_rows + ':</label> <input type="text" id="dw_num_rows" value="" />'
        + '  <label for="dw_num_cols">' + lang.num_cols + ':</label> <input type="text" id="dw_num_cols" value="" /></p>'
        + '<p><button id="btn_insert_table" class="hide-dialog">' + lang.ok + '</button> <button class="hide-dialog">' + lang.cancel + '</button></p>', btn);

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

      element = this.getFirstContainer(element);
      element.container.insertBefore(table, element.reference);
      }
    }
  };