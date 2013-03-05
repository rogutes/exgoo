String.prototype.$fmt = function() {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function(str, m1) {
    if (m1 >= args.length) return str;
    return args[m1];
  });
};
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

var find_under_node = function(q, node) {
  var children = node.children,
      check = function(q, text) {
        if (q.test) {
          if (q.test(text)) {
            return true;
          }
        }
        else if (text == q) {
          return true;
        }
        return false;
      };

  for (var i = 0, len = children.length; i < len; i++) {
    var result = find_under_node(q, children[i]);
    if (result) {
      return result;
    }
  }
  if (check(q, node.textContent)) return node;
  else return null;
};

var summary_to_table = function(summary) {
  var html = '<ol>',
      no = 0,
      byhost = summary.byhost;
  summary.ranked.forEach(function(result) {
    no++;
    html += '<li>' +
      '<div class="host">' + result.host + '</div>' +
      '<div class="result">' +
        '<a href="{0}">{1}</a>'.$fmt(encodeURI(result.url), result.url_text) +
        (result.cached ? ' &ndash; <a href="{0}">Cached</a>'.$fmt(encodeURI(result.cached)) : '') +
        (byhost[result.host].length ? ' &ndash; <span class="dim">(' + byhost[result.host].length + ' more)</span>' : '') +
      '</div>' +
      '<div class="desc">' + result.desc + '</div>' +
      '<div class="notes">' + result.notes + '</div>';
  });
  html += '</ol><style>' +
    'body { background:#E4E4E4; color:#000; font-size:15px; }' +
    'li { margin-bottom:1em; }' +
    'a { text-decoration:none; }' +
    'a:hover { text-decoration:underline; }' +
    '.host { padding-bottom:0.2em; }' +
    '.desc { padding:0.4em 0; }' +
    '.dim { color:#666; }' +
    '</style>';
  return html;
};

var goo_search = function(query, url) {
  var xhr = new window.XMLHttpRequest(),
      loc = window.location,
      base_url = loc.protocol + '//' + loc.host;
  if (query) {
    url = base_url + '/search?num=100&as_qdr=all&q=' + encodeURIComponent(query);
  }
  xhr.open('GET', url, false);
  xhr.send();
  if (xhr.status != 200) {
    return {
      'error': 'GET request failed (code {0} - {1}): {2}'.$fmt(
          xhr.status, xhr.statusText, xhr.responseText
      )
    };
  }
  return {
    'ok': true, 'response': xhr.responseText
  };
};

var goo_parse = function(response, summary) {
  var doc = document.createElement('div'),
      next_link,
      errors = [];

  if (!summary.byhost) summary.byhost = {};
  if (!summary.ranked) summary.ranked = [];
  doc.innerHTML = response;

  next_link = $('#pnnext', doc);
  if (next_link) {
    next_link = next_link.href;
  }

  var results = $$('#ires ol li.g', doc);
  if (!results.length) {
    window.goo_obj = doc;
    return {'error': 'No search results found (#ires ol li.g).', 'next': next_link};
  }
  for (var i = 0, len = results.length; i < len; i++) {
    var result = results[i];  // result is a <li class="g"> element
    window.goo_obj = result;
    if (!$('.r', result)) {
      continue;
    }
    result_link = $('.r a[href]', result);
    if (!result_link) {
      errors.push({'error': 'Error while parsing result (.r a[href]).', 'result': result});
      continue;
    }
    var host = result_link.hostname,
        result_desc = $('.st', result),
        cached_link = find_under_node('Cached', $('.s', result)),
        notes = find_under_node(/Rating:/, $('.s', result)),
        obj = {
          'host': host,
          'url': result_link.href,
          'url_text': result_link.textContent.trim(),
          'desc': result_desc ? result_desc.innerHTML : '',
          'cached': cached_link ? cached_link.href : '',
          'notes': notes ? notes.textContent.trim() : ''
        };

    if (!summary.byhost[host]) {
      summary.byhost[host] = [];
      summary.ranked.push(obj);
    }
    summary.byhost[host].push(obj);
  }
  if (errors.length) {
    console.log(errors);
    return {
      'error': 'Done with ' + errors.length + ' errors. Check the Javascript console for details.',
      'next': next_link
    };
  }
  return {'ok': true, 'next': next_link};
};

var goo = function(query) {
  var summary = {},
      container = document.body;

  var get_parse_format = function(url) {
    var result, html = '';
    if (!url) {
      result = goo_search(query);
    }
    else {
      result = goo_search(null, url);
    }

    if (result.error) {
      container.innerHTML = result.error;
      return;
    }
    result = goo_parse(result.response, summary);
    if (result.error) {
      container.innerHTML = result.error;
      return;
    }

    container.innerHTML = summary_to_table(summary);
    if (result.next) {
      container.innerHTML += '<p><a href="#" id="next">Get more results</a>';
      $('#next', container).onclick = function() { get_parse_format(result.next); };
    }
  };
  document.head.innerHTML = '';
  get_parse_format();
  return summary;
};

console.log(goo(decodeURIComponent(window.location.search.match(/q=([^&]+)/))));
