"use strict";
exports.__esModule = true;
exports.Prose = exports.MethodBadge = exports.Expr = void 0;
var react_1 = require("react");
var styles_module_css_1 = require("./styles.module.css");
/** Highlights Arazzo runtime expressions ($inputs, $steps, $response…) inside a value. */
function Expr(_a) {
    var value = _a.value;
    if (value == null)
        return null;
    var parts = String(value).split(/(\$[a-zA-Z][\w.#/\-\[\]]*)/g);
    return (<code className={styles_module_css_1["default"].expr}>
      {parts.map(function (p, i) {
        return p.startsWith('$') ? (<span key={i} className={styles_module_css_1["default"].exprVar}>
            {p}
          </span>) : (<react_1["default"].Fragment key={i}>{p}</react_1["default"].Fragment>);
    })}
    </code>);
}
exports.Expr = Expr;
function MethodBadge(_a) {
    var _b;
    var method = _a.method;
    return <span className={styles_module_css_1["default"].method + " " + ((_b = styles_module_css_1["default"]["m_" + method.toLowerCase()]) !== null && _b !== void 0 ? _b : '')}>{method}</span>;
}
exports.MethodBadge = MethodBadge;
/** Minimal CommonMark-ish rendering for description fields: paragraphs, **bold**, `code`, [links](url). */
function Prose(_a) {
    var text = _a.text;
    var inline = function (s, key) {
        var out = [];
        var re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
        var last = 0;
        var m;
        var i = 0;
        while ((m = re.exec(s))) {
            if (m.index > last)
                out.push(s.slice(last, m.index));
            var t = m[0];
            if (t.startsWith('**'))
                out.push(<strong key={i++}>{t.slice(2, -2)}</strong>);
            else if (t.startsWith('`'))
                out.push(<code key={i++}>{t.slice(1, -1)}</code>);
            else {
                var _a = t.match(/\[([^\]]+)\]\(([^)]+)\)/), label = _a[1], href = _a[2];
                out.push(<a key={i++} href={href}>
            {label}
          </a>);
            }
            last = m.index + t.length;
        }
        if (last < s.length)
            out.push(s.slice(last));
        return <p key={key}>{out}</p>;
    };
    return (<div className={styles_module_css_1["default"].prose}>
      {String(text)
        .trim()
        .split(/\n\s*\n/)
        .map(function (para, i) { return inline(para.replace(/\s*\n\s*/g, ' '), i); })}
    </div>);
}
exports.Prose = Prose;
