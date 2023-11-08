globalThis._importMeta_={url:import.meta.url,env:process.env};import { getRequestDependencies, getPreloadLinks, getPrefetchLinks, createRenderer } from 'vue-bundle-renderer/runtime';
import { stringify as stringify$1, uneval } from 'devalue';
import { renderToString, ssrRenderAttrs, ssrInterpolate, ssrRenderSuspense, ssrRenderComponent, ssrRenderVNode } from 'vue/server-renderer';
import { renderSSRHead } from '@unhead/ssr';
import { promises, existsSync } from 'fs';
import { dirname as dirname$1, resolve as resolve$1, join } from 'path';
import { promises as promises$1 } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { version, unref, ref, watchEffect, watch as watch$1, getCurrentInstance, hasInjectionContext, inject, useSSRContext, createApp as createApp$1, effectScope, reactive, mergeProps, provide, onErrorCaptured, onServerPrefetch, createVNode, resolveDynamicComponent, toRef, h, isReadonly, defineAsyncComponent, isRef, isShallow, isReactive, toRaw, withCtx, createTextVNode, toDisplayString, defineComponent, computed, resolveComponent } from 'vue';
import { createServerHead as createServerHead$1, getActiveHead } from 'unhead';
import { defineHeadPlugin, composableNames } from '@unhead/shared';
import http from 'node:http';
import https from 'node:https';

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = {};
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map((_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}
const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
const PROTOCOL_SCRIPT_RE = /^[\s\0]*(blob|data|javascript|vbscript):$/i;
function isScriptProtocol(protocol) {
  return !!protocol && PROTOCOL_SCRIPT_RE.test(protocol);
}
const TRAILING_SLASH_RE = /\/$|\/\?/;
function hasTrailingSlash(input = "", queryParameters = false) {
  if (!queryParameters) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", queryParameters = false) {
  if (!queryParameters) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  const [s0, ...s] = input.split("?");
  return (s0.slice(0, -1) || "/") + (s.length > 0 ? `?${s.join("?")}` : "");
}
function withTrailingSlash(input = "", queryParameters = false) {
  if (!queryParameters) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  const [s0, ...s] = input.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "");
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    return input;
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function isEqual(a, b, options = {}) {
  if (!options.trailingSlash) {
    a = withTrailingSlash(a);
    b = withTrailingSlash(b);
  }
  if (!options.leadingSlash) {
    a = withLeadingSlash(a);
    b = withLeadingSlash(b);
  }
  if (!options.encoding) {
    a = decode(a);
    b = decode(b);
  }
  return a === b;
}

function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto,
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return defaultProto ? parseURL(defaultProto + input) : parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  const [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  const { pathname, search, hash } = parsePath(
    path.replace(/\/(?=[A-Za-z]:)/, "")
  );
  return {
    protocol,
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol ? parsed.protocol + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    // @ts-ignore
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode !== void 0) {
      node = nextNode;
    } else {
      node = node.placeholderChildNode;
      if (node !== null) {
        params[node.paramName] = section;
        paramsFound = true;
      } else {
        break;
      }
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildNode = childNode;
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      node = childNode;
    }
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections[sections.length - 1];
    node.data = null;
    if (Object.keys(node.children).length === 0) {
      const parentNode = node.parent;
      parentNode.children.delete(lastSection);
      parentNode.wildcardChildNode = null;
      parentNode.placeholderChildNode = null;
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildNode: null
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table);
}
function _createMatcher(table) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table) {
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path.startsWith(key)) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        table.static.set(path, node.data);
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  const _value = value.trim();
  if (
    // eslint-disable-next-line unicorn/prefer-at
    value[0] === '"' && value.at(-1) === '"' && !value.includes("\\")
  ) {
    return _value.slice(1, -1);
  }
  if (_value.length <= 9) {
    const _lval = _value.toLowerCase();
    if (_lval === "true") {
      return true;
    }
    if (_lval === "false") {
      return false;
    }
    if (_lval === "undefined") {
      return void 0;
    }
    if (_lval === "null") {
      return null;
    }
    if (_lval === "nan") {
      return Number.NaN;
    }
    if (_lval === "infinity") {
      return Number.POSITIVE_INFINITY;
    }
    if (_lval === "-infinity") {
      return Number.NEGATIVE_INFINITY;
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!_isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (_isPlainObject(value) && _isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function _isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function rawHeaders(headers) {
  const rawHeaders2 = [];
  for (const key in headers) {
    if (Array.isArray(headers[key])) {
      for (const h of headers[key]) {
        rawHeaders2.push(key, h);
      }
    } else {
      rawHeaders2.push(key, headers[key]);
    }
  }
  return rawHeaders2;
}
function mergeFns(...functions) {
  return function(...args) {
    for (const fn of functions) {
      fn(...args);
    }
  };
}
function createNotImplementedError(name) {
  throw new Error(`[unenv] ${name} is not implemented yet!`);
}

let defaultMaxListeners = 10;
let EventEmitter$1 = class EventEmitter {
  __unenv__ = true;
  _events = /* @__PURE__ */ Object.create(null);
  _maxListeners;
  static get defaultMaxListeners() {
    return defaultMaxListeners;
  }
  static set defaultMaxListeners(arg) {
    if (typeof arg !== "number" || arg < 0 || Number.isNaN(arg)) {
      throw new RangeError(
        'The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + "."
      );
    }
    defaultMaxListeners = arg;
  }
  setMaxListeners(n) {
    if (typeof n !== "number" || n < 0 || Number.isNaN(n)) {
      throw new RangeError(
        'The value of "n" is out of range. It must be a non-negative number. Received ' + n + "."
      );
    }
    this._maxListeners = n;
    return this;
  }
  getMaxListeners() {
    return _getMaxListeners(this);
  }
  emit(type, ...args) {
    if (!this._events[type] || this._events[type].length === 0) {
      return false;
    }
    if (type === "error") {
      let er;
      if (args.length > 0) {
        er = args[0];
      }
      if (er instanceof Error) {
        throw er;
      }
      const err = new Error(
        "Unhandled error." + (er ? " (" + er.message + ")" : "")
      );
      err.context = er;
      throw err;
    }
    for (const _listener of this._events[type]) {
      (_listener.listener || _listener).apply(this, args);
    }
    return true;
  }
  addListener(type, listener) {
    return _addListener(this, type, listener, false);
  }
  on(type, listener) {
    return _addListener(this, type, listener, false);
  }
  prependListener(type, listener) {
    return _addListener(this, type, listener, true);
  }
  once(type, listener) {
    return this.on(type, _wrapOnce(this, type, listener));
  }
  prependOnceListener(type, listener) {
    return this.prependListener(type, _wrapOnce(this, type, listener));
  }
  removeListener(type, listener) {
    return _removeListener(this, type, listener);
  }
  off(type, listener) {
    return this.removeListener(type, listener);
  }
  removeAllListeners(type) {
    return _removeAllListeners(this, type);
  }
  listeners(type) {
    return _listeners(this, type, true);
  }
  rawListeners(type) {
    return _listeners(this, type, false);
  }
  listenerCount(type) {
    return this.rawListeners(type).length;
  }
  eventNames() {
    return Object.keys(this._events);
  }
};
function _addListener(target, type, listener, prepend) {
  _checkListener(listener);
  if (target._events.newListener !== void 0) {
    target.emit("newListener", type, listener.listener || listener);
  }
  if (!target._events[type]) {
    target._events[type] = [];
  }
  if (prepend) {
    target._events[type].unshift(listener);
  } else {
    target._events[type].push(listener);
  }
  const maxListeners = _getMaxListeners(target);
  if (maxListeners > 0 && target._events[type].length > maxListeners && !target._events[type].warned) {
    target._events[type].warned = true;
    const warning = new Error(
      `[unenv] Possible EventEmitter memory leak detected. ${target._events[type].length} ${type} listeners added. Use emitter.setMaxListeners() to increase limit`
    );
    warning.name = "MaxListenersExceededWarning";
    warning.emitter = target;
    warning.type = type;
    warning.count = target._events[type]?.length;
    console.warn(warning);
  }
  return target;
}
function _removeListener(target, type, listener) {
  _checkListener(listener);
  if (!target._events[type] || target._events[type].length === 0) {
    return target;
  }
  const lenBeforeFilter = target._events[type].length;
  target._events[type] = target._events[type].filter((fn) => fn !== listener);
  if (lenBeforeFilter === target._events[type].length) {
    return target;
  }
  if (target._events.removeListener) {
    target.emit("removeListener", type, listener.listener || listener);
  }
  if (target._events[type].length === 0) {
    delete target._events[type];
  }
  return target;
}
function _removeAllListeners(target, type) {
  if (!target._events[type] || target._events[type].length === 0) {
    return target;
  }
  if (target._events.removeListener) {
    for (const _listener of target._events[type]) {
      target.emit("removeListener", type, _listener.listener || _listener);
    }
  }
  delete target._events[type];
  return target;
}
function _wrapOnce(target, type, listener) {
  let fired = false;
  const wrapper = (...args) => {
    if (fired) {
      return;
    }
    target.removeListener(type, wrapper);
    fired = true;
    return args.length === 0 ? listener.call(target) : listener.apply(target, args);
  };
  wrapper.listener = listener;
  return wrapper;
}
function _getMaxListeners(target) {
  return target._maxListeners ?? EventEmitter$1.defaultMaxListeners;
}
function _listeners(target, type, unwrap) {
  let listeners = target._events[type];
  if (typeof listeners === "function") {
    listeners = [listeners];
  }
  return unwrap ? listeners.map((l) => l.listener || l) : listeners;
}
function _checkListener(listener) {
  if (typeof listener !== "function") {
    throw new TypeError(
      'The "listener" argument must be of type Function. Received type ' + typeof listener
    );
  }
}

const EventEmitter = globalThis.EventEmitter || EventEmitter$1;

class _Readable extends EventEmitter {
  __unenv__ = true;
  readableEncoding = null;
  readableEnded = true;
  readableFlowing = false;
  readableHighWaterMark = 0;
  readableLength = 0;
  readableObjectMode = false;
  readableAborted = false;
  readableDidRead = false;
  closed = false;
  errored = null;
  readable = false;
  destroyed = false;
  static from(_iterable, options) {
    return new _Readable(options);
  }
  constructor(_opts) {
    super();
  }
  _read(_size) {
  }
  read(_size) {
  }
  setEncoding(_encoding) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  isPaused() {
    return true;
  }
  unpipe(_destination) {
    return this;
  }
  unshift(_chunk, _encoding) {
  }
  wrap(_oldStream) {
    return this;
  }
  push(_chunk, _encoding) {
    return false;
  }
  _destroy(_error, _callback) {
    this.removeAllListeners();
  }
  destroy(error) {
    this.destroyed = true;
    this._destroy(error);
    return this;
  }
  pipe(_destenition, _options) {
    return {};
  }
  compose(stream, options) {
    throw new Error("[unenv] Method not implemented.");
  }
  [Symbol.asyncDispose]() {
    this.destroy();
    return Promise.resolve();
  }
  async *[Symbol.asyncIterator]() {
    throw createNotImplementedError("Readable.asyncIterator");
  }
  iterator(options) {
    throw createNotImplementedError("Readable.iterator");
  }
  map(fn, options) {
    throw createNotImplementedError("Readable.map");
  }
  filter(fn, options) {
    throw createNotImplementedError("Readable.filter");
  }
  forEach(fn, options) {
    throw createNotImplementedError("Readable.forEach");
  }
  reduce(fn, initialValue, options) {
    throw createNotImplementedError("Readable.reduce");
  }
  find(fn, options) {
    throw createNotImplementedError("Readable.find");
  }
  findIndex(fn, options) {
    throw createNotImplementedError("Readable.findIndex");
  }
  some(fn, options) {
    throw createNotImplementedError("Readable.some");
  }
  toArray(options) {
    throw createNotImplementedError("Readable.toArray");
  }
  every(fn, options) {
    throw createNotImplementedError("Readable.every");
  }
  flatMap(fn, options) {
    throw createNotImplementedError("Readable.flatMap");
  }
  drop(limit, options) {
    throw createNotImplementedError("Readable.drop");
  }
  take(limit, options) {
    throw createNotImplementedError("Readable.take");
  }
  asIndexedPairs(options) {
    throw createNotImplementedError("Readable.asIndexedPairs");
  }
}
const Readable = globalThis.Readable || _Readable;

class _Writable extends EventEmitter {
  __unenv__ = true;
  writable = true;
  writableEnded = false;
  writableFinished = false;
  writableHighWaterMark = 0;
  writableLength = 0;
  writableObjectMode = false;
  writableCorked = 0;
  closed = false;
  errored = null;
  writableNeedDrain = false;
  destroyed = false;
  _data;
  _encoding = "utf-8";
  constructor(_opts) {
    super();
  }
  pipe(_destenition, _options) {
    return {};
  }
  _write(chunk, encoding, callback) {
    if (this.writableEnded) {
      if (callback) {
        callback();
      }
      return;
    }
    if (this._data === void 0) {
      this._data = chunk;
    } else {
      const a = typeof this._data === "string" ? Buffer.from(this._data, this._encoding || encoding || "utf8") : this._data;
      const b = typeof chunk === "string" ? Buffer.from(chunk, encoding || this._encoding || "utf8") : chunk;
      this._data = Buffer.concat([a, b]);
    }
    this._encoding = encoding;
    if (callback) {
      callback();
    }
  }
  _writev(_chunks, _callback) {
  }
  _destroy(_error, _callback) {
  }
  _final(_callback) {
  }
  write(chunk, arg2, arg3) {
    const encoding = typeof arg2 === "string" ? this._encoding : "utf-8";
    const cb = typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
    this._write(chunk, encoding, cb);
    return true;
  }
  setDefaultEncoding(_encoding) {
    return this;
  }
  end(arg1, arg2, arg3) {
    const callback = typeof arg1 === "function" ? arg1 : typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
    if (this.writableEnded) {
      if (callback) {
        callback();
      }
      return this;
    }
    const data = arg1 === callback ? void 0 : arg1;
    if (data) {
      const encoding = arg2 === callback ? void 0 : arg2;
      this.write(data, encoding, callback);
    }
    this.writableEnded = true;
    this.writableFinished = true;
    this.emit("close");
    this.emit("finish");
    return this;
  }
  cork() {
  }
  uncork() {
  }
  destroy(_error) {
    this.destroyed = true;
    delete this._data;
    this.removeAllListeners();
    return this;
  }
  compose(stream, options) {
    throw new Error("[h3] Method not implemented.");
  }
}
const Writable = globalThis.Writable || _Writable;

const __Duplex = class {
  allowHalfOpen = true;
  _destroy;
  constructor(readable = new Readable(), writable = new Writable()) {
    Object.assign(this, readable);
    Object.assign(this, writable);
    this._destroy = mergeFns(readable._destroy, writable._destroy);
  }
};
function getDuplex() {
  Object.assign(__Duplex.prototype, Readable.prototype);
  Object.assign(__Duplex.prototype, Writable.prototype);
  return __Duplex;
}
const _Duplex = /* @__PURE__ */ getDuplex();
const Duplex = globalThis.Duplex || _Duplex;

class Socket extends Duplex {
  __unenv__ = true;
  bufferSize = 0;
  bytesRead = 0;
  bytesWritten = 0;
  connecting = false;
  destroyed = false;
  pending = false;
  localAddress = "";
  localPort = 0;
  remoteAddress = "";
  remoteFamily = "";
  remotePort = 0;
  readyState = "readOnly";
  constructor(_options) {
    super();
  }
  write(_buffer, _arg1, _arg2) {
    return false;
  }
  connect(_arg1, _arg2, _arg3) {
    return this;
  }
  end(_arg1, _arg2, _arg3) {
    return this;
  }
  setEncoding(_encoding) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  setTimeout(_timeout, _callback) {
    return this;
  }
  setNoDelay(_noDelay) {
    return this;
  }
  setKeepAlive(_enable, _initialDelay) {
    return this;
  }
  address() {
    return {};
  }
  unref() {
    return this;
  }
  ref() {
    return this;
  }
  resetAndDestroy() {
    const err = new Error("ERR_SOCKET_CLOSED");
    err.code = "ERR_SOCKET_CLOSED";
    this.destroy(err);
    return this;
  }
}

class IncomingMessage extends Readable {
  __unenv__ = {};
  aborted = false;
  httpVersion = "1.1";
  httpVersionMajor = 1;
  httpVersionMinor = 1;
  complete = true;
  connection;
  socket;
  headers = {};
  trailers = {};
  method = "GET";
  url = "/";
  statusCode = 200;
  statusMessage = "";
  closed = false;
  errored = null;
  readable = false;
  constructor(socket) {
    super();
    this.socket = this.connection = socket || new Socket();
  }
  get rawHeaders() {
    return rawHeaders(this.headers);
  }
  get rawTrailers() {
    return [];
  }
  setTimeout(_msecs, _callback) {
    return this;
  }
  get headersDistinct() {
    return _distinct(this.headers);
  }
  get trailersDistinct() {
    return _distinct(this.trailers);
  }
}
function _distinct(obj) {
  const d = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key) {
      d[key] = (Array.isArray(value) ? value : [value]).filter(
        Boolean
      );
    }
  }
  return d;
}

class ServerResponse extends Writable {
  __unenv__ = true;
  statusCode = 200;
  statusMessage = "";
  upgrading = false;
  chunkedEncoding = false;
  shouldKeepAlive = false;
  useChunkedEncodingByDefault = false;
  sendDate = false;
  finished = false;
  headersSent = false;
  strictContentLength = false;
  connection = null;
  socket = null;
  req;
  _headers = {};
  constructor(req) {
    super();
    this.req = req;
  }
  assignSocket(socket) {
    socket._httpMessage = this;
    this.socket = socket;
    this.connection = socket;
    this.emit("socket", socket);
    this._flush();
  }
  _flush() {
    this.flushHeaders();
  }
  detachSocket(_socket) {
  }
  writeContinue(_callback) {
  }
  writeHead(statusCode, arg1, arg2) {
    if (statusCode) {
      this.statusCode = statusCode;
    }
    if (typeof arg1 === "string") {
      this.statusMessage = arg1;
      arg1 = void 0;
    }
    const headers = arg2 || arg1;
    if (headers) {
      if (Array.isArray(headers)) ; else {
        for (const key in headers) {
          this.setHeader(key, headers[key]);
        }
      }
    }
    this.headersSent = true;
    return this;
  }
  writeProcessing() {
  }
  setTimeout(_msecs, _callback) {
    return this;
  }
  appendHeader(name, value) {
    name = name.toLowerCase();
    const current = this._headers[name];
    const all = [
      ...Array.isArray(current) ? current : [current],
      ...Array.isArray(value) ? value : [value]
    ].filter(Boolean);
    this._headers[name] = all.length > 1 ? all : all[0];
    return this;
  }
  setHeader(name, value) {
    this._headers[name.toLowerCase()] = value;
    return this;
  }
  getHeader(name) {
    return this._headers[name.toLowerCase()];
  }
  getHeaders() {
    return this._headers;
  }
  getHeaderNames() {
    return Object.keys(this._headers);
  }
  hasHeader(name) {
    return name.toLowerCase() in this._headers;
  }
  removeHeader(name) {
    delete this._headers[name.toLowerCase()];
  }
  addTrailers(_headers) {
  }
  flushHeaders() {
  }
  writeEarlyHints(_headers, cb) {
    if (typeof cb === "function") {
      cb();
    }
  }
}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class H3Error extends Error {
  constructor(message, opts = {}) {
    super(message, opts);
    __publicField$1(this, "statusCode", 500);
    __publicField$1(this, "fatal", false);
    __publicField$1(this, "unhandled", false);
    __publicField$1(this, "statusMessage");
    __publicField$1(this, "data");
    __publicField$1(this, "cause");
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
__publicField$1(H3Error, "__h3_error__", true);
function createError$2(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$2(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery(event) {
  return getQuery$1(event.path || "");
}
function isMethod(event, expected, allowHead) {
  if (allowHead && event.method === "HEAD") {
    return true;
  }
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError$2({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}

const RawBodySymbol = Symbol.for("h3RawBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "")) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  return event.web?.request?.body || event._requestBody || new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start, cookiesString.length));
    }
  }
  return cookiesStrings;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(name, value);
  }
}
const setHeaders = setResponseHeaders;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders(
    getProxyRequestHeaders(event),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  const response = await _getFetch(opts.fetch)(target, {
    headers: opts.headers,
    ignoreResponseError: true,
    // make $ofetch.raw transparent
    ...opts.fetchOptions
  });
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name)) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    for (const [key, value] of Object.entries(input)) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class H3Event {
  constructor(req, res) {
    __publicField(this, "__is_event__", true);
    // Context
    __publicField(this, "node");
    // Node
    __publicField(this, "web");
    // Web
    __publicField(this, "context", {});
    // Shared
    // Request
    __publicField(this, "_method");
    __publicField(this, "_path");
    __publicField(this, "_headers");
    __publicField(this, "_requestBody");
    // Response
    __publicField(this, "_handled", false);
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. **/
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. **/
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    return Object.assign(handler, { __is_handler__: true });
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  return Object.assign(_handler, { __is_handler__: true });
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler = r.default || r;
        if (typeof handler !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler
          );
        }
        _resolved = toEventHandler(r.default || r);
        return _resolved;
      });
    }
    return _promise;
  };
  return eventHandler((event) => {
    if (_resolved) {
      return _resolved(event);
    }
    return resolveHandler().then((handler) => handler(event));
  });
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const app = {
    // @ts-ignore
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    handler,
    stack,
    options
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(
      normalizeLayer({ ...arg2, route: "/", handler: arg1 })
    );
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$2({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      await options.onAfterResponse(event, void 0);
    }
  });
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$2(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$2({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  router.handler = eventHandler((event) => {
    let path = event.path || "/";
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      if (opts.preemptive || opts.preemtive) {
        throw createError$2({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${event.path || "/"}.`
        });
      } else {
        return;
      }
    }
    const method = (event.node.req.method || "get").toLowerCase();
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      if (opts.preemptive || opts.preemtive) {
        throw createError$2({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        });
      } else {
        return;
      }
    }
    event.context.matchedRoute = matched;
    const params = matched.params || {};
    event.context.params = params;
    return Promise.resolve(handler(event)).then((res) => {
      if (res === void 0 && (opts.preemptive || opts.preemtive)) {
        return null;
      }
      return res;
    });
  });
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$2(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      await sendError(event, error, !!app.options.debug);
    }
  };
  return toNodeHandle;
}

const s=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function mergeFetchOptions(input, defaults, Headers = globalThis.Headers) {
  const merged = {
    ...defaults,
    ...input
  };
  if (defaults?.params && input?.params) {
    merged.params = {
      ...defaults?.params,
      ...input?.params
    };
  }
  if (defaults?.query && input?.query) {
    merged.query = {
      ...defaults?.query,
      ...input?.query
    };
  }
  if (defaults?.headers && input?.headers) {
    merged.headers = new Headers(defaults?.headers || {});
    for (const [key, value] of new Headers(input?.headers || {})) {
      merged.headers.set(key, value);
    }
  }
  return merged;
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  //  Gateway Timeout
]);
const nullBodyResponses$1 = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch$1(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1,
          timeout: context.options.timeout
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: mergeFetchOptions(_options, globalOptions.defaults, Headers),
      response: void 0,
      error: void 0
    };
    context.options.method = context.options.method?.toUpperCase();
    if (context.options.onRequest) {
      await context.options.onRequest(context);
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query || context.options.params) {
        context.request = withQuery(context.request, {
          ...context.options.params,
          ...context.options.query
        });
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        context.options.body = typeof context.options.body === "string" ? context.options.body : JSON.stringify(context.options.body);
        context.options.headers = new Headers(context.options.headers || {});
        if (!context.options.headers.has("content-type")) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await context.options.onRequestError(context);
      }
      return await onError(context);
    }
    const hasBody = context.response.body && !nullBodyResponses$1.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await context.options.onResponse(context);
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await context.options.onResponseError(context);
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}) => createFetch$1({
    ...globalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch || createNodeFetch();
const Headers$1 = globalThis.Headers || s;
const AbortController = globalThis.AbortController || i;
const ofetch = createFetch$1({ fetch, Headers: Headers$1, AbortController });
const $fetch = ofetch;

const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createCall(handle) {
  return function callHandle(context) {
    const req = new IncomingMessage();
    const res = new ServerResponse(req);
    req.url = context.url || "/";
    req.method = context.method || "GET";
    req.headers = {};
    if (context.headers) {
      const headerEntries = typeof context.headers.entries === "function" ? context.headers.entries() : Object.entries(context.headers);
      for (const [name, value] of headerEntries) {
        if (!value) {
          continue;
        }
        req.headers[name.toLowerCase()] = value;
      }
    }
    req.headers.host = req.headers.host || context.host || "localhost";
    req.connection.encrypted = // @ts-ignore
    req.connection.encrypted || context.protocol === "https";
    req.body = context.body || null;
    req.__unenv__ = context.context;
    return handle(req, res).then(() => {
      let body = res._data;
      if (nullBodyResponses.has(res.statusCode) || req.method.toUpperCase() === "HEAD") {
        body = null;
        delete res._headers["content-length"];
      }
      const r = {
        body,
        headers: res._headers,
        status: res.statusCode,
        statusText: res.statusMessage
      };
      req.destroy();
      res.destroy();
      return r;
    });
  };
}

function createFetch(call, _fetch = global.fetch) {
  return async function ufetch(input, init) {
    const url = input.toString();
    if (!url.startsWith("/")) {
      return _fetch(url, init);
    }
    try {
      const r = await call({ url, ...init });
      return new Response(r.body, {
        status: r.status,
        statusText: r.statusText,
        headers: Object.fromEntries(
          Object.entries(r.headers).map(([name, value]) => [
            name,
            Array.isArray(value) ? value.join(",") : String(value) || ""
          ])
        )
      });
    } catch (error) {
      return new Response(error.toString(), {
        status: Number.parseInt(error.statusCode || error.code) || 500,
        statusText: error.statusText
      });
    }
  };
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char.toUpperCase() === char;
}
function splitByCase(string_, separators) {
  const splitters = separators ?? STR_SPLITTERS;
  const parts = [];
  if (!string_ || typeof string_ !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of string_) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff[buff.length - 1];
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(string_, joiner) {
  return !string_ ? "" : (Array.isArray(string_) ? string_ : splitByCase(string_)).map((p) => p.toLowerCase()).join(joiner ?? "-");
}
function snakeCase(string_) {
  return kebabCase(string_, "_");
}

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {
  "nuxt": {
    "buildId": "0956bf05-e04e-4c3f-9aa0-2619823e8cba"
  }
};



const appConfig$1 = defuFn(inlineAppConfig);

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": "https://y7sllzb2hyxilfzl5g26cpzf6a0soluc.lambda-url.ap-northeast-1.on.aws/"
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {}
};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
const _sharedRuntimeConfig = _deepFreeze(
  _applyEnv(klona(_inlineRuntimeConfig))
);
function useRuntimeConfig$1(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  _applyEnv(runtimeConfig);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig$1));
function _getEnv(key) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function _applyEnv(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = _getEnv(subKey);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      _applyEnv(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
  return obj;
}
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig$1();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

const defaults = Object.freeze({
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false,
  excludeKeys: void 0,
  excludeValues: void 0,
  replacer: void 0
});
function objectHash(object, options) {
  if (options) {
    options = { ...defaults, ...options };
  } else {
    options = defaults;
  }
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
const defaultPrototypesKeys = Object.freeze([
  "prototype",
  "__proto__",
  "constructor"
]);
function createHasher(options) {
  let buff = "";
  let context = /* @__PURE__ */ new Map();
  const write = (str) => {
    buff += str;
  };
  return {
    toString() {
      return buff;
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    },
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      if (objectLength < 10) {
        objType = "unknown:[" + objString + "]";
      } else {
        objType = objString.slice(8, objectLength - 1);
      }
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = context.get(object)) === void 0) {
        context.set(object, context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else if (!options.ignoreUnknown) {
          this.unkown(object, objType);
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        let extraKeys = [];
        if (options.respectType !== false && !isNativeFunction(object)) {
          extraKeys = defaultPrototypesKeys;
        }
        if (options.excludeKeys) {
          keys = keys.filter((key) => {
            return !options.excludeKeys(key);
          });
          extraKeys = extraKeys.filter((key) => {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    },
    array(arr, unordered) {
      unordered = unordered === void 0 ? options.unorderedArrays !== false : unordered;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry);
        for (const [key, value] of hasher.getContext()) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    },
    date(date) {
      return write("date:" + date.toJSON());
    },
    symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    unkown(value, type) {
      write(type);
      if (!value) {
        return;
      }
      write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          Array.from(value.entries()),
          true
          /* ordered */
        );
      }
    },
    error(err) {
      return write("error:" + err.toString());
    },
    boolean(bool) {
      return write("bool:" + bool);
    },
    string(string) {
      write("string:" + string.length + ":");
      write(string);
    },
    function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this.object(fn);
      }
    },
    number(number) {
      return write("number:" + number);
    },
    xml(xml) {
      return write("xml:" + xml.toString());
    },
    null() {
      return write("Null");
    },
    undefined() {
      return write("Undefined");
    },
    regexp(regex) {
      return write("regex:" + regex.toString());
    },
    uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    url(url) {
      return write("url:" + url.toString());
    },
    map(map) {
      write("map:");
      const arr = [...map];
      return this.array(arr, options.unorderedSets !== false);
    },
    set(set) {
      write("set:");
      const arr = [...set];
      return this.array(arr, options.unorderedSets !== false);
    },
    file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error(
        'Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n'
      );
    },
    domwindow() {
      return write("domwindow");
    },
    bigint(number) {
      return write("bigint:" + number.toString());
    },
    /* Node.js standard native objects */
    process() {
      return write("process");
    },
    timer() {
      return write("timer");
    },
    pipe() {
      return write("pipe");
    },
    tcp() {
      return write("tcp");
    },
    udp() {
      return write("udp");
    },
    tty() {
      return write("tty");
    },
    statwatcher() {
      return write("statwatcher");
    },
    securecontext() {
      return write("securecontext");
    },
    connection() {
      return write("connection");
    },
    zlib() {
      return write("zlib");
    },
    context() {
      return write("context");
    },
    nodescript() {
      return write("nodescript");
    },
    httpparser() {
      return write("httpparser");
    },
    dataview() {
      return write("dataview");
    },
    signal() {
      return write("signal");
    },
    fsevent() {
      return write("fsevent");
    },
    tlswrap() {
      return write("tlswrap");
    }
  };
}
const nativeFunc = "[native code] }";
const nativeFuncLength = nativeFunc.length;
function isNativeFunction(f) {
  if (typeof f !== "function") {
    return false;
  }
  return Function.prototype.toString.call(f).slice(-nativeFuncLength) === nativeFunc;
}

class WordArray {
  constructor(words, sigBytes) {
    words = this.words = words || [];
    this.sigBytes = sigBytes === void 0 ? words.length * 4 : sigBytes;
  }
  toString(encoder) {
    return (encoder || Hex).stringify(this);
  }
  concat(wordArray) {
    this.clamp();
    if (this.sigBytes % 4) {
      for (let i = 0; i < wordArray.sigBytes; i++) {
        const thatByte = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
        this.words[this.sigBytes + i >>> 2] |= thatByte << 24 - (this.sigBytes + i) % 4 * 8;
      }
    } else {
      for (let j = 0; j < wordArray.sigBytes; j += 4) {
        this.words[this.sigBytes + j >>> 2] = wordArray.words[j >>> 2];
      }
    }
    this.sigBytes += wordArray.sigBytes;
    return this;
  }
  clamp() {
    this.words[this.sigBytes >>> 2] &= 4294967295 << 32 - this.sigBytes % 4 * 8;
    this.words.length = Math.ceil(this.sigBytes / 4);
  }
  clone() {
    return new WordArray([...this.words]);
  }
}
const Hex = {
  stringify(wordArray) {
    const hexChars = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const bite = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      hexChars.push((bite >>> 4).toString(16), (bite & 15).toString(16));
    }
    return hexChars.join("");
  }
};
const Base64 = {
  stringify(wordArray) {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const base64Chars = [];
    for (let i = 0; i < wordArray.sigBytes; i += 3) {
      const byte1 = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      const byte2 = wordArray.words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
      const byte3 = wordArray.words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
      const triplet = byte1 << 16 | byte2 << 8 | byte3;
      for (let j = 0; j < 4 && i * 8 + j * 6 < wordArray.sigBytes * 8; j++) {
        base64Chars.push(keyStr.charAt(triplet >>> 6 * (3 - j) & 63));
      }
    }
    return base64Chars.join("");
  }
};
const Latin1 = {
  parse(latin1Str) {
    const latin1StrLength = latin1Str.length;
    const words = [];
    for (let i = 0; i < latin1StrLength; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
    }
    return new WordArray(words, latin1StrLength);
  }
};
const Utf8 = {
  parse(utf8Str) {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  }
};
class BufferedBlockAlgorithm {
  constructor() {
    this._data = new WordArray();
    this._nDataBytes = 0;
    this._minBufferSize = 0;
    this.blockSize = 512 / 32;
  }
  reset() {
    this._data = new WordArray();
    this._nDataBytes = 0;
  }
  _append(data) {
    if (typeof data === "string") {
      data = Utf8.parse(data);
    }
    this._data.concat(data);
    this._nDataBytes += data.sigBytes;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _doProcessBlock(_dataWords, _offset) {
  }
  _process(doFlush) {
    let processedWords;
    let nBlocksReady = this._data.sigBytes / (this.blockSize * 4);
    if (doFlush) {
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    }
    const nWordsReady = nBlocksReady * this.blockSize;
    const nBytesReady = Math.min(nWordsReady * 4, this._data.sigBytes);
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += this.blockSize) {
        this._doProcessBlock(this._data.words, offset);
      }
      processedWords = this._data.words.splice(0, nWordsReady);
      this._data.sigBytes -= nBytesReady;
    }
    return new WordArray(processedWords, nBytesReady);
  }
}
class Hasher extends BufferedBlockAlgorithm {
  update(messageUpdate) {
    this._append(messageUpdate);
    this._process();
    return this;
  }
  finalize(messageUpdate) {
    if (messageUpdate) {
      this._append(messageUpdate);
    }
  }
}

const H = [
  1779033703,
  -1150833019,
  1013904242,
  -1521486534,
  1359893119,
  -1694144372,
  528734635,
  1541459225
];
const K = [
  1116352408,
  1899447441,
  -1245643825,
  -373957723,
  961987163,
  1508970993,
  -1841331548,
  -1424204075,
  -670586216,
  310598401,
  607225278,
  1426881987,
  1925078388,
  -2132889090,
  -1680079193,
  -1046744716,
  -459576895,
  -272742522,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  -1740746414,
  -1473132947,
  -1341970488,
  -1084653625,
  -958395405,
  -710438585,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  -2117940946,
  -1838011259,
  -1564481375,
  -1474664885,
  -1035236496,
  -949202525,
  -778901479,
  -694614492,
  -200395387,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  -2067236844,
  -1933114872,
  -1866530822,
  -1538233109,
  -1090935817,
  -965641998
];
const W = [];
class SHA256 extends Hasher {
  constructor() {
    super(...arguments);
    this._hash = new WordArray([...H]);
  }
  reset() {
    super.reset();
    this._hash = new WordArray([...H]);
  }
  _doProcessBlock(M, offset) {
    const H2 = this._hash.words;
    let a = H2[0];
    let b = H2[1];
    let c = H2[2];
    let d = H2[3];
    let e = H2[4];
    let f = H2[5];
    let g = H2[6];
    let h = H2[7];
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = M[offset + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
        const gamma1x = W[i - 2];
        const gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
      }
      const ch = e & f ^ ~e & g;
      const maj = a & b ^ a & c ^ b & c;
      const sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
      const sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
      const t1 = h + sigma1 + ch + K[i] + W[i];
      const t2 = sigma0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H2[0] = H2[0] + a | 0;
    H2[1] = H2[1] + b | 0;
    H2[2] = H2[2] + c | 0;
    H2[3] = H2[3] + d | 0;
    H2[4] = H2[4] + e | 0;
    H2[5] = H2[5] + f | 0;
    H2[6] = H2[6] + g | 0;
    H2[7] = H2[7] + h | 0;
  }
  finalize(messageUpdate) {
    super.finalize(messageUpdate);
    const nBitsTotal = this._nDataBytes * 8;
    const nBitsLeft = this._data.sigBytes * 8;
    this._data.words[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(
      nBitsTotal / 4294967296
    );
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
    this._data.sigBytes = this._data.words.length * 4;
    this._process();
    return this._hash;
  }
}
function sha256base64(message) {
  return new SHA256().finalize(message).toString(Base64);
}

function hash(object, options = {}) {
  const hashed = typeof object === "string" ? object : objectHash(object, options);
  return sha256base64(hashed).slice(0, 10);
}

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
function checkBufferSupport() {
  if (typeof Buffer === void 0) {
    throw new TypeError("[unstorage] Buffer is not supported!");
  }
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  checkBufferSupport();
  const base64 = Buffer.from(value).toString("base64");
  return BASE64_PREFIX + base64;
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  checkBufferSupport();
  return Buffer.from(value.slice(BASE64_PREFIX.length), "base64");
}

const storageKeyProperties = [
  "hasItem",
  "getItem",
  "getItemRaw",
  "setItem",
  "setItemRaw",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0].replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    options: {},
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) || null;
    },
    getItemRaw(key) {
      return data.get(key) || null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return Array.from(data.keys());
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          await asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      for (const mount of mounts) {
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        const keys = rawKeys.map((key) => mount.mountpoint + normalizeKey$1(key)).filter((key) => !maskedMounts.some((p) => key.startsWith(p)));
        allKeys.push(...keys);
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      return base ? allKeys.filter((key) => key.startsWith(base) && !key.endsWith("$")) : allKeys.filter((key) => !key.endsWith("$"));
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    }
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0].replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError$1(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError$1(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError$1(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        const dirFiles = await readdirRecursive(entryPath, ignore);
        files.push(...dirFiles.map((f) => entry.name + "/" + f));
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.\:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError$1(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys() {
      return readdirRecursive(r("."), opts.ignore);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"D:\\MAD Developer\\Work\\Website\\Dexon\\www\\starter\\.data\\kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          const promise = useStorage().setItem(cacheKey, entry).catch((error) => {
            console.error(`[nitro] [cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event && event.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[nitro] [cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length > 0 ? hash(args, {}) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      const _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        variableHeaders[header] = incomingEvent.node.req.headers[header];
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            for (const header in headers2) {
              this.setHeader(header, headers2[header]);
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.context = incomingEvent.context;
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(event);
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString(value)
        );
      } else {
        event.node.res.setHeader(name, value);
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function normalizeError(error) {
  const cwd = typeof process.cwd === "function" ? process.cwd() : "/";
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Not Found" : "");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

const config = useRuntimeConfig$1();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      return sendRedirect(
        event,
        routeRules.redirect.to,
        routeRules.redirect.statusCode
      );
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$1(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig$1().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function createContext$1(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers$1.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers$1.delete(onLeave);
      }
    }
  };
}
function createNamespace$1(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext$1({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey$2 = "__unctx__";
const defaultNamespace = _globalThis$1[globalKey$2] || (_globalThis$1[globalKey$2] = createNamespace$1());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey$1 = "__unctx_async_handlers__";
const asyncHandlers$1 = _globalThis$1[asyncHandlersKey$1] || (_globalThis$1[asyncHandlersKey$1] = /* @__PURE__ */ new Set());

const plugins$1 = [
  
];

function defineRenderHandler(handler) {
  return eventHandler(async (event) => {
    if (event.path.endsWith("/favicon.ico")) {
      setResponseHeader(event, "Content-Type", "image/x-icon");
      return send(
        event,
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      );
    }
    const response = await handler(event);
    if (!response) {
      const _currentStatus = getResponseStatus(event);
      setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
      return send(
        event,
        "No response returned from render handler: " + event.path
      );
    }
    const nitroApp = useNitroApp();
    await nitroApp.hooks.callHook("render:response", response, { event });
    if (response.headers) {
      setResponseHeaders(event, response.headers);
    }
    if (response.statusCode || response.statusMessage) {
      setResponseStatus(event, response.statusCode, response.statusMessage);
    }
    return response.body;
  });
}

const errorHandler = (async function errorhandler(error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(error);
  const errorObject = {
    url: event.path,
    statusCode,
    statusMessage,
    message,
    stack: "",
    data: error.data
  };
  if (error.unhandled || error.fatal) {
    const tags = [
      "[nuxt]",
      "[request error]",
      error.unhandled && "[unhandled]",
      error.fatal && "[fatal]",
      Number(errorObject.statusCode) !== 200 && `[${errorObject.statusCode}]`
    ].filter(Boolean).join(" ");
    console.error(tags, errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (event.handled) {
    return;
  }
  setResponseStatus(event, errorObject.statusCode !== 200 && errorObject.statusCode || 500, errorObject.statusMessage);
  if (isJsonRequest(event)) {
    setResponseHeader(event, "Content-Type", "application/json");
    return send(event, JSON.stringify(errorObject));
  }
  const isErrorPage = event.path.startsWith("/__nuxt_error");
  const res = !isErrorPage ? await useNitroApp().localFetch(withQuery(joinURL(useRuntimeConfig$1().app.baseURL, "/__nuxt_error"), errorObject), {
    headers: getRequestHeaders(event),
    redirect: "manual"
  }).catch(() => null) : null;
  if (!res) {
    const { template } = await Promise.resolve().then(function () { return error500$1; });
    if (event.handled) {
      return;
    }
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  if (event.handled) {
    return;
  }
  for (const [header, value] of res.headers.entries()) {
    setResponseHeader(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : void 0, res.statusText);
  return send(event, html);
});

const assets = {
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"10be-n8egyE9tcb7sKGr/pYCaQ4uWqxI\"",
    "mtime": "2023-11-08T13:15:30.580Z",
    "size": 4286,
    "path": "../public/favicon.ico"
  },
  "/_nuxt/entry.3c4ebcd6.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2f5d-IUbnwWIn6QsALxMnWLcqWOVujSU\"",
    "mtime": "2023-11-08T17:09:03.885Z",
    "size": 12125,
    "path": "../public/_nuxt/entry.3c4ebcd6.css"
  },
  "/_nuxt/entry.798e9cf7.js": {
    "type": "application/javascript",
    "etag": "\"31810-gPmKQi+meW46dU+V7FE8J7JdvwE\"",
    "mtime": "2023-11-08T17:09:03.886Z",
    "size": 202768,
    "path": "../public/_nuxt/entry.798e9cf7.js"
  },
  "/_nuxt/error-404.7fc72018.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"e2e-iNt1cqPQ0WDudfCTZVQd31BeRGs\"",
    "mtime": "2023-11-08T17:09:03.886Z",
    "size": 3630,
    "path": "../public/_nuxt/error-404.7fc72018.css"
  },
  "/_nuxt/error-404.fcac8904.js": {
    "type": "application/javascript",
    "etag": "\"184d-kfIxSosN3wUQrwcaa9K0Jo2tqMc\"",
    "mtime": "2023-11-08T17:09:03.886Z",
    "size": 6221,
    "path": "../public/_nuxt/error-404.fcac8904.js"
  },
  "/_nuxt/error-500.c5df6088.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"79e-ByRo+49BgcevWdRjJy3CMx2IA5k\"",
    "mtime": "2023-11-08T17:09:03.885Z",
    "size": 1950,
    "path": "../public/_nuxt/error-500.c5df6088.css"
  },
  "/_nuxt/error-500.ff457e10.js": {
    "type": "application/javascript",
    "etag": "\"756-e2RxsESK75l7PdB1pJjAn8LE4Dg\"",
    "mtime": "2023-11-08T17:09:03.886Z",
    "size": 1878,
    "path": "../public/_nuxt/error-500.ff457e10.js"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-UKJkMM6nqEP1V+aKGhfZ7RprG3M\"",
    "mtime": "2023-11-08T17:09:04.884Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/_nuxt/builds/meta/0956bf05-e04e-4c3f-9aa0-2619823e8cba.json": {
    "type": "application/json",
    "etag": "\"8b-UN7WcYR898QTqOb4RzvOpM2/JMw\"",
    "mtime": "2023-11-08T17:09:04.884Z",
    "size": 139,
    "path": "../public/_nuxt/builds/meta/0956bf05-e04e-4c3f-9aa0-2619823e8cba.json"
  }
};

function normalizeWindowsPath(input = "") {
  if (!input || !input.includes("\\")) {
    return input;
  }
  return input.replace(/\\/g, "/");
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises$1.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta":{"maxAge":31536000},"/_nuxt/builds":{"maxAge":1},"/_nuxt":{"maxAge":31536000}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _f4b49z = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    setResponseHeader(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$2({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404
      });
    }
    return;
  }
  const ifNotMatch = getRequestHeader(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

const _lazy_01CanR = () => Promise.resolve().then(function () { return renderer$1; });

const handlers = [
  { route: '', handler: _f4b49z, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_01CanR, lazy: true, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_01CanR, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig$1();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((_err) => {
      console.error("Error while capturing another error", _err);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      await nitroApp.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const localCall = createCall(toNodeListener(h3App));
  const _localFetch = createFetch(localCall, globalThis.fetch);
  const localFetch = (input, init) => _localFetch(input, init).then(
    (response) => normalizeFetchResponse(response)
  );
  const $fetch = createFetch$1({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  h3App.use(
    eventHandler((event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const envContext = event.node.req?.__unenv__;
      if (envContext) {
        Object.assign(event.context, envContext);
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (envContext?.waitUntil) {
          envContext.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
    })
  );
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  for (const plugin of plugins$1) {
    try {
      plugin(app);
    } catch (err) {
      captureError(err, { tags: ["plugin"] });
      throw err;
    }
  }
  return app;
}
const nitroApp = createNitroApp();
const useNitroApp = () => nitroApp;

function normalizeLambdaIncomingHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers || {}).map(([key, value]) => [
      key.toLowerCase(),
      value
    ])
  );
}
function normalizeLambdaOutgoingHeaders(headers, stripCookies = false) {
  const entries = stripCookies ? Object.entries(headers).filter(([key]) => !["set-cookie"].includes(key)) : Object.entries(headers);
  return Object.fromEntries(
    entries.map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : String(v)])
  );
}
async function normalizeLambdaOutgoingBody(body, headers) {
  if (typeof body === "string") {
    return { type: "text", body };
  }
  if (!body) {
    return { type: "text", body: "" };
  }
  const buffer = await _toBuffer(body);
  const contentType = headers["content-type"] || "";
  return isTextType(contentType) ? { type: "text", body: buffer.toString("utf8") } : { type: "binary", body: buffer.toString("base64") };
}
function _toBuffer(data) {
  if ("pipeTo" in data && typeof data.pipeTo === "function") {
    return new Promise((resolve, reject) => {
      const chunks = [];
      data.pipeTo(
        new WritableStream({
          write(chunk) {
            chunks.push(chunk);
          },
          close() {
            resolve(Buffer.concat(chunks));
          },
          abort(reason) {
            reject(reason);
          }
        })
      ).catch(reject);
    });
  }
  if ("pipe" in data && typeof data.pipe === "function") {
    return new Promise((resolve, reject) => {
      const chunks = [];
      data.on("data", (chunk) => {
        chunks.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(chunks));
      }).on("error", reject);
    });
  }
  return Buffer.from(data);
}
const TEXT_TYPE_RE = /^text\/|\/(javascript|json|xml)|utf-?8/;
function isTextType(contentType = "") {
  return TEXT_TYPE_RE.test(contentType);
}

async function handler(event, context) {
  const query = {
    ...event.queryStringParameters,
    ...event.multiValueQueryStringParameters
  };
  const url = withQuery(
    event.path || event.rawPath,
    query
  );
  const method = event.httpMethod || event.requestContext?.http?.method || "get";
  if ("cookies" in event && event.cookies) {
    event.headers.cookie = event.cookies.join(";");
  }
  const r = await nitroApp.localCall({
    event,
    url,
    context,
    headers: normalizeLambdaIncomingHeaders(event.headers),
    method,
    query,
    body: event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body
  });
  const isApiGwV2 = "cookies" in event || "rawPath" in event;
  const awsBody = await normalizeLambdaOutgoingBody(r.body, r.headers);
  const cookies = normalizeCookieHeader(r.headers["set-cookie"]);
  return {
    ...cookies.length > 0 && {
      ...isApiGwV2 ? { cookies } : { multiValueHeaders: { "set-cookie": cookies } }
    },
    statusCode: r.status,
    headers: normalizeLambdaOutgoingHeaders(r.headers, true),
    body: awsBody.body,
    isBase64Encoded: awsBody.type === "binary"
  };
}

const _messages = {"appName":"Nuxt","version":"","statusCode":500,"statusMessage":"Server error","description":"This page is temporarily unavailable."};
const _render = function({ messages }) {
var __t, __p = '';
__p += '<!DOCTYPE html><html><head><title>' +
((__t = ( messages.statusCode )) == null ? '' : __t) +
' - ' +
((__t = ( messages.statusMessage )) == null ? '' : __t) +
' | ' +
((__t = ( messages.appName )) == null ? '' : __t) +
'</title><meta charset="utf-8"><meta content="width=device-width,initial-scale=1,minimum-scale=1" name="viewport"><style>.spotlight{background:linear-gradient(45deg, #00DC82 0%, #36E4DA 50%, #0047E1 100%);filter:blur(20vh)}*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e0e0e0}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}.bg-white{--tw-bg-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity))}.grid{display:-ms-grid;display:grid}.place-content-center{place-content:center}.font-sans{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji"}.font-medium{font-weight:500}.font-light{font-weight:300}.h-1\\/2{height:50%}.text-8xl{font-size:6rem;line-height:1}.text-xl{font-size:1.25rem;line-height:1.75rem}.leading-tight{line-height:1.25}.mb-8{margin-bottom:2rem}.mb-16{margin-bottom:4rem}.max-w-520px{max-width:520px}.min-h-screen{min-height:100vh}.overflow-hidden{overflow:hidden}.px-8{padding-left:2rem;padding-right:2rem}.fixed{position:fixed}.left-0{left:0}.right-0{right:0}.-bottom-1\\/2{bottom:-50%}.text-center{text-align:center}.text-black{--tw-text-opacity:1;color:rgba(0,0,0,var(--tw-text-opacity))}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}@media (min-width: 640px){.sm\\:text-4xl{font-size:2.25rem;line-height:2.5rem}.sm\\:text-10xl{font-size:10rem;line-height:1}.sm\\:px-0{padding-left:0;padding-right:0}}@media (prefers-color-scheme: dark){.dark\\:bg-black{--tw-bg-opacity:1;background-color:rgba(0,0,0,var(--tw-bg-opacity))}.dark\\:text-white{--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}}</style><script>(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll(\'link[rel="modulepreload"]\'))i(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function s(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(e){if(e.ep)return;e.ep=!0;const r=s(e);fetch(e.href,r)}})();</script></head><body class="font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden"><div class="fixed -bottom-1/2 left-0 right-0 h-1/2 spotlight"></div><div class="max-w-520px text-center"><h1 class="text-8xl sm:text-10xl font-medium mb-8">' +
((__t = ( messages.statusCode )) == null ? '' : __t) +
'</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight">' +
((__t = ( messages.description )) == null ? '' : __t) +
'</p></div></body></html>';
return __p
};
const _template = (messages) => _render({ messages: { ..._messages, ...messages } });
const template$1 = _template;

const error500$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  template: template$1
});

const Vue3 = version.startsWith("3");

function resolveUnref$1(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput$1(ref, lastKey = "") {
  if (ref instanceof Promise)
    return ref;
  const root = resolveUnref$1(ref);
  if (!ref || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput$1(r, lastKey));
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([k, v]) => {
        if (k === "titleTemplate" || k.startsWith("on"))
          return [k, unref(v)];
        return [k, resolveUnrefHeadInput$1(v, k)];
      })
    );
  }
  return root;
}

const VueReactivityPlugin = defineHeadPlugin({
  hooks: {
    "entries:resolve": function(ctx) {
      for (const entry of ctx.entries)
        entry.resolvedInput = resolveUnrefHeadInput$1(entry.input);
    }
  }
});

const headSymbol$1 = "usehead";
function vueInstall(head) {
  const plugin = {
    install(app) {
      if (Vue3) {
        app.config.globalProperties.$unhead = head;
        app.config.globalProperties.$head = head;
        app.provide(headSymbol$1, head);
      }
    }
  };
  return plugin.install;
}
function createServerHead(options = {}) {
  const head = createServerHead$1(options);
  head.use(VueReactivityPlugin);
  head.install = vueInstall(head);
  return head;
}

const unheadPlugins = [];

const appHead = {"meta":[{"charset":"utf-8"},{"name":"viewport","content":"width=device-width, initial-scale=1"},{"hid":"description","name":"description","content":""},{"name":"format-detection","content":"telephone=no"}],"link":[],"style":[],"script":[],"noscript":[],"title":"Title of your website","htmlAttrs":{"lang":"en"}};

const appRootId = "__nuxt";

const appRootTag = "div";

function buildAssetsDir() {
  return useRuntimeConfig$1().app.buildAssetsDir;
}
function buildAssetsURL(...path) {
  return joinURL(publicAssetsURL(), buildAssetsDir(), ...path);
}
function publicAssetsURL(...path) {
  const publicBase = useRuntimeConfig$1().app.cdnURL || useRuntimeConfig$1().app.baseURL;
  return path.length ? joinURL(publicBase, ...path) : publicBase;
}

globalThis.__buildAssetsURL = buildAssetsURL;
globalThis.__publicAssetsURL = publicAssetsURL;
const getClientManifest = () => Promise.resolve().then(function () { return client_manifest$1; }).then((r) => r.default || r).then((r) => typeof r === "function" ? r() : r);
const getEntryIds = () => getClientManifest().then((r) => Object.values(r).filter(
  (r2) => (
    // @ts-expect-error internal key set by CSS inlining configuration
    r2._globalCSS
  )
).map((r2) => r2.src));
const getServerEntry = () => Promise.resolve().then(function () { return server; }).then((r) => r.default || r);
const getSSRStyles = lazyCachedFunction(() => Promise.resolve().then(function () { return styles$1; }).then((r) => r.default || r));
const getSSRRenderer = lazyCachedFunction(async () => {
  const manifest = await getClientManifest();
  if (!manifest) {
    throw new Error("client.manifest is not available");
  }
  const createSSRApp = await getServerEntry();
  if (!createSSRApp) {
    throw new Error("Server bundle is not available");
  }
  const options = {
    manifest,
    renderToString: renderToString$1,
    buildAssetsURL
  };
  const renderer = createRenderer(createSSRApp, options);
  async function renderToString$1(input, context) {
    const html = await renderToString(input, context);
    return `<${appRootTag}${` id="${appRootId}"` }>${html}</${appRootTag}>`;
  }
  return renderer;
});
const getSPARenderer = lazyCachedFunction(async () => {
  const manifest = await getClientManifest();
  const spaTemplate = await Promise.resolve().then(function () { return _virtual__spaTemplate; }).then((r) => r.template).catch(() => "");
  const options = {
    manifest,
    renderToString: () => `<${appRootTag}${` id="${appRootId}"` }>${spaTemplate}</${appRootTag}>`,
    buildAssetsURL
  };
  const renderer = createRenderer(() => () => {
  }, options);
  const result = await renderer.renderToString({});
  const renderToString = (ssrContext) => {
    const config = useRuntimeConfig$1();
    ssrContext.modules = ssrContext.modules || /* @__PURE__ */ new Set();
    ssrContext.payload = {
      _errors: {},
      serverRendered: false,
      data: {},
      state: {}
    };
    ssrContext.config = {
      public: config.public,
      app: config.app
    };
    return Promise.resolve(result);
  };
  return {
    rendererContext: renderer.rendererContext,
    renderToString
  };
});
const PAYLOAD_URL_RE = /\/_payload(\.[a-zA-Z0-9]+)?.json(\?.*)?$/ ;
const renderer = defineRenderHandler(async (event) => {
  const nitroApp = useNitroApp();
  const ssrError = event.path.startsWith("/__nuxt_error") ? getQuery(event) : null;
  if (ssrError && ssrError.statusCode) {
    ssrError.statusCode = parseInt(ssrError.statusCode);
  }
  if (ssrError && !("__unenv__" in event.node.req)) {
    throw createError$2({
      statusCode: 404,
      statusMessage: "Page Not Found: /__nuxt_error"
    });
  }
  const islandContext = void 0;
  let url = ssrError?.url || islandContext?.url || event.path;
  const isRenderingPayload = PAYLOAD_URL_RE.test(url) && !islandContext;
  if (isRenderingPayload) {
    url = url.substring(0, url.lastIndexOf("/")) || "/";
    event._path = url;
    event.node.req.url = url;
  }
  const routeOptions = getRouteRules(event);
  const head = createServerHead({
    plugins: unheadPlugins
  });
  const headEntryOptions = { mode: "server" };
  head.push(appHead, headEntryOptions);
  const ssrContext = {
    url,
    event,
    runtimeConfig: useRuntimeConfig$1(),
    noSSR: event.context.nuxt?.noSSR || routeOptions.ssr === false && !islandContext || (false),
    head,
    error: !!ssrError,
    nuxt: void 0,
    /* NuxtApp */
    payload: ssrError ? { error: ssrError } : {},
    _payloadReducers: {},
    islandContext
  };
  const renderer = ssrContext.noSSR ? await getSPARenderer() : await getSSRRenderer();
  const _rendered = await renderer.renderToString(ssrContext).catch(async (error) => {
    if (ssrContext._renderResponse && error.message === "skipping render") {
      return {};
    }
    const _err = !ssrError && ssrContext.payload?.error || error;
    await ssrContext.nuxt?.hooks.callHook("app:error", _err);
    throw _err;
  });
  await ssrContext.nuxt?.hooks.callHook("app:rendered", { ssrContext, renderResult: _rendered });
  if (ssrContext._renderResponse) {
    return ssrContext._renderResponse;
  }
  if (ssrContext.payload?.error && !ssrError) {
    throw ssrContext.payload.error;
  }
  if (isRenderingPayload) {
    const response2 = renderPayloadResponse(ssrContext);
    return response2;
  }
  {
    const source = ssrContext.modules ?? ssrContext._registeredComponents;
    if (source) {
      for (const id of await getEntryIds()) {
        source.add(id);
      }
    }
  }
  const inlinedStyles = await renderInlineStyles(ssrContext.modules ?? ssrContext._registeredComponents ?? []) ;
  const NO_SCRIPTS = routeOptions.experimentalNoScripts;
  const { styles, scripts } = getRequestDependencies(ssrContext, renderer.rendererContext);
  head.push({ style: inlinedStyles });
  head.push({
    link: Object.values(styles).map(
      (resource) => ({ rel: "stylesheet", href: renderer.rendererContext.buildAssetsURL(resource.file) })
    )
  }, headEntryOptions);
  if (!NO_SCRIPTS) {
    head.push({
      link: getPreloadLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    head.push({
      link: getPrefetchLinks(ssrContext, renderer.rendererContext)
    }, headEntryOptions);
    head.push({
      script: renderPayloadJsonScript({ id: "__NUXT_DATA__", ssrContext, data: ssrContext.payload }) 
    }, {
      ...headEntryOptions,
      // this should come before another end of body scripts
      tagPosition: "bodyClose",
      tagPriority: "high"
    });
  }
  if (!routeOptions.experimentalNoScripts) {
    head.push({
      script: Object.values(scripts).map((resource) => ({
        type: resource.module ? "module" : null,
        src: renderer.rendererContext.buildAssetsURL(resource.file),
        defer: resource.module ? null : true,
        crossorigin: ""
      }))
    }, headEntryOptions);
  }
  const { headTags, bodyTags, bodyTagsOpen, htmlAttrs, bodyAttrs } = await renderSSRHead(head);
  const htmlContext = {
    island: Boolean(islandContext),
    htmlAttrs: [htmlAttrs],
    head: normalizeChunks([headTags, ssrContext.styles]),
    bodyAttrs: [bodyAttrs],
    bodyPrepend: normalizeChunks([bodyTagsOpen, ssrContext.teleports?.body]),
    body: [_rendered.html],
    bodyAppend: [bodyTags]
  };
  await nitroApp.hooks.callHook("render:html", htmlContext, { event });
  const response = {
    body: renderHTMLDocument(htmlContext),
    statusCode: getResponseStatus(event),
    statusMessage: getResponseStatusText(event),
    headers: {
      "content-type": "text/html;charset=utf-8",
      "x-powered-by": "Nuxt"
    }
  };
  return response;
});
function lazyCachedFunction(fn) {
  let res = null;
  return () => {
    if (res === null) {
      res = fn().catch((err) => {
        res = null;
        throw err;
      });
    }
    return res;
  };
}
function normalizeChunks(chunks) {
  return chunks.filter(Boolean).map((i) => i.trim());
}
function joinTags(tags) {
  return tags.join("");
}
function joinAttrs(chunks) {
  return chunks.join(" ");
}
function renderHTMLDocument(html) {
  return `<!DOCTYPE html>
<html ${joinAttrs(html.htmlAttrs)}>
<head>${joinTags(html.head)}</head>
<body ${joinAttrs(html.bodyAttrs)}>${joinTags(html.bodyPrepend)}${joinTags(html.body)}${joinTags(html.bodyAppend)}</body>
</html>`;
}
async function renderInlineStyles(usedModules) {
  const styleMap = await getSSRStyles();
  const inlinedStyles = /* @__PURE__ */ new Set();
  for (const mod of usedModules) {
    if (mod in styleMap) {
      for (const style of await styleMap[mod]()) {
        inlinedStyles.add(style);
      }
    }
  }
  return Array.from(inlinedStyles).map((style) => ({ innerHTML: style }));
}
function renderPayloadResponse(ssrContext) {
  return {
    body: stringify$1(splitPayload(ssrContext).payload, ssrContext._payloadReducers) ,
    statusCode: getResponseStatus(ssrContext.event),
    statusMessage: getResponseStatusText(ssrContext.event),
    headers: {
      "content-type": "application/json;charset=utf-8" ,
      "x-powered-by": "Nuxt"
    }
  };
}
function renderPayloadJsonScript(opts) {
  const contents = opts.data ? stringify$1(opts.data, opts.ssrContext._payloadReducers) : "";
  const payload = {
    type: "application/json",
    id: opts.id,
    innerHTML: contents,
    "data-ssr": !(opts.ssrContext.noSSR)
  };
  if (opts.src) {
    payload["data-src"] = opts.src;
  }
  return [
    payload,
    {
      innerHTML: `window.__NUXT__={};window.__NUXT__.config=${uneval(opts.ssrContext.config)}`
    }
  ];
}
function splitPayload(ssrContext) {
  const { data, prerenderedAt, ...initial } = ssrContext.payload;
  return {
    initial: { ...initial, prerenderedAt },
    payload: { data, prerenderedAt }
  };
}

const renderer$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: renderer
});

const client_manifest = {
  "node_modules/@nuxt/ui-templates/dist/templates/error-404.css": {
    "resourceType": "style",
    "prefetch": true,
    "preload": true,
    "file": "error-404.7fc72018.css",
    "src": "node_modules/@nuxt/ui-templates/dist/templates/error-404.css"
  },
  "node_modules/@nuxt/ui-templates/dist/templates/error-404.vue": {
    "resourceType": "script",
    "module": true,
    "prefetch": true,
    "preload": true,
    "css": [],
    "file": "error-404.fcac8904.js",
    "imports": [
      "node_modules/nuxt/dist/app/entry.js"
    ],
    "isDynamicEntry": true,
    "src": "node_modules/@nuxt/ui-templates/dist/templates/error-404.vue"
  },
  "error-404.7fc72018.css": {
    "file": "error-404.7fc72018.css",
    "resourceType": "style",
    "prefetch": true,
    "preload": true
  },
  "node_modules/@nuxt/ui-templates/dist/templates/error-500.css": {
    "resourceType": "style",
    "prefetch": true,
    "preload": true,
    "file": "error-500.c5df6088.css",
    "src": "node_modules/@nuxt/ui-templates/dist/templates/error-500.css"
  },
  "node_modules/@nuxt/ui-templates/dist/templates/error-500.vue": {
    "resourceType": "script",
    "module": true,
    "prefetch": true,
    "preload": true,
    "css": [],
    "file": "error-500.ff457e10.js",
    "imports": [
      "node_modules/nuxt/dist/app/entry.js"
    ],
    "isDynamicEntry": true,
    "src": "node_modules/@nuxt/ui-templates/dist/templates/error-500.vue"
  },
  "error-500.c5df6088.css": {
    "file": "error-500.c5df6088.css",
    "resourceType": "style",
    "prefetch": true,
    "preload": true
  },
  "node_modules/nuxt/dist/app/entry.css": {
    "resourceType": "style",
    "prefetch": true,
    "preload": true,
    "file": "entry.3c4ebcd6.css",
    "src": "node_modules/nuxt/dist/app/entry.css"
  },
  "node_modules/nuxt/dist/app/entry.js": {
    "resourceType": "script",
    "module": true,
    "prefetch": true,
    "preload": true,
    "css": [
      "entry.3c4ebcd6.css"
    ],
    "dynamicImports": [
      "node_modules/@nuxt/ui-templates/dist/templates/error-404.vue",
      "node_modules/@nuxt/ui-templates/dist/templates/error-500.vue"
    ],
    "file": "entry.798e9cf7.js",
    "isEntry": true,
    "src": "node_modules/nuxt/dist/app/entry.js",
    "_globalCSS": true
  },
  "entry.3c4ebcd6.css": {
    "file": "entry.3c4ebcd6.css",
    "resourceType": "style",
    "prefetch": true,
    "preload": true
  }
};

const client_manifest$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: client_manifest
});

const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
const nuxtAppCtx = /* @__PURE__ */ getContext("nuxt-app", {
  asyncContext: false
});
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.8.0";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: reactive({
      data: {},
      state: {},
      _errors: {},
      ...{ serverRendered: true }
    }),
    static: {
      data: {}
    },
    runWithContext: (fn) => nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn)),
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: {},
    _payloadRevivers: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    async function contextCaller(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    }
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
      nuxtApp.ssrContext._payloadReducers = {};
      nuxtApp.payload.path = nuxtApp.ssrContext.url;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (plugin.hooks) {
    nuxtApp.hooks.addHooks(plugin.hooks);
  }
  if (typeof plugin === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  var _a, _b;
  const parallels = [];
  const errors = [];
  for (const plugin of plugins2) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    const promise = applyPlugin(nuxtApp, plugin);
    if (plugin.parallel) {
      parallels.push(promise.catch((e) => errors.push(e)));
    } else {
      await promise;
    }
  }
  await Promise.all(parallels);
  if (errors.length) {
    throw errors[0];
  }
}
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin) {
  if (typeof plugin === "function") {
    return plugin;
  }
  delete plugin.name;
  return Object.assign(plugin.setup || (() => {
  }), plugin, { [NuxtPluginIndicator]: true });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function useNuxtApp() {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || nuxtAppCtx.tryUse();
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig() {
  return (/* @__PURE__ */ useNuxtApp()).$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
version.startsWith("3");
function resolveUnref(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput(ref2, lastKey = "") {
  if (ref2 instanceof Promise)
    return ref2;
  const root = resolveUnref(ref2);
  if (!ref2 || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput(r, lastKey));
  if (typeof root === "object") {
    return Object.fromEntries(
      Object.entries(root).map(([k, v]) => {
        if (k === "titleTemplate" || k.startsWith("on"))
          return [k, unref(v)];
        return [k, resolveUnrefHeadInput(v, k)];
      })
    );
  }
  return root;
}
defineHeadPlugin({
  hooks: {
    "entries:resolve": function(ctx) {
      for (const entry2 of ctx.entries)
        entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
    }
  }
});
const headSymbol = "usehead";
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey$1 = "__unhead_injection_handler__";
function setHeadInjectionHandler(handler) {
  _global[globalKey$1] = handler;
}
function injectHead() {
  if (globalKey$1 in _global) {
    return _global[globalKey$1]();
  }
  const head = inject(headSymbol);
  if (!head && "production" !== "production")
    console.warn("Unhead is missing Vue context, falling back to shared context. This may have unexpected results.");
  return head || getActiveHead();
}
function useHead(input, options = {}) {
  const head = options.head || injectHead();
  if (head) {
    if (!head.ssr)
      return clientUseHead(head, input, options);
    return head.push(input, options);
  }
}
function clientUseHead(head, input, options = {}) {
  const deactivated = ref(false);
  const resolvedInput = ref({});
  watchEffect(() => {
    resolvedInput.value = deactivated.value ? {} : resolveUnrefHeadInput(input);
  });
  const entry2 = head.push(resolvedInput.value, options);
  watch$1(resolvedInput, (e) => {
    entry2.patch(e);
  });
  getCurrentInstance();
  return entry2;
}
const coreComposableNames = [
  "injectHead"
];
({
  "@unhead/vue": [...coreComposableNames, ...composableNames]
});
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  var _a;
  return (_a = /* @__PURE__ */ useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, (/* @__PURE__ */ useNuxtApp())._route);
  }
  return (/* @__PURE__ */ useNuxtApp())._route;
};
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if ((/* @__PURE__ */ useNuxtApp())._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : withQuery(to.path || "/", to.query || {}) + (to.hash || "");
  if (options == null ? void 0 : options.open) {
    return Promise.resolve();
  }
  const isExternal = (options == null ? void 0 : options.external) || hasProtocol(toPath, { acceptRelative: true });
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const protocol = parseURL(toPath).protocol;
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = /* @__PURE__ */ useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      async function redirect(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(/"/g, "%22");
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: location2 }
        };
        return response;
      }
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      location.replace(toPath);
    } else {
      location.href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const useError = () => toRef((/* @__PURE__ */ useNuxtApp()).payload, "error");
const showError = (_err) => {
  const err = createError(_err);
  try {
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    const error = useError();
    if (false)
      ;
    error.value = error.value || err;
  } catch {
    throw err;
  }
  return err;
};
const isNuxtError = (err) => !!(err && typeof err === "object" && "__nuxt_error" in err);
const createError = (err) => {
  const _err = createError$2(err);
  _err.__nuxt_error = true;
  return _err;
};
function definePayloadReducer(name, reduce) {
  {
    (/* @__PURE__ */ useNuxtApp()).ssrContext._payloadReducers[name] = reduce;
  }
}
const unhead_KgADcZ0jPj = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    setHeadInjectionHandler(
      // need a fresh instance of the nuxt app to avoid parallel requests interfering with each other
      () => (/* @__PURE__ */ useNuxtApp()).vueApp._context.provides.usehead
    );
    nuxtApp.vueApp.use(head);
  }
});
function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als && currentInstance === void 0) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
_globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = parseURL(fullPath.toString());
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: {},
    name: void 0,
    matched: [],
    redirectedFrom: void 0,
    meta: {},
    href: fullPath
  };
}
const router_CaKIoANnI2 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      error: []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false)
          ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const router = {
      currentRoute: route,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => window.history.go(-1),
      go: (delta) => window.history.go(delta),
      forward: () => window.history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", {
      functional: true,
      props: {
        to: String,
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          var _a;
          const route2 = router.resolve(props.to);
          return props.custom ? (_a = slots.default) == null ? void 0 : _a.call(slots, { href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    });
    nuxtApp._route = route;
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        var _a;
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
        }
        nuxtApp._processingMiddleware = true;
        if (!((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext)) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$2({
                  statusCode: 404,
                  statusMessage: `Page Not Found: ${initialURL}`
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
const reducers = {
  NuxtError: (data) => isNuxtError(data) && data.toJSON(),
  EmptyShallowRef: (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  EmptyRef: (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_"),
  ShallowRef: (data) => isRef(data) && isShallow(data) && data.value,
  ShallowReactive: (data) => isReactive(data) && isShallow(data) && toRaw(data),
  Ref: (data) => isRef(data) && data.value,
  Reactive: (data) => isReactive(data) && toRaw(data)
};
const revive_payload_server_eJ33V7gbc6 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const reducer in reducers) {
      definePayloadReducer(reducer, reducers[reducer]);
    }
  }
});
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  unhead_KgADcZ0jPj,
  router_CaKIoANnI2,
  revive_payload_server_eJ33V7gbc6,
  components_plugin_KR1HBZs4kY
];
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$3 = {
  __name: "welcome",
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    title: {
      type: String,
      default: "Welcome to Nuxt!"
    },
    readDocs: {
      type: String,
      default: "We highly recommend you take a look at the Nuxt documentation, whether you are new or have previous experience with the framework."
    },
    followTwitter: {
      type: String,
      default: "Follow the Nuxt Twitter account to get latest news about releases, new modules, tutorials and tips."
    },
    starGitHub: {
      type: String,
      default: "Nuxt is open source and the code is available on GitHub, feel free to star it, participate in discussions or dive into the source."
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.title}`,
      script: [],
      style: [
        {
          children: `@property --gradient-angle{syntax:'<angle>';inherits:false;initial-value:180deg}@keyframes gradient-rotate{0%{--gradient-angle:0deg}100%{--gradient-angle:360deg}}*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e0e0e0}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}a{color:inherit;text-decoration:inherit}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p,h2,h3{margin:0}h1,h2,h3{font-size:inherit;font-weight:inherit}img{border-style:solid;max-width:100%;height:auto}svg,img{display:block;vertical-align:middle}ul{list-style:none;margin:0;padding:0}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "antialiased bg-white dark:bg-black text-black dark:text-white min-h-screen place-content-center flex flex-col items-center justify-center text-sm sm:text-base" }, _attrs))} data-v-ea739b84><div class="flex-1 flex flex-col gap-y-16 py-14" data-v-ea739b84><div class="flex flex-col gap-y-4 items-center justify-center" data-v-ea739b84><a href="https://nuxt.com" target="_blank" data-v-ea739b84><svg width="61" height="42" viewBox="0 0 61 42" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-ea739b84><path d="M33.9869 41.2211H56.412C57.1243 41.2212 57.824 41.0336 58.4408 40.6772C59.0576 40.3209 59.5698 39.8083 59.9258 39.191C60.2818 38.5737 60.469 37.8736 60.4687 37.1609C60.4684 36.4482 60.2805 35.7482 59.924 35.1313L44.864 9.03129C44.508 8.41416 43.996 7.90168 43.3793 7.54537C42.7626 7.18906 42.063 7.00147 41.3509 7.00147C40.6387 7.00147 39.9391 7.18906 39.3225 7.54537C38.7058 7.90168 38.1937 8.41416 37.8377 9.03129L33.9869 15.7093L26.458 2.65061C26.1018 2.03354 25.5895 1.52113 24.9726 1.16489C24.3557 0.808639 23.656 0.621094 22.9438 0.621094C22.2316 0.621094 21.5318 0.808639 20.915 1.16489C20.2981 1.52113 19.7858 2.03354 19.4296 2.65061L0.689224 35.1313C0.332704 35.7482 0.144842 36.4482 0.144532 37.1609C0.144222 37.8736 0.331476 38.5737 0.687459 39.191C1.04344 39.8083 1.5556 40.3209 2.17243 40.6772C2.78925 41.0336 3.48899 41.2212 4.20126 41.2211H18.2778C23.8551 41.2211 27.9682 38.7699 30.7984 33.9876L37.6694 22.0813L41.3498 15.7093L52.3951 34.8492H37.6694L33.9869 41.2211ZM18.0484 34.8426L8.2247 34.8404L22.9504 9.32211L30.2979 22.0813L25.3784 30.6092C23.4989 33.7121 21.3637 34.8426 18.0484 34.8426Z" fill="#00DC82" data-v-ea739b84></path></svg></a><h1 class="text-black dark:text-white text-4xl sm:text-5xl font-semibold text-center" data-v-ea739b84>Welcome to Nuxt!</h1></div><div class="grid grid-cols-2 lg:grid-cols-10 gap-6 max-w-[960px] px-4" data-v-ea739b84><div class="col-span-2 lg:col-span-10 relative get-started-gradient-border" data-v-ea739b84><div class="get-started-gradient-left absolute left-0 inset-y-0 w-[20%] bg-gradient-to-r to-transparent from-green-400 rounded-xl z-1 transition-opacity duration-300" data-v-ea739b84></div><div class="get-started-gradient-right absolute right-0 inset-y-0 w-[20%] bg-gradient-to-l to-transparent from-blue-400 rounded-xl z-1 transition-opacity duration-300" data-v-ea739b84></div><div class="w-full absolute inset-x-0 flex justify-center -top-[58px]" data-v-ea739b84><img src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22105%22%20height%3D%22116%22%20fill%3D%22none%22%3E%3Cg%20filter%3D%22url(%23a)%22%20shape-rendering%3D%22geometricPrecision%22%3E%3Cpath%20fill%3D%22%2318181B%22%20d%3D%22M17.203%2033.223%2046.9%2014.286a8.416%208.416%200%200%201%208.64-.18L87.38%2031.97c2.68%201.527%204.365%204.409%204.428%207.571l.191%2034.944c.063%203.151-1.491%206.104-4.091%207.776l-30.143%2019.383a8.417%208.417%200%200%201-8.75.251l-31.126-17.73C15.135%2082.595%2012.98%2079.6%2013%2076.35V40.828c.02-3.111%201.614-5.994%204.203-7.605Z%22%2F%3E%3Cpath%20stroke%3D%22url(%23b)%22%20stroke-width%3D%222%22%20d%3D%22M46.9%2014.286%2017.202%2033.223c-2.59%201.61-4.183%204.494-4.203%207.605V76.35m33.9-62.064a8.416%208.416%200%200%201%208.64-.18m-8.64.18a8.435%208.435%200%200%201%208.64-.18M13%2076.35c-.02%203.25%202.135%206.246%204.888%207.814M13%2076.35c-.02%203.233%202.136%206.247%204.888%207.814m0%200%2031.126%2017.731m0%200a8.417%208.417%200%200%200%208.75-.251m-8.75.251a8.438%208.438%200%200%200%208.75-.251m0%200%2030.143-19.383m0%200c2.598-1.67%204.154-4.627%204.091-7.776m-4.091%207.776c2.6-1.672%204.154-4.625%204.091-7.776m0%200-.19-34.944m0%200c-.064-3.162-1.75-6.044-4.43-7.571m4.43%207.571c-.063-3.147-1.75-6.045-4.43-7.571m0%200L55.54%2014.105%22%2F%3E%3C%2Fg%3E%3Cpath%20fill%3D%22url(%23c)%22%20d%3D%22M48.669%2067.696c-.886%202.69-3.02%204.659-6.153%205.709-1.41.465-2.88.72-4.364.755a1.313%201.313%200%200%201-1.312-1.313c.035-1.484.29-2.954.754-4.364%201.05-3.133%203.02-5.266%205.71-6.152a1.312%201.312%200%201%201%20.836%202.477c-3.232%201.083-4.232%204.577-4.544%206.595%202.018-.311%205.512-1.312%206.595-4.544a1.313%201.313%200%200%201%202.477.837Zm16.39-12.486-1.46%201.477v10.057a2.657%202.657%200%200%201-.772%201.854l-5.316%205.3a2.559%202.559%200%200%201-1.853.77%202.413%202.413%200%200%201-.755-.115%202.624%202.624%200%200%201-1.821-2.001l-1.296-6.48-6.858-6.858-6.48-1.297a2.625%202.625%200%200%201-2.002-1.82%202.609%202.609%200%200%201%20.656-2.61l5.3-5.315a2.658%202.658%200%200%201%201.853-.771h10.057l1.477-1.46c4.692-4.692%209.499-4.561%2011.353-4.282a2.576%202.576%200%200%201%202.198%202.198c.28%201.854.41%206.661-4.282%2011.353Zm-26.103.132%206.185%201.23%206.546-6.546h-7.432l-5.299%205.316Zm8.482%202.657L53%2063.561l10.205-10.205c1.28-1.28%204.2-4.724%203.543-9.105-4.38-.656-7.826%202.264-9.105%203.544L47.438%2057.999Zm13.535%201.313-6.546%206.546%201.23%206.185%205.316-5.299v-7.432Z%22%20shape-rendering%3D%22geometricPrecision%22%2F%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x1%3D%2257.994%22%20x2%3D%2292%22%20y1%3D%2258%22%20y2%3D%2258%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%231DE0B1%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2336E4DA%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22c%22%20x1%3D%2255.197%22%20x2%3D%2269.453%22%20y1%3D%2258.107%22%20y2%3D%2258.107%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%231DE0B1%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2336E4DA%22%2F%3E%3C%2FlinearGradient%3E%3Cfilter%20id%3D%22a%22%20width%3D%22104.897%22%20height%3D%22115.897%22%20x%3D%22.052%22%20y%3D%22.052%22%20color-interpolation-filters%3D%22sRGB%22%20filterUnits%3D%22userSpaceOnUse%22%3E%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20result%3D%22hardAlpha%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%2F%3E%3CfeOffset%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%225.974%22%2F%3E%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22out%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%201%200%200%200%200%201%200%200%200%200%201%200%200%200%200.07%200%22%2F%3E%3CfeBlend%20in2%3D%22BackgroundImageFix%22%20result%3D%22effect1_dropShadow_2724_4091%22%2F%3E%3CfeBlend%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_dropShadow_2724_4091%22%20result%3D%22shape%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3C%2Fsvg%3E%0A" class="hidden dark:block" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22105%22%20height%3D%22116%22%20fill%3D%22none%22%3E%3Cg%20filter%3D%22url(%23a)%22%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M17.203%2033.223%2046.9%2014.286a8.416%208.416%200%200%201%208.64-.18L87.38%2031.97c2.68%201.527%204.365%204.409%204.428%207.571l.191%2034.944c.063%203.151-1.491%206.104-4.091%207.776l-30.143%2019.383a8.417%208.417%200%200%201-8.75.251l-31.126-17.73C15.135%2082.595%2012.98%2079.6%2013%2076.35V40.828c.02-3.111%201.614-5.994%204.203-7.605Z%22%2F%3E%3Cpath%20stroke%3D%22url(%23b)%22%20stroke-width%3D%222%22%20d%3D%22M46.9%2014.286%2017.202%2033.223c-2.59%201.61-4.183%204.494-4.203%207.605V76.35m33.9-62.064a8.416%208.416%200%200%201%208.64-.18m-8.64.18a8.435%208.435%200%200%201%208.64-.18M13%2076.35c-.02%203.25%202.135%206.246%204.888%207.814M13%2076.35c-.02%203.233%202.136%206.247%204.888%207.814m0%200%2031.126%2017.731m0%200a8.417%208.417%200%200%200%208.75-.251m-8.75.251a8.438%208.438%200%200%200%208.75-.251m0%200%2030.143-19.383m0%200c2.598-1.67%204.154-4.627%204.091-7.776m-4.091%207.776c2.6-1.672%204.154-4.625%204.091-7.776m0%200-.19-34.944m0%200c-.064-3.162-1.75-6.044-4.43-7.571m4.43%207.571c-.063-3.147-1.75-6.045-4.43-7.571m0%200L55.54%2014.105%22%2F%3E%3C%2Fg%3E%3Cpath%20fill%3D%22%23fff%22%20d%3D%22M32%2037h42v42H32z%22%2F%3E%3Cpath%20fill%3D%22url(%23c)%22%20d%3D%22M48.669%2067.697c-.886%202.69-3.02%204.659-6.153%205.709-1.41.465-2.88.72-4.364.755a1.313%201.313%200%200%201-1.312-1.313c.035-1.484.29-2.954.754-4.364%201.05-3.134%203.02-5.266%205.71-6.152a1.314%201.314%200%201%201%20.836%202.477c-3.232%201.083-4.232%204.577-4.544%206.595%202.018-.311%205.512-1.312%206.595-4.544a1.313%201.313%200%200%201%202.477.837Zm16.39-12.486-1.46%201.477v10.057a2.657%202.657%200%200%201-.772%201.854l-5.316%205.3a2.559%202.559%200%200%201-1.853.77%202.413%202.413%200%200%201-.755-.115%202.626%202.626%200%200%201-1.821-2.001l-1.296-6.48-6.858-6.858-6.48-1.297a2.625%202.625%200%200%201-2.002-1.82%202.609%202.609%200%200%201%20.656-2.61l5.3-5.315a2.658%202.658%200%200%201%201.853-.771h10.057l1.477-1.46c4.692-4.692%209.499-4.561%2011.353-4.282a2.576%202.576%200%200%201%202.198%202.198c.28%201.854.41%206.661-4.282%2011.353Zm-26.103.132%206.185%201.23%206.546-6.546h-7.432l-5.299%205.316ZM47.438%2058%2053%2063.562l10.205-10.204c1.28-1.28%204.2-4.725%203.543-9.106-4.38-.656-7.826%202.264-9.105%203.544L47.438%2058Zm13.535%201.313-6.546%206.546%201.23%206.185%205.316-5.299v-7.432Z%22%2F%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x1%3D%2257.994%22%20x2%3D%2292%22%20y1%3D%2258%22%20y2%3D%2258%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%231DE0B1%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2336E4DA%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22c%22%20x1%3D%2255.197%22%20x2%3D%2269.453%22%20y1%3D%2258.108%22%20y2%3D%2258.108%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%3Cstop%20offset%3D%22.5%22%20stop-color%3D%22%231DE0B1%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2336E4DA%22%2F%3E%3C%2FlinearGradient%3E%3Cfilter%20id%3D%22a%22%20width%3D%22104.897%22%20height%3D%22115.897%22%20x%3D%22.052%22%20y%3D%22.052%22%20color-interpolation-filters%3D%22sRGB%22%20filterUnits%3D%22userSpaceOnUse%22%3E%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20result%3D%22hardAlpha%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%2F%3E%3CfeOffset%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%225.974%22%2F%3E%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22out%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%201%200%200%200%200%201%200%200%200%200%201%200%200%200%200.07%200%22%2F%3E%3CfeBlend%20in2%3D%22BackgroundImageFix%22%20result%3D%22effect1_dropShadow_2726_4054%22%2F%3E%3CfeBlend%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_dropShadow_2726_4054%22%20result%3D%22shape%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3C%2Fsvg%3E%0A" class="dark:hidden" data-v-ea739b84></div><div class="flex flex-col rounded-xl items-center gap-y-4 pt-[58px] px-4 sm:px-28 pb-6 z-10" data-v-ea739b84><h2 class="font-semibold text-2xl text-black dark:text-white" data-v-ea739b84>Get started</h2><p class="mb-2 text-center" data-v-ea739b84>Remove this welcome page by replacing <a class="bg-gray-100 dark:bg-white/10 rounded font-mono p-1 font-bold" data-v-ea739b84>&lt;NuxtWelcome /&gt;</a> in <a href="https://nuxt.com/docs/guide/directory-structure/app" target="_blank" rel="noopener" class="bg-gray-100 dark:bg-white/10 rounded font-mono p-1 font-bold" data-v-ea739b84>app.vue</a> with your own code.</p></div></div><div class="lg:min-h-min sm:min-h-[220px] md:min-h-[180px] col-span-2 sm:col-span-1 lg:col-span-6 text-black dark:text-white rounded-xl modules-container relative items-center justify-center border border-gray-200 dark:border-transparent hover:border-transparent" data-v-ea739b84><div class="gradient-border gradient-border-modules gradient-border-rect" data-v-ea739b84></div><div class="modules-gradient-right absolute right-0 inset-y-0 w-[20%] bg-gradient-to-l to-transparent from-yellow-400 rounded-xl z-1 transition-opacity duration-300" data-v-ea739b84></div><a href="https://nuxt.com/modules" target="_blank" class="py-6 px-5 rounded-xl flex items-center justify-center gap-x-4 dark:border-none bg-white dark:bg-gray-900 sm:min-h-[220px] md:min-h-[180px] lg:min-h-min" data-v-ea739b84><img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20clip-path%3D%22url(%23clip0_2613_3853)%22%3E%0A%3Cpath%20d%3D%22M51.1519%2039.8821C51.154%2039.9844%2051.1527%2040.0863%2051.148%2040.1877C51.0782%2041.7091%2050.2566%2043.1165%2048.9325%2043.9357L29.0918%2056.2117C27.6504%2057.1035%2025.8212%2057.1564%2024.3387%2056.3439L3.85107%2045.1148C2.27157%2044.2491%201.14238%2042.6366%201.15291%2041.0494L1.15293%2041.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4169%201.73583%2026.2139%201.69824%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8136C50.0797%2014.6078%2050.9898%2016.1132%2051.026%2017.7438L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821Z%22%20fill%3D%22white%22%20stroke%3D%22url(%23paint0_linear_2613_3853)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M33.8193%2042.2552H17.8193C16.7585%2042.2552%2015.7411%2041.8337%2014.9909%2041.0836C14.2408%2040.3334%2013.8193%2039.316%2013.8193%2038.2552V24.9218C13.8193%2023.861%2014.2408%2022.8435%2014.9909%2022.0934C15.7411%2021.3433%2016.7585%2020.9218%2017.8193%2020.9218H19.1527C19.1751%2019.792%2019.5558%2018.6985%2020.2399%2017.7991C20.924%2016.8996%2021.8761%2016.2407%2022.9589%2015.9173C24.0416%2015.594%2025.1992%2015.6229%2026.2644%2016C27.3297%2016.377%2028.2477%2017.0827%2028.886%2018.0152C29.4839%2018.8674%2029.8094%2019.8808%2029.8193%2020.9218H33.8193C34.173%2020.9218%2034.5121%2021.0623%2034.7621%2021.3124C35.0122%2021.5624%2035.1527%2021.9015%2035.1527%2022.2552V26.2552C36.2825%2026.2776%2037.376%2026.6583%2038.2754%2027.3424C39.1749%2028.0265%2039.8338%2028.9786%2040.1572%2030.0613C40.4805%2031.1441%2040.4516%2032.3016%2040.0745%2033.3669C39.6975%2034.4322%2038.9918%2035.3502%2038.0593%2035.9885C37.2071%2036.5864%2036.1937%2036.9118%2035.1527%2036.9218V36.9218V40.9218C35.1527%2041.2755%2035.0122%2041.6146%2034.7621%2041.8646C34.5121%2042.1147%2034.173%2042.2552%2033.8193%2042.2552ZM17.8193%2023.5885C17.4657%2023.5885%2017.1266%2023.729%2016.8765%2023.979C16.6265%2024.2291%2016.486%2024.5682%2016.486%2024.9218V38.2552C16.486%2038.6088%2016.6265%2038.9479%2016.8765%2039.198C17.1266%2039.448%2017.4657%2039.5885%2017.8193%2039.5885H32.486V35.3485C32.4849%2035.1347%2032.5351%2034.9238%2032.6326%2034.7335C32.7301%2034.5432%2032.8718%2034.3792%2033.046%2034.2552C33.2196%2034.1313%2033.4204%2034.051%2033.6316%2034.0208C33.8427%2033.9907%2034.058%2034.0116%2034.2593%2034.0818C34.6393%2034.2368%2035.0532%2034.2901%2035.46%2034.2363C35.8669%2034.1825%2036.2527%2034.0236%2036.5793%2033.7752C36.9045%2033.5769%2037.1834%2033.3113%2037.3973%2032.9962C37.6111%2032.6811%2037.7551%2032.3239%2037.8193%2031.9485C37.8708%2031.5699%2037.8402%2031.1847%2037.7298%2030.8189C37.6194%2030.4532%2037.4317%2030.1154%2037.1793%2029.8285C36.8381%2029.414%2036.3734%2029.1193%2035.8529%2028.9874C35.3325%2028.8555%2034.7835%2028.8932%2034.286%2029.0952C34.0846%2029.1654%2033.8694%2029.1863%2033.6582%2029.1562C33.4471%2029.126%2033.2463%2029.0457%2033.0727%2028.9218C32.8985%2028.7978%2032.7567%2028.6338%2032.6593%2028.4435C32.5618%2028.2532%2032.5115%2028.0423%2032.5127%2027.8285V23.5885H28.246C28.0269%2023.6009%2027.8081%2023.559%2027.609%2023.4666C27.4099%2023.3742%2027.2368%2023.234%2027.1049%2023.0586C26.973%2022.8832%2026.8864%2022.6779%2026.8529%2022.461C26.8194%2022.2441%2026.8399%2022.0222%2026.9127%2021.8152C27.0677%2021.4352%2027.1209%2021.0213%2027.0671%2020.6145C27.0134%2020.2076%2026.8544%2019.8218%2026.606%2019.4952C26.4091%2019.1607%2026.1395%2018.8749%2025.8172%2018.6588C25.4948%2018.4427%2025.128%2018.3019%2024.7438%2018.2468C24.3597%2018.1917%2023.9681%2018.2238%2023.598%2018.3407C23.2279%2018.4575%2022.8889%2018.6561%2022.606%2018.9218C22.3433%2019.1824%2022.1377%2019.4948%2022.0023%2019.8391C21.8668%2020.1834%2021.8045%2020.5521%2021.8193%2020.9218C21.8224%2021.2277%2021.8812%2021.5304%2021.9927%2021.8152C22.0632%2022.0168%2022.0842%2022.2324%2022.054%2022.4438C22.0237%2022.6553%2021.9432%2022.8564%2021.819%2023.0302C21.6949%2023.204%2021.5308%2023.3454%2021.3406%2023.4426C21.1504%2023.5397%2020.9396%2023.5898%2020.726%2023.5885H17.8193Z%22%20fill%3D%22url(%23paint1_linear_2613_3853)%22%2F%3E%0A%3C%2Fg%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2613_3853%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23F7D14C%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23A38108%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2613_3853%22%20x1%3D%2213.7453%22%20y1%3D%2221.3705%22%20x2%3D%2240.3876%22%20y2%3D%2235.7024%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23F7D14C%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23A38108%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3CclipPath%20id%3D%22clip0_2613_3853%22%3E%0A%3Crect%20width%3D%2252%22%20height%3D%2257%22%20fill%3D%22white%22%20transform%3D%22translate(0.152832%200.920898)%22%2F%3E%0A%3C%2FclipPath%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="modules icon" class="modules-image-color-light" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M3.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4246%201.73116%2026.2124%201.69742%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8137C50.0812%2014.6086%2050.9896%2016.1043%2051.026%2017.7437L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821C51.1856%2041.5204%2050.346%2043.0611%2048.9325%2043.9357L29.0918%2056.2117C27.6424%2057.1085%2025.8227%2057.1572%2024.3387%2056.3439L3.85107%2045.1148C2.26984%2044.2481%201.14232%2042.646%201.15293%2041.0494V41.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869Z%22%20fill%3D%22%2318181B%22%20stroke%3D%22url(%23paint0_linear_2595_7337)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M33.8193%2042.2542H17.8193C16.7585%2042.2542%2015.7411%2041.8328%2014.9909%2041.0826C14.2408%2040.3325%2013.8193%2039.3151%2013.8193%2038.2542V24.9209C13.8193%2023.86%2014.2408%2022.8426%2014.9909%2022.0924C15.7411%2021.3423%2016.7585%2020.9209%2017.8193%2020.9209H19.1527C19.1751%2019.791%2019.5558%2018.6975%2020.2399%2017.7981C20.924%2016.8986%2021.8761%2016.2397%2022.9589%2015.9164C24.0416%2015.593%2025.1992%2015.6219%2026.2644%2015.999C27.3297%2016.376%2028.2477%2017.0817%2028.886%2018.0142C29.4839%2018.8664%2029.8094%2019.8799%2029.8193%2020.9209H33.8193C34.173%2020.9209%2034.5121%2021.0613%2034.7621%2021.3114C35.0122%2021.5614%2035.1527%2021.9006%2035.1527%2022.2542V26.2542C36.2825%2026.2766%2037.376%2026.6573%2038.2754%2027.3414C39.1749%2028.0255%2039.8338%2028.9776%2040.1572%2030.0604C40.4805%2031.1432%2040.4516%2032.3007%2040.0745%2033.366C39.6975%2034.4312%2038.9918%2035.3492%2038.0593%2035.9875C37.2071%2036.5854%2036.1937%2036.9109%2035.1527%2036.9209V40.9209C35.1527%2041.2745%2035.0122%2041.6136%2034.7621%2041.8637C34.5121%2042.1137%2034.173%2042.2542%2033.8193%2042.2542ZM17.8193%2023.5875C17.4657%2023.5875%2017.1266%2023.728%2016.8765%2023.978C16.6265%2024.2281%2016.486%2024.5672%2016.486%2024.9209V38.2542C16.486%2038.6078%2016.6265%2038.9469%2016.8765%2039.197C17.1266%2039.447%2017.4657%2039.5875%2017.8193%2039.5875H32.486V35.3475C32.4849%2035.1337%2032.5351%2034.9228%2032.6326%2034.7325C32.7301%2034.5422%2032.8718%2034.3782%2033.046%2034.2542C33.2196%2034.1304%2033.4205%2034.05%2033.6316%2034.0198C33.8427%2033.9897%2034.058%2034.0106%2034.2593%2034.0809C34.6393%2034.2359%2035.0532%2034.2891%2035.46%2034.2353C35.8669%2034.1816%2036.2527%2034.0226%2036.5793%2033.7742C36.9045%2033.5759%2037.1834%2033.3103%2037.3973%2032.9952C37.6111%2032.6801%2037.7551%2032.3229%2037.8193%2031.9475C37.8708%2031.5689%2037.8402%2031.1837%2037.7298%2030.8179C37.6194%2030.4522%2037.4317%2030.1144%2037.1793%2029.8275C36.8381%2029.413%2036.3734%2029.1183%2035.8529%2028.9864C35.3325%2028.8545%2034.7835%2028.8923%2034.286%2029.0942C34.0846%2029.1644%2033.8694%2029.1854%2033.6582%2029.1552C33.4471%2029.125%2033.2463%2029.0447%2033.0727%2028.9209C32.8985%2028.7969%2032.7567%2028.6328%2032.6593%2028.4425C32.5618%2028.2522%2032.5115%2028.0413%2032.5127%2027.8275V23.5875H28.246C28.0269%2023.5999%2027.8081%2023.5581%2027.609%2023.4656C27.4099%2023.3732%2027.2368%2023.233%2027.1049%2023.0576C26.973%2022.8822%2026.8864%2022.6769%2026.8529%2022.46C26.8194%2022.2431%2026.8399%2022.0213%2026.9127%2021.8142C27.0677%2021.4342%2027.1209%2021.0204%2027.0671%2020.6135C27.0134%2020.2066%2026.8544%2019.8208%2026.606%2019.4942C26.4091%2019.1597%2026.1395%2018.8739%2025.8172%2018.6578C25.4948%2018.4417%2025.128%2018.3009%2024.7438%2018.2458C24.3597%2018.1908%2023.9681%2018.2228%2023.598%2018.3397C23.2279%2018.4565%2022.8889%2018.6552%2022.606%2018.9209C22.3433%2019.1814%2022.1377%2019.4938%2022.0023%2019.8381C21.8668%2020.1824%2021.8045%2020.5512%2021.8193%2020.9209C21.8224%2021.2267%2021.8812%2021.5294%2021.9927%2021.8142C22.0632%2022.0158%2022.0842%2022.2314%2022.054%2022.4429C22.0237%2022.6543%2021.9432%2022.8554%2021.819%2023.0292C21.6949%2023.203%2021.5308%2023.3444%2021.3406%2023.4416C21.1504%2023.5388%2020.9396%2023.5888%2020.726%2023.5875H17.8193Z%22%20fill%3D%22url(%23paint1_linear_2595_7337)%22%2F%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2595_7337%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23F7D14C%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23A38108%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2595_7337%22%20x1%3D%2213.7453%22%20y1%3D%2221.3695%22%20x2%3D%2240.3876%22%20y2%3D%2235.7015%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23F7D14C%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23A38108%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="modules icon" class="modules-image-color-dark" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20clip-path%3D%22url(%23clip0_2691_4389)%22%3E%0A%3Cpath%20d%3D%22M51.1519%2039.8821C51.154%2039.9844%2051.1527%2040.0863%2051.148%2040.1877C51.0782%2041.7091%2050.2566%2043.1165%2048.9325%2043.9357L29.0918%2056.2117C27.6504%2057.1035%2025.8212%2057.1564%2024.3387%2056.3439L3.85107%2045.1148C2.27157%2044.2491%201.14238%2042.6366%201.15291%2041.0494L1.15293%2041.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4169%201.73583%2026.2139%201.69824%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8136C50.0797%2014.6078%2050.9898%2016.1132%2051.026%2017.7438L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821Z%22%20fill%3D%22white%22%20stroke%3D%22url(%23paint0_linear_2691_4389)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M33.8193%2042.2542H17.8193C16.7585%2042.2542%2015.7411%2041.8328%2014.9909%2041.0826C14.2408%2040.3325%2013.8193%2039.3151%2013.8193%2038.2542V24.9209C13.8193%2023.86%2014.2408%2022.8426%2014.9909%2022.0924C15.7411%2021.3423%2016.7585%2020.9209%2017.8193%2020.9209H19.1527C19.1751%2019.791%2019.5558%2018.6975%2020.2399%2017.7981C20.924%2016.8986%2021.8761%2016.2397%2022.9589%2015.9164C24.0416%2015.593%2025.1992%2015.6219%2026.2644%2015.999C27.3297%2016.376%2028.2477%2017.0817%2028.886%2018.0142C29.4839%2018.8664%2029.8094%2019.8799%2029.8193%2020.9209H33.8193C34.173%2020.9209%2034.5121%2021.0613%2034.7621%2021.3114C35.0122%2021.5614%2035.1527%2021.9006%2035.1527%2022.2542V26.2542C36.2825%2026.2766%2037.376%2026.6573%2038.2754%2027.3414C39.1749%2028.0255%2039.8338%2028.9776%2040.1572%2030.0604C40.4805%2031.1432%2040.4516%2032.3007%2040.0745%2033.366C39.6975%2034.4312%2038.9918%2035.3492%2038.0593%2035.9875C37.2071%2036.5854%2036.1937%2036.9109%2035.1527%2036.9209V36.9209V40.9209C35.1527%2041.2745%2035.0122%2041.6136%2034.7621%2041.8637C34.5121%2042.1137%2034.173%2042.2542%2033.8193%2042.2542ZM17.8193%2023.5875C17.4657%2023.5875%2017.1266%2023.728%2016.8765%2023.978C16.6265%2024.2281%2016.486%2024.5672%2016.486%2024.9209V38.2542C16.486%2038.6078%2016.6265%2038.9469%2016.8765%2039.197C17.1266%2039.447%2017.4657%2039.5875%2017.8193%2039.5875H32.486V35.3475C32.4849%2035.1337%2032.5351%2034.9228%2032.6326%2034.7325C32.7301%2034.5422%2032.8718%2034.3782%2033.046%2034.2542C33.2196%2034.1304%2033.4204%2034.05%2033.6316%2034.0198C33.8427%2033.9897%2034.058%2034.0106%2034.2593%2034.0809C34.6393%2034.2359%2035.0532%2034.2891%2035.46%2034.2353C35.8669%2034.1816%2036.2527%2034.0226%2036.5793%2033.7742C36.9045%2033.5759%2037.1834%2033.3103%2037.3973%2032.9952C37.6111%2032.6801%2037.7551%2032.3229%2037.8193%2031.9475C37.8708%2031.5689%2037.8402%2031.1837%2037.7298%2030.8179C37.6194%2030.4522%2037.4317%2030.1144%2037.1793%2029.8275C36.8381%2029.413%2036.3734%2029.1183%2035.8529%2028.9864C35.3325%2028.8545%2034.7835%2028.8923%2034.286%2029.0942C34.0846%2029.1644%2033.8694%2029.1854%2033.6582%2029.1552C33.4471%2029.125%2033.2463%2029.0447%2033.0727%2028.9209C32.8985%2028.7969%2032.7567%2028.6328%2032.6593%2028.4425C32.5618%2028.2522%2032.5115%2028.0413%2032.5127%2027.8275V23.5875H28.246C28.0269%2023.5999%2027.8081%2023.5581%2027.609%2023.4656C27.4099%2023.3732%2027.2368%2023.233%2027.1049%2023.0576C26.973%2022.8822%2026.8864%2022.6769%2026.8529%2022.46C26.8194%2022.2431%2026.8399%2022.0213%2026.9127%2021.8142C27.0677%2021.4342%2027.1209%2021.0204%2027.0671%2020.6135C27.0134%2020.2066%2026.8544%2019.8208%2026.606%2019.4942C26.4091%2019.1597%2026.1395%2018.8739%2025.8172%2018.6578C25.4948%2018.4417%2025.128%2018.3009%2024.7438%2018.2458C24.3597%2018.1908%2023.9681%2018.2228%2023.598%2018.3397C23.2279%2018.4565%2022.8889%2018.6552%2022.606%2018.9209C22.3433%2019.1814%2022.1377%2019.4938%2022.0023%2019.8381C21.8668%2020.1824%2021.8045%2020.5512%2021.8193%2020.9209C21.8224%2021.2267%2021.8812%2021.5294%2021.9927%2021.8142C22.0632%2022.0158%2022.0842%2022.2314%2022.054%2022.4429C22.0237%2022.6543%2021.9432%2022.8554%2021.819%2023.0292C21.6949%2023.203%2021.5308%2023.3444%2021.3406%2023.4416C21.1504%2023.5388%2020.9396%2023.5888%2020.726%2023.5875H17.8193Z%22%20fill%3D%22url(%23paint1_linear_2691_4389)%22%2F%3E%0A%3C%2Fg%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2691_4389%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23D4D4D8%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2691_4389%22%20x1%3D%2213.7453%22%20y1%3D%2221.3695%22%20x2%3D%2240.3876%22%20y2%3D%2235.7015%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23D4D4D8%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3CclipPath%20id%3D%22clip0_2691_4389%22%3E%0A%3Crect%20width%3D%2252%22%20height%3D%2257%22%20fill%3D%22white%22%20transform%3D%22translate(0.152832%200.920898)%22%2F%3E%0A%3C%2FclipPath%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="modules icon" class="modules-image-light" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M3.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4246%201.73116%2026.2124%201.69742%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8137C50.0812%2014.6086%2050.9896%2016.1043%2051.026%2017.7437L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821C51.1856%2041.5203%2050.346%2043.0611%2048.9325%2043.9357L29.0918%2056.2117C27.6424%2057.1085%2025.8227%2057.1572%2024.3387%2056.3439L3.85107%2045.1148C2.26984%2044.2481%201.14232%2042.646%201.15293%2041.0494V41.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869Z%22%20fill%3D%22%2318181B%22%20stroke%3D%22url(%23paint0_linear_2595_7175)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M33.8193%2042.2542H17.8193C16.7585%2042.2542%2015.7411%2041.8328%2014.9909%2041.0826C14.2408%2040.3325%2013.8193%2039.3151%2013.8193%2038.2542V24.9209C13.8193%2023.86%2014.2408%2022.8426%2014.9909%2022.0924C15.7411%2021.3423%2016.7585%2020.9209%2017.8193%2020.9209H19.1527C19.1751%2019.791%2019.5558%2018.6975%2020.2399%2017.7981C20.924%2016.8986%2021.8761%2016.2397%2022.9589%2015.9164C24.0416%2015.593%2025.1992%2015.6219%2026.2644%2015.999C27.3297%2016.376%2028.2477%2017.0817%2028.886%2018.0142C29.4839%2018.8664%2029.8094%2019.8799%2029.8193%2020.9209H33.8193C34.173%2020.9209%2034.5121%2021.0613%2034.7621%2021.3114C35.0122%2021.5614%2035.1527%2021.9006%2035.1527%2022.2542V26.2542C36.2825%2026.2766%2037.376%2026.6573%2038.2754%2027.3414C39.1749%2028.0255%2039.8338%2028.9776%2040.1572%2030.0604C40.4805%2031.1432%2040.4516%2032.3007%2040.0745%2033.366C39.6975%2034.4312%2038.9918%2035.3492%2038.0593%2035.9875C37.2071%2036.5854%2036.1937%2036.9109%2035.1527%2036.9209V40.9209C35.1527%2041.2745%2035.0122%2041.6136%2034.7621%2041.8637C34.5121%2042.1137%2034.173%2042.2542%2033.8193%2042.2542ZM17.8193%2023.5875C17.4657%2023.5875%2017.1266%2023.728%2016.8765%2023.978C16.6265%2024.2281%2016.486%2024.5672%2016.486%2024.9209V38.2542C16.486%2038.6078%2016.6265%2038.9469%2016.8765%2039.197C17.1266%2039.447%2017.4657%2039.5875%2017.8193%2039.5875H32.486V35.3475C32.4849%2035.1337%2032.5351%2034.9228%2032.6326%2034.7325C32.7301%2034.5422%2032.8718%2034.3782%2033.046%2034.2542C33.2196%2034.1304%2033.4205%2034.05%2033.6316%2034.0198C33.8427%2033.9897%2034.058%2034.0106%2034.2593%2034.0809C34.6393%2034.2359%2035.0532%2034.2891%2035.46%2034.2353C35.8669%2034.1816%2036.2527%2034.0226%2036.5793%2033.7742C36.9045%2033.5759%2037.1834%2033.3103%2037.3973%2032.9952C37.6111%2032.6801%2037.7551%2032.3229%2037.8193%2031.9475C37.8708%2031.5689%2037.8402%2031.1837%2037.7298%2030.8179C37.6194%2030.4522%2037.4317%2030.1144%2037.1793%2029.8275C36.8381%2029.413%2036.3734%2029.1183%2035.8529%2028.9864C35.3325%2028.8545%2034.7835%2028.8923%2034.286%2029.0942C34.0846%2029.1644%2033.8694%2029.1854%2033.6582%2029.1552C33.4471%2029.125%2033.2463%2029.0447%2033.0727%2028.9209C32.8985%2028.7969%2032.7567%2028.6328%2032.6593%2028.4425C32.5618%2028.2522%2032.5115%2028.0413%2032.5127%2027.8275V23.5875H28.246C28.0269%2023.5999%2027.8081%2023.5581%2027.609%2023.4656C27.4099%2023.3732%2027.2368%2023.233%2027.1049%2023.0576C26.973%2022.8822%2026.8864%2022.6769%2026.8529%2022.46C26.8194%2022.2431%2026.8399%2022.0213%2026.9127%2021.8142C27.0677%2021.4342%2027.1209%2021.0204%2027.0671%2020.6135C27.0134%2020.2066%2026.8544%2019.8208%2026.606%2019.4942C26.4091%2019.1597%2026.1395%2018.8739%2025.8172%2018.6578C25.4948%2018.4417%2025.128%2018.3009%2024.7438%2018.2458C24.3597%2018.1908%2023.9681%2018.2228%2023.598%2018.3397C23.2279%2018.4565%2022.8889%2018.6552%2022.606%2018.9209C22.3433%2019.1814%2022.1377%2019.4938%2022.0023%2019.8381C21.8668%2020.1824%2021.8045%2020.5512%2021.8193%2020.9209C21.8224%2021.2267%2021.8812%2021.5294%2021.9927%2021.8142C22.0632%2022.0158%2022.0842%2022.2314%2022.054%2022.4429C22.0237%2022.6543%2021.9432%2022.8554%2021.819%2023.0292C21.6949%2023.203%2021.5308%2023.3444%2021.3406%2023.4416C21.1504%2023.5388%2020.9396%2023.5888%2020.726%2023.5875H17.8193Z%22%20fill%3D%22url(%23paint1_linear_2595_7175)%22%2F%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2595_7175%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2595_7175%22%20x1%3D%2213.7453%22%20y1%3D%2221.3695%22%20x2%3D%2240.3876%22%20y2%3D%2235.7015%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="modules icon" class="modules-image-dark" data-v-ea739b84><div class="flex flex-col space-y text-black dark:text-white" data-v-ea739b84><h3 class="font-semibold text-xl" data-v-ea739b84>Modules</h3><p class="text-gray-700 dark:text-gray-300" data-v-ea739b84>Discover our list of modules to supercharge your Nuxt project. Created by the Nuxt team and community.</p></div></a></div><div class="row-span-2 col-span-2 order-last lg:order-none lg:col-span-4 text-black dark:text-white documentation-container rounded-xl relative items-center justify-center border border-gray-200 dark:border-transparent hover:border-transparent" data-v-ea739b84><div class="gradient-border gradient-border-square gradient-border-documentation" data-v-ea739b84></div><a href="https://nuxt.com/docs" target="_blank" class="rounded-xl flex lg:flex-col items-center justify-center gap-y-4 bg-white dark:bg-gray-900" data-v-ea739b84><div class="py-6 lg:py-7 px-5 rounded-xl flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-y-2" data-v-ea739b84><div class="flex flex-col space-y text-black dark:text-white" data-v-ea739b84><h3 class="font-semibold text-xl" data-v-ea739b84>Documentation</h3><p class="text-gray-700 dark:text-gray-300" data-v-ea739b84>We highly recommend you take a look at the Nuxt documentation to level up.</p></div><img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%22342%22%20height%3D%22165%22%20viewBox%3D%220%200%20342%20165%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20clip-path%3D%22url(%23clip0_2687_3947)%22%3E%0A%3Cpath%20d%3D%22M0.152832%20131.851H154.28%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M215.399%20107.359H349.153%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M0.152832%2077.2178L116.191%2077.2178%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M36.1528%20106.921L152.191%20106.921%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M202.153%2042.9209L317.305%2042.9209%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2076.9209L345.305%2076.9209%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M285.947%208.45605V166.979%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M252.602%2016.8311V107.36%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M171.153%2016.9209V107.45%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2016.9209V43.4501%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M122.153%2016.9211L327.45%2016.9209%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M1.92432%2043.3086H148.163%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M122.392%2016.4209V55.3659%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M36.084%200.920898L36.084%20176.921%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M75.4448%2043.249V175.152%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%2275.4448%22%20cy%3D%2277.2178%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%2236.1528%22%20cy%3D%22131.85%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%22285.947%22%20cy%3D%2242.9209%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%22252.602%22%20cy%3D%22107.359%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Cg%20filter%3D%22url(%23filter0_d_2687_3947)%22%3E%0A%3Cpath%20d%3D%22M122.846%2050.7109L163.067%2026.0929C166.656%2023.9507%20171.117%2023.8611%20174.77%2025.8579L217.894%2049.0819C221.524%2051.0665%20223.807%2054.8133%20223.892%2058.9246L224.15%20104.352C224.235%20108.448%20222.13%20112.287%20218.609%20114.46L177.783%20139.658C174.174%20141.886%20169.638%20142.011%20165.931%20139.984L123.774%20116.935C120.045%20114.896%20117.125%20111.001%20117.153%20106.776L117.153%2060.5974C117.18%2056.5529%20119.338%2052.8048%20122.846%2050.7109Z%22%20fill%3D%22white%22%2F%3E%0A%3Cpath%20d%3D%22M222.151%20104.393C222.22%20107.764%20220.487%20110.944%20217.571%20112.75C217.567%20112.753%20217.563%20112.755%20217.559%20112.758L176.733%20137.956C173.748%20139.798%20169.96%20139.907%20166.89%20138.229L124.733%20115.18C121.469%20113.395%20119.131%20110.069%20119.153%20106.79L119.153%20106.776L119.153%2060.6107C119.153%2060.6086%20119.153%2060.6065%20119.153%2060.6044C119.178%2057.2703%20120.958%2054.1669%20123.871%2052.4282L123.881%2052.4225L123.89%2052.4167L164.101%2027.8047C164.101%2027.8047%20164.101%2027.8047%20164.101%2027.8047C164.106%2027.8022%20164.11%2027.7997%20164.114%2027.7972C167.078%2026.0385%20170.793%2025.9632%20173.81%2027.6128L173.81%2027.6128L173.821%2027.6188L216.934%2050.8367C216.936%2050.8377%20216.938%2050.8387%20216.94%2050.8397C219.935%2052.4801%20221.817%2055.5878%20221.892%2058.9515L222.15%20104.363L222.15%20104.378L222.151%20104.393Z%22%20stroke%3D%22url(%23paint0_linear_2687_3947)%22%20stroke-width%3D%224%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M192.349%2096.9158L190.63%2090.5186L183.778%2064.9088C183.55%2064.0605%20182.994%2063.3375%20182.233%2062.8988C181.472%2062.4601%20180.568%2062.3416%20179.72%2062.5693L173.323%2064.2877L173.116%2064.3498C172.807%2063.945%20172.409%2063.6168%20171.953%2063.3906C171.497%2063.1644%20170.995%2063.0463%20170.486%2063.0455H163.861C163.279%2063.0471%20162.707%2063.2043%20162.205%2063.501C161.703%2063.2043%20161.132%2063.0471%20160.549%2063.0455H153.924C153.045%2063.0455%20152.203%2063.3945%20151.582%2064.0157C150.96%2064.6369%20150.611%2065.4795%20150.611%2066.358V99.483C150.611%20100.362%20150.96%20101.204%20151.582%20101.825C152.203%20102.447%20153.045%20102.796%20153.924%20102.796H160.549C161.132%20102.794%20161.703%20102.637%20162.205%20102.34C162.707%20102.637%20163.279%20102.794%20163.861%20102.796H170.486C171.365%20102.796%20172.207%20102.447%20172.829%20101.825C173.45%20101.204%20173.799%20100.362%20173.799%2099.483V78.8627L177.836%2093.9346L179.554%20100.332C179.742%20101.039%20180.158%20101.665%20180.739%20102.11C181.32%20102.556%20182.031%20102.797%20182.763%20102.796C183.049%20102.791%20183.334%20102.756%20183.612%20102.692L190.009%20100.974C190.43%20100.861%20190.824%20100.665%20191.169%20100.399C191.514%20100.132%20191.802%2099.7997%20192.018%2099.4209C192.238%2099.047%20192.381%2098.6325%20192.438%2098.2021C192.495%2097.7717%20192.465%2097.3342%20192.349%2096.9158V96.9158ZM176.325%2075.4881L182.722%2073.7697L187.007%2089.7732L180.61%2091.4916L176.325%2075.4881ZM180.569%2065.7783L181.873%2070.5607L175.476%2072.2791L174.171%2067.4967L180.569%2065.7783ZM170.486%2066.358V91.2018H163.861V66.358H170.486ZM160.549%2066.358V71.3268H153.924V66.358H160.549ZM153.924%2099.483V74.6393H160.549V99.483H153.924ZM170.486%2099.483H163.861V94.5143H170.486V99.483ZM189.161%2097.7646L182.763%2099.483L181.459%2094.6799L187.877%2092.9615L189.161%2097.7646V97.7646Z%22%20fill%3D%22url(%23paint1_linear_2687_3947)%22%2F%3E%0A%3Crect%20x%3D%222.15283%22%20y%3D%22-3.0791%22%20width%3D%22327%22%20height%3D%2223%22%20fill%3D%22url(%23paint2_linear_2687_3947)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(1%200%200%20-1%202.15283%20166.921)%22%20fill%3D%22url(%23paint3_linear_2687_3947)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(0%201%201%200%200.152832%20-17.0791)%22%20fill%3D%22url(%23paint4_linear_2687_3947)%22%2F%3E%0A%3Crect%20x%3D%22342.153%22%20y%3D%22-17.0791%22%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22rotate(90%20342.153%20-17.0791)%22%20fill%3D%22url(%23paint5_linear_2687_3947)%22%2F%3E%0A%3C%2Fg%3E%0A%3Cdefs%3E%0A%3Cfilter%20id%3D%22filter0_d_2687_3947%22%20x%3D%2286.1528%22%20y%3D%22-6.5791%22%20width%3D%22169%22%20height%3D%22179%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%0A%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%0A%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20type%3D%22matrix%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%20result%3D%22hardAlpha%22%2F%3E%0A%3CfeOffset%2F%3E%0A%3CfeGaussianBlur%20stdDeviation%3D%2215.5%22%2F%3E%0A%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22out%22%2F%3E%0A%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%220%200%200%200%201%200%200%200%200%201%200%200%200%200%201%200%200%200%200.07%200%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in2%3D%22BackgroundImageFix%22%20result%3D%22effect1_dropShadow_2687_3947%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_dropShadow_2687_3947%22%20result%3D%22shape%22%2F%3E%0A%3C%2Ffilter%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2687_3947%22%20x1%3D%22118.202%22%20y1%3D%2260.3042%22%20x2%3D%22223.159%22%20y2%3D%22113.509%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23003F25%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2687_3947%22%20x1%3D%22150.495%22%20y1%3D%2271.0767%22%20x2%3D%22191.769%22%20y2%3D%2294.1139%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23003F25%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint2_linear_2687_3947%22%20x1%3D%22165.653%22%20y1%3D%22-3.0791%22%20x2%3D%22166.153%22%20y2%3D%2219.9209%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint3_linear_2687_3947%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint4_linear_2687_3947%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint5_linear_2687_3947%22%20x1%3D%22505.653%22%20y1%3D%22-17.0791%22%20x2%3D%22506.244%22%20y2%3D%227.91876%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3CclipPath%20id%3D%22clip0_2687_3947%22%3E%0A%3Crect%20width%3D%22341%22%20height%3D%22164%22%20fill%3D%22white%22%20transform%3D%22translate(0.152832%200.920898)%22%2F%3E%0A%3C%2FclipPath%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="documentation icon" class="documentation-image-color-light h-32 sm:h-34" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%22342%22%20height%3D%22165%22%20viewBox%3D%220%200%20342%20165%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20clip-path%3D%22url(%23clip0_2595_7273)%22%3E%0A%3Cpath%20d%3D%22M0.152832%20131.851H154.28%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M215.399%20107.359H349.153%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M0.152832%2077.2178L116.191%2077.2178%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M36.1528%20106.921L152.191%20106.921%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M202.153%2042.9209L317.305%2042.9209%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2076.9209L345.305%2076.9209%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M285.947%208.45605V166.979%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M252.602%2016.8311V107.36%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M171.153%2016.9209V107.45%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2016.9209V43.4501%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M122.153%2016.9211L327.45%2016.9209%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M1.92432%2043.3086H148.163%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M122.392%2016.4209V55.3659%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M36.084%200.920898L36.084%20176.921%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M75.4448%2043.249V175.152%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%2275.4448%22%20cy%3D%2277.2178%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%2236.1528%22%20cy%3D%22131.85%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%22285.947%22%20cy%3D%2242.9209%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%22252.602%22%20cy%3D%22107.359%22%20r%3D%223.5%22%20fill%3D%22%2300DC82%22%2F%3E%0A%3Cg%20filter%3D%22url(%23filter0_d_2595_7273)%22%3E%0A%3Cpath%20d%3D%22M122.846%2050.7109L163.067%2026.0929C166.656%2023.9507%20171.117%2023.8611%20174.77%2025.8579L217.894%2049.0819C221.524%2051.0665%20223.807%2054.8133%20223.892%2058.9246L224.15%20104.352C224.235%20108.448%20222.13%20112.287%20218.609%20114.46L177.783%20139.658C174.174%20141.886%20169.638%20142.011%20165.931%20139.984L123.774%20116.935C120.045%20114.896%20117.125%20111.001%20117.153%20106.776L117.153%2060.5974C117.18%2056.5529%20119.338%2052.8048%20122.846%2050.7109Z%22%20fill%3D%22%2318181B%22%2F%3E%0A%3Cpath%20d%3D%22M123.871%2052.4282L123.881%2052.4225L123.89%2052.4167L164.101%2027.8047C167.083%2026.0291%20170.786%2025.9592%20173.81%2027.6128L173.81%2027.6128L173.821%2027.6188L216.934%2050.8367C216.936%2050.8376%20216.938%2050.8386%20216.939%2050.8395C219.938%2052.4814%20221.817%2055.5694%20221.892%2058.9515L222.15%20104.363L222.15%20104.378L222.151%20104.393C222.221%20107.772%20220.485%20110.952%20217.559%20112.758L176.733%20137.956C173.732%20139.808%20169.963%20139.909%20166.89%20138.229L124.733%20115.18C121.465%20113.393%20119.131%20110.089%20119.153%20106.79L119.153%20106.776L119.153%2060.6107C119.153%2060.6086%20119.153%2060.6065%20119.153%2060.6044C119.178%2057.2703%20120.958%2054.1669%20123.871%2052.4282Z%22%20stroke%3D%22url(%23paint0_linear_2595_7273)%22%20stroke-width%3D%224%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M192.349%2096.9158L190.63%2090.5186L183.778%2064.9088C183.55%2064.0605%20182.994%2063.3375%20182.233%2062.8988C181.472%2062.4601%20180.568%2062.3416%20179.72%2062.5693L173.323%2064.2877L173.116%2064.3498C172.807%2063.945%20172.409%2063.6168%20171.953%2063.3906C171.497%2063.1644%20170.995%2063.0463%20170.486%2063.0455H163.861C163.279%2063.0471%20162.707%2063.2043%20162.205%2063.501C161.703%2063.2043%20161.132%2063.0471%20160.549%2063.0455H153.924C153.045%2063.0455%20152.203%2063.3945%20151.582%2064.0157C150.96%2064.6369%20150.611%2065.4795%20150.611%2066.358V99.483C150.611%20100.362%20150.96%20101.204%20151.582%20101.825C152.203%20102.447%20153.045%20102.796%20153.924%20102.796H160.549C161.132%20102.794%20161.703%20102.637%20162.205%20102.34C162.707%20102.637%20163.279%20102.794%20163.861%20102.796H170.486C171.365%20102.796%20172.207%20102.447%20172.829%20101.825C173.45%20101.204%20173.799%20100.362%20173.799%2099.483V78.8627L177.836%2093.9346L179.554%20100.332C179.742%20101.039%20180.158%20101.665%20180.739%20102.11C181.32%20102.556%20182.031%20102.797%20182.763%20102.796C183.049%20102.791%20183.334%20102.756%20183.612%20102.692L190.009%20100.974C190.43%20100.861%20190.824%20100.665%20191.169%20100.399C191.514%20100.132%20191.802%2099.7998%20192.018%2099.4209C192.238%2099.047%20192.381%2098.6325%20192.438%2098.2021C192.495%2097.7717%20192.465%2097.3342%20192.349%2096.9158ZM176.325%2075.4881L182.722%2073.7697L187.007%2089.7732L180.61%2091.4916L176.325%2075.4881ZM180.569%2065.7783L181.873%2070.5607L175.476%2072.2791L174.171%2067.4967L180.569%2065.7783ZM170.486%2066.358V91.2018H163.861V66.358H170.486ZM160.549%2066.358V71.3268H153.924V66.358H160.549ZM153.924%2099.483V74.6393H160.549V99.483H153.924ZM170.486%2099.483H163.861V94.5143H170.486V99.483ZM189.161%2097.7646L182.763%2099.483L181.459%2094.6799L187.877%2092.9615L189.161%2097.7646Z%22%20fill%3D%22url(%23paint1_linear_2595_7273)%22%2F%3E%0A%3Crect%20x%3D%222.15283%22%20y%3D%22-3.0791%22%20width%3D%22327%22%20height%3D%2223%22%20fill%3D%22url(%23paint2_linear_2595_7273)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(1%200%200%20-1%202.15283%20166.921)%22%20fill%3D%22url(%23paint3_linear_2595_7273)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(0%201%201%200%200.152832%20-17.0791)%22%20fill%3D%22url(%23paint4_linear_2595_7273)%22%2F%3E%0A%3Crect%20x%3D%22342.153%22%20y%3D%22-17.0791%22%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22rotate(90%20342.153%20-17.0791)%22%20fill%3D%22url(%23paint5_linear_2595_7273)%22%2F%3E%0A%3C%2Fg%3E%0A%3Cdefs%3E%0A%3Cfilter%20id%3D%22filter0_d_2595_7273%22%20x%3D%2286.1528%22%20y%3D%22-6.5791%22%20width%3D%22169%22%20height%3D%22179%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%0A%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%0A%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20type%3D%22matrix%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%20result%3D%22hardAlpha%22%2F%3E%0A%3CfeOffset%2F%3E%0A%3CfeGaussianBlur%20stdDeviation%3D%2215.5%22%2F%3E%0A%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22out%22%2F%3E%0A%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%220%200%200%200%201%200%200%200%200%201%200%200%200%200%201%200%200%200%200.07%200%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in2%3D%22BackgroundImageFix%22%20result%3D%22effect1_dropShadow_2595_7273%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_dropShadow_2595_7273%22%20result%3D%22shape%22%2F%3E%0A%3C%2Ffilter%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2595_7273%22%20x1%3D%22118.202%22%20y1%3D%2260.3042%22%20x2%3D%22223.159%22%20y2%3D%22113.509%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23003F25%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2595_7273%22%20x1%3D%22150.495%22%20y1%3D%2271.0767%22%20x2%3D%22191.769%22%20y2%3D%2294.1139%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2300DC82%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23003F25%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint2_linear_2595_7273%22%20x1%3D%22165.653%22%20y1%3D%22-3.0791%22%20x2%3D%22166.153%22%20y2%3D%2219.9209%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint3_linear_2595_7273%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint4_linear_2595_7273%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint5_linear_2595_7273%22%20x1%3D%22505.653%22%20y1%3D%22-17.0791%22%20x2%3D%22506.244%22%20y2%3D%227.91876%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3CclipPath%20id%3D%22clip0_2595_7273%22%3E%0A%3Crect%20width%3D%22341%22%20height%3D%22164%22%20fill%3D%22white%22%20transform%3D%22translate(0.152832%200.920898)%22%2F%3E%0A%3C%2FclipPath%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="documentation icon" class="documentation-image-color-dark h-32 sm:h-34" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%22342%22%20height%3D%22165%22%20viewBox%3D%220%200%20342%20165%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20clip-path%3D%22url(%23clip0_2687_3977)%22%3E%0A%3Cpath%20d%3D%22M0.152832%20131.851H154.28%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M215.399%20107.359H349.153%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M0.152832%2077.2178L116.191%2077.2178%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M36.1528%20106.921L152.191%20106.921%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M202.153%2042.9209L317.305%2042.9209%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2076.9209L345.305%2076.9209%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M285.947%208.45605V166.979%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M252.602%2016.8311V107.36%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M171.153%2016.9209V107.45%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2016.9209V43.4501%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M122.153%2016.9211L327.45%2016.9209%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M1.92432%2043.3086H148.163%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M122.392%2016.4209V55.3659%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M36.084%200.920898L36.084%20176.921%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Cpath%20d%3D%22M75.4448%2043.249V175.152%22%20stroke%3D%22%23E4E4E7%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%2275.4448%22%20cy%3D%2277.2178%22%20r%3D%223.5%22%20fill%3D%22%23A1A1AA%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%2236.1528%22%20cy%3D%22131.85%22%20r%3D%223.5%22%20fill%3D%22%23A1A1AA%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%22285.947%22%20cy%3D%2242.9209%22%20r%3D%223.5%22%20fill%3D%22%23A1A1AA%22%2F%3E%0A%3Ccircle%20opacity%3D%220.7%22%20cx%3D%22252.602%22%20cy%3D%22107.359%22%20r%3D%223.5%22%20fill%3D%22%23A1A1AA%22%2F%3E%0A%3Cg%20filter%3D%22url(%23filter0_d_2687_3977)%22%3E%0A%3Cpath%20d%3D%22M122.846%2050.7109L163.067%2026.0929C166.656%2023.9507%20171.117%2023.8611%20174.77%2025.8579L217.894%2049.0819C221.524%2051.0665%20223.807%2054.8133%20223.892%2058.9246L224.15%20104.352C224.235%20108.448%20222.13%20112.287%20218.609%20114.46L177.783%20139.658C174.174%20141.886%20169.638%20142.011%20165.931%20139.984L123.774%20116.935C120.045%20114.896%20117.125%20111.001%20117.153%20106.776L117.153%2060.5974C117.18%2056.5529%20119.338%2052.8048%20122.846%2050.7109Z%22%20fill%3D%22white%22%2F%3E%0A%3Cpath%20d%3D%22M222.151%20104.393C222.22%20107.764%20220.487%20110.944%20217.571%20112.75C217.567%20112.753%20217.563%20112.755%20217.559%20112.758L176.733%20137.956C173.748%20139.798%20169.96%20139.907%20166.89%20138.229L124.733%20115.18C121.469%20113.395%20119.131%20110.069%20119.153%20106.79L119.153%20106.776L119.153%2060.6107C119.153%2060.6086%20119.153%2060.6065%20119.153%2060.6044C119.178%2057.2703%20120.958%2054.1669%20123.871%2052.4282L123.881%2052.4225L123.89%2052.4167L164.101%2027.8047C164.101%2027.8047%20164.101%2027.8047%20164.101%2027.8047C164.106%2027.8022%20164.11%2027.7997%20164.114%2027.7972C167.078%2026.0385%20170.793%2025.9632%20173.81%2027.6128L173.81%2027.6128L173.821%2027.6188L216.934%2050.8367C216.936%2050.8377%20216.938%2050.8387%20216.94%2050.8397C219.935%2052.4801%20221.817%2055.5878%20221.892%2058.9515L222.15%20104.363L222.15%20104.378L222.151%20104.393Z%22%20stroke%3D%22url(%23paint0_linear_2687_3977)%22%20stroke-width%3D%224%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M192.349%2096.9158L190.63%2090.5186L183.778%2064.9088C183.55%2064.0605%20182.994%2063.3375%20182.233%2062.8988C181.472%2062.4601%20180.568%2062.3416%20179.72%2062.5693L173.323%2064.2877L173.116%2064.3498C172.807%2063.945%20172.409%2063.6168%20171.953%2063.3906C171.497%2063.1644%20170.995%2063.0463%20170.486%2063.0455H163.861C163.279%2063.0471%20162.707%2063.2043%20162.205%2063.501C161.703%2063.2043%20161.132%2063.0471%20160.549%2063.0455H153.924C153.045%2063.0455%20152.203%2063.3945%20151.582%2064.0157C150.96%2064.6369%20150.611%2065.4795%20150.611%2066.358V99.483C150.611%20100.362%20150.96%20101.204%20151.582%20101.825C152.203%20102.447%20153.045%20102.796%20153.924%20102.796H160.549C161.132%20102.794%20161.703%20102.637%20162.205%20102.34C162.707%20102.637%20163.279%20102.794%20163.861%20102.796H170.486C171.365%20102.796%20172.207%20102.447%20172.829%20101.825C173.45%20101.204%20173.799%20100.362%20173.799%2099.483V78.8627L177.836%2093.9346L179.554%20100.332C179.742%20101.039%20180.158%20101.665%20180.739%20102.11C181.32%20102.556%20182.031%20102.797%20182.763%20102.796C183.049%20102.791%20183.334%20102.756%20183.612%20102.692L190.009%20100.974C190.43%20100.861%20190.824%20100.665%20191.169%20100.399C191.514%20100.132%20191.802%2099.7997%20192.018%2099.4209C192.238%2099.047%20192.381%2098.6325%20192.438%2098.2021C192.495%2097.7717%20192.465%2097.3342%20192.349%2096.9158V96.9158ZM176.325%2075.4881L182.722%2073.7697L187.007%2089.7732L180.61%2091.4916L176.325%2075.4881ZM180.569%2065.7783L181.873%2070.5607L175.476%2072.2791L174.171%2067.4967L180.569%2065.7783ZM170.486%2066.358V91.2018H163.861V66.358H170.486ZM160.549%2066.358V71.3268H153.924V66.358H160.549ZM153.924%2099.483V74.6393H160.549V99.483H153.924ZM170.486%2099.483H163.861V94.5143H170.486V99.483ZM189.161%2097.7646L182.763%2099.483L181.459%2094.6799L187.877%2092.9615L189.161%2097.7646V97.7646Z%22%20fill%3D%22url(%23paint1_linear_2687_3977)%22%2F%3E%0A%3Crect%20x%3D%222.15283%22%20y%3D%22-3.0791%22%20width%3D%22327%22%20height%3D%2223%22%20fill%3D%22url(%23paint2_linear_2687_3977)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(1%200%200%20-1%202.15283%20166.921)%22%20fill%3D%22url(%23paint3_linear_2687_3977)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(0%201%201%200%200.152832%20-17.0791)%22%20fill%3D%22url(%23paint4_linear_2687_3977)%22%2F%3E%0A%3Crect%20x%3D%22342.153%22%20y%3D%22-17.0791%22%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22rotate(90%20342.153%20-17.0791)%22%20fill%3D%22url(%23paint5_linear_2687_3977)%22%2F%3E%0A%3C%2Fg%3E%0A%3Cdefs%3E%0A%3Cfilter%20id%3D%22filter0_d_2687_3977%22%20x%3D%2286.1528%22%20y%3D%22-6.5791%22%20width%3D%22169%22%20height%3D%22179%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%0A%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%0A%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20type%3D%22matrix%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%20result%3D%22hardAlpha%22%2F%3E%0A%3CfeOffset%2F%3E%0A%3CfeGaussianBlur%20stdDeviation%3D%2215.5%22%2F%3E%0A%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22out%22%2F%3E%0A%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%220%200%200%200%200.831373%200%200%200%200%200.831373%200%200%200%200%200.847059%200%200%200%200.07%200%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in2%3D%22BackgroundImageFix%22%20result%3D%22effect1_dropShadow_2687_3977%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_dropShadow_2687_3977%22%20result%3D%22shape%22%2F%3E%0A%3C%2Ffilter%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2687_3977%22%20x1%3D%22118.202%22%20y1%3D%2260.3042%22%20x2%3D%22223.159%22%20y2%3D%22113.509%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23D4D4D8%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%233F3F46%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2687_3977%22%20x1%3D%22150.495%22%20y1%3D%2271.0767%22%20x2%3D%22191.769%22%20y2%3D%2294.1139%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23D4D4D8%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%233F3F46%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint2_linear_2687_3977%22%20x1%3D%22165.653%22%20y1%3D%22-3.0791%22%20x2%3D%22166.153%22%20y2%3D%2219.9209%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint3_linear_2687_3977%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint4_linear_2687_3977%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint5_linear_2687_3977%22%20x1%3D%22505.653%22%20y1%3D%22-17.0791%22%20x2%3D%22506.244%22%20y2%3D%227.91876%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3CclipPath%20id%3D%22clip0_2687_3977%22%3E%0A%3Crect%20width%3D%22341%22%20height%3D%22164%22%20fill%3D%22white%22%20transform%3D%22translate(0.152832%200.920898)%22%2F%3E%0A%3C%2FclipPath%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="documentation icon" class="documentation-image-light h-32 sm:h-34" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%22342%22%20height%3D%22165%22%20viewBox%3D%220%200%20342%20165%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cg%20clip-path%3D%22url(%23clip0_2595_7193)%22%3E%0A%3Cpath%20d%3D%22M0.152832%20131.851H154.28%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M215.399%20107.359H349.153%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M0.152832%2077.2178L116.191%2077.2178%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M36.1528%20106.921L152.191%20106.921%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M202.153%2042.9209L317.305%2042.9209%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2076.9209L345.305%2076.9209%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M285.947%208.45605V166.979%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M252.602%2016.8311V107.36%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M171.153%2016.9209V107.45%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M218.153%2016.9209V43.4501%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M122.153%2016.9211L327.45%2016.9209%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M1.92432%2043.3086H148.163%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M122.392%2016.4209V55.3659%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M36.084%200.920898L36.084%20176.921%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Cpath%20d%3D%22M75.4448%2043.249V175.152%22%20stroke%3D%22%2327272A%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%2275.4448%22%20cy%3D%2277.2178%22%20r%3D%223.5%22%20fill%3D%22white%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%2236.1528%22%20cy%3D%22131.85%22%20r%3D%223.5%22%20fill%3D%22white%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%22285.947%22%20cy%3D%2242.9209%22%20r%3D%223.5%22%20fill%3D%22white%22%2F%3E%0A%3Ccircle%20opacity%3D%220.14%22%20cx%3D%22252.602%22%20cy%3D%22107.359%22%20r%3D%223.5%22%20fill%3D%22white%22%2F%3E%0A%3Cg%20filter%3D%22url(%23filter0_d_2595_7193)%22%3E%0A%3Cpath%20d%3D%22M122.846%2050.7109L163.067%2026.0929C166.656%2023.9507%20171.117%2023.8611%20174.77%2025.8579L217.894%2049.0819C221.524%2051.0665%20223.807%2054.8133%20223.892%2058.9246L224.15%20104.352C224.235%20108.448%20222.13%20112.287%20218.609%20114.46L177.783%20139.658C174.174%20141.886%20169.638%20142.011%20165.931%20139.984L123.774%20116.935C120.045%20114.896%20117.125%20111.001%20117.153%20106.776L117.153%2060.5974C117.18%2056.5529%20119.338%2052.8048%20122.846%2050.7109Z%22%20fill%3D%22%2318181B%22%2F%3E%0A%3Cpath%20d%3D%22M123.871%2052.4282L123.881%2052.4225L123.89%2052.4167L164.101%2027.8047C167.083%2026.0291%20170.786%2025.9592%20173.81%2027.6128L173.81%2027.6128L173.821%2027.6188L216.934%2050.8367C216.936%2050.8376%20216.938%2050.8386%20216.939%2050.8395C219.938%2052.4814%20221.817%2055.5694%20221.892%2058.9515L222.15%20104.363L222.15%20104.378L222.151%20104.393C222.221%20107.772%20220.485%20110.952%20217.559%20112.758L176.733%20137.956C173.732%20139.808%20169.963%20139.909%20166.89%20138.229L124.733%20115.18C121.465%20113.393%20119.131%20110.089%20119.153%20106.79L119.153%20106.776L119.153%2060.6107C119.153%2060.6086%20119.153%2060.6065%20119.153%2060.6044C119.178%2057.2703%20120.958%2054.1669%20123.871%2052.4282Z%22%20stroke%3D%22url(%23paint0_linear_2595_7193)%22%20stroke-width%3D%224%22%2F%3E%0A%3C%2Fg%3E%0A%3Cpath%20d%3D%22M192.349%2096.9158L190.63%2090.5186L183.778%2064.9088C183.55%2064.0605%20182.994%2063.3375%20182.233%2062.8988C181.472%2062.4601%20180.568%2062.3416%20179.72%2062.5693L173.323%2064.2877L173.116%2064.3498C172.807%2063.945%20172.409%2063.6168%20171.953%2063.3906C171.497%2063.1644%20170.995%2063.0463%20170.486%2063.0455H163.861C163.279%2063.0471%20162.707%2063.2043%20162.205%2063.501C161.703%2063.2043%20161.132%2063.0471%20160.549%2063.0455H153.924C153.045%2063.0455%20152.203%2063.3945%20151.582%2064.0157C150.96%2064.6369%20150.611%2065.4795%20150.611%2066.358V99.483C150.611%20100.362%20150.96%20101.204%20151.582%20101.825C152.203%20102.447%20153.045%20102.796%20153.924%20102.796H160.549C161.132%20102.794%20161.703%20102.637%20162.205%20102.34C162.707%20102.637%20163.279%20102.794%20163.861%20102.796H170.486C171.365%20102.796%20172.207%20102.447%20172.829%20101.825C173.45%20101.204%20173.799%20100.362%20173.799%2099.483V78.8627L177.836%2093.9346L179.554%20100.332C179.742%20101.039%20180.158%20101.665%20180.739%20102.11C181.32%20102.556%20182.031%20102.797%20182.763%20102.796C183.049%20102.791%20183.334%20102.756%20183.612%20102.692L190.009%20100.974C190.43%20100.861%20190.824%20100.665%20191.169%20100.399C191.514%20100.132%20191.802%2099.7998%20192.018%2099.4209C192.238%2099.047%20192.381%2098.6325%20192.438%2098.2021C192.495%2097.7717%20192.465%2097.3342%20192.349%2096.9158ZM176.325%2075.4881L182.722%2073.7697L187.007%2089.7732L180.61%2091.4916L176.325%2075.4881ZM180.569%2065.7783L181.873%2070.5607L175.476%2072.2791L174.171%2067.4967L180.569%2065.7783ZM170.486%2066.358V91.2018H163.861V66.358H170.486ZM160.549%2066.358V71.3268H153.924V66.358H160.549ZM153.924%2099.483V74.6393H160.549V99.483H153.924ZM170.486%2099.483H163.861V94.5143H170.486V99.483ZM189.161%2097.7646L182.763%2099.483L181.459%2094.6799L187.877%2092.9615L189.161%2097.7646Z%22%20fill%3D%22url(%23paint1_linear_2595_7193)%22%2F%3E%0A%3Crect%20x%3D%222.15283%22%20y%3D%22-3.0791%22%20width%3D%22327%22%20height%3D%2223%22%20fill%3D%22url(%23paint2_linear_2595_7193)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(1%200%200%20-1%202.15283%20166.921)%22%20fill%3D%22url(%23paint3_linear_2595_7193)%22%2F%3E%0A%3Crect%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22matrix(0%201%201%200%200.152832%20-17.0791)%22%20fill%3D%22url(%23paint4_linear_2595_7193)%22%2F%3E%0A%3Crect%20x%3D%22342.153%22%20y%3D%22-17.0791%22%20width%3D%22327%22%20height%3D%2225%22%20transform%3D%22rotate(90%20342.153%20-17.0791)%22%20fill%3D%22url(%23paint5_linear_2595_7193)%22%2F%3E%0A%3C%2Fg%3E%0A%3Cdefs%3E%0A%3Cfilter%20id%3D%22filter0_d_2595_7193%22%20x%3D%2286.1528%22%20y%3D%22-6.5791%22%20width%3D%22169%22%20height%3D%22179%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%0A%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%0A%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20type%3D%22matrix%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%20result%3D%22hardAlpha%22%2F%3E%0A%3CfeOffset%2F%3E%0A%3CfeGaussianBlur%20stdDeviation%3D%2215.5%22%2F%3E%0A%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22out%22%2F%3E%0A%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%220%200%200%200%201%200%200%200%200%201%200%200%200%200%201%200%200%200%200.07%200%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in2%3D%22BackgroundImageFix%22%20result%3D%22effect1_dropShadow_2595_7193%22%2F%3E%0A%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22effect1_dropShadow_2595_7193%22%20result%3D%22shape%22%2F%3E%0A%3C%2Ffilter%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2595_7193%22%20x1%3D%22118.202%22%20y1%3D%2260.3042%22%20x2%3D%22223.159%22%20y2%3D%22113.509%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2595_7193%22%20x1%3D%22150.495%22%20y1%3D%2271.0767%22%20x2%3D%22191.769%22%20y2%3D%2294.1139%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint2_linear_2595_7193%22%20x1%3D%22165.653%22%20y1%3D%22-3.0791%22%20x2%3D%22166.153%22%20y2%3D%2219.9209%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint3_linear_2595_7193%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint4_linear_2595_7193%22%20x1%3D%22163.5%22%20y1%3D%22-2.30278e-07%22%20x2%3D%22164.091%22%20y2%3D%2224.9979%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint5_linear_2595_7193%22%20x1%3D%22505.653%22%20y1%3D%22-17.0791%22%20x2%3D%22506.244%22%20y2%3D%227.91876%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%2318181B%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2318181B%22%20stop-opacity%3D%220%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3CclipPath%20id%3D%22clip0_2595_7193%22%3E%0A%3Crect%20width%3D%22341%22%20height%3D%22164%22%20fill%3D%22white%22%20transform%3D%22translate(0.152832%200.920898)%22%2F%3E%0A%3C%2FclipPath%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="documentation icon" class="documentation-image-dark h-32 sm:h-34" data-v-ea739b84></div></a></div><div class="lg:min-h-min sm:min-h-[220px] md:min-h-[180px] col-span-2 sm:col-span-1 lg:col-span-6 text-black dark:text-white rounded-xl examples-container relative items-center justify-center border border-gray-200 dark:border-transparent hover:border-transparent" data-v-ea739b84><div class="gradient-border gradient-border-examples gradient-border-rect" data-v-ea739b84></div><div class="examples-gradient-right absolute right-0 inset-y-0 w-[20%] bg-gradient-to-l to-transparent from-blue-400 rounded-xl z-1 transition-opacity duration-300" data-v-ea739b84></div><a href="https://nuxt.com/docs/examples" target="_blank" class="py-6 px-5 rounded-xl flex items-center justify-center gap-x-4 bg-white dark:bg-gray-900 sm:min-h-[220px] md:min-h-[180px] lg:min-h-min" data-v-ea739b84><img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M49.1971%2043.7595C49.1113%2043.8209%2049.0231%2043.8796%2048.9325%2043.9357L29.0918%2056.2117C27.6504%2057.1035%2025.8212%2057.1564%2024.3387%2056.3439L3.85107%2045.1148C2.27157%2044.2491%201.14238%2042.6366%201.15291%2041.0494L1.15293%2041.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4169%201.73583%2026.2139%201.69824%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8136C50.0797%2014.6078%2050.9898%2016.1132%2051.026%2017.7438L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821C51.1834%2041.4138%2050.4491%2042.8635%2049.1971%2043.7595Z%22%20fill%3D%22white%22%20stroke%3D%22url(%23paint0_linear_2613_3941)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M37.1528%2017.9209H15.1528C14.6224%2017.9209%2014.1137%2018.1316%2013.7386%2018.5067C13.3635%2018.8818%2013.1528%2019.3905%2013.1528%2019.9209V37.9209C13.1528%2038.4513%2013.3635%2038.96%2013.7386%2039.3351C14.1137%2039.7102%2014.6224%2039.9209%2015.1528%2039.9209H37.1528C37.6833%2039.9209%2038.192%2039.7102%2038.567%2039.3351C38.9421%2038.96%2039.1528%2038.4513%2039.1528%2037.9209V19.9209C39.1528%2019.3905%2038.9421%2018.8818%2038.567%2018.5067C38.192%2018.1316%2037.6833%2017.9209%2037.1528%2017.9209V17.9209ZM15.1528%2019.9209H37.1528V24.9209H15.1528V19.9209ZM15.1528%2026.9209H22.1528V37.9209H15.1528V26.9209ZM37.1528%2037.9209H24.1528V26.9209H37.1528V37.9209Z%22%20fill%3D%22url(%23paint1_linear_2613_3941)%22%2F%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2613_3941%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%238DEAFF%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23008AA9%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2613_3941%22%20x1%3D%2213.0804%22%20y1%3D%2222.6224%22%20x2%3D%2237.028%22%20y2%3D%2237.847%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%238DEAFF%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23008AA9%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="examples icon" class="examples-image-color-light" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M3.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4246%201.73116%2026.2124%201.69742%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8137C50.0812%2014.6086%2050.9896%2016.1043%2051.026%2017.7437L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821C51.1856%2041.5203%2050.346%2043.0611%2048.9325%2043.9357L29.0918%2056.2117C27.6424%2057.1085%2025.8227%2057.1572%2024.3387%2056.3439L3.85107%2045.1148C2.26984%2044.2481%201.14232%2042.646%201.15293%2041.0494V41.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869Z%22%20fill%3D%22%2318181B%22%20stroke%3D%22url(%23paint0_linear_2595_7426)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M37.1528%2017.9209H15.1528C14.6224%2017.9209%2014.1137%2018.1316%2013.7386%2018.5067C13.3635%2018.8818%2013.1528%2019.3905%2013.1528%2019.9209V37.9209C13.1528%2038.4513%2013.3635%2038.96%2013.7386%2039.3351C14.1137%2039.7102%2014.6224%2039.9209%2015.1528%2039.9209H37.1528C37.6833%2039.9209%2038.192%2039.7102%2038.567%2039.3351C38.9421%2038.96%2039.1528%2038.4513%2039.1528%2037.9209V19.9209C39.1528%2019.3905%2038.9421%2018.8818%2038.567%2018.5067C38.192%2018.1316%2037.6833%2017.9209%2037.1528%2017.9209ZM15.1528%2019.9209H37.1528V24.9209H15.1528V19.9209ZM15.1528%2026.9209H22.1528V37.9209H15.1528V26.9209ZM37.1528%2037.9209H24.1528V26.9209H37.1528V37.9209Z%22%20fill%3D%22url(%23paint1_linear_2595_7426)%22%2F%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2595_7426%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%238DEAFF%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23008AA9%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2595_7426%22%20x1%3D%2213.0804%22%20y1%3D%2222.6224%22%20x2%3D%2237.028%22%20y2%3D%2237.847%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%238DEAFF%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23008AA9%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="examples icon" class="examples-image-color-dark" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M49.1971%2043.7595C49.1113%2043.8209%2049.0231%2043.8796%2048.9325%2043.9357L29.0918%2056.2117C27.6504%2057.1035%2025.8212%2057.1564%2024.3387%2056.3439L3.85107%2045.1148C2.27157%2044.2491%201.14238%2042.6366%201.15291%2041.0494L1.15293%2041.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4169%201.73583%2026.2139%201.69824%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8136C50.0797%2014.6078%2050.9898%2016.1132%2051.026%2017.7438L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821C51.1834%2041.4138%2050.4491%2042.8635%2049.1971%2043.7595Z%22%20fill%3D%22white%22%20stroke%3D%22url(%23paint0_linear_2691_4397)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M37.1528%2017.9209H15.1528C14.6224%2017.9209%2014.1137%2018.1316%2013.7386%2018.5067C13.3635%2018.8818%2013.1528%2019.3905%2013.1528%2019.9209V37.9209C13.1528%2038.4513%2013.3635%2038.96%2013.7386%2039.3351C14.1137%2039.7102%2014.6224%2039.9209%2015.1528%2039.9209H37.1528C37.6833%2039.9209%2038.192%2039.7102%2038.567%2039.3351C38.9421%2038.96%2039.1528%2038.4513%2039.1528%2037.9209V19.9209C39.1528%2019.3905%2038.9421%2018.8818%2038.567%2018.5067C38.192%2018.1316%2037.6833%2017.9209%2037.1528%2017.9209V17.9209ZM15.1528%2019.9209H37.1528V24.9209H15.1528V19.9209ZM15.1528%2026.9209H22.1528V37.9209H15.1528V26.9209ZM37.1528%2037.9209H24.1528V26.9209H37.1528V37.9209Z%22%20fill%3D%22url(%23paint1_linear_2691_4397)%22%2F%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2691_4397%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23D4D4D8%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2691_4397%22%20x1%3D%2213.0804%22%20y1%3D%2222.6224%22%20x2%3D%2237.028%22%20y2%3D%2237.847%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22%23D4D4D8%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="examples icon" class="examples-image-light" data-v-ea739b84> <img src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2253%22%20height%3D%2258%22%20viewBox%3D%220%200%2053%2058%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M3.43319%2014.5869L3.43322%2014.587L3.44269%2014.5812L22.9844%202.59084C24.4246%201.73116%2026.2124%201.69742%2027.6729%202.49791L27.6729%202.49792L27.6784%202.50094L48.6303%2013.8121C48.6313%2013.8126%2048.6322%2013.8131%2048.6331%2013.8137C50.0812%2014.6086%2050.9896%2016.1043%2051.026%2017.7437L51.1517%2039.8672L51.1517%2039.8746L51.1519%2039.8821C51.1856%2041.5203%2050.346%2043.0611%2048.9325%2043.9357L29.0918%2056.2117C27.6424%2057.1085%2025.8227%2057.1572%2024.3387%2056.3439L3.85107%2045.1148C2.26984%2044.2481%201.14232%2042.646%201.15293%2041.0494V41.0427L1.153%2018.552C1.15301%2018.5509%201.15302%2018.5499%201.15302%2018.5488C1.16485%2016.9324%202.02611%2015.4289%203.43319%2014.5869Z%22%20fill%3D%22%2318181B%22%20stroke%3D%22url(%23paint0_linear_2595_7182)%22%20stroke-width%3D%222%22%2F%3E%0A%3Cpath%20d%3D%22M37.1528%2017.9209H15.1528C14.6224%2017.9209%2014.1137%2018.1316%2013.7386%2018.5067C13.3635%2018.8818%2013.1528%2019.3905%2013.1528%2019.9209V37.9209C13.1528%2038.4513%2013.3635%2038.96%2013.7386%2039.3351C14.1137%2039.7102%2014.6224%2039.9209%2015.1528%2039.9209H37.1528C37.6833%2039.9209%2038.192%2039.7102%2038.567%2039.3351C38.9421%2038.96%2039.1528%2038.4513%2039.1528%2037.9209V19.9209C39.1528%2019.3905%2038.9421%2018.8818%2038.567%2018.5067C38.192%2018.1316%2037.6833%2017.9209%2037.1528%2017.9209ZM15.1528%2019.9209H37.1528V24.9209H15.1528V19.9209ZM15.1528%2026.9209H22.1528V37.9209H15.1528V26.9209ZM37.1528%2037.9209H24.1528V26.9209H37.1528V37.9209Z%22%20fill%3D%22url(%23paint1_linear_2595_7182)%22%2F%3E%0A%3Cdefs%3E%0A%3ClinearGradient%20id%3D%22paint0_linear_2595_7182%22%20x1%3D%220.662695%22%20y1%3D%2218.4025%22%20x2%3D%2251.7209%22%20y2%3D%2244.2212%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3ClinearGradient%20id%3D%22paint1_linear_2595_7182%22%20x1%3D%2213.0804%22%20y1%3D%2222.6224%22%20x2%3D%2237.028%22%20y2%3D%2237.847%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%0A%3Cstop%20stop-color%3D%22white%22%2F%3E%0A%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2371717A%22%2F%3E%0A%3C%2FlinearGradient%3E%0A%3C%2Fdefs%3E%0A%3C%2Fsvg%3E%0A" alt="examples icon" class="examples-image-dark" data-v-ea739b84><div class="flex flex-col space-y text-black dark:text-white" data-v-ea739b84><h3 class="font-semibold text-xl" data-v-ea739b84>Examples</h3><p class="text-gray-700 dark:text-gray-300" data-v-ea739b84>Explore different way of using Nuxt features and get inspired with our list of examples.</p></div></a></div></div></div><footer class="relative border-t bg-white dark:bg-black border-gray-200 dark:border-gray-900 w-full h-[70px] flex items-center" data-v-ea739b84><div class="absolute inset-x-0 flex items-center justify-center -top-3" data-v-ea739b84><a href="https://nuxt.com" target="_blank" data-v-ea739b84><svg width="70" height="20" viewBox="0 0 70 20" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-ea739b84><ellipse cx="34.6528" cy="10.4209" rx="34.5" ry="9.5" fill="white" class="dark:hidden" data-v-ea739b84></ellipse><ellipse cx="34.6528" cy="10.4209" rx="34.5" ry="9.5" fill="black" class="hidden dark:block" data-v-ea739b84></ellipse><path d="M36.0605 15.9209H42.6256C42.8341 15.9209 43.0389 15.8655 43.2195 15.7602C43.4001 15.6548 43.55 15.5033 43.6543 15.3209C43.7585 15.1384 43.8133 14.9315 43.8132 14.7208C43.8131 14.5102 43.7581 14.3033 43.6537 14.1209L39.2448 6.40667C39.1406 6.22427 38.9907 6.0728 38.8101 5.96748C38.6296 5.86217 38.4248 5.80672 38.2163 5.80672C38.0078 5.80672 37.803 5.86217 37.6225 5.96748C37.4419 6.0728 37.292 6.22427 37.1878 6.40667L36.0605 8.38048L33.8563 4.52076C33.752 4.33837 33.602 4.18692 33.4214 4.08163C33.2409 3.97633 33.036 3.9209 32.8275 3.9209C32.619 3.9209 32.4141 3.97633 32.2335 4.08163C32.053 4.18692 31.903 4.33837 31.7987 4.52076L26.3123 14.1209C26.2079 14.3033 26.1529 14.5102 26.1528 14.7208C26.1527 14.9315 26.2076 15.1384 26.3118 15.3209C26.416 15.5033 26.5659 15.6548 26.7465 15.7602C26.9271 15.8655 27.1319 15.9209 27.3405 15.9209H31.4615C33.0943 15.9209 34.2984 15.1964 35.127 13.7829L37.1385 10.2638L38.216 8.38048L41.4496 14.0376H37.1385L36.0605 15.9209ZM31.3943 14.0356L28.5184 14.035L32.8294 6.49263L34.9805 10.2638L33.5402 12.7844C32.99 13.7015 32.3649 14.0356 31.3943 14.0356Z" fill="#00DC82" data-v-ea739b84></path></svg></a></div><div class="mx-auto sm:px-6 lg:px-8 px-4 w-full" data-v-ea739b84><div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between" data-v-ea739b84><div class="flex flex-col-reverse items-center gap-3 sm:flex-row" data-v-ea739b84><span class="text-sm text-gray-700 dark:text-gray-300" data-v-ea739b84>© 2016-${ssrInterpolate(( new Date()).getFullYear())} Nuxt - MIT License</span></div><ul class="flex items-center justify-end gap-3" data-v-ea739b84><li data-v-ea739b84><a href="https://chat.nuxt.dev" target="_blank" class="focus-visible:ring-2 text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white" data-v-ea739b84><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-ea739b84><path d="M13.3705 1.07322C13.3663 1.06497 13.3594 1.05851 13.351 1.05499C12.3785 0.599487 11.3522 0.274675 10.2978 0.0886873C10.2882 0.0868693 10.2783 0.0881809 10.2695 0.0924354C10.2607 0.0966899 10.2534 0.103671 10.2487 0.112385C10.109 0.371315 9.98212 0.637279 9.86863 0.909263C8.73205 0.733138 7.57595 0.733138 6.43938 0.909263C6.32514 0.636589 6.19624 0.370559 6.05328 0.112385C6.04838 0.10386 6.04107 0.0970401 6.03232 0.0928132C6.02356 0.0885863 6.01377 0.0871486 6.0042 0.0886873C4.9497 0.274285 3.92333 0.599121 2.95092 1.05502C2.9426 1.05862 2.93558 1.06477 2.93082 1.07262C0.986197 4.03716 0.453491 6.92881 0.714819 9.78465C0.715554 9.79165 0.71766 9.79843 0.721013 9.80458C0.724365 9.81073 0.728896 9.81613 0.734334 9.82046C1.86667 10.6763 3.1332 11.3296 4.47988 11.7525C4.48937 11.7554 4.49949 11.7552 4.5089 11.7521C4.51831 11.7489 4.52655 11.7429 4.53251 11.7349C4.82175 11.3331 5.07803 10.9077 5.29876 10.4629C5.3018 10.4568 5.30353 10.4501 5.30384 10.4433C5.30416 10.4365 5.30305 10.4296 5.3006 10.4233C5.29814 10.4169 5.29439 10.4111 5.2896 10.4064C5.2848 10.4016 5.27906 10.3979 5.27277 10.3955C4.86862 10.2377 4.47736 10.0474 4.10266 9.82645C4.09586 9.82236 4.09014 9.81663 4.08602 9.80976C4.0819 9.80288 4.0795 9.79508 4.07903 9.78703C4.07856 9.77899 4.08004 9.77095 4.08334 9.76362C4.08664 9.7563 4.09166 9.74992 4.09794 9.74504C4.17657 9.68491 4.25524 9.62236 4.33032 9.55918C4.33699 9.55358 4.34506 9.54998 4.35362 9.5488C4.36218 9.54762 4.3709 9.54891 4.37879 9.55252C6.83362 10.6962 9.4913 10.6962 11.9171 9.55252C11.925 9.54868 11.9338 9.54721 11.9425 9.54829C11.9512 9.54936 11.9594 9.55293 11.9662 9.55858C12.0413 9.62176 12.1199 9.68491 12.1991 9.74504C12.2054 9.74987 12.2105 9.75621 12.2138 9.7635C12.2172 9.7708 12.2187 9.77882 12.2183 9.78687C12.2179 9.79492 12.2156 9.80274 12.2115 9.80964C12.2074 9.81654 12.2018 9.82232 12.195 9.82645C11.8211 10.0492 11.4295 10.2394 11.0243 10.3949C11.018 10.3974 11.0123 10.4012 11.0075 10.406C11.0028 10.4109 10.9991 10.4167 10.9967 10.4231C10.9943 10.4295 10.9932 10.4364 10.9936 10.4433C10.9939 10.4501 10.9957 10.4568 10.9988 10.4629C11.2232 10.9052 11.4791 11.3301 11.7645 11.7342C11.7703 11.7425 11.7785 11.7487 11.7879 11.7519C11.7974 11.7552 11.8076 11.7554 11.8171 11.7524C13.1662 11.331 14.4349 10.6776 15.5687 9.82046C15.5742 9.81635 15.5788 9.81108 15.5822 9.80501C15.5855 9.79893 15.5876 9.7922 15.5882 9.78525C15.9011 6.4836 15.0644 3.61565 13.3705 1.07322ZM5.66537 8.04574C4.92629 8.04574 4.31731 7.35337 4.31731 6.50305C4.31731 5.65274 4.91448 4.96032 5.66537 4.96032C6.42213 4.96032 7.02522 5.65875 7.01341 6.503C7.01341 7.35337 6.41622 8.04574 5.66537 8.04574ZM10.6496 8.04574C9.91051 8.04574 9.30153 7.35337 9.30153 6.50305C9.30153 5.65274 9.8987 4.96032 10.6496 4.96032C11.4064 4.96032 12.0094 5.65875 11.9976 6.503C11.9976 7.35337 11.4064 8.04574 10.6496 8.04574Z" fill="currentColor" data-v-ea739b84></path></svg></a></li><li data-v-ea739b84><a href="https://twitter.nuxt.dev" target="_blank" class="focus-visible:ring-2 text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white" data-v-ea739b84><svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-ea739b84><path d="M17.486 1.75441C16.8596 2.02615 16.1972 2.20579 15.5193 2.28774C16.2345 1.86051 16.7704 1.18839 17.0277 0.396073C16.3556 0.796126 15.62 1.07799 14.8527 1.22941C14.3398 0.673216 13.6568 0.302987 12.9108 0.176783C12.1649 0.0505786 11.3981 0.175539 10.7308 0.532064C10.0635 0.88859 9.53345 1.45652 9.2237 2.14677C8.91396 2.83702 8.84208 3.61056 9.01934 4.34607C7.66053 4.27734 6.33137 3.92353 5.11822 3.30762C3.90506 2.69171 2.83504 1.82748 1.97767 0.771073C1.67695 1.29621 1.51894 1.89093 1.51934 2.49607C1.51827 3.05806 1.65618 3.61159 1.9208 4.10738C2.18541 4.60317 2.56852 5.02583 3.036 5.33774C2.49265 5.32296 1.96091 5.17716 1.486 4.91274V4.95441C1.49008 5.74182 1.766 6.50365 2.2671 7.11104C2.7682 7.71844 3.46372 8.13411 4.236 8.28774C3.93872 8.37821 3.63007 8.42591 3.31934 8.42941C3.10424 8.42689 2.88969 8.40739 2.67767 8.37107C2.89759 9.04842 3.32319 9.64036 3.89523 10.0645C4.46728 10.4887 5.15732 10.724 5.86934 10.7377C4.66701 11.6838 3.18257 12.2001 1.65267 12.2044C1.37412 12.2053 1.09578 12.1886 0.819336 12.1544C2.38136 13.163 4.20168 13.6983 6.061 13.6961C7.34408 13.7094 8.61695 13.4669 9.80527 12.9828C10.9936 12.4987 12.0735 11.7826 12.982 10.8765C13.8905 9.97033 14.6093 8.89223 15.0965 7.70516C15.5836 6.51809 15.8294 5.24585 15.8193 3.96274C15.8193 3.82107 15.8193 3.67107 15.8193 3.52107C16.4732 3.03342 17.0372 2.43559 17.486 1.75441Z" fill="currentColor" data-v-ea739b84></path></svg></a></li><li data-v-ea739b84><a href="https://github.nuxt.dev" target="_blank" class="focus-visible:ring-2 text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white" data-v-ea739b84><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" data-v-ea739b84><path d="M9.15269 0.792969C7.17392 0.793051 5.25974 1.49723 3.75266 2.77951C2.24558 4.06179 1.24394 5.83849 0.92697 7.7917C0.609997 9.74492 0.998373 11.7472 2.02261 13.4403C3.04684 15.1333 4.6401 16.4067 6.51729 17.0325C6.93396 17.1055 7.09021 16.8555 7.09021 16.6367C7.09021 16.4388 7.07978 15.7825 7.07978 15.0846C4.98603 15.47 4.44436 14.5742 4.27769 14.1055C4.09276 13.6496 3.79959 13.2456 3.42353 12.9284C3.13186 12.7721 2.71519 12.3867 3.4131 12.3763C3.67959 12.4052 3.93518 12.498 4.15822 12.6467C4.38125 12.7953 4.56516 12.9956 4.69436 13.2305C4.80833 13.4352 4.96159 13.6155 5.14535 13.7609C5.32911 13.9063 5.53975 14.014 5.76522 14.0779C5.99068 14.1418 6.22653 14.1605 6.45926 14.1331C6.69198 14.1056 6.917 14.0325 7.12143 13.918C7.1575 13.4943 7.34631 13.0982 7.65269 12.8034C5.79853 12.5951 3.86103 11.8763 3.86103 8.68883C3.84931 7.86062 4.15493 7.05931 4.71519 6.44924C4.46043 5.72943 4.49024 4.93948 4.79853 4.24091C4.79853 4.24091 5.49642 4.02215 7.09019 5.09508C8.45376 4.72005 9.89328 4.72005 11.2569 5.09508C12.8506 4.01174 13.5485 4.24091 13.5485 4.24091C13.8569 4.93947 13.8867 5.72943 13.6319 6.44924C14.1938 7.05826 14.4997 7.86027 14.486 8.68883C14.486 11.8867 12.5381 12.5951 10.6839 12.8034C10.8828 13.005 11.036 13.247 11.133 13.513C11.2301 13.779 11.2688 14.0628 11.2464 14.3451C11.2464 15.4597 11.236 16.3555 11.236 16.6367C11.236 16.8555 11.3923 17.1159 11.8089 17.0326C13.6828 16.4016 15.2715 15.1253 16.2914 13.4313C17.3112 11.7374 17.6959 9.73616 17.3768 7.78483C17.0576 5.83351 16.0553 4.05911 14.5489 2.77839C13.0425 1.49768 11.1299 0.793998 9.15269 0.792969Z" fill="currentColor" data-v-ea739b84></path></svg></a></li></ul></div></div></footer></div>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxt/ui-templates/dist/templates/welcome.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-ea739b84"]]);
const _sfc_main$2 = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_NuxtWelcome = __nuxt_component_0$1;
  _push(`<div${ssrRenderAttrs(_attrs)}>`);
  _push(ssrRenderComponent(_component_NuxtWelcome, null, null, _parent));
  _push(`</div>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender]]);
const _sfc_main$1$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    (_error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n");
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = /* @__PURE__ */ defineAsyncComponent(() => Promise.resolve().then(function () { return error4046d131690; }).then((r) => r.default || r));
    const _Error = /* @__PURE__ */ defineAsyncComponent(() => Promise.resolve().then(function () { return error50033540ee5; }).then((r) => r.default || r));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1$1 = _sfc_main$1$1.setup;
_sfc_main$1$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1$1 ? _sfc_setup$1$1(props, ctx) : void 0;
};
const ErrorComponent = _sfc_main$1$1;
const _sfc_main$4 = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = /* @__PURE__ */ defineAsyncComponent(() => Promise.resolve().then(function () { return islandRenderer309840cb; }).then((r) => r.default || r));
    const nuxtApp = /* @__PURE__ */ useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(AppComponent), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const RootComponent = _sfc_main$4;
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp$1(RootComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.hooks.callHook("app:error", err);
      nuxt.payload.error = nuxt.payload.error || err;
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);

const server = /*#__PURE__*/Object.freeze({
  __proto__: null,
  _: _export_sfc,
  a: useHead,
  c: createError,
  default: entry$1,
  n: navigateTo,
  u: useRouter
});

const interopDefault = r => r.default || r || [];
const styles = {
  "node_modules/nuxt/dist/app/entry.js": () => Promise.resolve().then(function () { return entryStyles_8755339a$1; }).then(interopDefault),
  "node_modules/@nuxt/ui-templates/dist/templates/error-500.vue": () => Promise.resolve().then(function () { return error500Styles_cf4b3e80$1; }).then(interopDefault),
  "node_modules/@nuxt/ui-templates/dist/templates/error-404.vue": () => Promise.resolve().then(function () { return error404Styles_1e0dde27$1; }).then(interopDefault)
};

const styles$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: styles
});

const template = "";

const _virtual__spaTemplate = /*#__PURE__*/Object.freeze({
  __proto__: null,
  template: template
});

const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
/*! @__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  const resolveTrailingSlashBehavior = (to, resolve) => {
    if (!to || options.trailingSlash !== "append" && options.trailingSlash !== "remove") {
      return to;
    }
    const normalizeTrailingSlash = options.trailingSlash === "append" ? withTrailingSlash : withoutTrailingSlash;
    if (typeof to === "string") {
      return normalizeTrailingSlash(to, true);
    }
    const path = "path" in to ? to.path : resolve(to).path;
    return {
      ...to,
      name: void 0,
      // named routes would otherwise always override trailing slash behavior
      path: normalizeTrailingSlash(path, true)
    };
  };
  return /* @__PURE__ */ defineComponent({
    name: componentName,
    props: {
      // Routing
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      // Attributes
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Prefetching
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Styling
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      // Vue Router's `<RouterLink>` additional props
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      // Edge cases handling
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      // Slot API
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = computed(() => {
        const path = props.to || props.href || "";
        return resolveTrailingSlashBehavior(path, router.resolve);
      });
      const isExternal = computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, { acceptRelative: true });
      });
      const prefetched = ref(false);
      const el = void 0;
      const elRef = void 0;
      return () => {
        var _a2;
        var _a, _b;
        if (!isExternal.value) {
          const routerLinkProps = {
            ref: elRef,
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue,
            custom: props.custom
          };
          if (!props.custom) {
            if (prefetched.value) {
              routerLinkProps.class = props.prefetchedClass || options.prefetchedClass;
            }
            routerLinkProps.rel = props.rel;
          }
          return h(
            resolveComponent("RouterLink"),
            routerLinkProps,
            slots.default
          );
        }
        const href = typeof to.value === "object" ? (_a2 = (_a = router.resolve(to.value)) == null ? void 0 : _a.href) != null ? _a2 : null : to.value || null;
        const target = props.target || null;
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        const navigate = () => navigateTo(href, { replace: props.replace });
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href,
            navigate,
            get route() {
              if (!href) {
                return void 0;
              }
              const url = parseURL(href);
              return {
                path: url.pathname,
                fullPath: url.pathname,
                get query() {
                  return parseQuery(url.search);
                },
                hash: url.hash,
                // stub properties for compat with vue-router
                params: {},
                name: void 0,
                matched: [],
                redirectedFrom: void 0,
                meta: {},
                href
              };
            },
            rel,
            target,
            isExternal: isExternal.value,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", { ref: el, href, rel, target }, (_b = slots.default) == null ? void 0 : _b.call(slots));
      };
    }
  });
}
const __nuxt_component_0 = /* @__PURE__ */ defineNuxtLink(nuxtLinkDefaults);
const _sfc_main$1 = {
  __name: "error-404",
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: Number,
      default: 404
    },
    statusMessage: {
      type: String,
      default: "Not Found"
    },
    description: {
      type: String,
      default: "Sorry, the page you are looking for could not be found."
    },
    backHome: {
      type: String,
      default: "Go back home"
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e0e0e0}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}a{color:inherit;text-decoration:inherit}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-ccd3db62><div class="fixed left-0 right-0 spotlight z-10" data-v-ccd3db62></div><div class="max-w-520px text-center z-20" data-v-ccd3db62><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-ccd3db62>${ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-ccd3db62>${ssrInterpolate(__props.description)}</p><div class="w-full flex items-center justify-center" data-v-ccd3db62>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "gradient-border text-md sm:text-xl py-2 px-4 sm:py-3 sm:px-6 cursor-pointer"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(__props.backHome)}`);
          } else {
            return [
              createTextVNode(toDisplayString(__props.backHome), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxt/ui-templates/dist/templates/error-404.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const error404 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-ccd3db62"]]);

const error4046d131690 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: error404
});

const _sfc_main = {
  __name: "error-500",
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: Number,
      default: 500
    },
    statusMessage: {
      type: String,
      default: "Server error"
    },
    description: {
      type: String,
      default: "This page is temporarily unavailable."
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e0e0e0}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-df79c84d><div class="fixed -bottom-1/2 left-0 right-0 h-1/2 spotlight" data-v-df79c84d></div><div class="max-w-520px text-center" data-v-df79c84d><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-df79c84d>${ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-df79c84d>${ssrInterpolate(__props.description)}</p></div></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxt/ui-templates/dist/templates/error-500.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const error500 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-df79c84d"]]);

const error50033540ee5 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: error500
});

const components_islands = {};
const islandComponents = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: components_islands
});
const islandRenderer = /* @__PURE__ */ defineComponent({
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const component = islandComponents[props.context.name];
    if (!component) {
      throw createError({
        statusCode: 404,
        statusMessage: `Island component not found: ${props.context.name}`
      });
    }
    return () => createVNode(component || "span", { ...props.context.props, "nuxt-ssr-component-uid": "" });
  }
});

const islandRenderer309840cb = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: islandRenderer
});

const welcome_vue_vue_type_style_index_0_scoped_ea739b84_lang = "@media (prefers-color-scheme:light){.get-started-gradient-border[data-v-ea739b84]{background:linear-gradient(90deg,#fff,#fff),linear-gradient(90deg,#00dc82,#1de0b1,#36e4da)}.gradient-border-modules[data-v-ea739b84]{background:linear-gradient(var(--gradient-angle),#f7d14c,rgba(247,209,76,.6),hsla(0,0%,100%,.8),#f7d14c)}.gradient-border-examples[data-v-ea739b84]{background:linear-gradient(var(--gradient-angle),#8deaff,rgba(141,234,255,.6),hsla(0,0%,100%,.8),#8deaff)}.gradient-border-documentation[data-v-ea739b84]{background:linear-gradient(var(--gradient-angle),#00dc82,rgba(0,220,130,.6),hsla(0,0%,100%,.8),#00dc82)}}@media (prefers-color-scheme:dark){.get-started-gradient-border[data-v-ea739b84]{background:linear-gradient(90deg,#18181b,#18181b),linear-gradient(90deg,#00dc82,#1de0b1,#36e4da)}.gradient-border-modules[data-v-ea739b84]{background:linear-gradient(var(--gradient-angle),#f7d14c,#a38108,hsla(0,0%,100%,.3),#a38108)}.gradient-border-examples[data-v-ea739b84]{background:linear-gradient(var(--gradient-angle),#8deaff,#008aa9,hsla(0,0%,100%,.3),#008aa9)}.gradient-border-documentation[data-v-ea739b84]{background:linear-gradient(var(--gradient-angle),#00dc82,#003f25,hsla(0,0%,100%,.2),#003f25)}}.get-started-gradient-border[data-v-ea739b84]{background-clip:padding-box,border-box;background-origin:padding-box,border-box;border-color:transparent;border-radius:12px;border-width:1px}.get-started-gradient-border[data-v-ea739b84]:hover>:is(.get-started-gradient-left,.get-started-gradient-right){opacity:.2}.get-started-gradient-left[data-v-ea739b84],.get-started-gradient-right[data-v-ea739b84]{opacity:0}.gradient-border[data-v-ea739b84]{border-radius:12px;left:0;opacity:0;position:absolute;top:0;transform:translate(-1px,-1px);width:calc(100% + 2px);z-index:-1}.gradient-border-rect[data-v-ea739b84]{height:calc(100% + 2px)}@media (min-width:1024px){.gradient-border-rect[data-v-ea739b84]{height:calc(100% + 1px)}}.gradient-border-square[data-v-ea739b84]{height:calc(100% + 2px)}.modules-gradient-right[data-v-ea739b84]{opacity:0}.documentation-container:hover>.gradient-border[data-v-ea739b84],.examples-container:hover>.gradient-border[data-v-ea739b84],.modules-container:hover>.gradient-border[data-v-ea739b84]{animation:gradient-rotate 5s linear 0s infinite reverse;opacity:1;transition:all .3s linear}.examples-container:hover>.examples-gradient-right[data-v-ea739b84],.modules-container:hover>.modules-gradient-right[data-v-ea739b84]{opacity:.2}.examples-gradient-right[data-v-ea739b84]{opacity:0}.documentation-image-color-dark[data-v-ea739b84],.documentation-image-color-light[data-v-ea739b84],.examples-image-color-dark[data-v-ea739b84],.examples-image-color-light[data-v-ea739b84],.modules-image-color-dark[data-v-ea739b84],.modules-image-color-light[data-v-ea739b84]{display:none}@media (prefers-color-scheme:light){.modules-image-light[data-v-ea739b84]{display:block}.modules-container:hover>a>.modules-image-light[data-v-ea739b84],.modules-image-dark[data-v-ea739b84]{display:none}.examples-image-light[data-v-ea739b84],.modules-container:hover>a>.modules-image-color-light[data-v-ea739b84]{display:block}.examples-container:hover>a>.examples-image-light[data-v-ea739b84],.examples-image-dark[data-v-ea739b84]{display:none}.documentation-image-light[data-v-ea739b84],.examples-container:hover>a>.examples-image-color-light[data-v-ea739b84]{display:block}.documentation-container:hover>a>div>.documentation-image-light[data-v-ea739b84],.documentation-image-dark[data-v-ea739b84]{display:none}.documentation-container:hover>a>div>.documentation-image-color-light[data-v-ea739b84]{display:block}}@media (prefers-color-scheme:dark){.modules-image-dark[data-v-ea739b84]{display:block}.modules-image-light[data-v-ea739b84]{display:none}.modules-container:hover>a>.modules-image-color-dark[data-v-ea739b84]{display:block}.modules-container:hover>a>.modules-image-dark[data-v-ea739b84]{display:none}.examples-image-dark[data-v-ea739b84]{display:block}.examples-image-light[data-v-ea739b84]{display:none}.examples-container:hover>a>.examples-image-color-dark[data-v-ea739b84]{display:block}.examples-container:hover>a>.examples-image-dark[data-v-ea739b84]{display:none}.documentation-image-dark[data-v-ea739b84]{display:block}.documentation-image-light[data-v-ea739b84]{display:none}.documentation-container:hover>a>div>.documentation-image-color-dark[data-v-ea739b84]{display:block}.documentation-container:hover>a>div>.documentation-image-dark[data-v-ea739b84]{display:none}}.bg-white[data-v-ea739b84]{--tw-bg-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity))}.bg-gray-100[data-v-ea739b84]{--tw-bg-opacity:1;background-color:rgba(238,238,238,var(--tw-bg-opacity))}.bg-gradient-to-r[data-v-ea739b84]{background-image:linear-gradient(to right,var(--tw-gradient-stops))}.bg-gradient-to-l[data-v-ea739b84]{background-image:linear-gradient(to left,var(--tw-gradient-stops))}.from-green-400[data-v-ea739b84]{--tw-gradient-from:rgba(55,233,144,var(--tw-from-opacity,1));--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,hsla(0,0%,100%,0))}.from-blue-400[data-v-ea739b84]{--tw-gradient-from:rgba(56,189,248,var(--tw-from-opacity,1));--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,hsla(0,0%,100%,0))}.from-yellow-400[data-v-ea739b84]{--tw-gradient-from:rgba(251,191,36,var(--tw-from-opacity,1));--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to,hsla(0,0%,100%,0))}.to-transparent[data-v-ea739b84]{--tw-gradient-to:transparent}.border-gray-200[data-v-ea739b84]{--tw-border-opacity:1;border-color:rgba(224,224,224,var(--tw-border-opacity))}.hover\\:border-transparent[data-v-ea739b84]:hover{border-color:transparent}.rounded-xl[data-v-ea739b84]{border-radius:.75rem}.rounded[data-v-ea739b84]{border-radius:.25rem}.border[data-v-ea739b84]{border-width:1px}.border-t[data-v-ea739b84]{border-top-width:1px}.flex[data-v-ea739b84]{display:flex}.grid[data-v-ea739b84]{display:grid}.hidden[data-v-ea739b84]{display:none}.flex-col[data-v-ea739b84]{flex-direction:column}.flex-col-reverse[data-v-ea739b84]{flex-direction:column-reverse}.place-content-center[data-v-ea739b84]{place-content:center}.items-center[data-v-ea739b84]{align-items:center}.justify-end[data-v-ea739b84]{justify-content:flex-end}.justify-center[data-v-ea739b84]{justify-content:center}.flex-1[data-v-ea739b84]{flex:1 1 0%}.order-last[data-v-ea739b84]{order:9999}.font-mono[data-v-ea739b84]{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}.font-semibold[data-v-ea739b84]{font-weight:600}.font-bold[data-v-ea739b84]{font-weight:700}.h-32[data-v-ea739b84]{height:8rem}.h-\\[70px\\][data-v-ea739b84]{height:70px}.text-4xl[data-v-ea739b84]{font-size:2.25rem;line-height:2.5rem}.text-xl[data-v-ea739b84]{font-size:1.25rem;line-height:1.75rem}.text-sm[data-v-ea739b84]{font-size:.875rem;line-height:1.25rem}.text-2xl[data-v-ea739b84]{font-size:1.5rem;line-height:2rem}.mx-auto[data-v-ea739b84]{margin-left:auto;margin-right:auto}.mb-2[data-v-ea739b84]{margin-bottom:.5rem}.max-w-\\[960px\\][data-v-ea739b84]{max-width:960px}.min-h-screen[data-v-ea739b84]{min-height:100vh}.p-1[data-v-ea739b84]{padding:.25rem}.px-4[data-v-ea739b84]{padding-left:1rem;padding-right:1rem}.py-14[data-v-ea739b84]{padding-bottom:3.5rem;padding-top:3.5rem}.py-6[data-v-ea739b84]{padding-bottom:1.5rem;padding-top:1.5rem}.px-5[data-v-ea739b84]{padding-left:1.25rem;padding-right:1.25rem}.pt-\\[58px\\][data-v-ea739b84]{padding-top:58px}.pb-6[data-v-ea739b84]{padding-bottom:1.5rem}.absolute[data-v-ea739b84]{position:absolute}.relative[data-v-ea739b84]{position:relative}.inset-y-0[data-v-ea739b84]{bottom:0;top:0}.inset-x-0[data-v-ea739b84]{left:0;right:0}.left-0[data-v-ea739b84]{left:0}.right-0[data-v-ea739b84]{right:0}.-top-\\[58px\\][data-v-ea739b84]{top:-58px}.-top-3[data-v-ea739b84]{top:-.75rem}.focus-visible\\:ring-2[data-v-ea739b84]:focus-visible{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.text-center[data-v-ea739b84]{text-align:center}.text-black[data-v-ea739b84]{--tw-text-opacity:1;color:rgba(0,0,0,var(--tw-text-opacity))}.text-gray-700[data-v-ea739b84]{--tw-text-opacity:1;color:rgba(66,66,66,var(--tw-text-opacity))}.hover\\:text-black[data-v-ea739b84]:hover{--tw-text-opacity:1;color:rgba(0,0,0,var(--tw-text-opacity))}.antialiased[data-v-ea739b84]{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.w-full[data-v-ea739b84]{width:100%}.w-\\[20\\%\\][data-v-ea739b84]{width:20%}.z-10[data-v-ea739b84]{z-index:10}.z-1[data-v-ea739b84]{z-index:1}.gap-6[data-v-ea739b84]{grid-gap:1.5rem;gap:1.5rem}.gap-3[data-v-ea739b84]{grid-gap:.75rem;gap:.75rem}.gap-x-4[data-v-ea739b84]{grid-column-gap:1rem;-webkit-column-gap:1rem;-moz-column-gap:1rem;column-gap:1rem}.gap-y-16[data-v-ea739b84]{grid-row-gap:4rem;-webkit-row-gap:4rem;-moz-row-gap:4rem;row-gap:4rem}.gap-y-4[data-v-ea739b84]{grid-row-gap:1rem;-webkit-row-gap:1rem;-moz-row-gap:1rem;row-gap:1rem}.gap-y-2[data-v-ea739b84]{grid-row-gap:.5rem;-webkit-row-gap:.5rem;-moz-row-gap:.5rem;row-gap:.5rem}.grid-cols-2[data-v-ea739b84]{grid-template-columns:repeat(2,minmax(0,1fr))}.col-span-2[data-v-ea739b84]{-ms-grid-column-span:span 2/span 2;grid-column:span 2/span 2}.row-span-2[data-v-ea739b84]{-ms-grid-row-span:span 2/span 2;grid-row:span 2/span 2}.transition-opacity[data-v-ea739b84]{transition-duration:.15s;transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1)}.duration-300[data-v-ea739b84]{transition-duration:.3s}@media (min-width:640px){.sm\\:flex-row[data-v-ea739b84]{flex-direction:row}.sm\\:justify-between[data-v-ea739b84]{justify-content:space-between}.sm\\:h-34[data-v-ea739b84]{height:8.5rem}.sm\\:text-base[data-v-ea739b84]{font-size:1rem;line-height:1.5rem}.sm\\:text-5xl[data-v-ea739b84]{font-size:3rem;line-height:1}.sm\\:min-h-\\[220px\\][data-v-ea739b84]{min-height:220px}.sm\\:px-6[data-v-ea739b84]{padding-left:1.5rem;padding-right:1.5rem}.sm\\:px-28[data-v-ea739b84]{padding-left:7rem;padding-right:7rem}.sm\\:col-span-1[data-v-ea739b84]{-ms-grid-column-span:span 1/span 1;grid-column:span 1/span 1}}@media (min-width:768px){.md\\:min-h-\\[180px\\][data-v-ea739b84]{min-height:180px}}@media (min-width:1024px){.lg\\:flex-col[data-v-ea739b84]{flex-direction:column}.lg\\:order-none[data-v-ea739b84]{order:0}.lg\\:min-h-min[data-v-ea739b84]{min-height:-moz-min-content;min-height:min-content}.lg\\:py-7[data-v-ea739b84]{padding-bottom:1.75rem;padding-top:1.75rem}.lg\\:px-8[data-v-ea739b84]{padding-left:2rem;padding-right:2rem}.lg\\:grid-cols-10[data-v-ea739b84]{grid-template-columns:repeat(10,minmax(0,1fr))}.lg\\:col-span-10[data-v-ea739b84]{-ms-grid-column-span:span 10/span 10;grid-column:span 10/span 10}.lg\\:col-span-6[data-v-ea739b84]{-ms-grid-column-span:span 6/span 6;grid-column:span 6/span 6}.lg\\:col-span-4[data-v-ea739b84]{-ms-grid-column-span:span 4/span 4;grid-column:span 4/span 4}}@media (prefers-color-scheme:dark){.dark\\:bg-black[data-v-ea739b84]{--tw-bg-opacity:1;background-color:rgba(0,0,0,var(--tw-bg-opacity))}.dark\\:bg-white\\/10[data-v-ea739b84]{--tw-bg-opacity:.1;background-color:rgba(255,255,255,var(--tw-bg-opacity))}.dark\\:bg-gray-900[data-v-ea739b84]{--tw-bg-opacity:1;background-color:rgba(24,24,27,var(--tw-bg-opacity))}.dark\\:border-transparent[data-v-ea739b84]{border-color:transparent}.dark\\:border-gray-900[data-v-ea739b84]{--tw-border-opacity:1;border-color:rgba(24,24,27,var(--tw-border-opacity))}.dark\\:border-none[data-v-ea739b84]{border-style:none}.dark\\:block[data-v-ea739b84]{display:block}.dark\\:hidden[data-v-ea739b84]{display:none}.dark\\:text-white[data-v-ea739b84]{--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}.dark\\:text-gray-300[data-v-ea739b84]{--tw-text-opacity:1;color:rgba(189,189,189,var(--tw-text-opacity))}.dark\\:hover\\:text-white[data-v-ea739b84]:hover{--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}}";

const entryStyles_8755339a = [welcome_vue_vue_type_style_index_0_scoped_ea739b84_lang];

const entryStyles_8755339a$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: entryStyles_8755339a
});

const error500_vue_vue_type_style_index_0_scoped_df79c84d_lang = ".spotlight[data-v-df79c84d]{background:linear-gradient(45deg,#00dc82,#36e4da 50%,#0047e1);filter:blur(20vh)}.bg-white[data-v-df79c84d]{--tw-bg-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity))}.grid[data-v-df79c84d]{display:grid}.place-content-center[data-v-df79c84d]{place-content:center}.font-sans[data-v-df79c84d]{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.font-medium[data-v-df79c84d]{font-weight:500}.font-light[data-v-df79c84d]{font-weight:300}.h-1\\/2[data-v-df79c84d]{height:50%}.text-8xl[data-v-df79c84d]{font-size:6rem;line-height:1}.text-xl[data-v-df79c84d]{font-size:1.25rem;line-height:1.75rem}.leading-tight[data-v-df79c84d]{line-height:1.25}.mb-8[data-v-df79c84d]{margin-bottom:2rem}.mb-16[data-v-df79c84d]{margin-bottom:4rem}.max-w-520px[data-v-df79c84d]{max-width:520px}.min-h-screen[data-v-df79c84d]{min-height:100vh}.overflow-hidden[data-v-df79c84d]{overflow:hidden}.px-8[data-v-df79c84d]{padding-left:2rem;padding-right:2rem}.fixed[data-v-df79c84d]{position:fixed}.left-0[data-v-df79c84d]{left:0}.right-0[data-v-df79c84d]{right:0}.-bottom-1\\/2[data-v-df79c84d]{bottom:-50%}.text-center[data-v-df79c84d]{text-align:center}.text-black[data-v-df79c84d]{--tw-text-opacity:1;color:rgba(0,0,0,var(--tw-text-opacity))}.antialiased[data-v-df79c84d]{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}@media (min-width:640px){.sm\\:text-4xl[data-v-df79c84d]{font-size:2.25rem;line-height:2.5rem}.sm\\:text-10xl[data-v-df79c84d]{font-size:10rem;line-height:1}.sm\\:px-0[data-v-df79c84d]{padding-left:0;padding-right:0}}@media (prefers-color-scheme:dark){.dark\\:bg-black[data-v-df79c84d]{--tw-bg-opacity:1;background-color:rgba(0,0,0,var(--tw-bg-opacity))}.dark\\:text-white[data-v-df79c84d]{--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}}";

const error500Styles_cf4b3e80 = [error500_vue_vue_type_style_index_0_scoped_df79c84d_lang, error500_vue_vue_type_style_index_0_scoped_df79c84d_lang];

const error500Styles_cf4b3e80$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: error500Styles_cf4b3e80
});

const error404_vue_vue_type_style_index_0_scoped_ccd3db62_lang = '.spotlight[data-v-ccd3db62]{background:linear-gradient(45deg,#00dc82,#36e4da 50%,#0047e1);bottom:-30vh;filter:blur(20vh);height:40vh}.gradient-border[data-v-ccd3db62]{-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-radius:.5rem;position:relative}@media (prefers-color-scheme:light){.gradient-border[data-v-ccd3db62]{background-color:hsla(0,0%,100%,.3)}.gradient-border[data-v-ccd3db62]:before{background:linear-gradient(90deg,#e2e2e2,#e2e2e2 25%,#00dc82 50%,#36e4da 75%,#0047e1)}}@media (prefers-color-scheme:dark){.gradient-border[data-v-ccd3db62]{background-color:hsla(0,0%,8%,.3)}.gradient-border[data-v-ccd3db62]:before{background:linear-gradient(90deg,#303030,#303030 25%,#00dc82 50%,#36e4da 75%,#0047e1)}}.gradient-border[data-v-ccd3db62]:before{background-size:400% auto;border-radius:.5rem;bottom:0;content:"";left:0;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.5;padding:2px;position:absolute;right:0;top:0;transition:background-position .3s ease-in-out,opacity .2s ease-in-out;width:100%}.gradient-border[data-v-ccd3db62]:hover:before{background-position:-50% 0;opacity:1}.bg-white[data-v-ccd3db62]{--tw-bg-opacity:1;background-color:rgba(255,255,255,var(--tw-bg-opacity))}.cursor-pointer[data-v-ccd3db62]{cursor:pointer}.flex[data-v-ccd3db62]{display:flex}.grid[data-v-ccd3db62]{display:grid}.place-content-center[data-v-ccd3db62]{place-content:center}.items-center[data-v-ccd3db62]{align-items:center}.justify-center[data-v-ccd3db62]{justify-content:center}.font-sans[data-v-ccd3db62]{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.font-medium[data-v-ccd3db62]{font-weight:500}.font-light[data-v-ccd3db62]{font-weight:300}.text-8xl[data-v-ccd3db62]{font-size:6rem;line-height:1}.text-xl[data-v-ccd3db62]{font-size:1.25rem;line-height:1.75rem}.leading-tight[data-v-ccd3db62]{line-height:1.25}.mb-8[data-v-ccd3db62]{margin-bottom:2rem}.mb-16[data-v-ccd3db62]{margin-bottom:4rem}.max-w-520px[data-v-ccd3db62]{max-width:520px}.min-h-screen[data-v-ccd3db62]{min-height:100vh}.overflow-hidden[data-v-ccd3db62]{overflow:hidden}.px-8[data-v-ccd3db62]{padding-left:2rem;padding-right:2rem}.py-2[data-v-ccd3db62]{padding-bottom:.5rem;padding-top:.5rem}.px-4[data-v-ccd3db62]{padding-left:1rem;padding-right:1rem}.fixed[data-v-ccd3db62]{position:fixed}.left-0[data-v-ccd3db62]{left:0}.right-0[data-v-ccd3db62]{right:0}.text-center[data-v-ccd3db62]{text-align:center}.text-black[data-v-ccd3db62]{--tw-text-opacity:1;color:rgba(0,0,0,var(--tw-text-opacity))}.antialiased[data-v-ccd3db62]{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.w-full[data-v-ccd3db62]{width:100%}.z-10[data-v-ccd3db62]{z-index:10}.z-20[data-v-ccd3db62]{z-index:20}@media (min-width:640px){.sm\\:text-4xl[data-v-ccd3db62]{font-size:2.25rem;line-height:2.5rem}.sm\\:text-xl[data-v-ccd3db62]{font-size:1.25rem;line-height:1.75rem}.sm\\:text-10xl[data-v-ccd3db62]{font-size:10rem;line-height:1}.sm\\:px-0[data-v-ccd3db62]{padding-left:0;padding-right:0}.sm\\:py-3[data-v-ccd3db62]{padding-bottom:.75rem;padding-top:.75rem}.sm\\:px-6[data-v-ccd3db62]{padding-left:1.5rem;padding-right:1.5rem}}@media (prefers-color-scheme:dark){.dark\\:bg-black[data-v-ccd3db62]{--tw-bg-opacity:1;background-color:rgba(0,0,0,var(--tw-bg-opacity))}.dark\\:text-white[data-v-ccd3db62]{--tw-text-opacity:1;color:rgba(255,255,255,var(--tw-text-opacity))}}';

const error404Styles_1e0dde27 = [error404_vue_vue_type_style_index_0_scoped_ccd3db62_lang, error404_vue_vue_type_style_index_0_scoped_ccd3db62_lang];

const error404Styles_1e0dde27$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  default: error404Styles_1e0dde27
});

export { handler };
//# sourceMappingURL=index.mjs.map
