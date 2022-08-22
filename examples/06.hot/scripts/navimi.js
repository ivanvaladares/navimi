/**
 * Navimi v0.2.2 
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com 
 * https://github.com/ivanvaladares/navimi 
 */ 
class __Navimi_Components {
    constructor() {
        this._components = {};
        this._removeComponent = (node) => {
            if (node.localName && node.__rendered && this._components[node.localName]) {
                node.__rendered = false;
                this._removeChildComponents(node);
                this._disconnectComponent(node);
                node.remove();
                node.onUnmount && node.onUnmount();
            }
        };
        this._disconnectComponent = (node) => {
            if (node.parentComponent) {
                node.parentComponent.childComponents =
                    node.parentComponent.childComponents
                        .filter((child) => child !== node);
            }
        };
        this._removeChildComponents = (node) => {
            node.childComponents &&
                node.childComponents.map((child) => {
                    this._removeComponent(child);
                });
        };
        this._readAttributes = (node) => {
            const prevAttributes = node.props;
            node.props = {};
            for (const attr of [].slice.call(node.attributes)) {
                const name = attr.name;
                //@ts-ignore
                if (typeof node[name] !== "function") {
                    node.props = Object.assign(Object.assign({}, node.props || {}), { [name]: attr.value });
                }
            }
            return prevAttributes;
        };
        this._traverseTree = (node, callback) => {
            if (node.localName) {
                if (this._components[node.localName]) {
                    callback(node);
                }
                else {
                    let childNode;
                    //@ts-ignore
                    for (childNode of node.children) {
                        this._traverseTree(childNode, callback);
                    }
                }
            }
        };
        this._registerTag = async (node, parentNode) => {
            if (node.props) {
                return;
            }
            const componentClass = this._components[node.localName];
            // initializes the component props
            node.props = {};
            node.__rendered = false;
            node.__previousTemplate = undefined;
            node.__initalInnerHTML = node.innerHTML;
            node.innerHTML = "";
            node.parentComponent = undefined;
            node.childComponents = [];
            this._findParentComponent(node, parentNode);
            this._readAttributes(node);
            // connects the component class to the tag 
            // todo: pass down navimi services to the component's constructor
            Object.setPrototypeOf(node, new componentClass(node.props));
            // todo: check if this time (10) can become an option in case someone needs higher frame rates
            node.update = this._navimiHelpers.throttle(node.render, 10, node);
            await node.init();
        };
        this._findParentComponent = (node, parentNode) => {
            const register = (parent) => {
                node.parentComponent = parent;
                parent.childComponents = [
                    ...parent.childComponents || [],
                    node,
                ];
            };
            if (parentNode) {
                register(parentNode);
                return;
            }
            let parent = node.parentNode;
            while (parent) {
                if (/-/.test(parent.localName) && this._components[parent.localName]) {
                    register(parent);
                    return;
                }
                parent = parent.parentNode;
            }
        };
        this._registerChildEvents = (parentNode, childNode) => {
            if (childNode.attributes) {
                for (const attr of [].slice.call(childNode.attributes)) {
                    const name = attr.name;
                    //@ts-ignore
                    if (typeof childNode[name] === "function") {
                        //@ts-ignore
                        childNode[name] = childNode[name].bind(parentNode);
                    }
                }
            }
        };
        this._registerChildComponents = (parentNode) => {
            const traverse = (node) => {
                let childNode;
                //@ts-ignore
                for (childNode of node.childNodes) {
                    if (this._components[childNode.localName]) {
                        this._registerTag(childNode, parentNode);
                    }
                    else {
                        // bind child tags events to the parent
                        this._registerChildEvents(parentNode, childNode);
                        traverse(childNode);
                    }
                }
            };
            traverse(parentNode);
        };
        this.mergeHtml = (template, node) => {
            const getNodeType = (node) => {
                if (node.nodeType === 3)
                    return "text";
                if (node.nodeType === 8)
                    return "comment";
                return node.tagName.toLowerCase();
            };
            const getNodeContent = (node) => {
                if (node.childNodes && node.childNodes.length > 0)
                    return null;
                return node.textContent;
            };
            const templateNodes = [].slice.call(template.childNodes);
            let documentNodes = [].slice.call(node.childNodes);
            let diffCount = documentNodes.length - templateNodes.length;
            for (let index = 0; index < templateNodes.length; index++) {
                const templateNode = templateNodes[index];
                // new node, create it
                if (!documentNodes[index]) {
                    node.appendChild(templateNode.cloneNode(true));
                    continue;
                }
                // add/remove nodes to match the template
                if (getNodeType(templateNode) !== getNodeType(documentNodes[index])) {
                    if (diffCount > 0) {
                        this._traverseTree(documentNodes[index], this._removeComponent);
                        if (documentNodes[index].parentNode) {
                            documentNodes[index].parentNode.removeChild(documentNodes[index]);
                        }
                        index--;
                    }
                    else {
                        node.insertBefore(templateNode.cloneNode(true), documentNodes[index]);
                    }
                    documentNodes = [].slice.call(node.childNodes);
                    continue;
                }
                // update text content
                const templateContent = getNodeContent(templateNode);
                if (templateContent && templateContent !== getNodeContent(documentNodes[index])) {
                    documentNodes[index].textContent = templateContent;
                }
                if (templateNode.localName) {
                    // sync attributes
                    if (templateNode.localName === documentNodes[index].localName) {
                        const attr1 = [].slice.call(documentNodes[index].attributes);
                        const attr2 = [].slice.call(templateNode.attributes);
                        const update = attr2.filter((n) => attr1.find((x) => n.name === x.name && n.value !== x.value));
                        const remove = attr1.filter((n) => !attr2.find((x) => n.name === x.name));
                        const add = attr2.filter((n) => !attr1.find((x) => n.name === x.name));
                        remove.map((attr) => {
                            documentNodes[index].removeAttribute(attr.name);
                        });
                        [...update, ...add].map((attr) => {
                            documentNodes[index].setAttribute(attr.name, attr.value);
                        });
                    }
                    if (this._components[templateNode.localName]) {
                        // stop here! do not work on others component's childrens
                        continue;
                    }
                    // clear child nodes
                    if (documentNodes[index].childNodes.length > 0 && templateNode.childNodes.length < 1) {
                        documentNodes[index].innerHTML = "";
                        continue;
                    }
                    // prepare empty node for next round
                    if (documentNodes[index].childNodes.length < 1 && templateNode.childNodes.length > 0) {
                        const fragment = document.createDocumentFragment();
                        this.mergeHtml(templateNode, fragment);
                        documentNodes[index].appendChild(fragment);
                        continue;
                    }
                    // dive deeper into the tree
                    if (templateNode.childNodes.length > 0) {
                        this.mergeHtml(templateNode, documentNodes[index]);
                    }
                }
            }
            // remove extra elements
            diffCount = documentNodes.length - templateNodes.length;
            while (diffCount > 0) {
                const index = documentNodes.length - diffCount;
                this._traverseTree(documentNodes[index], this._removeComponent);
                documentNodes[index].parentNode &&
                    documentNodes[index].parentNode.removeChild(documentNodes[index]);
                diffCount--;
            }
        };
        this._createComponentClass = (componentClass, registerChildComponents, mergeHtml) => {
            return class extends (componentClass) {
                constructor(props) {
                    super(props);
                }
                async init() {
                    super.init && await super.init();
                    await this.render();
                    super.onMount && await super.onMount();
                }
                async render() {
                    this.__rendered = true;
                    const html = super.render && await super.render(this.__initalInnerHTML);
                    if (html && html !== this.__previousTemplate) {
                        this.__previousTemplate = html;
                        const domParser = new DOMParser();
                        const template = domParser.parseFromString(html, "text/html");
                        mergeHtml(template.querySelector("body"), this);
                        registerChildComponents(this);
                    }
                    super.onRender && super.onRender();
                }
            };
        };
        this.registerComponent = (componentName, componentClass) => {
            if (!this._components[componentName] && /-/.test(componentName)) {
                Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);
                this._components[componentName] =
                    this._createComponentClass(componentClass, this._registerChildComponents, this.mergeHtml);
            }
        };
    }
    init(navimiHelpers) {
        this._components = {};
        this._navimiHelpers = navimiHelpers;
        new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "attributes") {
                    const node = mutation.target;
                    if (this._components[node.localName]) {
                        const prevAttributes = this._readAttributes(node);
                        if (!node.shouldUpdate || node.shouldUpdate(prevAttributes, node.props)) {
                            node.update();
                        }
                    }
                }
                else {
                    for (const addedNode of mutation.addedNodes) {
                        this._traverseTree(addedNode, this._registerTag);
                    }
                    for (const removedNode of mutation.removedNodes) {
                        // todo: create a queue to remove components and give priority to adding components
                        this._traverseTree(removedNode, this._removeComponent);
                    }
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    }
}
class __Navimi_Core {
    constructor(routes, services, options) {
        this._navigateTo = (url, params) => {
            this._initRoute(url, params);
        };
        this._reportError = (error) => {
            if (this._options.onError) {
                this._options.onError(error);
                return;
            }
            console.error(error);
        };
        this._waitForAssets = (callId) => {
            const css = this._options.globalCssUrl;
            const template = this._options.globalTemplatesUrl;
            if (!css && !template) {
                return Promise.resolve();
            }
            return new Promise(resolve => {
                const loadInterval = setInterval(() => {
                    let allLoaded = true;
                    if ((css && !this._navimiCSSs.isCssLoaded(css)) ||
                        (template && !this._navimiTemplates.isTemplateLoaded(template))) {
                        allLoaded = false;
                    }
                    //check if any load error occured
                    const errors = this._navimiFetch.getErrors(css) ||
                        this._navimiFetch.getErrors(template);
                    if (errors || allLoaded || callId < this._callId) {
                        clearInterval(loadInterval);
                        return resolve();
                    }
                }, 10);
            });
        };
        this._initRoute = async (urlToGo, navParams, force) => {
            try {
                const url = this._navimiHelpers.removeHash(urlToGo || this._navimiHelpers.getUrl());
                if (!force) {
                    if (this._currentUrl === url) {
                        return;
                    }
                    this._abortController && this._abortController.abort();
                    this._abortController = window["AbortController"] ? new AbortController() : undefined;
                }
                const callId = ++this._callId;
                const pushState = urlToGo !== undefined;
                const { routeItem, params } = this._navimiHelpers.getRouteAndParams(url, this._routesList);
                const routeParams = Object.assign({ url,
                    routeItem,
                    params }, (navParams ? navParams : {}));
                if (this._currentJS && !force) {
                    if (this._options.onBeforeRoute) {
                        const shouldContinue = await this._options.onBeforeRoute(routeParams, this._navigateTo);
                        if (shouldContinue === false) {
                            return;
                        }
                    }
                    const currentJsInstance = this._navimiJSs.getInstance(this._currentJS);
                    if (currentJsInstance) {
                        const beforeLeave = currentJsInstance.beforeLeave;
                        if (beforeLeave) {
                            const shouldContinue = beforeLeave(routeParams);
                            if (shouldContinue === false) {
                                if (!pushState) {
                                    history.forward();
                                }
                                return;
                            }
                        }
                        currentJsInstance.destroy && currentJsInstance.destroy();
                    }
                }
                if (!routeItem) {
                    callId === this._callId && this._reportError(new Error("No route match for url: " + url));
                    return;
                }
                await this._navimiMiddlewares.executeMiddlewares(this._abortController, routeParams, (url, params) => {
                    this._initRoute(url, params, true);
                }).catch(this._reportError);
                if (callId < this._callId) {
                    //removeIf(minify)
                    console.warn("Navimi: A middleware has exited or errored.");
                    //endRemoveIf(minify)
                    return;
                }
                this._currentUrl = url;
                const { title, jsUrl, cssUrl, templatesUrl, services, components } = routeItem || {};
                if (!jsUrl && !templatesUrl) {
                    throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");
                }
                if (jsUrl) {
                    this._currentJS = jsUrl;
                    this._routesParams[jsUrl] = routeParams;
                }
                if (pushState) {
                    if (navParams && navParams.replaceUrl) {
                        history.replaceState(null, null, urlToGo);
                    }
                    else {
                        history.pushState(null, null, urlToGo);
                    }
                }
                // load all (css, templates and js) from the route in parallel
                await Promise.all([
                    this._navimiJSs.loadDependencies(this._abortController, jsUrl || url, services, components),
                    this._navimiCSSs.fetchCss(this._abortController, cssUrl),
                    this._navimiTemplates.fetchTemplate(this._abortController, templatesUrl),
                    (jsUrl && this._navimiJSs.fetchJS(this._abortController, [jsUrl], "route"))
                ]).catch(this._reportError);
                //wait global css and template to load, if any
                await this._waitForAssets(callId);
                this._navimiHelpers.setTitle(title);
                if (!this._globalCssInserted) {
                    this._globalCssInserted = true;
                    this._navimiCSSs.insertCss(this._options.globalCssUrl, 'globalCss');
                }
                if (jsUrl) {
                    await this._navimiJSs.initJS(jsUrl, this._routesParams[jsUrl]);
                }
                else {
                    const template = this._navimiTemplates.getTemplate(templatesUrl);
                    const body = document.querySelector("body");
                    if (template && body) {
                        body.innerHTML = template;
                    }
                    return;
                }
                if (callId === this._callId) {
                    this._navimiHelpers.setNavimiLinks();
                    this._navimiCSSs.insertCss(cssUrl, 'routeCss');
                    this._options.onAfterRoute &&
                        this._options.onAfterRoute(routeParams, this._navigateTo);
                }
            }
            catch (ex) {
                this._reportError(ex);
            }
        };
        this._callId = 0;
        this._abortController = window["AbortController"] ? new AbortController() : undefined;
        this._currentJS;
        this._currentUrl;
        this._routesParams = {};
        this._routesList = routes || {};
        this._options = options || {};
        this._globalCssInserted = false;
        this._win = window ? window : {};
        this._navimiFetch = services.navimiFetch;
        this._navimiCSSs = services.navimiCSSs;
        this._navimiJSs = services.navimiJSs;
        this._navimiTemplates = services.navimiTemplates;
        this._navimiMiddlewares = services.navimiMiddlewares;
        this._navimiHot = services.navimiHot;
        this._navimiHelpers = services.navimiHelpers;
        this._win.addEventListener('popstate', () => {
            this._initRoute();
        });
        this._win.navigateTo = this._navigateTo;
        //add middlewares
        this._navimiMiddlewares.addMiddlewares(this._options.middlewares);
        (async () => {
            await this._init();
        })();
        this._initRoute();
        if (this._options.hot) {
            this._initHot();
        }
    }
    _init() {
        if (this._options.globalCssUrl || this._options.globalTemplatesUrl) {
            Promise.all([
                this._navimiCSSs.fetchCss(undefined, this._options.globalCssUrl),
                this._navimiTemplates.fetchTemplate(undefined, this._options.globalTemplatesUrl),
            ]).catch(this._reportError);
        }
    }
    _initHot() {
        //removeIf(minify)
        this._navimiHot.init(this._navimiCSSs, this._navimiJSs, this._navimiTemplates, () => this._initRoute(undefined, undefined, true));
        setTimeout(this._navimiHot.openHotWs, 1000, this._options.hot);
        //endRemoveIf(minify)
    }
}
class __Navimi_CSSs {
    constructor() {
        this._loadedCsss = {};
        this._replaceCss = (cssCode, url) => {
            const oldTag = document.querySelector(`[cssUrl='${url}']`);
            if (!oldTag) {
                return;
            }
            oldTag.innerHTML = cssCode;
        };
        this.isCssLoaded = (url) => {
            return this._loadedCsss[url] !== undefined;
        };
        this.fetchCss = (abortController, url) => {
            if (!url || this._loadedCsss[url]) {
                return Promise.resolve();
            }
            return this._navimiFetch.fetchFile(url, {
                headers: {
                    Accept: "text/css"
                },
                signal: abortController ? abortController.signal : undefined
            }).then(cssCode => {
                this._loadedCsss[url] = cssCode;
            });
        };
        this.insertCss = (url, type, prepend) => {
            if (type === "routeCss") {
                const oldRouteTag = document.querySelector(`[cssType='${type}']`);
                if (oldRouteTag) {
                    if (oldRouteTag.getAttribute('cssUrl') === url) {
                        return;
                    }
                    oldRouteTag.remove();
                }
            }
            //avoid reinserting the same css
            if (document.querySelector(`[cssUrl='${url}']`)) {
                return;
            }
            const cssCode = this._loadedCsss[url];
            if (!cssCode) {
                return;
            }
            const style = document.createElement("style");
            style.innerHTML = cssCode;
            url && style.setAttribute("cssUrl", url);
            url && style.setAttribute("cssType", type);
            const head = document.getElementsByTagName("head")[0];
            const target = (head || document.body);
            prepend ? target.prepend(style) : target.appendChild(style);
        };
        //removeIf(minify)
        this.digestHot = ({ filePath, data }) => {
            if (!this.isCssLoaded(filePath)) {
                return;
            }
            this._loadedCsss[filePath] = data;
            this._replaceCss(data, filePath);
            console.log(`${filePath} updated.`);
            return Promise.resolve();
        };
        //endRemoveIf(minify)
    }
    init(navimiFetch) {
        this._navimiFetch = navimiFetch;
    }
}
class __Navimi_Fetch {
    constructor() {
        this.loadErrors = {};
        this.init = (options) => {
            this._bustCache = options.bustCache;
        };
        this.getErrors = (url) => {
            return this.loadErrors[url];
        };
        this.fetchFile = (url, options) => {
            return new Promise((resolve, reject) => {
                delete this.loadErrors[url];
                const requestUrl = url + (this._bustCache ? '?v=' + this._bustCache : '');
                const error = `Could not load the file! - ${url}`;
                //todo: add retry
                fetch(requestUrl, options)
                    .then((data) => {
                    if (!data || !data.ok) {
                        this.loadErrors[url] = error;
                        return reject(error);
                    }
                    data.text().then(resolve);
                })
                    .catch(() => {
                    this.loadErrors[url] = error;
                    reject(error);
                });
            });
        };
    }
}
class __Navimi_Helpers {
    constructor() {
        this.parseQuery = (queryString) => {
            const query = {};
            queryString.split('&').map(pair => {
                const kv = pair.split('=');
                query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
            });
            return query;
        };
        this.splitPath = (path) => {
            if (!path) {
                return [];
            }
            const queryPos = path.indexOf("?");
            path = queryPos >= 0 ? path.substring(0, queryPos) : path;
            return path.split("/").filter(p => p.length > 0);
        };
        this.parsePath = (urlPath, urlPattern) => {
            const queryPos = urlPath.indexOf("?");
            const query = queryPos > 0 ? urlPath.substring(queryPos + 1, urlPath.length) : "";
            const path = this.splitPath(urlPath);
            const pattern = this.splitPath(urlPattern);
            let params = {};
            if (queryPos > 0) {
                params = {
                    queryString: this.parseQuery(query)
                };
            }
            for (let i = 0; i < pattern.length; i++) {
                if (pattern[i].charAt(0) === ':') {
                    const name = pattern[i].slice(1);
                    if (path.length <= i) {
                        return null;
                    }
                    params[name] = decodeURIComponent(path[i]);
                }
                else {
                    if (!path[i] || pattern[i].toLowerCase() !== path[i].toLowerCase())
                        return null;
                }
            }
            return params;
        };
        this.timeout = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.debounce = (task, wait) => {
            let timeout;
            return function (...args) {
                const func = () => {
                    timeout = null;
                    task.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(func, wait);
            };
        };
        // eslint-disable-next-line @typescript-eslint/ban-types
        this.throttle = (task, wait, context) => {
            let timeout;
            let lastTime;
            return function (...args) {
                const now = Date.now();
                if (lastTime && now < lastTime + wait) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        lastTime = now;
                        task.apply(context, args);
                    }, wait);
                }
                else {
                    lastTime = now;
                    task.apply(context, args);
                }
            };
        };
        this.getUrl = () => {
            const location = document.location;
            const matches = location.toString().match(/^[^#]*(#.+)$/);
            const hash = matches ? matches[1] : "";
            return [location.pathname, location.search, hash].join("");
        };
        this.setTitle = (title) => {
            document.title = title;
        };
        this.setNavimiLinks = () => {
            document.querySelectorAll("[navimi-link]").forEach(el => {
                el.removeAttribute("navimi-link");
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.navigateTo(e.target.pathname);
                });
            });
        };
        this.removeHash = (url) => {
            const hashPos = url.indexOf("#");
            return hashPos > 0 ? url.substring(0, hashPos) : url;
        };
        this.stringify = (obj) => {
            const visited = [];
            const iterateObject = (obj) => {
                if (typeof obj === 'function') {
                    return String(obj);
                }
                //todo: error serialization is not working
                if (obj instanceof Error) {
                    return obj.message;
                }
                if (obj === null || typeof obj !== 'object') {
                    return obj;
                }
                if (visited.indexOf(obj) !== -1) {
                    return `[Circular: ${visited.indexOf(obj)}]`;
                }
                visited.push(obj);
                if (Array.isArray(obj)) {
                    const aResult = obj.map(iterateObject);
                    visited.pop();
                    return aResult;
                }
                const result = Object.keys(obj).reduce((result, prop) => {
                    result[prop] = iterateObject(((obj, prop) => {
                        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                            try {
                                return obj[prop];
                            }
                            catch (_a) {
                                return;
                            }
                        }
                        return obj[prop];
                    })(obj, prop));
                    return result;
                }, {});
                visited.pop();
                return result;
            };
            return JSON.stringify(iterateObject(obj));
        };
        this.cloneObject = (obj) => {
            //todo: error cloning is not working
            return obj === null || typeof obj !== "object" ? obj :
                Object.keys(obj).reduce((prev, current) => obj[current] !== null && typeof obj[current] === "object" ?
                    (prev[current] = this.cloneObject(obj[current]), prev) :
                    (prev[current] = obj[current], prev), Array.isArray(obj) ? [] : {});
        };
        this.getRouteAndParams = (url, routingList) => {
            const urlParams = this.splitPath(url);
            const catchAll = routingList["*"];
            let routeItem, params;
            for (const routeUrl in routingList) {
                const routeParams = this.splitPath(routeUrl);
                if (routeParams.length === urlParams.length) {
                    params = this.parsePath(url, routeUrl);
                    if (params) {
                        routeItem = routingList[routeUrl];
                        break;
                    }
                }
            }
            if (!routeItem && catchAll) {
                params = this.parsePath(url, url);
                routeItem = catchAll;
            }
            return { routeItem, params };
        };
    }
}
class __Navimi_Hot {
    constructor() {
        this.openHotWs = (hotOption) => {
            try {
                if (!('WebSocket' in window)) {
                    console.error("Websocket is not supported by your browser!");
                    return;
                }
                console.warn("Connecting HOT...");
                const port = hotOption === true ? 8080 : hotOption;
                this._wsHotClient = null;
                this._wsHotClient = new WebSocket(`ws://localhost:${port}`);
                this._wsHotClient.addEventListener('message', (e) => {
                    try {
                        const payload = JSON.parse(e.data || "");
                        if (payload.message) {
                            console.warn(payload.message);
                            return;
                        }
                        if (payload.filePath) {
                            this._digestHot(payload);
                        }
                    }
                    catch (ex) {
                        console.error("Could not parse HOT message:", ex);
                    }
                });
                this._wsHotClient.onclose = () => {
                    console.warn('HOT Connection Closed!');
                    setTimeout(this.openHotWs, 5000, hotOption);
                };
            }
            catch (ex) {
                console.error(ex);
            }
        };
        this._digestHot = (payload) => {
            var _a;
            try {
                const filePath = payload.filePath.replace(/\\/g, "/");
                const fileType = (_a = filePath.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase();
                switch (fileType) {
                    case "css":
                        this._navimiCSSs.digestHot(payload);
                        break;
                    case "html":
                    case "htm":
                        this._navimiTemplates.digestHot(payload).then(() => this._initRouteFunc());
                        break;
                    case "js":
                        this._navimiJSs.digestHot(payload).then(() => this._initRouteFunc());
                        break;
                    case "gif":
                    case "jpg":
                    case "jpeg":
                    case "png":
                    case "svg":
                        this._initRouteFunc();
                        break;
                }
            }
            catch (ex) {
                console.error("Could not digest HOT payload: ", ex);
            }
        };
        //endRemoveIf(minify)
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    init(navimiCSSs, navimiJSs, navimiTemplates, initRoute) {
        this._navimiCSSs = navimiCSSs;
        this._navimiJSs = navimiJSs;
        this._navimiTemplates = navimiTemplates;
        this._initRouteFunc = initRoute;
    }
}
class __Navimi_JSs {
    constructor() {
        this._navimiLoaderNS = "__navimiLoader";
        this._callBackNS = "_jsLoaderCallback";
        this._promiseNS = "_promise_";
        this._loadedJSs = {};
        this._jsType = {};
        this._jsInstances = {};
        this._dependencyJSsMap = {};
        this._routesJSsServices = {};
        this._routesJSsComponents = {};
        this._resolvePromise = (value, jsUrl) => {
            this._navimiLoader[this._promiseNS + jsUrl](value);
        };
        this._rejectPromise = (reason, jsUrl) => {
            this._navimiLoader[this._promiseNS + jsUrl + "_reject"](reason);
        };
        this._awaitJS = (jsUrl) => {
            return new Promise((resolve, reject) => {
                const loadInterval = setInterval(() => {
                    if (this._jsInstances[jsUrl]) {
                        clearInterval(loadInterval);
                        return resolve(this._jsInstances[jsUrl]);
                    }
                    const type = this._jsType[jsUrl];
                    if ((type === 'library' || type === 'module') && this.isJsLoaded(jsUrl)) {
                        clearInterval(loadInterval);
                        return resolve("");
                    }
                    const error = this._navimiFetch.getErrors(jsUrl);
                    if (error) {
                        clearInterval(loadInterval);
                        return reject(error);
                    }
                }, 10);
            });
        };
        this._addLibrary = async (library) => {
            const arr = Array.isArray(library) ? library : [library];
            if (arr.length > 0) {
                const libraries = arr.map(lib => {
                    if (typeof lib === "string") {
                        const type = lib.split(".").pop();
                        return {
                            url: lib,
                            type: type.toLowerCase(),
                        };
                    }
                    else {
                        return lib;
                    }
                });
                await Promise.all(libraries.map(obj => {
                    const type = obj.type.toLowerCase();
                    if (type === "css") {
                        return this._navimiCSSs.fetchCss(undefined, obj.url).then(() => {
                            this._navimiCSSs.insertCss(obj.url, 'library', true);
                        });
                    }
                    else {
                        return this.fetchJS(undefined, [obj.url], type === "module" ? "module" : "library");
                    }
                })).catch(ex => {
                    throw new Error(ex);
                });
            }
        };
        this._fetch = (abortController, url, type) => {
            return this._navimiFetch.fetchFile(url, {
                headers: {
                    Accept: "application/javascript"
                },
                signal: abortController ? abortController.signal : undefined
            }).then(jsCode => {
                this._jsType[url] = type;
                this._insertJS(url, jsCode, type);
            });
        };
        this._insertJS = (url, jsCode, type) => {
            const jsHtmlBody = (type === "module" || type === "library") ? jsCode :
                `(function(){window.${this._navimiLoaderNS}.${this._callBackNS}("${url}", "${type}", (function(){return ${jsCode}   
                })())}())`;
            this._loadedJSs[url] = jsCode;
            const oldTag = document.querySelector(`[jsUrl='${url}']`);
            if (oldTag) {
                oldTag.remove();
            }
            const script = document.createElement("script");
            script.type = type === "module" ? "module" : "text/javascript";
            script.innerHTML = jsHtmlBody;
            script.setAttribute("jsUrl", url);
            const head = document.getElementsByTagName("head")[0];
            (head || document.body).appendChild(script);
            if (type === 'module' || type === 'library') {
                this._resolvePromise(true, url); // resolve the promise - script is loaded
            }
        };
        this._instantiateJS = async (jsUrl, type, JsClass) => {
            // for services, components and javascript
            if (type !== "route") {
                // keep this instance to reuse later
                this._jsInstances[jsUrl] = JsClass;
                this._resolvePromise(Object.freeze(JsClass), jsUrl);
                return;
            }
            try {
                this._navimiState.unwatchState(jsUrl);
                const routerFunctions = {
                    addLibrary: this._addLibrary,
                    setTitle: this._navimiHelpers.setTitle,
                    navigateTo: window.navigateTo,
                    getTemplate: this._navimiTemplates.getTemplate,
                    fetchJS: (url) => {
                        const urls = Array.isArray(url) ? url : [url];
                        urls.map(u => {
                            this._dependencyJSsMap[u] = Object.assign(Object.assign({}, this._dependencyJSsMap[u] || {}), { [jsUrl]: true });
                        });
                        return this.fetchJS(undefined, urls, "javascript");
                    },
                    fetchTemplate: (url) => {
                        return this._navimiTemplates.fetchTemplate(undefined, url);
                    },
                    setState: this._navimiState.setState,
                    getState: this._navimiState.getState,
                    setNavimiLinks: this._navimiHelpers.setNavimiLinks,
                    unwatchState: (key) => this._navimiState.unwatchState(jsUrl, key),
                    watchState: (key, callback) => this._navimiState.watchState(jsUrl, key, callback),
                };
                //wait for all dependencies to be loaded
                const dependencies = [];
                for (const deps in this._dependencyJSsMap) {
                    if (this._dependencyJSsMap[deps][jsUrl]) {
                        dependencies.push(deps);
                    }
                }
                await Promise.all(dependencies.map(this._awaitJS));
                //gather all services
                let services = {};
                this._routesJSsServices[jsUrl].map((sn) => {
                    services = Object.assign(Object.assign({}, services), { [sn]: this._jsInstances[this._options.services[sn]] });
                });
                const jsInstance = new JsClass(Object.freeze(routerFunctions), services);
                //keep this instance to reuse later
                this._jsInstances[jsUrl] = jsInstance;
                this._resolvePromise(jsInstance, jsUrl);
            }
            catch (error) {
                this._rejectPromise(error, jsUrl);
            }
        };
        this._isJsLoading = (jsUrl) => {
            return this._navimiLoader[this._promiseNS + jsUrl] !== undefined &&
                !this._navimiFetch.getErrors(jsUrl);
        };
        this.isJsLoaded = (url) => {
            return this._loadedJSs[url] !== undefined;
        };
        this.getInstance = (url) => {
            return this._jsInstances[url];
        };
        this.fetchJS = (abortController, urls, type) => {
            const init = (url) => {
                return new Promise((resolve, reject) => {
                    // return the instance if this js is already loaded
                    if (this._jsInstances[url]) {
                        return resolve(this._jsInstances[url]);
                    }
                    // stop here if the module or library is already inserted
                    if (this._loadedJSs[url] && (type === 'module' || type === 'library')) {
                        return resolve(true);
                    }
                    // route repeated calls to an awaiter
                    if (this._isJsLoading(url)) {
                        return this._awaitJS(url)
                            .then(resolve)
                            .catch(reject);
                    }
                    // let the js resolve the promise itself when it loads (in _instantiateJS)
                    this._navimiLoader[this._promiseNS + url] = resolve;
                    this._navimiLoader[this._promiseNS + url + "_reject"] = reject;
                    this._fetch(abortController, url, type).catch(reject);
                });
            };
            return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
        };
        this.loadDependencies = (abortController, jsUrl, services, components) => {
            if (!jsUrl) {
                return;
            }
            const checkUrls = (depArray, type) => {
                const notFound = [];
                const urls = (depArray || []).map(name => {
                    //@ts-ignore
                    const url = this._options[type] && this._options[type][name];
                    if (url === undefined) {
                        notFound.push(name);
                    }
                    else {
                        type === "services" &&
                            this._routesJSsServices[jsUrl].indexOf(name) === -1 &&
                            this._routesJSsServices[jsUrl].push(name);
                        type === "components" &&
                            this._routesJSsComponents[jsUrl].indexOf(name) === -1 &&
                            this._routesJSsComponents[jsUrl].push(name);
                        this._dependencyJSsMap[url] = Object.assign(Object.assign({}, this._dependencyJSsMap[url] || {}), { [jsUrl]: true });
                    }
                    return url;
                });
                if (notFound.length > 0) {
                    throw new Error(type + " not defined: " + notFound.join(", "));
                }
                return urls;
            };
            this._routesJSsServices[jsUrl] = this._routesJSsServices[jsUrl] || [];
            this._routesJSsComponents[jsUrl] = this._routesJSsComponents[jsUrl] || [];
            const servicesUrls = checkUrls(services, "services");
            const componentsUrls = checkUrls(components, "components");
            const promises = servicesUrls.filter(url => url !== undefined)
                .map(url => this.fetchJS(abortController, [url], "service"))
                .concat(componentsUrls.filter(url => url !== undefined)
                .map(url => this
                .fetchJS(abortController, [url], "component")
                .then((componentClass) => {
                //register components as soon as they are loaded
                Object.keys(this._options.components).map((name) => {
                    if (this._options.components[name] === url) {
                        this._navimiComponents.registerComponent(name, componentClass);
                    }
                });
            })));
            return Promise.all(promises);
        };
        this.initJS = async (jsUrl, params) => {
            const jsInstance = this.getInstance(jsUrl);
            jsInstance && jsInstance.init &&
                await jsInstance.init(params);
        };
        //removeIf(minify)
        this.digestHot = ({ filePath, data }) => {
            if (!this.isJsLoaded(filePath)) {
                return;
            }
            return Promise.resolve();
            //discover the js type
            // "module"
            // "library"
            // "route"
            // "javascript"
            // "service"
            // "component"
            //call destroy and unload for all js that are referencing this js
            //remove the js from the loaded js list
            //load the js again
            //callback
            // private _routesJSs: INavimi_KeyList<InstanceType<any>> = {};
            // private _dependencyJSsMap: INavimi_KeyList<INavimi_KeyList<boolean>> = {};
            // private _routesJSsServices: INavimi_KeyList<string[]> = {};
            // private _routesJSsComponents: INavimi_KeyList<string[]> = {};
            // for (const routeUrl in routeList) {
            //     const { jsUrl } = routeList[routeUrl];
            //     if (isSameFile(jsUrl, filePath)) {
            //         console.log(`${filePath} updated.`);
            //         delete this._routesJSs[jsUrl];
            //         this._navimiLoader[this._promiseNS + jsUrl] = () => {
            //             if (jsUrl === currentJS) {
            //                 //reload route if current JS is updated
            //                 callback();
            //             }
            //         };
            //         this._insertJS(jsUrl, jsCode, "route");
            //         return;
            //     }
            // }
            // for (const jsUrl in this._dependencyJSsMap) {
            //     if (isSameFile(jsUrl, filePath)) {
            //         console.log(`${filePath} updated.`);
            //         this._navimiLoader[this._promiseNS + jsUrl] = () => {
            //             Object.keys(this._dependencyJSsMap[jsUrl]).map(s => {
            //                 //clear all dependent JSs that depends of this JS
            //                 delete this._routesJSs[s];
            //                 if (s === currentJS) {
            //                     //reload route if current JS is updated
            //                     callback();
            //                 }
            //             });
            //         };
            //         //todo: check for modules, services and components
            //         this._insertJS(filePath, jsCode, "javascript");
            //     }
            // }
        };
        //endRemoveIf(minify)
    }
    init(navimiHelpers, navimiFetch, navimiCSSs, navimiTemplates, navimiState, navimiComponents, options) {
        this._navimiHelpers = navimiHelpers;
        this._navimiFetch = navimiFetch;
        this._navimiCSSs = navimiCSSs;
        this._navimiTemplates = navimiTemplates;
        this._navimiState = navimiState;
        this._navimiComponents = navimiComponents;
        this._options = options;
        // @ts-ignore
        this._navimiLoader = window[this._navimiLoaderNS] = {
            [this._callBackNS]: this._instantiateJS, // initialize JS loader namespace
        };
    }
}
class __Navimi_Middlewares {
    constructor() {
        this._middlewareStack = [];
        this.addMiddlewares = (middlewares) => {
            if (Array.isArray(middlewares)) {
                this._middlewareStack.push(...middlewares.filter(mdw => mdw !== undefined));
            }
        };
        this.executeMiddlewares = async (abortController, context, callback) => {
            let prevIndex = -1;
            const runner = async (resolve, reject, index = 0) => {
                //removeIf(minify)
                if (index === prevIndex) {
                    console.warn('next() called multiple times');
                }
                //endRemoveIf(minify)
                prevIndex = index;
                const middleware = this._middlewareStack[index];
                if (middleware) {
                    try {
                        await middleware(context, async (url, params) => {
                            if (abortController && abortController.signal.aborted) {
                                resolve();
                            }
                            else {
                                if (!url) {
                                    await runner(resolve, reject, index + 1);
                                }
                                else {
                                    callback(url, params);
                                    resolve();
                                }
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                }
                else {
                    resolve();
                }
            };
            return await new Promise(runner);
        };
    }
}
class Navimi {
    constructor(routes, options, services, core) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const navimiFetch = (_a = services === null || services === void 0 ? void 0 : services.navimiFetch) !== null && _a !== void 0 ? _a : new __Navimi_Fetch();
        const navimiCSSs = (_b = services === null || services === void 0 ? void 0 : services.navimiCSSs) !== null && _b !== void 0 ? _b : new __Navimi_CSSs();
        const navimiJSs = (_c = services === null || services === void 0 ? void 0 : services.navimiJSs) !== null && _c !== void 0 ? _c : new __Navimi_JSs();
        const navimiTemplates = (_d = services === null || services === void 0 ? void 0 : services.navimiTemplates) !== null && _d !== void 0 ? _d : new __Navimi_Templates();
        const navimiMiddlewares = (_e = services === null || services === void 0 ? void 0 : services.navimiMiddlewares) !== null && _e !== void 0 ? _e : new __Navimi_Middlewares();
        const navimiState = (_f = services === null || services === void 0 ? void 0 : services.navimiState) !== null && _f !== void 0 ? _f : new __Navimi_State();
        const navimiHot = (_g = services === null || services === void 0 ? void 0 : services.navimiHot) !== null && _g !== void 0 ? _g : new __Navimi_Hot();
        const navimiHelpers = (_h = services === null || services === void 0 ? void 0 : services.navimiHelpers) !== null && _h !== void 0 ? _h : new __Navimi_Helpers();
        const navimiComponents = (_j = services === null || services === void 0 ? void 0 : services.navimiComponents) !== null && _j !== void 0 ? _j : new __Navimi_Components();
        // setup DI
        navimiFetch.init(options);
        navimiCSSs.init(navimiFetch);
        navimiJSs.init(navimiHelpers, navimiFetch, navimiCSSs, navimiTemplates, navimiState, navimiComponents, options);
        navimiTemplates.init(navimiFetch);
        navimiState.init(navimiHelpers);
        navimiComponents.init(navimiHelpers);
        const _services = {
            navimiFetch,
            navimiJSs,
            navimiCSSs,
            navimiTemplates,
            navimiMiddlewares,
            navimiState,
            navimiHot,
            navimiHelpers,
            navimiComponents
        };
        return core ? core(routes, _services, options) :
            new __Navimi_Core(routes, _services, options);
    }
}
class __Navimi_State {
    constructor() {
        this.state = {};
        this.stateWatchers = {};
        this.prevState = {};
        this.stateDiff = {};
        this._navimiHelpers = {};
        this.getStateDiff = (keys) => {
            //start with longer keys to go deep first
            keys.sort((a, b) => b.length - a.length).map(key => {
                if (!this.stateDiff[key]) {
                    const sOld = this._navimiHelpers.stringify(this.getState(key, this.prevState) || "");
                    const sNew = this._navimiHelpers.stringify(this.getState(key, this.state) || "");
                    if (sOld !== sNew) {
                        this.stateDiff[key] = true;
                        //set upper keys as changed so we don't test them again
                        keys.map(upperKey => {
                            if (key !== upperKey && key.indexOf(upperKey) === 0) {
                                this.stateDiff[upperKey] = true;
                            }
                        });
                    }
                }
            });
        };
        this.mergeState = (state, newState) => {
            if (newState instanceof Error) {
                newState = Object.assign(Object.assign({}, newState), { message: newState.message, stack: newState.stack });
            }
            const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
            if (isObject(state) && isObject(newState)) {
                for (const key in newState) {
                    if (isObject(newState[key])) {
                        !state[key] && Object.assign(state, { [key]: {} });
                        this.mergeState(state[key], newState[key]);
                    }
                    else {
                        Object.assign(state, { [key]: newState[key] });
                    }
                }
            }
        };
        this.setState = (newState) => {
            const observedKeys = Object.keys(this.stateWatchers);
            if (observedKeys.length > 0) {
                this.prevState = this._navimiHelpers.cloneObject(this.state);
            }
            this.mergeState(this.state, newState);
            if (observedKeys.length > 0) {
                this.getStateDiff(observedKeys);
                this.invokeStateWatchers();
            }
        };
        this.getState = (key, _state) => {
            const state = key ?
                key.split('.')
                    .reduce((v, k) => (v && v[k]) || undefined, _state || this.state) :
                _state || this.state;
            return state ? Object.freeze(this._navimiHelpers.cloneObject(state)) : undefined;
        };
        this.watchState = (jsUrl, key, callback) => {
            if (!key || !callback) {
                return;
            }
            if (!this.stateWatchers[key]) {
                this.stateWatchers[key] = {};
            }
            this.stateWatchers[key] = Object.assign(Object.assign({}, this.stateWatchers[key]), { [jsUrl]: [
                    ...(this.stateWatchers[key][jsUrl] || []),
                    callback
                ] });
        };
        this.unwatchState = (jsUrl, key) => {
            const remove = (key) => {
                this.stateWatchers[key][jsUrl] = undefined;
                delete this.stateWatchers[key][jsUrl];
                Object.keys(this.stateWatchers[key]).length === 0 &&
                    delete this.stateWatchers[key];
            };
            if (key) {
                const keys = Array.isArray(key) ? key : [key];
                keys.map(id => {
                    !this.stateWatchers[id] && (this.stateWatchers[id] = {});
                    remove(id);
                });
                return;
            }
            Object.keys(this.stateWatchers).map(remove);
        };
        this.clear = (key) => {
            const keys = Array.isArray(key) ? key : [key];
            console.log("clear", keys);
            keys.map(id => {
                const state = id ?
                    id.split('.')
                        .reduce((v, k) => (v && v[k]) || undefined, this.state) :
                    this.state;
                console.log(id);
                if (state instanceof Object) {
                    Object.keys(state).map(sk => {
                        if (state[sk] instanceof Object) {
                            this.clear(id + "." + sk);
                        }
                        delete state[sk];
                    });
                }
            });
        };
    }
    init(navimiHelpers) {
        this._navimiHelpers = navimiHelpers;
        // debounce this so we fire in batches
        this.invokeStateWatchers = navimiHelpers.debounce(() => {
            const keys = Object.keys(this.stateWatchers);
            const diff = Object.keys(this.stateDiff);
            this.stateDiff = {};
            // fire deep keys first
            keys.filter(key => diff.indexOf(key) >= 0).sort((a, b) => b.length - a.length).map(key => {
                Object.keys(this.stateWatchers[key]).map((jsUrl) => {
                    const state = this.getState(key);
                    this.stateWatchers[key][jsUrl] &&
                        this.stateWatchers[key][jsUrl].map((cb) => cb &&
                            cb(state));
                });
            });
        }, 10);
    }
}
class __Navimi_Templates {
    constructor() {
        this._templatesCache = {};
        this._loadedTemplates = {};
        this.loadTemplate = (templateCode, url) => {
            let tempCode = templateCode;
            if (!this._regIni.exec(tempCode)) {
                this._templatesCache[url] = tempCode;
                return;
            }
            while (templateCode && templateCode.length > 0) {
                const iniTemplate = this._regIni.exec(tempCode);
                if (!iniTemplate || iniTemplate.length === 0) {
                    break;
                }
                const regIdRes = this._regId.exec(iniTemplate[1]);
                const idTemplate = regIdRes.length > 0 && regIdRes[1].slice(1, -1);
                tempCode = tempCode.substring(iniTemplate.index + iniTemplate[0].length);
                const endTemplate = this._regEnd.exec(tempCode);
                if (!idTemplate || !endTemplate || endTemplate.length === 0) {
                    break;
                }
                this._templatesCache[idTemplate] = tempCode.substring(0, endTemplate.index);
            }
        };
        this.isTemplateLoaded = (url) => {
            return this._loadedTemplates[url] !== undefined;
        };
        this.getTemplate = (templateId) => {
            const ids = Array.isArray(templateId) ? templateId : [templateId];
            const arrTemplates = ids.map(id => this._templatesCache[id]);
            return arrTemplates.length > 1 ? arrTemplates : arrTemplates[0];
        };
        this.fetchTemplate = (abortController, url) => {
            const init = (url) => {
                if (!url || this._loadedTemplates[url]) {
                    return Promise.resolve();
                }
                return this._navimiFetch.fetchFile(url, {
                    headers: {
                        Accept: "text/html"
                    },
                    signal: abortController ? abortController.signal : undefined
                }).then(templateCode => {
                    this.loadTemplate(templateCode, url);
                    this._loadedTemplates[url] = true;
                });
            };
            const urls = Array.isArray(url) ? url : [url];
            return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
        };
        //removeIf(minify)
        this.digestHot = ({ filePath, data }) => {
            if (!this.isTemplateLoaded(filePath)) {
                return;
            }
            this.loadTemplate(data, filePath);
            console.log(`${filePath} updated.`);
            return Promise.resolve();
        };
        //endRemoveIf(minify)
    }
    init(navimiFetch) {
        this._navimiFetch = navimiFetch;
        this._regIni = new RegExp("<t ([^>]+)>");
        this._regEnd = new RegExp("</t>");
        this._regId = new RegExp("id=(\"[^\"]+\"|'[^']+')");
    }
}
