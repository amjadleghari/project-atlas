"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var BrowserOnly_1 = require("@docusaurus/BrowserOnly");
var router_1 = require("@docusaurus/router");
var theme_common_1 = require("@docusaurus/theme-common");
var DetailPanel_1 = require("./DetailPanel");
var palette_1 = require("./palette");
var styles_module_css_1 = require("./styles.module.css");
function readSelection(search, graph) {
    var q = new URLSearchParams(search);
    var model = q.get('model');
    if (model && graph.models.some(function (m) { return m.id === model; }))
        return { kind: 'model', id: model };
    var family = q.get('family');
    if (family && graph.families.some(function (f) { return f.id === family; }))
        return { kind: 'family', id: family };
    return null;
}
function Legend(_a) {
    var graph = _a.graph, mode = _a.mode;
    var _b = react_1.useState(true), open = _b[0], setOpen = _b[1];
    react_1.useEffect(function () {
        if (window.matchMedia('(max-width: 996px)').matches)
            setOpen(false);
    }, []);
    return (<details className={styles_module_css_1["default"].legend} open={open} onToggle={function (e) { return setOpen(e.target.open); }}>
      <summary className={styles_module_css_1["default"].legendSummary}>Legend</summary>
      <div className={styles_module_css_1["default"].legendRow}>
        <svg width="34" height="12" aria-hidden>
          <line x1="2" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 1 L32 6 L22 11 Z" fill="var(--ifm-background-color)" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        Extends
      </div>
      <div className={styles_module_css_1["default"].legendRow}>
        <svg width="34" height="12" aria-hidden>
          <path d="M2 6 L8 2 L14 6 L8 10 Z" fill="currentColor"/>
          <line x1="14" y1="6" x2="32" y2="6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        Contains
      </div>
      <div className={styles_module_css_1["default"].legendRow}>
        <svg width="34" height="12" aria-hidden>
          <line x1="2" y1="6" x2="28" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 3"/>
          <path d="M24 2 L31 6 L24 10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        References by id
      </div>
      <div className={styles_module_css_1["default"].legendRow}>
        <span className={styles_module_css_1["default"].legendAbstract} aria-hidden/>
        Abstract
      </div>
      <div className={styles_module_css_1["default"].legendDivider}/>
      {graph.families.map(function (f, i) { return (<div key={f.id} className={styles_module_css_1["default"].legendRow}>
          <span className={styles_module_css_1["default"].swatch} style={{ background: palette_1.familyColor(i, mode) }} aria-hidden/>
          {f.title}
        </div>); })}
    </details>);
}
function CdmApp(_a) {
    var graph = _a.graph;
    var location = router_1.useLocation();
    var history = router_1.useHistory();
    var colorMode = theme_common_1.useColorMode().colorMode;
    var _b = react_1.useState(null), selection = _b[0], setSelection = _b[1];
    var _c = react_1.useState(new Set()), hiddenFamilies = _c[0], setHiddenFamilies = _c[1];
    var _d = react_1.useState(true), showComposition = _d[0], setShowComposition = _d[1];
    var _e = react_1.useState(true), showReferences = _e[0], setShowReferences = _e[1];
    var _f = react_1.useState(false), lineageOnly = _f[0], setLineageOnly = _f[1];
    var _g = react_1.useState('hierarchy'), layout = _g[0], setLayout = _g[1];
    var _h = react_1.useState(0), fitSignal = _h[0], setFitSignal = _h[1];
    // Narrow screens: the compact cluster layout reads better than a wide hierarchy.
    react_1.useEffect(function () {
        if (window.matchMedia('(max-width: 700px)').matches)
            setLayout('clusters');
    }, []);
    var _j = react_1.useState(''), query = _j[0], setQuery = _j[1];
    // Deep links: /data-model?model=Customer or ?family=party (read after hydration)
    react_1.useEffect(function () {
        setSelection(readSelection(location.search, graph));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);
    var select = react_1.useCallback(function (s) {
        var _a;
        setSelection(s);
        var q = new URLSearchParams();
        if ((s === null || s === void 0 ? void 0 : s.kind) === 'model')
            q.set('model', s.id);
        if ((s === null || s === void 0 ? void 0 : s.kind) === 'family')
            q.set('family', s.id);
        var search = q.toString() ? "?" + q : '';
        if (search !== location.search)
            history.replace(__assign(__assign({}, location), { search: search, hash: '' }));
        // a hidden family's model should become visible when picked
        if ((s === null || s === void 0 ? void 0 : s.kind) === 'model') {
            var fam = (_a = graph.models.find(function (m) { return m.id === s.id; })) === null || _a === void 0 ? void 0 : _a.family;
            if (fam && hiddenFamilies.has(fam)) {
                var next = new Set(hiddenFamilies);
                next["delete"](fam);
                setHiddenFamilies(next);
            }
        }
    }, [history, location, graph, hiddenFamilies]);
    react_1.useEffect(function () {
        var onKey = function (e) {
            if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement))
                select(null);
        };
        window.addEventListener('keydown', onKey);
        return function () { return window.removeEventListener('keydown', onKey); };
    }, [select]);
    var toggleFamily = function (id) {
        var next = new Set(hiddenFamilies);
        if (next.has(id))
            next["delete"](id);
        else
            next.add(id);
        if (next.size === graph.families.length)
            return; // keep at least one visible
        setHiddenFamilies(next);
    };
    var onlyFamily = function (id) { return setHiddenFamilies(new Set(graph.families.map(function (f) { return f.id; }).filter(function (f) { return f !== id; }))); };
    var matches = react_1.useMemo(function () {
        var q = query.trim().toLowerCase();
        if (!q)
            return [];
        return graph.models
            .filter(function (m) {
            var _a;
            return m.title.toLowerCase().includes(q) ||
                m.properties.some(function (p) { return p.name.toLowerCase().includes(q); }) ||
                ((_a = m.description) !== null && _a !== void 0 ? _a : '').toLowerCase().includes(q);
        })
            .slice(0, 8);
    }, [query, graph]);
    var mode = colorMode === 'dark' ? 'dark' : 'light';
    return (<div className={styles_module_css_1["default"].app}>
        <div className={styles_module_css_1["default"].toolbar} role="toolbar" aria-label="Graph controls">
          <div className={styles_module_css_1["default"].search}>
            <input type="search" placeholder="Find a model or property…" value={query} aria-label="Find a model or property" onChange={function (e) { return setQuery(e.target.value); }} onKeyDown={function (e) {
        if (e.key === 'Enter' && matches[0]) {
            select({ kind: 'model', id: matches[0].id });
            setQuery('');
        }
        if (e.key === 'Escape')
            setQuery('');
    }}/>
            {matches.length > 0 && (<ul className={styles_module_css_1["default"].searchResults} role="listbox">
                {matches.map(function (m) {
        var _a;
        return (<li key={m.id}>
                    <button type="button" onClick={function () {
            select({ kind: 'model', id: m.id });
            setQuery('');
        }}>
                      <strong>{m.title}</strong>
                      <span className={styles_module_css_1["default"].muted}> · {(_a = graph.families.find(function (f) { return f.id === m.family; })) === null || _a === void 0 ? void 0 : _a.title}</span>
                    </button>
                  </li>);
    })}
              </ul>)}
          </div>

          <div className={styles_module_css_1["default"].chips} aria-label="Families">
            {graph.families.map(function (f, i) {
        var on = !hiddenFamilies.has(f.id);
        return (<button key={f.id} type="button" className={styles_module_css_1["default"].chip + " " + (on ? styles_module_css_1["default"].chipOn : '')} aria-pressed={on} title={(on ? 'Hide' : 'Show') + " " + f.title + " (double-click: show only this)"} onClick={function () { return toggleFamily(f.id); }} onDoubleClick={function () { return onlyFamily(f.id); }}>
                  <span className={styles_module_css_1["default"].swatch} style={{ background: palette_1.familyColor(i, mode) }} aria-hidden/>
                  {f.title}
                  <span className={styles_module_css_1["default"].chipCount}>{f.models.length}</span>
                </button>);
    })}
          </div>

          <div className={styles_module_css_1["default"].toggles}>
            <label>
              <input type="checkbox" checked={showComposition} onChange={function (e) { return setShowComposition(e.target.checked); }}/>
              Contains
            </label>
            <label>
              <input type="checkbox" checked={showReferences} onChange={function (e) { return setShowReferences(e.target.checked); }}/>
              References
            </label>
            <label title={(selection === null || selection === void 0 ? void 0 : selection.kind) === 'model' ? '' : 'Select a model first'}>
              <input type="checkbox" checked={lineageOnly} disabled={(selection === null || selection === void 0 ? void 0 : selection.kind) !== 'model'} onChange={function (e) { return setLineageOnly(e.target.checked); }}/>
              Lineage only
            </label>
            <select value={layout} onChange={function (e) { return setLayout(e.target.value); }} aria-label="Layout">
              <option value="hierarchy">Hierarchy</option>
              <option value="clusters">Clusters</option>
            </select>
            <button type="button" className={styles_module_css_1["default"].iconBtn} onClick={function () { return setFitSignal(function (n) { return n + 1; }); }} title="Fit to screen">
              Fit
            </button>
          </div>
        </div>

        <div className={styles_module_css_1["default"].body}>
          <div className={styles_module_css_1["default"].canvas}>
            <BrowserOnly_1["default"] fallback={<div className={styles_module_css_1["default"].loading}>Loading graph…</div>}>
              {function () {
        var CdmGraph = require('./CdmGraph')["default"];
        return (<CdmGraph graph={graph} selection={selection} onSelect={select} hiddenFamilies={hiddenFamilies} showComposition={showComposition} showReferences={showReferences} lineageOnly={lineageOnly} layout={layout} mode={mode} fitSignal={fitSignal}/>);
    }}
            </BrowserOnly_1["default"]>
            <Legend graph={graph} mode={mode}/>
          </div>
          <aside className={styles_module_css_1["default"].panel} aria-label="Details">
            <DetailPanel_1["default"] graph={graph} selection={selection} onSelect={select} onOnlyFamily={onlyFamily} mode={mode}/>
          </aside>
        </div>
      </div>);
}
function CdmPage(_a) {
    var graph = _a.graph;
    return (<Layout_1["default"] title="Canonical data model" description="Interactive map of the canonical data model" noFooter>
      <CdmApp graph={graph}/>
    </Layout_1["default"]>);
}
exports["default"] = CdmPage;
