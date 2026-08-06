/*
 * Shared utilities: local persistence, file download/upload, CSV, formatting.
 */
window.AIMA = window.AIMA || {};

(function (AIMA) {
  'use strict';

  var util = {};

  util.uid = function (prefix) {
    var random = Math.random().toString(36).slice(2, 8);
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + random;
  };

  util.todayISO = function () {
    return new Date().toISOString().slice(0, 10);
  };

  util.formatDateTime = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  util.slug = function (text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'assessment';
  };

  util.download = function (filename, content, mime) {
    var blob = new Blob([content], { type: (mime || 'application/octet-stream') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };

  util.downloadJSON = function (filename, data) {
    util.download(filename, JSON.stringify(data, null, 2), 'application/json');
  };

  /** Read a FileList of .json files. Resolves with { records, errors }. */
  util.readJSONFiles = function (fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    return Promise.all(files.map(function (file) {
      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = function () {
          try {
            resolve({ file: file.name, data: JSON.parse(String(reader.result)) });
          } catch (err) {
            resolve({ file: file.name, error: 'Not valid JSON (' + err.message + ')' });
          }
        };
        reader.onerror = function () { resolve({ file: file.name, error: 'Could not read file' }); };
        reader.readAsText(file);
      });
    })).then(function (results) {
      return {
        records: results.filter(function (r) { return !r.error; }),
        errors: results.filter(function (r) { return r.error; })
      };
    });
  };

  util.toCSV = function (columns, rows) {
    function cell(value) {
      if (value === null || value === undefined) return '';
      var text = String(value);
      return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    }
    var lines = [columns.map(function (c) { return cell(c.label); }).join(',')];
    rows.forEach(function (row) {
      lines.push(columns.map(function (c) { return cell(typeof c.value === 'function' ? c.value(row) : row[c.value]); }).join(','));
    });
    return lines.join('\r\n');
  };

  util.store = {
    available: (function () {
      try {
        var probe = '__aima_probe__';
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        return true;
      } catch (err) {
        return false;
      }
    })(),
    save: function (key, value) {
      if (!this.available) return false;
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        return false;
      }
    },
    load: function (key, fallback) {
      if (!this.available) return fallback;
      try {
        var raw = window.localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },
    remove: function (key) {
      if (!this.available) return;
      try { window.localStorage.removeItem(key); } catch (err) { /* ignore */ }
    }
  };

  util.escapeHTML = function (value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  AIMA.util = util;
})(window.AIMA);
