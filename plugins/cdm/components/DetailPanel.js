"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var Link_1 = require("@docusaurus/Link");
var CodeBlock_1 = require("@theme/CodeBlock");
var shared_1 = require("../../arazzo/components/shared");
var palette_1 = require("./palette");
var styles_module_css_1 = require("./styles.module.css");
function ModelLink(_a) {
    var id = _a.id, onSelect = _a.onSelect, many = _a.many;
    return (<button type="button" className={styles_module_css_1["default"].modelLink} onClick={function () { return onSelect({ kind: 'model', id: id }); }}>
      {id}
      {many && '[]'}
    </button>);
}
function FamilyBadge(_a) {
    var _b;
    var graph = _a.graph, family = _a.family, mode = _a.mode, onSelect = _a.onSelect;
    var i = graph.families.findIndex(function (f) { return f.id === family; });
    var f = graph.families[i];
    return (<button type="button" className={styles_module_css_1["default"].familyBadge} onClick={function () { return onSelect({ kind: 'family', id: family }); }}>
      <span className={styles_module_css_1["default"].swatch} style={{ background: palette_1.familyColor(i, mode) }} aria-hidden/>
      {(_b = f === null || f === void 0 ? void 0 : f.title) !== null && _b !== void 0 ? _b : family}
    </button>);
}
function PropType(_a) {
    var _b;
    var p = _a.p, onSelect = _a.onSelect;
    var embeds = p.refs.filter(function (r) { return r.kind !== 'references'; });
    var refs = p.refs.filter(function (r) { return r.kind === 'references'; });
    var fmt = (_b = p.constraints.find(function (c) { return c.startsWith('format: '); })) === null || _b === void 0 ? void 0 : _b.slice(8);
    return (<span className={styles_module_css_1["default"].ptype}>
      {embeds.length > 0 ? (embeds.map(function (r, i) { return (<react_1["default"].Fragment key={r.model + i}>
            {i > 0 && <span className={styles_module_css_1["default"].muted}> | </span>}
            <ModelLink id={r.model} many={r.kind === 'many'} onSelect={onSelect}/>
          </react_1["default"].Fragment>); })) : (<code>
          {p.type}
          {fmt && <span className={styles_module_css_1["default"].muted}> ‹{fmt}›</span>}
        </code>)}
      {refs.map(function (r) { return (<span key={r.model} className={styles_module_css_1["default"].fk} title="References another model by its id">
          → <ModelLink id={r.model} onSelect={onSelect}/>
        </span>); })}
    </span>);
}
function PropTable(_a) {
    var props = _a.props, onSelect = _a.onSelect;
    return (<table className={styles_module_css_1["default"].props}>
      <thead>
        <tr>
          <th>Property</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {props.map(function (p) { return (<tr key={p.name}>
            <td>
              <code className={styles_module_css_1["default"].pname}>{p.name}</code>
              {p.required && <span className={styles_module_css_1["default"].req}>required</span>}
              {p.overrides && <span className={styles_module_css_1["default"].tag}>refines</span>}
            </td>
            <td>
              <PropType p={p} onSelect={onSelect}/>
              {p.description && <div className={styles_module_css_1["default"].pdesc}>{p.description}</div>}
              {p["enum"] && (<div className={styles_module_css_1["default"].enumRow}>
                  {p["enum"].map(function (v) { return (<code key={String(v)}>{JSON.stringify(v)}</code>); })}
                </div>)}
              {p.constraints.filter(function (c) { return !c.startsWith('format: '); }).length > 0 && (<div className={styles_module_css_1["default"].constraints}>
                  {p.constraints
        .filter(function (c) { return !c.startsWith('format: '); })
        .map(function (c) { return (<span key={c}>{c}</span>); })}
                </div>)}
            </td>
          </tr>); })}
      </tbody>
    </table>);
}
function Usage(_a) {
    var usage = _a.usage;
    var bySpec = new Map();
    for (var _i = 0, usage_1 = usage; _i < usage_1.length; _i++) {
        var u = usage_1[_i];
        if (!bySpec.has(u.specLabel))
            bySpec.set(u.specLabel, []);
        bySpec.get(u.specLabel).push(u);
    }
    return (<>
      {__spreadArrays(bySpec).map(function (_a) {
        var label = _a[0], list = _a[1];
        return (<div key={label} className={styles_module_css_1["default"].usageGroup}>
          <div className={styles_module_css_1["default"].usageSpec}>{label}</div>
          <ul className={styles_module_css_1["default"].usageList}>
            {list.map(function (u) {
            var _a;
            return (<li key={u.method + u.path + ((_a = u.via) !== null && _a !== void 0 ? _a : '')}>
                <Link_1["default"] to={u.href} className={styles_module_css_1["default"].usageOp}>
                  <shared_1.MethodBadge method={u.method}/>
                  <code>{u.path}</code>
                </Link_1["default"]>
                <div className={styles_module_css_1["default"].usageMeta}>
                  {u.where.join(' + ')}
                  {u.via && <> · via {u.via}</>}
                </div>
              </li>);
        })}
          </ul>
        </div>);
    })}
    </>);
}
function Section(_a) {
    var title = _a.title, count = _a.count, children = _a.children;
    return (<section className={styles_module_css_1["default"].psection}>
      <h3 className={styles_module_css_1["default"].psectionTitle}>
        {title}
        {count != null && <span className={styles_module_css_1["default"].count}>{count}</span>}
      </h3>
      {children}
    </section>);
}
function ModelDetail(_a) {
    var m = _a.m, graph = _a.graph, onSelect = _a.onSelect, mode = _a.mode;
    var _b = react_1.useState(false), copied = _b[0], setCopied = _b[1];
    var inheritedCount = m.inherited.reduce(function (n, g) { return n + g.properties.length; }, 0);
    var direct = m.usedIn.filter(function (u) { return !u.via; });
    var indirect = m.usedIn.filter(function (u) { return u.via; });
    var download = "data:application/schema+json;charset=utf-8," + encodeURIComponent(m.raw);
    return (<div>
      <div className={styles_module_css_1["default"].pheadMeta}>
        <FamilyBadge graph={graph} family={m.family} mode={mode} onSelect={onSelect}/>
        {m.abstract && <span className={styles_module_css_1["default"].tagAbstract}>abstract</span>}
      </div>
      <h2 className={styles_module_css_1["default"].ptitle}>{m.title}</h2>
      {m.description && <p className={styles_module_css_1["default"].plead}>{m.description}</p>}

      {m.schemaId && (<div className={styles_module_css_1["default"].idRow}>
          <code title={m.schemaId}>{m.schemaId}</code>
          <button type="button" className={styles_module_css_1["default"].iconBtn} onClick={function () {
        var _a;
        (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(m.schemaId).then(function () {
            setCopied(true);
            setTimeout(function () { return setCopied(false); }, 1200);
        });
    }}>
            {copied ? 'Copied' : 'Copy $id'}
          </button>
          <a className={styles_module_css_1["default"].iconBtn} href={download} download={m.file.split('/').pop()}>
            Download
          </a>
        </div>)}

      {(m.ancestors.length > 0 || m.subtypes.length > 0) && (<Section title="Inheritance">
          {m.ancestors.length > 0 && (<div className={styles_module_css_1["default"].chain}>
              {m.ancestors.map(function (a) { return (<react_1["default"].Fragment key={a}>
                  <ModelLink id={a} onSelect={onSelect}/>
                  <span className={styles_module_css_1["default"].chainArrow}>›</span>
                </react_1["default"].Fragment>); })}
              <strong>{m.title}</strong>
            </div>)}
          {m.subtypes.length > 0 && (<div className={styles_module_css_1["default"].subtypes}>
              <span className={styles_module_css_1["default"].muted}>Subtypes:</span>
              {m.subtypes.map(function (s) { return (<ModelLink key={s} id={s} onSelect={onSelect}/>); })}
            </div>)}
        </Section>)}

      <Section title="Properties" count={m.properties.length + inheritedCount}>
        {m.properties.length > 0 ? (<PropTable props={m.properties} onSelect={onSelect}/>) : (<p className={styles_module_css_1["default"].muted}>No properties of its own.</p>)}
        {m.inherited.map(function (g) { return (<details key={g.from} className={styles_module_css_1["default"].inherited}>
            <summary>
              Inherited from <ModelLink id={g.from} onSelect={onSelect}/> <span className={styles_module_css_1["default"].count}>{g.properties.length}</span>
            </summary>
            <PropTable props={g.properties} onSelect={onSelect}/>
          </details>); })}
      </Section>

      {m.referencedBy.length > 0 && (<Section title="Used by models" count={m.referencedBy.length}>
          <ul className={styles_module_css_1["default"].refList}>
            {m.referencedBy.map(function (r) { return (<li key={r.model + r.property}>
                <ModelLink id={r.model} onSelect={onSelect}/>
                <code className={styles_module_css_1["default"].muted}>.{r.property}</code>
                <span className={styles_module_css_1["default"].tag}>{r.kind === 'references' ? 'by id' : r.kind === 'many' ? 'contains many' : 'contains'}</span>
              </li>); })}
          </ul>
        </Section>)}

      <Section title="Used in contracts" count={new Set(m.usedIn.map(function (u) { return u.specId + u.method + u.path; })).size}>
        {m.usedIn.length === 0 && <p className={styles_module_css_1["default"].muted}>Not used by any published API contract yet.</p>}
        {direct.length > 0 && <Usage usage={direct}/>}
        {indirect.length > 0 && (<>
            {direct.length > 0 && <div className={styles_module_css_1["default"].subhead}>Included through other models</div>}
            <Usage usage={indirect}/>
          </>)}
      </Section>

      <details className={styles_module_css_1["default"].sourceBlock}>
        <summary>JSON Schema · {m.file}</summary>
        <CodeBlock_1["default"] language="json">{m.raw}</CodeBlock_1["default"]>
      </details>
    </div>);
}
function FamilyDetail(_a) {
    var id = _a.id, graph = _a.graph, onSelect = _a.onSelect, onOnlyFamily = _a.onOnlyFamily, mode = _a.mode;
    var i = graph.families.findIndex(function (f) { return f.id === id; });
    var f = graph.families[i];
    var models = f.models.map(function (mid) { return graph.models.find(function (m) { return m.id === mid; }); });
    return (<div>
      <div className={styles_module_css_1["default"].pheadMeta}>
        <span className={styles_module_css_1["default"].kicker}>
          <span className={styles_module_css_1["default"].swatch} style={{ background: palette_1.familyColor(i, mode) }} aria-hidden/> Family
        </span>
      </div>
      <h2 className={styles_module_css_1["default"].ptitle}>{f.title}</h2>
      {f.description && <p className={styles_module_css_1["default"].plead}>{f.description}</p>}
      <button type="button" className={styles_module_css_1["default"].iconBtn} onClick={function () { return onOnlyFamily(id); }}>
        Show only this family
      </button>
      <Section title="Models" count={models.length}>
        <ModelList models={models} onSelect={onSelect}/>
      </Section>
    </div>);
}
function ModelList(_a) {
    var models = _a.models, onSelect = _a.onSelect;
    return (<ul className={styles_module_css_1["default"].modelList}>
      {models.map(function (m) { return (<li key={m.id}>
          <button type="button" onClick={function () { return onSelect({ kind: 'model', id: m.id }); }}>
            <span className={m.abstract ? styles_module_css_1["default"].italic : undefined}>{m.title}</span>
            {m["extends"].length > 0 && <span className={styles_module_css_1["default"].muted}> extends {m["extends"].join(', ')}</span>}
          </button>
        </li>); })}
    </ul>);
}
function Overview(_a) {
    var graph = _a.graph, onSelect = _a.onSelect, mode = _a.mode;
    return (<div>
      <span className={styles_module_css_1["default"].kicker}>Canonical data model</span>
      <h2 className={styles_module_css_1["default"].ptitle}>
        {graph.models.length} models in {graph.families.length} families
      </h2>
      <p className={styles_module_css_1["default"].plead}>
        The shared vocabulary every API contract is built from. Click a model in the graph — or below — to see its
        properties, inheritance and the operations that use it.
      </p>
      {graph.errors.length > 0 && (<div className="alert alert--warning margin-bottom--md">
          {graph.errors.map(function (e) { return (<div key={e}>{e}</div>); })}
        </div>)}
      {graph.families.map(function (f, i) { return (<Section key={f.id} title={f.title} count={f.models.length}>
          <button type="button" className={styles_module_css_1["default"].familyBadge} onClick={function () { return onSelect({ kind: 'family', id: f.id }); }}>
            <span className={styles_module_css_1["default"].swatch} style={{ background: palette_1.familyColor(i, mode) }} aria-hidden/>
            About this family
          </button>
          <ModelList models={f.models.map(function (id) { return graph.models.find(function (m) { return m.id === id; }); })} onSelect={onSelect}/>
        </Section>); })}
      <p className={styles_module_css_1["default"].hint}>
        Tip: <kbd>Esc</kbd> clears the selection. Links like <code>?model=Customer</code> open straight to a model.
      </p>
    </div>);
}
function DetailPanel(props) {
    var graph = props.graph, selection = props.selection, onSelect = props.onSelect;
    var model = (selection === null || selection === void 0 ? void 0 : selection.kind) === 'model' ? graph.models.find(function (m) { return m.id === selection.id; }) : undefined;
    return (<div className={styles_module_css_1["default"].panelInner}>
      {selection && (<button type="button" className={styles_module_css_1["default"].back} onClick={function () { return onSelect(null); }}>
          ← All models
        </button>)}
      {model ? (<ModelDetail key={model.id} m={model} graph={graph} onSelect={onSelect} mode={props.mode}/>) : (selection === null || selection === void 0 ? void 0 : selection.kind) === 'family' ? (<FamilyDetail id={selection.id} {...props}/>) : (<Overview graph={graph} onSelect={onSelect} mode={props.mode}/>)}
    </div>);
}
exports["default"] = DetailPanel;
