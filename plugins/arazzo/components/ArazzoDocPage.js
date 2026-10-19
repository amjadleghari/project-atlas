"use strict";
exports.__esModule = true;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
var Heading_1 = require("@theme/Heading");
var CodeBlock_1 = require("@theme/CodeBlock");
var Mermaid_1 = require("@theme/Mermaid");
var shared_1 = require("./shared");
var shared_2 = require("@site/src/components/portal/shared");
var styles_module_css_1 = require("./styles.module.css");
function Criteria(_a) {
    var items = _a.items;
    return (<ul className={styles_module_css_1["default"].criteria}>
      {items.map(function (c, i) { return (<li key={i}>
          <shared_1.Expr value={c.condition}/>
          {c.context && (<span className={styles_module_css_1["default"].muted}>
              {' '}
              on <shared_1.Expr value={c.context}/>
            </span>)}
          {c.type && c.type !== 'simple' && (<span className={styles_module_css_1["default"].pill}>{typeof c.type === 'string' ? c.type : c.type.type}</span>)}
        </li>); })}
    </ul>);
}
function Actions(_a) {
    var items = _a.items, kind = _a.kind;
    return (<ul className={styles_module_css_1["default"].criteria}>
      {items.map(function (a, i) {
        var _a;
        return (<li key={i}>
          <span className={kind === 'failure' ? styles_module_css_1["default"].pillFail : styles_module_css_1["default"].pillOk}>{a.type}</span>{' '}
          <strong>{a.name}</strong>
          {a.stepId && (<>
              {' → '}
              <a href={"#step-" + a.stepId}>{a.stepId}</a>
            </>)}
          {a.workflowId && <> → workflow <code>{a.workflowId}</code></>}
          {a.retryAfter != null && <span className={styles_module_css_1["default"].muted}> after {a.retryAfter}s</span>}
          {a.retryLimit != null && <span className={styles_module_css_1["default"].muted}> · max {a.retryLimit} tries</span>}
          {((_a = a.criteria) === null || _a === void 0 ? void 0 : _a.length) > 0 && (<div className={styles_module_css_1["default"].muted}>
              when <Criteria items={a.criteria}/>
            </div>)}
        </li>);
    })}
    </ul>);
}
function KeyValueTable(_a) {
    var map = _a.map;
    return (<table className={styles_module_css_1["default"].kv}>
      <tbody>
        {Object.entries(map).map(function (_a) {
        var k = _a[0], v = _a[1];
        return (<tr key={k}>
            <td>
              <code>{k}</code>
            </td>
            <td>
              <shared_1.Expr value={typeof v === 'string' ? v : JSON.stringify(v)}/>
            </td>
          </tr>);
    })}
      </tbody>
    </table>);
}
function Section(_a) {
    var title = _a.title, children = _a.children;
    return (<div className={styles_module_css_1["default"].section}>
      <div className={styles_module_css_1["default"].sectionTitle}>{title}</div>
      {children}
    </div>);
}
function StepTarget(_a) {
    var _b, _c;
    var target = _a.target;
    if (target.kind === 'operation') {
        var label = (<>
        {target.method && <shared_1.MethodBadge method={target.method}/>}
        <code className={styles_module_css_1["default"].path}>{(_c = (_b = target.path) !== null && _b !== void 0 ? _b : target.operationId) !== null && _c !== void 0 ? _c : target.raw}</code>
      </>);
        return (<div className={styles_module_css_1["default"].target}>
        {target.href ? <Link_1["default"] to={target.href}>{label}</Link_1["default"]> : label}
        {target.sourceTitle && <span className={styles_module_css_1["default"].muted}> · {target.sourceTitle}</span>}
        {target.summary && <div className={styles_module_css_1["default"].muted}>{target.summary}</div>}
        {!target.method && (<div className={styles_module_css_1["default"].warn}>Operation not found in a published OpenAPI contract.</div>)}
      </div>);
    }
    if (target.kind === 'workflow') {
        return (<div className={styles_module_css_1["default"].target}>
        <span className={styles_module_css_1["default"].pill}>workflow</span>{' '}
        {target.href ? <a href={target.href}>{target.workflowId}</a> : <code>{target.raw}</code>}
      </div>);
    }
    return null;
}
function ArazzoDocPage(_a) {
    var _b;
    var doc = _a.doc;
    return (<Layout_1["default"] title={doc.title + " \u00B7 Workflows"} description={(_b = doc.summary) !== null && _b !== void 0 ? _b : undefined}>
      <main className={"container margin-vert--lg " + styles_module_css_1["default"].page}>
        <nav className={styles_module_css_1["default"].crumbs}>
          <Link_1["default"] to="/workflows">Workflows</Link_1["default"]> / {doc.title}
        </nav>
        <header className={styles_module_css_1["default"].header}>
          <Heading_1["default"] as="h1">{doc.title}</Heading_1["default"]>
          <div className={styles_module_css_1["default"].meta}>
            {doc.version && <span className={styles_module_css_1["default"].pill}>v{doc.version}</span>}
            <span className={styles_module_css_1["default"].pill}>Arazzo {doc.arazzo}</span>
            <code className={styles_module_css_1["default"].muted}>{doc.file}</code>
            {doc.downloads && <shared_2.DownloadButtons spec={{ id: doc.slug + ".arazzo", downloads: doc.downloads }} compact/>}
          </div>
          {doc.summary && <p className={styles_module_css_1["default"].lead}>{doc.summary}</p>}
          {doc.description && <shared_1.Prose text={doc.description}/>}
        </header>

        {doc.errors.length > 0 && (<div className="alert alert--warning margin-bottom--md">
            {doc.errors.map(function (e) { return (<div key={e}>{e}</div>); })}
          </div>)}

        <Section title="Source descriptions">
          <table className={styles_module_css_1["default"].kv}>
            <tbody>
              {doc.sources.map(function (s) {
        var _a;
        return (<tr key={s.name}>
                  <td>
                    <code>{s.name}</code>
                  </td>
                  <td>
                    {s.route ? <Link_1["default"] to={s.route}>{(_a = s.title) !== null && _a !== void 0 ? _a : s.url}</Link_1["default"]> : <code>{s.url}</code>}
                    <span className={styles_module_css_1["default"].muted}> · {s.type}</span>
                  </td>
                </tr>);
    })}
            </tbody>
          </table>
        </Section>

        {doc.workflows.map(function (wf) {
        var _a;
        return (<section key={wf.workflowId} id={"workflow-" + wf.workflowId} className={styles_module_css_1["default"].workflow}>
            <Heading_1["default"] as="h2">
              <code>{wf.workflowId}</code>
            </Heading_1["default"]>
            {wf.summary && <p className={styles_module_css_1["default"].lead}>{wf.summary}</p>}
            {wf.description && <shared_1.Prose text={wf.description}/>}
            {((_a = wf.dependsOn) === null || _a === void 0 ? void 0 : _a.length) > 0 && (<p className={styles_module_css_1["default"].muted}>
                Depends on:{' '}
                {wf.dependsOn.map(function (d) { return (<code key={d}>{d}</code>); })}
              </p>)}

            <div className={styles_module_css_1["default"].diagram}>
              <Mermaid_1["default"] value={wf.mermaid}/>
            </div>

            <div className={styles_module_css_1["default"].twoCol}>
              {wf.inputs && (<Section title="Inputs">
                  <CodeBlock_1["default"] language="yaml">{wf.inputs}</CodeBlock_1["default"]>
                </Section>)}
              {wf.outputs && (<Section title="Outputs">
                  <KeyValueTable map={wf.outputs}/>
                </Section>)}
            </div>

            <Heading_1["default"] as="h3">Steps</Heading_1["default"]>
            <ol className={styles_module_css_1["default"].steps}>
              {wf.steps.map(function (st) { return (<li key={st.stepId} id={"step-" + st.stepId} className={styles_module_css_1["default"].step}>
                  <div className={styles_module_css_1["default"].stepHead}>
                    <strong>{st.stepId}</strong>
                    <StepTarget target={st.target}/>
                  </div>
                  {st.description && <shared_1.Prose text={st.description}/>}
                  {st.parameters && (<Section title="Parameters">
                      <table className={styles_module_css_1["default"].kv}>
                        <tbody>
                          {st.parameters.map(function (p, i) {
            var _a;
            return (<tr key={i}>
                              <td>
                                <code>{(_a = p.name) !== null && _a !== void 0 ? _a : p.reference}</code>
                                {p["in"] && <span className={styles_module_css_1["default"].muted}> ({p["in"]})</span>}
                              </td>
                              <td>
                                <shared_1.Expr value={typeof p.value === 'string' ? p.value : JSON.stringify(p.value)}/>
                              </td>
                            </tr>);
        })}
                        </tbody>
                      </table>
                    </Section>)}
                  {st.requestBody && (<Section title={"Request body" + (st.requestBody.contentType ? " \u00B7 " + st.requestBody.contentType : '')}>
                      <CodeBlock_1["default"] language="yaml">{st.requestBody.yaml}</CodeBlock_1["default"]>
                    </Section>)}
                  {st.successCriteria && (<Section title="Success criteria">
                      <Criteria items={st.successCriteria}/>
                    </Section>)}
                  {st.onSuccess && (<Section title="On success">
                      <Actions items={st.onSuccess} kind="success"/>
                    </Section>)}
                  {st.onFailure && (<Section title="On failure">
                      <Actions items={st.onFailure} kind="failure"/>
                    </Section>)}
                  {st.outputs && (<Section title="Outputs">
                      <KeyValueTable map={st.outputs}/>
                    </Section>)}
                </li>); })}
            </ol>
          </section>);
    })}

        <details className={styles_module_css_1["default"].source}>
          <summary>View source</summary>
          <CodeBlock_1["default"] language="yaml" title={doc.file}>
            {doc.raw}
          </CodeBlock_1["default"]>
        </details>
      </main>
    </Layout_1["default"]>);
}
exports["default"] = ArazzoDocPage;
