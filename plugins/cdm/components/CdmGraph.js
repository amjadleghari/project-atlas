"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
/**
 * Cytoscape-rendered graph of the canonical data model. Client-only: CdmPage
 * loads it inside <BrowserOnly>.
 *
 *  - Families are compound nodes (boxes) containing their models.
 *  - Inheritance: solid line, hollow triangle at the parent (UML generalisation).
 *  - Composition: diamond at the owning model.
 *  - Reference by id (x-references): dashed line with an open arrow.
 */
var react_1 = require("react");
var cytoscape_1 = require("cytoscape");
var cytoscape_elk_1 = require("cytoscape-elk");
var cytoscape_fcose_1 = require("cytoscape-fcose");
var palette_1 = require("./palette");
var styles_module_css_1 = require("./styles.module.css");
var registered = false;
function register() {
    if (registered)
        return;
    cytoscape_1["default"].use(cytoscape_elk_1["default"]);
    cytoscape_1["default"].use(cytoscape_fcose_1["default"]);
    registered = true;
}
var MAX_FIT_ZOOM = 1.35;
/** Fit to the given elements without zooming in past a comfortable reading size. */
function fitCapped(cy, eles, padding, animate) {
    var bb = eles.boundingBox({});
    var zoom = Math.min(MAX_FIT_ZOOM, Math.max(cy.minZoom(), Math.min((cy.width() - 2 * padding) / bb.w, (cy.height() - 2 * padding) / bb.h)));
    var pan = { x: (cy.width() - zoom * (bb.x1 + bb.x2)) / 2, y: (cy.height() - zoom * (bb.y1 + bb.y2)) / 2 };
    if (animate)
        cy.animate({ zoom: zoom, pan: pan }, { duration: 300 });
    else
        cy.viewport({ zoom: zoom, pan: pan });
}
/** On narrow screens, frame the selection and its neighbours rather than the whole map. */
function focusSelection(cy, animate) {
    if (cy.width() >= 700)
        return false;
    var focus = cy.nodes('.selected, .neighbor').filter(':visible');
    if (focus.empty())
        return false;
    fitCapped(cy, focus.union(focus.connectedEdges(':visible')), 28, animate);
    return true;
}
var mid = function (id) { return "m:" + id; };
var fid = function (id) { return "f:" + id; };
function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    // Cytoscape can't paint 'transparent' (Infima uses it for some surfaces) — use the fallback.
    return v && v !== 'transparent' && !v.startsWith('rgba(0, 0, 0, 0') ? v : fallback;
}
function buildStyle(mode) {
    var text = cssVar('--ifm-font-color-base', mode === 'dark' ? '#e3e3e3' : '#1c1e21');
    var textMuted = cssVar('--ifm-color-emphasis-700', '#606770');
    var surface = cssVar('--ifm-background-surface-color', mode === 'dark' ? '#242526' : '#ffffff');
    var lineStrong = cssVar('--ifm-color-emphasis-800', '#444950');
    var line = cssVar('--ifm-color-emphasis-500', '#8d949e');
    var font = cssVar('--ifm-font-family-base', 'system-ui, sans-serif');
    return [
        {
            selector: 'node[type="family"]',
            style: {
                shape: 'round-rectangle',
                'background-color': 'data(color)',
                'background-opacity': mode === 'dark' ? 0.14 : 0.07,
                'border-color': 'data(color)',
                'border-width': 1.5,
                'border-opacity': 0.9,
                label: 'data(label)',
                color: textMuted,
                'font-family': font,
                'font-size': 13,
                'font-weight': 700,
                'text-transform': 'uppercase',
                'text-valign': 'top',
                'text-halign': 'center',
                'text-margin-y': -6,
                padding: '22px',
                'corner-radius': 14,
                'overlay-opacity': 0,
                'underlay-opacity': 0
            }
        },
        {
            selector: 'node[type="model"]',
            style: {
                shape: 'round-rectangle',
                width: 'data(w)',
                height: 'data(h)',
                'background-color': surface,
                'border-color': 'data(color)',
                'border-width': 2,
                label: 'data(label)',
                color: text,
                'font-family': font,
                'font-size': 13,
                'font-weight': 600,
                'text-valign': 'center',
                'text-halign': 'center',
                'text-wrap': 'wrap',
                'underlay-color': 'data(color)',
                'underlay-padding': 6,
                'underlay-opacity': 0,
                'underlay-shape': 'round-rectangle',
                'transition-property': 'underlay-opacity, opacity, border-width',
                'transition-duration': 150
            }
        },
        { selector: 'node[?abstract]', style: { 'border-style': 'dashed', 'font-style': 'italic' } },
        { selector: 'node:active, edge:active', style: { 'overlay-opacity': 0 } },
        { selector: 'node[type="model"].hover', style: { 'underlay-opacity': 0.18 } },
        { selector: 'node[type="model"].neighbor', style: { 'border-width': 3 } },
        { selector: 'node[type="model"].selected', style: { 'border-width': 4, 'underlay-opacity': 0.32 } },
        { selector: 'node[type="family"].selected', style: { 'border-width': 3, 'background-opacity': mode === 'dark' ? 0.24 : 0.14 } },
        { selector: 'node.faded', style: { opacity: 0.18 } },
        { selector: 'node[type="family"].dim', style: { 'border-opacity': 0.35, 'text-opacity': 0.5 } },
        {
            selector: 'edge',
            style: {
                width: 1.5,
                'line-color': line,
                'curve-style': 'bezier',
                'target-arrow-color': line,
                'source-arrow-color': line,
                'arrow-scale': 1.2,
                'font-family': font,
                'font-size': 11,
                color: textMuted,
                'text-background-color': surface,
                'text-background-opacity': 1,
                'text-background-padding': '2px',
                'text-background-shape': 'roundrectangle'
            }
        },
        {
            selector: 'edge[kind="extends"]',
            style: {
                width: 2,
                'line-color': lineStrong,
                'target-arrow-color': lineStrong,
                'target-arrow-shape': 'triangle',
                'target-arrow-fill': 'hollow',
                'arrow-scale': 1.6
            }
        },
        {
            selector: 'edge[kind="embeds"], edge[kind="many"]',
            style: { 'source-arrow-shape': 'diamond', 'source-arrow-fill': 'filled', 'arrow-scale': 1.3 }
        },
        {
            selector: 'edge[kind="references"]',
            style: { 'line-style': 'dashed', 'line-dash-pattern': [6, 4], 'target-arrow-shape': 'vee' }
        },
        { selector: 'edge.labelled', style: { label: 'data(label)', width: 2.5, 'z-compound-depth': 'top', 'z-index': 99 } },
        { selector: 'edge.faded', style: { opacity: 0.08 } },
        { selector: '.hidden', style: { display: 'none' } },
    ];
}
function buildElements(graph, mode) {
    var colorOf = new Map(graph.families.map(function (f, i) { return [f.id, palette_1.familyColor(i, mode)]; }));
    var els = [];
    for (var _i = 0, _a = graph.families; _i < _a.length; _i++) {
        var f = _a[_i];
        els.push({ data: { id: fid(f.id), type: 'family', label: f.title, color: colorOf.get(f.id), family: f.id } });
    }
    for (var _b = 0, _c = graph.models; _b < _c.length; _b++) {
        var m = _c[_b];
        var label = m.abstract ? m.title + "\n\u00ABabstract\u00BB" : m.title;
        els.push({
            data: {
                id: mid(m.id),
                parent: fid(m.family),
                type: 'model',
                label: label,
                abstract: m.abstract,
                color: colorOf.get(m.family),
                family: m.family,
                w: Math.max(96, m.title.length * 8 + 32),
                h: m.abstract ? 46 : 36
            }
        });
    }
    for (var _d = 0, _e = graph.models; _d < _e.length; _d++) {
        var m = _e[_d];
        for (var _f = 0, _g = m["extends"]; _f < _g.length; _f++) {
            var p = _g[_f];
            els.push({ data: { id: "x:" + m.id + ">" + p, source: mid(m.id), target: mid(p), kind: 'extends', label: '' } });
        }
        // merge several properties pointing at the same model into one edge
        var merged = new Map();
        for (var _h = 0, _j = m.properties; _h < _j.length; _h++) {
            var prop = _j[_h];
            for (var _k = 0, _l = prop.refs; _k < _l.length; _k++) {
                var r = _l[_k];
                var key = r.kind + "|" + r.model;
                if (!merged.has(key))
                    merged.set(key, { target: r.model, kind: r.kind, labels: [] });
                merged.get(key).labels.push(r.kind === 'many' ? prop.name + " [*]" : prop.name);
            }
        }
        for (var _m = 0, merged_1 = merged; _m < merged_1.length; _m++) {
            var _o = merged_1[_m], key = _o[0], e = _o[1];
            if (e.target === m.id && e.kind !== 'references')
                continue;
            els.push({
                data: { id: "r:" + m.id + ">" + key, source: mid(m.id), target: mid(e.target), kind: e.kind, label: e.labels.join(', ') }
            });
        }
    }
    return els;
}
function layoutOptions(kind) {
    if (kind === 'clusters') {
        return {
            name: 'fcose',
            quality: 'proof',
            animate: false,
            nodeDimensionsIncludeLabels: true,
            nodeRepulsion: 9000,
            idealEdgeLength: 90,
            nestingFactor: 0.6,
            padding: 30
        };
    }
    return {
        name: 'elk',
        nodeDimensionsIncludeLabels: true,
        fit: true,
        padding: 30,
        animate: false,
        elk: {
            algorithm: 'layered',
            'elk.direction': 'UP',
            'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
            'elk.layered.spacing.nodeNodeBetweenLayers': 64,
            'elk.spacing.nodeNode': 28,
            'elk.padding': '[top=36,left=20,bottom=20,right=20]',
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
        }
    };
}
function CdmGraph(props) {
    var graph = props.graph, selection = props.selection, onSelect = props.onSelect, hiddenFamilies = props.hiddenFamilies, showComposition = props.showComposition, showReferences = props.showReferences, lineageOnly = props.lineageOnly, layout = props.layout, mode = props.mode, fitSignal = props.fitSignal;
    var container = react_1.useRef(null);
    var cyRef = react_1.useRef(null);
    var onSelectRef = react_1.useRef(onSelect);
    onSelectRef.current = onSelect;
    var _a = react_1.useState(null), tip = _a[0], setTip = _a[1];
    var byId = react_1.useMemo(function () { return new Map(graph.models.map(function (m) { return [m.id, m]; })); }, [graph]);
    // ---- create once ------------------------------------------------------------
    react_1.useEffect(function () {
        register();
        var cy = cytoscape_1["default"]({
            container: container.current,
            elements: buildElements(graph, mode),
            style: buildStyle(mode),
            minZoom: 0.15,
            maxZoom: 2.5,
            boxSelectionEnabled: false,
            autounselectify: true,
            autoungrabify: false
        });
        cyRef.current = cy;
        cy.on('tap', 'node', function (e) {
            var n = e.target;
            var d = n.data();
            onSelectRef.current(d.type === 'model' ? { kind: 'model', id: d.id.slice(2) } : { kind: 'family', id: d.family });
        });
        cy.on('tap', function (e) {
            if (e.target === cy)
                onSelectRef.current(null);
        });
        cy.on('mouseover', 'node[type="model"]', function (e) {
            var n = e.target;
            n.addClass('hover');
            var p = n.renderedPosition();
            setTip({ x: p.x, y: p.y - n.renderedOuterHeight() / 2, id: n.id().slice(2) });
            if (container.current)
                container.current.style.cursor = 'pointer';
        });
        cy.on('mouseout', 'node[type="model"]', function (e) {
            e.target.removeClass('hover');
            setTip(null);
            if (container.current)
                container.current.style.cursor = '';
        });
        cy.on('viewport drag', function () { return setTip(null); });
        return function () {
            cy.destroy();
            cyRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graph]);
    // ---- colour mode: restyle + recolour ----------------------------------------
    react_1.useEffect(function () {
        var cy = cyRef.current;
        if (!cy)
            return;
        graph.families.forEach(function (f, i) {
            var c = palette_1.familyColor(i, mode);
            cy.$id(fid(f.id)).data('color', c);
            cy.nodes("[family=\"" + f.id + "\"]").data('color', c);
        });
        cy.style(buildStyle(mode));
    }, [mode, graph]);
    // ---- visibility (families + edge kinds) and layout ---------------------------
    react_1.useEffect(function () {
        var cy = cyRef.current;
        if (!cy)
            return;
        cy.batch(function () {
            cy.nodes().forEach(function (n) {
                n.toggleClass('hidden', hiddenFamilies.has(n.data('family')));
            });
            cy.edges('[kind="embeds"], [kind="many"]').toggleClass('hidden', !showComposition);
            cy.edges('[kind="references"]').toggleClass('hidden', !showReferences);
        });
        // Reference-by-id edges are drawn but don't drive the layout, so the
        // inheritance hierarchy stays readable.
        var eles = cy.elements().not('.hidden').not('edge[kind="references"]');
        var l = eles.layout(layoutOptions(layout));
        l.one('layoutstop', function () {
            if (!focusSelection(cy, false))
                fitCapped(cy, cy.elements(':visible'), 40, false);
        });
        l.run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hiddenFamilies, layout, graph, showComposition]);
    react_1.useEffect(function () {
        var _a;
        (_a = cyRef.current) === null || _a === void 0 ? void 0 : _a.edges('[kind="references"]').toggleClass('hidden', !showReferences);
    }, [showReferences]);
    react_1.useEffect(function () {
        var cy = cyRef.current;
        if (cy && fitSignal)
            fitCapped(cy, cy.elements(':visible'), 40, true);
    }, [fitSignal]);
    // ---- selection highlight ------------------------------------------------------
    react_1.useEffect(function () {
        var cy = cyRef.current;
        if (!cy)
            return;
        cy.batch(function () {
            cy.elements().removeClass('selected neighbor faded labelled dim');
            cy.nodes('.lineage-hidden-x').removeClass('hidden lineage-hidden-x');
            if (!selection)
                return;
            if (selection.kind === 'family') {
                var fam = cy.$id(fid(selection.id));
                fam.addClass('selected');
                cy.nodes('[type="model"]')
                    .filter(function (n) { return n.data('family') !== selection.id; })
                    .addClass('faded');
                cy.nodes('[type="family"]').not(fam).addClass('dim');
                cy.edges()
                    .filter(function (e) { return e.source().data('family') !== selection.id && e.target().data('family') !== selection.id; })
                    .addClass('faded');
                return;
            }
            var node = cy.$id(mid(selection.id));
            if (node.empty())
                return;
            var m = byId.get(selection.id);
            // lineage = ancestors + all descendants, plus direct neighbours via any edge
            var descendants = new Set();
            var walk = function (id) { var _a; return (_a = byId.get(id)) === null || _a === void 0 ? void 0 : _a.subtypes.forEach(function (s) {
                if (!descendants.has(s)) {
                    descendants.add(s);
                    walk(s);
                }
            }); };
            walk(m.id);
            var lineage = new Set(__spreadArrays([m.id], m.ancestors, descendants));
            var connected = node.connectedEdges(':visible');
            var related = cy.collection().union(node);
            cy.nodes('[type="model"]').forEach(function (n) {
                if (lineage.has(n.id().slice(2)))
                    related.merge(n);
            });
            related.merge(connected.connectedNodes());
            var lineageEdges = cy.edges('[kind="extends"]').filter(function (e) { return related.contains(e.source()) && related.contains(e.target()); });
            var keepEdges = connected.union(lineageEdges);
            node.addClass('selected');
            related.not(node).addClass('neighbor');
            cy.nodes('[type="model"]').not(related).addClass('faded');
            cy.edges().not(keepEdges).addClass('faded');
            connected.addClass('labelled');
            var keepFamilies = new Set(related.map(function (n) { return n.data('family'); }));
            cy.nodes('[type="family"]')
                .filter(function (f) { return !keepFamilies.has(f.data('family')); })
                .addClass('dim');
            if (lineageOnly) {
                cy.nodes('[type="model"]').not(related).not('.hidden').addClass('hidden lineage-hidden-x');
                cy.nodes('[type="family"]')
                    .filter(function (f) { return !keepFamilies.has(f.data('family')) && !f.hasClass('hidden'); })
                    .addClass('hidden lineage-hidden-x');
            }
            if (focusSelection(cy, true))
                return;
            // bring the node into view if it's off-screen
            var bb = node.renderedBoundingBox({});
            var w = cy.width();
            var h = cy.height();
            if (bb.x1 < 0 || bb.y1 < 0 || bb.x2 > w || bb.y2 > h) {
                cy.animate({ center: { eles: node } }, { duration: 300 });
            }
        });
        if (lineageOnly && (selection === null || selection === void 0 ? void 0 : selection.kind) === 'model') {
            fitCapped(cy, cy.elements(':visible'), 48, true);
        }
    }, [selection, lineageOnly, byId, hiddenFamilies, showComposition, showReferences]);
    var tipModel = tip ? byId.get(tip.id) : undefined;
    return (<div className={styles_module_css_1["default"].graphWrap}>
      <div ref={container} className={styles_module_css_1["default"].graph} role="img" aria-label="Canonical data model graph"/>
      {tip && tipModel && (<div className={styles_module_css_1["default"].tooltip} style={{ left: tip.x, top: tip.y }}>
          <strong>{tipModel.title}</strong>
          {tipModel.abstract && <span className={styles_module_css_1["default"].tagAbstract}>abstract</span>}
          {tipModel.description && <div className={styles_module_css_1["default"].tooltipDesc}>{tipModel.description}</div>}
          <div className={styles_module_css_1["default"].tooltipMeta}>
            {tipModel.properties.length} own · {tipModel.inherited.reduce(function (n, g) { return n + g.properties.length; }, 0)} inherited
            properties
            {tipModel.usedIn.length > 0 && " \u00B7 " + new Set(tipModel.usedIn.map(function (u) { return u.specId + u.path + u.method; })).size + " operations"}
          </div>
        </div>)}
    </div>);
}
exports["default"] = CdmGraph;
