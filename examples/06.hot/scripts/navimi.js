/**
 * Navimi v0.2.2 
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com 
 * https://github.com/ivanvaladares/navimi 
 */ 
class __Navimi_Components {
    constructor() {
        this._components = {};
        this.registerComponent = (name, componentClass) => {
            if (!this._components[name] && /\-/.test(name)) {
                Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);
                this._components[name] =
                    this._createComponentClass(componentClass, this._removeChildComponents, this._registerChildComponents);
            }
        };
        this._disconnectComponent = (node) => {
            if (node.props && node.props.parentComponent) {
                node.props.parentComponent.props.childComponents =
                    node.props.parentComponent.props.childComponents
                        .filter((child) => child != node);
            }
            if (node._observer) {
                node._observer.disconnect();
                node._observer = null;
            }
            if (node._attrObserver) {
                node._attrObserver.disconnect();
                node._attrObserver = null;
            }
        };
        this._removeChildComponents = (node) => {
            node.props && node.props.childComponents &&
                node.props.childComponents.map((child) => {
                    this._removeChildComponents(child);
                    this._disconnectComponent(child);
                    child.remove();
                    child.onAfterRemove && child.onAfterRemove();
                });
        };
        this._readAttributes = (node) => {
            const prevAttributes = node.props.attributes;
            node.props.attributes = undefined;
            for (let list of [].slice.call(node.attributes)) {
                const name = list.name;
                //@ts-ignore
                if (typeof node[name] !== "function") {
                    node.props.attributes = Object.assign(Object.assign({}, node.props.attributes || {}), { [name]: list.value });
                }
            }
            return prevAttributes;
        };
        this._registerTag = (tag) => {
            const componentClass = this._components[tag.localName];
            // connects the component class to the tag 
            Object.setPrototypeOf(tag, componentClass.prototype);
            // initializes the component props
            tag.props = {};
            this._readAttributes(tag);
            const parent = tag.parentElement;
            // observer to detect removed components
            tag._observer = new MutationObserver((mutations) => {
                if (mutations.find(mutation => mutation.removedNodes.length > 0)) {
                    if (!parent.contains(tag)) {
                        this._removeChildComponents(tag);
                        this._disconnectComponent(tag);
                        tag.onAfterRemove && tag.onAfterRemove();
                    }
                }
            });
            tag._observer.observe(parent, { childList: true });
            // observer to detect changes in the dom and refresh the attributes
            tag._attrObserver = new MutationObserver((mutations) => {
                if (mutations.find(mutation => mutation.type === "attributes")) {
                    const prevAttributes = this._readAttributes(tag);
                    if (!tag.shouldUpdate || tag.shouldUpdate(prevAttributes, tag.props.attributes)) {
                        tag.update();
                    }
                }
            });
            tag._attrObserver.observe(tag, { attributes: true });
            this._findParentComponent(tag);
            tag.init();
        };
        this._findParentComponent = (node) => {
            let parent = node.parentNode;
            while (parent) {
                if (/\-/.test(parent.localName) && this._components[parent.localName]) {
                    node.props.parentComponent = parent;
                    parent.props.childComponents = [
                        ...parent.props.childComponents || [],
                        node,
                    ];
                    return;
                }
                parent = parent.parentNode;
            }
        };
        this._registerChildEvents = (parent, child) => {
            if (child.attributes) {
                for (let list of [].slice.call(child.attributes)) {
                    const name = list.name;
                    //@ts-ignore
                    typeof child[name] === "function" && (child[name] = child[name].bind(parent));
                }
            }
        };
        this._registerChildComponents = (parent) => {
            const traverse = (node) => {
                let child;
                //@ts-ignore
                for (child of node.childNodes) {
                    if (this._components[child.localName]) {
                        this._registerTag(child);
                    }
                    else {
                        // bind child tags events to the parent
                        this._registerChildEvents(parent, child);
                        traverse(child);
                    }
                }
            };
            traverse(parent);
        };
        this._createComponentClass = (componentClass, beforeRender, afterRender) => {
            return class extends (componentClass) {
                init() {
                    super.init && super.init();
                    this.render();
                }
                update() {
                    this.render();
                }
                render() {
                    beforeRender(this);
                    if (this.props.children === undefined) {
                        this.props.children = this.innerHTML;
                    }
                    // todo: use virtual or shadow dom.
                    this.innerHTML = super.render && super.render();
                    afterRender(this);
                    super.onAfterRender && super.onAfterRender();
                }
            };
        };
    }
    init() {
        this._components = {};
        // todo: check if I shold remove this and fire the register after the route render
        new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                let node;
                //@ts-ignore
                for (node of mutation.addedNodes) {
                    if (this._components[node.localName] && !node.props) {
                        this._registerTag(node);
                    }
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true });
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
        this._initRoute = async (urlToGo, navParams, force) => {
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
            let { routeItem, params } = this._navimiHelpers.getRouteAndParams(url, this._routesList);
            if (navParams !== undefined) {
                params = Object.assign(Object.assign({}, params), navParams);
            }
            if (this._options.onBeforeRoute) {
                const shouldContinue = await this._options.onBeforeRoute({ url, routeItem, params }, this._navigateTo);
                if (shouldContinue === false) {
                    return;
                }
            }
            if (this._currentJS && !force) {
                const currentJsInstance = this._navimiJSs.getInstance(this._currentJS);
                if (currentJsInstance) {
                    const beforeLeave = currentJsInstance.beforeLeave;
                    if (beforeLeave) {
                        const shouldContinue = beforeLeave({ url, routeItem, params });
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
            await this._navimiMiddlewares.executeMiddlewares(this._abortController, { url, routeItem, params }, (url, params) => {
                this._initRoute(url, params, true);
            }).catch(this._reportError);
            if (callId < this._callId) {
                if (__NAVIMI_DEV) {
                    console.warn("Navimi: A middleware has exited or errored.");
                }
                return;
            }
            this._currentUrl = url;
            try {
                const { title, jsUrl, cssUrl, templatesUrl, dependsOn } = routeItem || {};
                if (!jsUrl && !templatesUrl) {
                    throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");
                }
                if (jsUrl) {
                    this._currentJS = jsUrl;
                    this._routesParams[jsUrl] = { url, routeItem, params };
                }
                if (pushState) {
                    if (navParams === null || navParams === void 0 ? void 0 : navParams.replaceUrl) {
                        history.replaceState(null, null, urlToGo);
                    }
                    else {
                        history.pushState(null, null, urlToGo);
                    }
                }
                this._navimiCSSs.fetchCss(this._abortController, cssUrl).catch(_ => { });
                this._navimiTemplates.fetchTemplate(this._abortController, templatesUrl).catch(_ => { });
                try {
                    this._navimiJSs.loadServices(this._abortController, jsUrl, dependsOn);
                }
                catch (ex) {
                    this._reportError(ex);
                }
                if (jsUrl) {
                    await this._navimiJSs.fetchJS(this._abortController, [jsUrl], "route");
                }
                //wait css and template to load if any
                while ((cssUrl && !this._navimiCSSs.isCssLoaded(cssUrl)) ||
                    (templatesUrl && !this._navimiTemplates.isTemplateLoaded(templatesUrl)) ||
                    (this._options.globalCssUrl &&
                        !this._navimiCSSs.isCssLoaded(this._options.globalCssUrl)) ||
                    (this._options.globalTemplatesUrl &&
                        !this._navimiTemplates.isTemplateLoaded(this._options.globalTemplatesUrl))) {
                    await this._navimiHelpers.timeout(10);
                    if (callId < this._callId) {
                        return;
                    }
                    //check if any load error occured
                    if ((cssUrl && this._navimiFetch.getErrors(cssUrl)) ||
                        (templatesUrl && this._navimiFetch.getErrors(templatesUrl)) ||
                        (this._options.globalCssUrl &&
                            this._navimiFetch.getErrors(this._options.globalCssUrl)) ||
                        (this._options.globalTemplatesUrl &&
                            this._navimiFetch.getErrors(this._options.globalTemplatesUrl))) {
                        this._reportError(new Error(this._navimiFetch.getErrors(cssUrl) ||
                            this._navimiFetch.getErrors(templatesUrl) ||
                            this._navimiFetch.getErrors(this._options.globalCssUrl) ||
                            this._navimiFetch.getErrors(this._options.globalTemplatesUrl)));
                        return;
                    }
                }
                this._navimiDom.setTitle(title);
                try {
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
                }
                catch (ex) {
                    this._reportError(ex);
                }
                finally {
                    if (callId < this._callId) {
                        return;
                    }
                    this._navimiDom.setNavimiLinks();
                    this._navimiDom.insertCss(this._navimiCSSs.getCss(cssUrl), "routeCss");
                    this._options.onAfterRoute &&
                        this._options.onAfterRoute({ url, routeItem, params }, this._navigateTo);
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
        this._win = window ? window : {};
        this._navimiFetch = services.navimiFetch;
        this._navimiDom = services.navimiDom;
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
    async _init() {
        if (this._options.globalCssUrl || this._options.globalTemplatesUrl) {
            await Promise.all([
                this._navimiCSSs.fetchCss(undefined, this._options.globalCssUrl),
                this._navimiTemplates.fetchTemplate(undefined, this._options.globalTemplatesUrl),
            ]).catch(this._reportError);
            this._navimiDom.insertCss(this._navimiCSSs.getCss(this._options.globalCssUrl), "globalCss");
        }
    }
    _initHot() {
        if (__NAVIMI_PROD) {
            console.warn('HOT is disabled! Use the unminified version to enable it.');
        }
        if (__NAVIMI_DEV) {
            setTimeout(this._navimiHot.openHotWs, 1000, this._options.hot, (callback) => {
                callback(this._options.globalCssUrl, this._options.globalTemplatesUrl, this._currentJS, this._routesList, () => {
                    this._initRoute(undefined, this._routesParams[this._currentJS], true);
                });
            });
        }
    }
}
class __Navimi_CSSs {
    constructor() {
        this._loadedCsss = {};
        this.isCssLoaded = (url) => {
            return this._loadedCsss[url] !== undefined;
        };
        this.getCss = (url) => {
            return this._loadedCsss[url];
        };
        this.fetchCss = (abortController, url, autoInsert) => {
            return new Promise(async (resolve, reject) => {
                if (!url || this._loadedCsss[url]) {
                    return resolve();
                }
                try {
                    const cssCode = await this._navimiFetch.fetchFile(url, {
                        headers: {
                            Accept: "text/css"
                        },
                        signal: abortController ? abortController.signal : undefined
                    });
                    if (autoInsert) {
                        this._navimiDom.insertCss(cssCode, url, true);
                        this._loadedCsss[url] = "loaded";
                    }
                    else {
                        this._loadedCsss[url] = cssCode;
                    }
                    resolve();
                }
                catch (ex) {
                    reject(ex);
                }
            });
        };
        this.reloadCss = (filePath, cssCode, routeList, currentJS, globalCssUrl) => {
            if (__NAVIMI_DEV) {
                const isSameFile = this._navimiHelpers.isSameFile;
                if (isSameFile(globalCssUrl, filePath)) {
                    console.log(`${filePath} updated.`);
                    this._loadedCsss[globalCssUrl] = cssCode;
                    this._navimiDom.insertCss(cssCode, "globalCss");
                    return;
                }
                for (const routeUrl in routeList) {
                    const { jsUrl, cssUrl } = routeList[routeUrl];
                    if (isSameFile(cssUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        this._loadedCsss[cssUrl] = cssCode;
                        if (currentJS === jsUrl) {
                            this._navimiDom.insertCss(cssCode, "routeCss");
                        }
                        return;
                    }
                }
            }
        };
    }
    init(navimiDom, navimiFetch, navimiHelpers) {
        this._navimiDom = navimiDom;
        this._navimiFetch = navimiFetch;
        this._navimiHelpers = navimiHelpers;
    }
}
// flag(s) to indicate uglify to add/remove code from the output
const __NAVIMI_DEV = true;
const __NAVIMI_PROD = false;
class __Navimi_Dom {
    constructor() {
        this.setTitle = (title) => {
            document.title = title;
        };
        this.setNavimiLinks = () => {
            document.querySelectorAll("[navimi-link]").forEach(el => {
                el.removeAttribute("navimi-link");
                el.setAttribute("navimi-linked", "");
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.navigateTo(e.target.pathname);
                });
            });
        };
        this.insertCss = (cssCode, type, prepend) => {
            const oldTag = type ? document.querySelector(`[cssId='${type}']`) : undefined;
            oldTag && oldTag.remove();
            if (!cssCode) {
                return;
            }
            const style = document.createElement("style");
            style.innerHTML = cssCode;
            type && style.setAttribute("cssId", type);
            const head = document.getElementsByTagName("head")[0];
            const target = (head || document.body);
            prepend ? target.prepend(style) : target.appendChild(style);
        };
        this.insertJS = (jsCode, jsUrl, isModule) => {
            const oldTag = document.querySelector(`[jsUrl='${jsUrl}']`);
            oldTag && oldTag.remove();
            const script = document.createElement("script");
            script.type = isModule ? "module" : "text/javascript";
            script.innerHTML = jsCode;
            script.setAttribute("jsUrl", jsUrl);
            const head = document.getElementsByTagName("head")[0];
            (head || document.body).appendChild(script);
        };
        this.addLibrary = async (url) => {
            const arr = Array.isArray(url) ? url : [url];
            let urls = arr.map((url) => {
                if (typeof url === "string") {
                    const type = url.split(".").pop();
                    return { url, type: (type.toLowerCase() === "css") ? "css" : "jsLibrary" };
                }
                else {
                    return url;
                }
            }).filter((obj) => !this._navimiJSs.isJsLoaded(obj.url));
            urls.length > 0 && await Promise.all(urls.map(obj => {
                if (obj.type.toLowerCase() === "css") {
                    this._navimiCSSs.fetchCss(undefined, obj.url, true);
                }
                else {
                    const type = obj.type.toLowerCase().indexOf("module") >= 0 ? "module" : "library";
                    return this._navimiJSs.fetchJS(undefined, [obj.url], type);
                }
            })).catch(ex => {
                throw new Error(ex);
            });
        };
    }
    init(navimiCSSs, navimiJSs) {
        this._navimiCSSs = navimiCSSs;
        this._navimiJSs = navimiJSs;
    }
}
class __Navimi_Fetch {
    constructor() {
        this.loadErrors = {};
        this.init = (options, fetch) => {
            this._bustCache = options.bustCache;
            this._fetch = fetch;
        };
        this.getErrors = (url) => {
            return this.loadErrors[url];
        };
        this.fetchFile = (url, options) => {
            return new Promise((resolve, reject) => {
                delete this.loadErrors[url];
                const requestUrl = url + (this._bustCache ? '?v=' + this._bustCache : '');
                //todo: add retry with options
                (this._fetch || fetch)(requestUrl, options)
                    .then(async (data) => {
                    if (!data || !data.ok) {
                        const error = `Could not load the file! - ${url}`;
                        this.loadErrors[url] = error;
                        return reject(error);
                    }
                    resolve(await data.text());
                })
                    .catch(ex => {
                    this.loadErrors[url] = ex.message;
                    reject(ex);
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
            path = queryPos >= 0 ? path.substr(0, queryPos) : path;
            return path.split("/").filter(p => p.length > 0);
        };
        this.parsePath = (urlPath, urlPattern) => {
            const queryPos = urlPath.indexOf("?");
            const query = queryPos > 0 ? urlPath.substr(queryPos + 1, urlPath.length) : "";
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
        this.isSameFile = (path1, path2) => {
            return path1 && path2 && path1.split("?").shift().toLowerCase() ==
                path2.split("?").shift().toLowerCase();
        };
        this.timeout = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        this.debounce = (task, ms) => {
            let timeout;
            return function () {
                const func = () => {
                    timeout = null;
                    task.apply(this, arguments);
                };
                clearTimeout(timeout);
                timeout = setTimeout(func, ms);
            };
        };
        this.getUrl = () => {
            const location = document.location;
            const matches = location.toString().match(/^[^#]*(#.+)$/);
            const hash = matches ? matches[1] : "";
            return [location.pathname, location.search, hash].join("");
        };
        this.removeHash = (url) => {
            const hashPos = url.indexOf("#");
            return hashPos > 0 ? url.substr(0, hashPos) : url;
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
        this.openHotWs = (hotOption, callback) => {
            if (__NAVIMI_DEV) {
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
                            const json = JSON.parse(e.data || "");
                            if (json.message) {
                                console.warn(json.message);
                                return;
                            }
                            if (json.filePath) {
                                callback((globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute) => {
                                    this._digestHot(json, globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute);
                                });
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
            }
        };
        this._digestHot = (payload, globalCssUrl, globalTemplatesUrl, currentJs, routesList, initRoute) => {
            if (__NAVIMI_DEV) {
                try {
                    const filePath = payload.filePath.replace(/\\/g, "/");
                    const fileType = filePath.split(".").pop();
                    const data = payload.data;
                    switch (fileType) {
                        case "css":
                            this._navimiCSSs.reloadCss(filePath, data, routesList, currentJs, globalCssUrl);
                            break;
                        case "html":
                        case "htm":
                            this._navimiTemplates.reloadTemplate(filePath, data, routesList, currentJs, globalTemplatesUrl, () => {
                                initRoute();
                            });
                            break;
                        case "js":
                            this._navimiJSs.reloadJs(filePath, data, routesList, currentJs, () => {
                                initRoute();
                            });
                            break;
                        case "gif":
                        case "jpg":
                        case "jpeg":
                        case "png":
                        case "svg":
                            initRoute();
                            break;
                    }
                }
                catch (ex) {
                    console.error("Could not digest HOT payload: ", ex);
                }
            }
        };
    }
    init(navimiCSSs, navimiJSs, navimiTemplates) {
        this._navimiCSSs = navimiCSSs;
        this._navimiJSs = navimiJSs;
        this._navimiTemplates = navimiTemplates;
    }
}
class __Navimi_JSs {
    constructor() {
        this._navimiLoaderNS = "__navimiLoader";
        this._callBackNS = "_jsLoaderCallback";
        this._promiseNS = "_promise_";
        this._loadedJSs = {};
        this._routesJSs = {};
        this._othersJSs = {};
        this._dependencyJSsMap = {};
        this._routesJSsServices = {};
        this._awaitJS = (jsUrl) => {
            return new Promise((resolve, reject) => {
                const loadInterval = setInterval(() => {
                    if (this._routesJSs[jsUrl]) {
                        clearInterval(loadInterval);
                        return resolve(this._routesJSs[jsUrl]);
                    }
                    if (this._navimiLoader[this._promiseNS + jsUrl] === undefined) {
                        clearInterval(loadInterval);
                        return reject(`Error loading file! ${jsUrl}`);
                    }
                }, 50);
            });
        };
        this._fetch = (abortController, url, type) => {
            return new Promise(async (resolve, reject) => {
                try {
                    let jsCode;
                    if (this._loadedJSs[url]) {
                        jsCode = this._loadedJSs[url];
                    }
                    else {
                        jsCode = await this._navimiFetch.fetchFile(url, {
                            headers: {
                                Accept: "application/javascript"
                            },
                            signal: abortController ? abortController.signal : undefined
                        });
                    }
                    this._insertJS(url, jsCode, type);
                    if (type !== "route" && type !== "service") {
                        this._navimiLoader[this._promiseNS + url](true); // resolve the promise - script is loaded
                    }
                    resolve();
                }
                catch (ex) {
                    reject(ex);
                }
            });
        };
        this._insertJS = (url, jsCode, type) => {
            let jsHtmlBody = (type === "module" || type === "library") ? jsCode :
                `(function(){window.${this._navimiLoaderNS}.${this._callBackNS}("${url}", "${type}", (function(){return ${jsCode}   
                })())}())`;
            this._loadedJSs[url] = jsCode;
            this._navimiDom.insertJS(jsHtmlBody, url, type === "module");
        };
        this._instantiateJS = async (jsUrl, type, JsClass) => {
            const promiseToResolve = this._navimiLoader[this._promiseNS + jsUrl];
            const promiseToReject = this._navimiLoader[this._promiseNS + jsUrl + "_reject"];
            // remove callbacks
            setTimeout(() => {
                delete this._navimiLoader[this._promiseNS + jsUrl];
                delete this._navimiLoader[this._promiseNS + jsUrl + "_reject"];
            }, 10);
            if (type !== "route") {
                // keep this instance to reuse later
                this._othersJSs[jsUrl] = JsClass;
                promiseToResolve && promiseToResolve(Object.freeze(JsClass));
                return;
            }
            try {
                this._navimiState.unwatchState(jsUrl);
                const routerFunctions = {
                    addLibrary: this._navimiDom.addLibrary,
                    setTitle: this._navimiDom.setTitle,
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
                        return this._navimiTemplates.fetchTemplate(undefined, url, jsUrl);
                    },
                    setState: this._navimiState.setState,
                    getState: this._navimiState.getState,
                    setNavimiLinks: this._navimiDom.setNavimiLinks,
                    unwatchState: (key) => this._navimiState.unwatchState(jsUrl, key),
                    watchState: (key, callback) => this._navimiState.watchState(jsUrl, key, callback),
                };
                let services = {};
                // wait for all services to load
                if (this._routesJSsServices[jsUrl] && this._routesJSsServices[jsUrl].length > 0) {
                    while (true) {
                        if (this._routesJSsServices[jsUrl].map((sn) => this._othersJSs[this._options.services[sn]] === undefined).indexOf(true) === -1) {
                            break;
                        }
                        if (this._routesJSsServices[jsUrl].map(sn => this._options.services[sn]).find(su => this._navimiFetch.getErrors(su))) {
                            return;
                        }
                        await this._navimiHelpers.timeout(10);
                    }
                    this._routesJSsServices[jsUrl].map((sn) => {
                        services = Object.assign(Object.assign({}, services), { [sn]: this._othersJSs[this._options.services[sn]] });
                    });
                }
                let jsInstance = new JsClass(Object.freeze(routerFunctions), services);
                //keep this instance to reuse later
                this._routesJSs[jsUrl] = jsInstance;
                promiseToResolve && promiseToResolve(jsInstance);
            }
            catch (error) {
                promiseToReject && promiseToReject(error);
            }
        };
        this.isJsLoaded = (url) => {
            return this._loadedJSs[url] !== undefined;
        };
        this.getInstance = (url) => {
            return this._routesJSs[url];
        };
        this.fetchJS = (abortController, urls, type) => {
            const init = (url) => {
                return new Promise(async (resolve, reject) => {
                    // return the instance if this js is already loaded
                    if (type !== "route" && this._othersJSs[url]) {
                        return resolve(this._othersJSs[url]);
                    }
                    else {
                        if (this._routesJSs[url]) {
                            return resolve(this._routesJSs[url]);
                        }
                    }
                    // route repeated calls to an awaiter
                    if (this._navimiLoader[this._promiseNS + url]) {
                        await this._awaitJS(url)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }
                    // let the js resolve the promise itself (*1)
                    this._navimiLoader[this._promiseNS + url] = resolve;
                    this._navimiLoader[this._promiseNS + url + "_reject"] = reject;
                    this._fetch(abortController, url, type).catch(ex => {
                        this._navimiLoader[this._promiseNS + url + "_reject"](ex);
                    });
                });
            };
            return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
        };
        this.loadServices = (abortController, jsUrl, services) => {
            if (!jsUrl || !services || services.length === 0) {
                return;
            }
            this._routesJSsServices[jsUrl] = this._routesJSsServices[jsUrl] || [];
            if (services && services.length > 0) {
                let notFoundServices = [];
                const servicesUrls = services.map(sn => {
                    const su = this._options.services && this._options.services[sn];
                    if (su === undefined) {
                        notFoundServices.push(sn);
                    }
                    else {
                        this._routesJSsServices[jsUrl].indexOf(sn) === -1 && this._routesJSsServices[jsUrl].push(sn);
                        this._dependencyJSsMap[su] = Object.assign(Object.assign({}, this._dependencyJSsMap[su] || {}), { [jsUrl]: true });
                    }
                    return su;
                });
                if (notFoundServices.length > 0) {
                    throw new Error("Service(s) not defined: " + notFoundServices.join(", "));
                }
                Promise.all(servicesUrls.filter(su => su !== undefined)
                    .map(su => this.fetchJS(abortController, [su], "service")));
            }
        };
        this.initJS = async (jsUrl, params) => {
            const jsInstance = this.getInstance(jsUrl);
            jsInstance && jsInstance.init &&
                await jsInstance.init(params);
        };
        this.reloadJs = (filePath, jsCode, routeList, currentJS, callback) => {
            if (__NAVIMI_DEV) {
                const isSameFile = this._navimiHelpers.isSameFile;
                for (const routeUrl in routeList) {
                    const { jsUrl } = routeList[routeUrl];
                    if (isSameFile(jsUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        delete this._routesJSs[jsUrl];
                        this._navimiLoader[this._promiseNS + jsUrl] = () => {
                            if (jsUrl === currentJS) {
                                //reload route if current JS is updated
                                callback();
                            }
                        };
                        this._insertJS(jsUrl, jsCode, "route");
                        return;
                    }
                }
                for (const jsUrl in this._dependencyJSsMap) {
                    if (isSameFile(jsUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        delete this._othersJSs[jsUrl];
                        this._navimiLoader[this._promiseNS + jsUrl] = () => {
                            Object.keys(this._dependencyJSsMap[jsUrl]).map(s => {
                                //clear all dependent JSs that depends of this JS
                                delete this._routesJSs[s];
                                if (s === currentJS) {
                                    //reload route if current JS is updated
                                    callback();
                                }
                            });
                        };
                        //todo: check for modules, services and components
                        this._insertJS(filePath, jsCode, "javascript");
                    }
                }
            }
        };
    }
    init(navimiDom, navimiFetch, navimiTemplates, navimiState, navimiHelpers, options) {
        this._navimiDom = navimiDom;
        this._navimiFetch = navimiFetch;
        this._navimiTemplates = navimiTemplates;
        this._navimiState = navimiState;
        this._navimiHelpers = navimiHelpers;
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
                if (__NAVIMI_DEV) {
                    if (index === prevIndex) {
                        console.warn('next() called multiple times');
                    }
                }
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
        const navimiDom = (_b = services === null || services === void 0 ? void 0 : services.navimiDom) !== null && _b !== void 0 ? _b : new __Navimi_Dom();
        const navimiCSSs = (_c = services === null || services === void 0 ? void 0 : services.navimiCSSs) !== null && _c !== void 0 ? _c : new __Navimi_CSSs();
        const navimiJSs = (_d = services === null || services === void 0 ? void 0 : services.navimiJSs) !== null && _d !== void 0 ? _d : new __Navimi_JSs();
        const navimiTemplates = (_e = services === null || services === void 0 ? void 0 : services.navimiTemplates) !== null && _e !== void 0 ? _e : new __Navimi_Templates();
        const navimiMiddlewares = (_f = services === null || services === void 0 ? void 0 : services.navimiMiddlewares) !== null && _f !== void 0 ? _f : new __Navimi_Middlewares();
        const navimiState = (_g = services === null || services === void 0 ? void 0 : services.navimiState) !== null && _g !== void 0 ? _g : new __Navimi_State();
        const navimiHot = (_h = services === null || services === void 0 ? void 0 : services.navimiHot) !== null && _h !== void 0 ? _h : new __Navimi_Hot();
        const navimiHelpers = (_j = services === null || services === void 0 ? void 0 : services.navimiHelpers) !== null && _j !== void 0 ? _j : new __Navimi_Helpers();
        // setup DI
        navimiFetch.init(options);
        navimiCSSs.init(navimiDom, navimiFetch, navimiHelpers);
        navimiDom.init(navimiCSSs, navimiJSs);
        navimiJSs.init(navimiDom, navimiFetch, navimiTemplates, navimiState, navimiHelpers, options);
        navimiTemplates.init(navimiFetch, navimiHelpers);
        navimiState.init(navimiHelpers);
        if (__NAVIMI_DEV) {
            navimiHot.init(navimiCSSs, navimiJSs, navimiTemplates);
        }
        const _services = {
            navimiFetch,
            navimiJSs,
            navimiCSSs,
            navimiDom,
            navimiTemplates,
            navimiMiddlewares,
            navimiState,
            navimiHot,
            navimiHelpers
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
                Object.keys(this.stateWatchers[key]).map((cs) => {
                    const sNew = this.getState(key);
                    this.stateWatchers[key][cs] &&
                        this.stateWatchers[key][cs].map((cb) => cb && cb(sNew));
                });
            });
        }, 10);
    }
}
class __Navimi_Templates {
    constructor() {
        this._templatesCache = {};
        this._loadedTemplates = {};
        this._dependencyTemplatesMap = {};
        this.loadTemplate = (templateCode, url) => {
            const regIni = new RegExp("<t ([^>]+)>");
            const regEnd = new RegExp("</t>");
            const regId = new RegExp("id=(\"[^\"]+\"|\'[^\']+\')");
            let tempCode = templateCode;
            if (!regIni.exec(tempCode)) {
                this._templatesCache[url] = tempCode;
                return;
            }
            while (templateCode && templateCode.length > 0) {
                const iniTemplate = regIni.exec(tempCode);
                if (!iniTemplate || iniTemplate.length === 0) {
                    break;
                }
                const regIdRes = regId.exec(iniTemplate[1]);
                const idTemplate = regIdRes.length > 0 && regIdRes[1].slice(1, -1);
                tempCode = tempCode.substr(iniTemplate.index + iniTemplate[0].length);
                const endTemplate = regEnd.exec(tempCode);
                if (!idTemplate || !endTemplate || endTemplate.length === 0) {
                    break;
                }
                this._templatesCache[idTemplate] = tempCode.substr(0, endTemplate.index);
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
        this.fetchTemplate = (abortController, url, jsUrl) => {
            const init = (url) => {
                return new Promise(async (resolve, reject) => {
                    if (!url || this._loadedTemplates[url]) {
                        return resolve();
                    }
                    try {
                        const templateCode = await this._navimiFetch.fetchFile(url, {
                            headers: {
                                Accept: "text/html"
                            },
                            signal: abortController ? abortController.signal : undefined
                        });
                        this.loadTemplate(templateCode, url);
                        this._loadedTemplates[url] = true;
                        resolve();
                    }
                    catch (ex) {
                        reject(ex);
                    }
                });
            };
            const urls = Array.isArray(url) ? url : [url];
            if (jsUrl) {
                urls.map((u) => {
                    this._dependencyTemplatesMap[u] = Object.assign(Object.assign({}, this._dependencyTemplatesMap[u] || {}), { [jsUrl]: true });
                });
            }
            return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
        };
        this.reloadTemplate = (filePath, templateCode, routeList, currentJS, globalTemplatesUrl, callback) => {
            if (__NAVIMI_DEV) {
                const isSameFile = this._navimiHelpers.isSameFile;
                if (isSameFile(globalTemplatesUrl, filePath)) {
                    console.log(`${filePath} updated.`);
                    this.loadTemplate(templateCode, globalTemplatesUrl);
                    callback();
                    return;
                }
                for (const routeUrl in routeList) {
                    const { jsUrl, templatesUrl } = routeList[routeUrl];
                    if (isSameFile(templatesUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        this.loadTemplate(templateCode, templatesUrl);
                        currentJS === jsUrl && callback();
                        return;
                    }
                }
                for (const templatesUrl in this._dependencyTemplatesMap) {
                    if (isSameFile(templatesUrl, filePath)) {
                        console.log(`${filePath} updated.`);
                        this.loadTemplate(templateCode, templatesUrl);
                        Object.keys(this._dependencyTemplatesMap[templatesUrl]).map(s => {
                            if (s === currentJS) {
                                //reload route if current JS is updated
                                callback();
                            }
                        });
                    }
                }
            }
        };
    }
    init(navimiFetch, navimiHelpers) {
        this._navimiFetch = navimiFetch;
        this._navimiHelpers = navimiHelpers;
    }
}
