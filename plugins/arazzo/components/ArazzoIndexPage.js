"use strict";
exports.__esModule = true;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
var Heading_1 = require("@theme/Heading");
var styles_module_css_1 = require("./styles.module.css");
function ArazzoIndexPage(_a) {
    var index = _a.index;
    return (<Layout_1["default"] title="Workflows" description="Arazzo workflows that chain our internal APIs.">
      <main className={"container margin-vert--lg " + styles_module_css_1["default"].page}>
        <Heading_1["default"] as="h1">Workflows</Heading_1["default"]>
        <p className={styles_module_css_1["default"].lead}>
          Arazzo contracts describing how our APIs are called together. Each step links to the operation in its API
          reference.
        </p>
        {index.length === 0 && <p>No Arazzo documents found. Add a <code>*.arazzo.yaml</code> file to the <code>arazzo/</code> folder.</p>}
        <div className={styles_module_css_1["default"].cards}>
          {index.map(function (d) { return (<Link_1["default"] key={d.permalink} to={d.permalink} className={styles_module_css_1["default"].card}>
              <div className={styles_module_css_1["default"].cardTitle}>
                {d.title}
                {d.version && <span className={styles_module_css_1["default"].pill}>v{d.version}</span>}
              </div>
              {d.summary && <p className={styles_module_css_1["default"].muted}>{d.summary}</p>}
              <ul className={styles_module_css_1["default"].wfList}>
                {d.workflows.map(function (w) { return (<li key={w.workflowId}>
                    <code>{w.workflowId}</code>
                    <span className={styles_module_css_1["default"].muted}>
                      {' '}
                      · {w.steps} step{w.steps === 1 ? '' : 's'}
                    </span>
                  </li>); })}
              </ul>
            </Link_1["default"]>); })}
        </div>
      </main>
    </Layout_1["default"]>);
}
exports["default"] = ArazzoIndexPage;
