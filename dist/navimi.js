/**
 * Navimi v0.4.0 
 * Developed by Ivan Valadares
 * ivanvaladares@hotmail.com 
 * https://github.com/ivanvaladares/navimi 
 */ 

var Navimi = (function () {
    'use strict';

    const removeHash = (url) => {
        const hashPos = url.indexOf('#');
        return hashPos > 0 ? url.substring(0, hashPos) : url;
    };

    const getUrl = () => {
        const location = document.location;
        const matches = location.toString().match(/^[^#]*(#.+)$/);
        const hash = matches ? matches[1] : '';
        return [location.pathname, location.search, hash].join('');
    };

    const parseQuery = (queryString) => {
        const query = {};
        queryString.split('&').map(pair => {
            const kv = pair.split('=');
            query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        return query;
    };
    const splitPath = (path) => {
        if (!path) {
            return [];
        }
        const queryPos = path.indexOf('?');
        path = queryPos >= 0 ? path.substring(0, queryPos) : path;
        return path.split('/').filter(p => p.length > 0);
    };
    const parsePath = (urlPath, urlPattern) => {
        const queryPos = urlPath.indexOf('?');
        const query = queryPos > 0 ? urlPath.substring(queryPos + 1, urlPath.length) : '';
        const path = splitPath(urlPath);
        const pattern = splitPath(urlPattern);
        let params = {};
        if (queryPos > 0) {
            params = {
                queryString: parseQuery(query)
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
    const getRouteAndParams = (url, routingList) => {
        const urlParams = splitPath(url);
        const catchAll = routingList['*'];
        let routeItem, params;
        for (const routeUrl in routingList) {
            const routeParams = splitPath(routeUrl);
            if (routeParams.length === urlParams.length) {
                params = parsePath(url, routeUrl);
                if (params) {
                    routeItem = routingList[routeUrl];
                    break;
                }
            }
        }
        if (!routeItem && catchAll) {
            params = parsePath(url, url);
            routeItem = catchAll;
        }
        return { routeItem, params };
    };

    const setTitle = (title) => {
        document.title = title;
    };

    const setNavimiLinks = () => {
        document.querySelectorAll('[navimi-link]').forEach(el => {
            el.removeAttribute('navimi-link');
            el.addEventListener('click', (e) => {
                e.preventDefault();
                window.navigateTo(event.target.pathname);
            });
        });
    };

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
                    const url = removeHash(urlToGo || getUrl());
                    if (!force) {
                        if (this._currentUrl === url) {
                            return;
                        }
                        this._abortController && this._abortController.abort();
                        this._abortController = window['AbortController'] ? new AbortController() : undefined;
                    }
                    const callId = ++this._callId;
                    const pushState = urlToGo !== undefined;
                    const { routeItem, params } = getRouteAndParams(url, this._routesList);
                    const routeParams = Object.assign({ url,
                        routeItem,
                        params }, (navParams ? navParams : {}));
                    if (!force) {
                        if (this._options.onBeforeRoute) {
                            const shouldContinue = await this._options.onBeforeRoute(routeParams, this._navigateTo);
                            if (shouldContinue === false) {
                                return;
                            }
                        }
                        if (this._currentJSUrl) {
                            const currentRoute = this._navimiJSs.getInstance(this._currentJSUrl);
                            if (currentRoute) {
                                const onBeforeLeave = currentRoute.onBeforeLeave;
                                if (onBeforeLeave) {
                                    const shouldContinue = onBeforeLeave(routeParams);
                                    if (shouldContinue === false) {
                                        if (!pushState) {
                                            history.forward();
                                        }
                                        return;
                                    }
                                }
                                currentRoute.onLeave && currentRoute.onLeave();
                            }
                        }
                    }
                    if (!routeItem) {
                        callId === this._callId && this._reportError(new Error('No route match for url: ' + url));
                        return;
                    }
                    await this._navimiMiddlewares.executeMiddlewares(this._abortController, routeParams, (url, params) => {
                        this._initRoute(url, params, true);
                    }).catch(this._reportError);
                    if (callId < this._callId) {
                        //removeIf(minify)
                        console.warn('Navimi: A middleware has exited or errored.');
                        //endRemoveIf(minify)
                        return;
                    }
                    this._currentUrl = url;
                    const { title, jsUrl, cssUrl, templatesUrl, services, components } = routeItem || {};
                    if (!jsUrl && !templatesUrl) {
                        throw new Error('The route must define the \'jsUrl\' or \'templatesUrl\'!');
                    }
                    if (jsUrl) {
                        this._currentJSUrl = jsUrl;
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
                        this._navimiJSs.loadServices(this._abortController, jsUrl || url, services),
                        this._navimiJSs.loadComponents(this._abortController, jsUrl || url, components),
                        this._navimiCSSs.fetchCss(this._abortController, cssUrl),
                        this._navimiTemplates.fetchTemplate(this._abortController, templatesUrl),
                        (jsUrl && this._navimiJSs.fetchJS(this._abortController, [jsUrl], 'route'))
                    ]).catch(this._reportError);
                    //wait global css and template to load, if any
                    await this._waitForAssets(callId);
                    setTitle(title);
                    if (!this._globalCssInserted) {
                        this._globalCssInserted = true;
                        this._navimiCSSs.insertCss(this._options.globalCssUrl, 'globalCss');
                    }
                    if (jsUrl) {
                        await this._navimiJSs.initRoute(jsUrl, this._routesParams[jsUrl]);
                    }
                    else {
                        const template = this._navimiTemplates.getTemplate(templatesUrl);
                        const body = document.querySelector('body');
                        if (template && body) {
                            body.innerHTML = template;
                        }
                    }
                    if (callId === this._callId) {
                        setNavimiLinks();
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
            this._abortController = window['AbortController'] ? new AbortController() : undefined;
            this._currentJSUrl;
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
                return Promise.all([
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
                    //todo: add retry with options
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

    class __Navimi_CSSs {
        constructor() {
            this._loadedCsss = {};
            this._cssRulesCache = {};
            this._cssCount = 0;
            this._atomicCssId = '__navimi__cssInJs__';
            this._replaceCss = (cssCode, url) => {
                const oldTag = document.querySelector(`[cssUrl='${url}']`);
                if (!oldTag) {
                    return;
                }
                oldTag.innerHTML = cssCode;
            };
            this._insertCssRule = ({ className, child, media, cssRule }) => {
                if (!this._cssSheet) {
                    const style = document.querySelector(`style[id=${this._atomicCssId}]`);
                    // @ts-ignore
                    this._cssSheet = style.sheet;
                }
                const rule = `.${`${className}${child}`}{${cssRule.join(';')}}`;
                this._cssSheet.insertRule(media ? `${media}{${rule}}` : rule, this._cssSheet.cssRules.length);
            };
            this._addCssToDom = (cssCode, prepend, props) => {
                if (!document)
                    return;
                const style = document.createElement('style');
                style.innerHTML = cssCode;
                props && Object.entries(props).forEach(([key, value]) => {
                    style.setAttribute(key, value);
                });
                const head = document.getElementsByTagName('head')[0];
                const target = (head || document.body);
                prepend ? target.insertBefore(style, target.firstChild) : target.appendChild(style);
            };
            this._parseCssRules = (obj, child = '', media = '') => {
                return Object.entries(obj).reduce((rules, [key, value]) => {
                    if (value && typeof value === 'object') {
                        const _media = /^@/.test(key) ? key : null;
                        const _child = _media ? child : child + key.replace(/&/g, '');
                        return rules.concat(this._parseCssRules(value, _child, _media || media));
                    }
                    return rules.concat({ media, child, cssRule: [`${key}:${value}`] });
                }, []);
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
                        Accept: 'text/css'
                    },
                    signal: abortController ? abortController.signal : undefined
                }).then(cssCode => {
                    this._loadedCsss[url] = cssCode;
                });
            };
            this.insertCss = (url, type, prepend) => {
                if (type === 'routeCss') {
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
                this._addCssToDom(cssCode, prepend, { cssUrl: url, cssType: type });
            };
            this.style = (...styles) => {
                return styles.map(style => this._parseCssRules(style).map(rule => {
                    const cacheKey = JSON.stringify(rule);
                    if (this._cssRulesCache[cacheKey]) {
                        return this._cssRulesCache[cacheKey];
                    }
                    const className = `__navimi_${this._cssCount++}`;
                    this._insertCssRule(Object.assign(Object.assign({}, rule), { className }));
                    this._cssRulesCache[cacheKey] = className;
                    return className;
                }).join(' ')).join('');
            };
            //removeIf(minify)
            this.digestHot = ({ filePath, data }) => {
                if (!this.isCssLoaded(filePath)) {
                    return Promise.reject();
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
            this._addCssToDom('', true, { id: this._atomicCssId });
        }
    }

    class __Navimi_JSs {
        constructor() {
            this._navimiLoaderNS = '__navimiLoader';
            this._callBackNS = '_jsLoaderCallback';
            this._promiseNS = '_promise_';
            this._loadedJSs = {};
            this._jsType = {};
            this._jsInstances = {};
            this._jsDepMap = {};
            this._servicesList = {};
            this._uidCounter = 0;
            this._resolvePromise = (value, jsUrl) => {
                this._navimiLoader[this._promiseNS + jsUrl](value);
            };
            this._rejectPromise = (reason, jsUrl) => {
                this._navimiLoader[this._promiseNS + jsUrl + '_reject'](reason);
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
                            return resolve('');
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
                        if (typeof lib === 'string') {
                            const type = lib.split('.').pop();
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
                        if (type === 'css') {
                            return this._navimiCSSs.fetchCss(undefined, obj.url).then(() => {
                                return this._navimiCSSs.insertCss(obj.url, 'library', true);
                            });
                        }
                        else {
                            return this.fetchJS(undefined, [obj.url], type === 'module' ? 'module' : 'library');
                        }
                    })).catch(ex => {
                        throw new Error(ex);
                    });
                }
            };
            this._fetch = async (abortController, url, type) => {
                let jsCode = '';
                if (this._loadedJSs[url]) {
                    jsCode = this._loadedJSs[url];
                }
                else {
                    jsCode = await this._navimiFetch.fetchFile(url, {
                        headers: {
                            Accept: 'application/javascript'
                        },
                        signal: abortController ? abortController.signal : undefined
                    });
                }
                this._jsType[url] = type;
                this._insertJS(url, jsCode.replace(/^\s+|\s+$/g, ''), type);
            };
            this._insertJS = (url, jsCode, type) => {
                const jsHtmlBody = (type === 'module' || type === 'library') ? jsCode :
                    `((loader, url, type) => { loader(url, type, (() => { return ${jsCode}
})())})(${this._navimiLoaderNS}.${this._callBackNS}, "${url}", "${type}")`;
                this._loadedJSs[url] = jsCode;
                const oldTag = document.querySelector(`[jsUrl='${url}']`);
                if (oldTag) {
                    oldTag.remove();
                }
                const script = document.createElement('script');
                script.type = type === 'module' ? 'module' : 'text/javascript';
                script.innerHTML = jsHtmlBody;
                script.setAttribute('jsUrl', url);
                const head = document.getElementsByTagName('head')[0];
                (head || document.body).appendChild(script);
                if (type === 'module' || type === 'library') {
                    this._resolvePromise(true, url); // resolve the promise - script is loaded
                }
            };
            this._getFunctions = (callerUid, jsUrl) => {
                return Object.freeze({
                    addLibrary: this._addLibrary,
                    setTitle,
                    navigateTo: window.navigateTo,
                    getTemplate: this._navimiTemplates.getTemplate,
                    fetchJS: (url) => {
                        const urls = Array.isArray(url) ? url : [url];
                        urls.map(u => {
                            this._jsDepMap[u] = Object.assign(Object.assign({}, this._jsDepMap[u] || {}), { [jsUrl]: true });
                        });
                        return this.fetchJS(undefined, urls, 'javascript');
                    },
                    fetchTemplate: (url) => {
                        return this._navimiTemplates.fetchTemplate(undefined, url);
                    },
                    style: this._navimiCSSs.style,
                    setState: this._navimiState.setState,
                    getState: this._navimiState.getState,
                    setNavimiLinks,
                    unwatchState: (key) => this._navimiState.unwatchState(callerUid, key),
                    watchState: (key, callback) => this._navimiState.watchState(callerUid, key, callback)
                });
            };
            this._getServices = async (jsUrl, JsClass) => {
                var _a;
                if (Array.isArray(JsClass)) {
                    //add all other elements are expected to be services names
                    const services = JsClass.filter(s => typeof s === 'string');
                    if (services.length > 0) {
                        this.loadServices(undefined, jsUrl, services);
                    }
                }
                //wait for all dependencies to load
                const dependencies = [];
                for (const deps in this._jsDepMap) {
                    if (this._jsDepMap[deps][jsUrl]) {
                        dependencies.push(deps);
                    }
                }
                await Promise.all(dependencies.map(this._awaitJS));
                //gather required services
                let services = {};
                (_a = this._servicesList[jsUrl]) === null || _a === void 0 ? void 0 : _a.map((serviceName) => {
                    services = Object.assign(Object.assign({}, services), { [serviceName]: this._jsInstances[this._options.services[serviceName]] });
                });
                return Object.freeze(services);
            };
            this._getClassAndServices = async (jsUrl, JsClass) => {
                let finalClass = JsClass;
                if (Array.isArray(JsClass)) {
                    // the last element is expected to be the component class
                    finalClass = JsClass.pop();
                }
                const services = await this._getServices(jsUrl, JsClass);
                return { JsClass: finalClass, services };
            };
            this._buildRoute = async (jsUrl, JsClass) => {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const jss = this;
                const { JsClass: routeClass, services } = await this._getClassAndServices(jsUrl, JsClass);
                const uid = `route:${++this._uidCounter}`;
                const route = class extends (routeClass) {
                    constructor() {
                        const functions = jss._getFunctions(uid, jsUrl);
                        super(functions, services);
                    }
                    onEnter(params) {
                        if (super.onEnter) {
                            super.onEnter(params);
                        }
                    }
                    onBeforeLeave(params) {
                        if (super.onBeforeLeave) {
                            return super.onBeforeLeave(params);
                        }
                        return true;
                    }
                    onLeave() {
                        if (super.onLeave) {
                            super.onLeave();
                        }
                    }
                    destroy() {
                        jss._navimiState.unwatchState(uid);
                        if (super.destroy) {
                            super.destroy();
                        }
                    }
                };
                return new route();
            };
            this._buildComponentClass = async (jsUrl, JsClass) => {
                const componentName = Object.keys(this._options.components)
                    .find((name) => this._options.components[name] === jsUrl);
                if (!componentName || !/-/.test(componentName)) {
                    return;
                }
                const { JsClass: componentClass, services } = await this._getClassAndServices(jsUrl, JsClass);
                return this._navimiComponents.registerComponent(componentName, componentClass, (callerUid) => {
                    return this._getFunctions(callerUid, jsUrl);
                }, services);
            };
            this._instantiateJS = async (jsUrl, type, JsCode) => {
                try {
                    if (type === 'route' || type === 'component') {
                        const instance = type === 'route' ?
                            await this._buildRoute(jsUrl, JsCode) :
                            await this._buildComponentClass(jsUrl, JsCode);
                        //keep this instance to reuse later -- component = class / route = object
                        this._jsInstances[jsUrl] = instance;
                        return this._resolvePromise(instance, jsUrl);
                    }
                    // for services and javascripts
                    this._jsInstances[jsUrl] = JsCode;
                    return this._resolvePromise(JsCode, jsUrl);
                }
                catch (error) {
                    this._rejectPromise(error, jsUrl);
                }
            };
            this._isJsLoading = (jsUrl) => {
                return this._navimiLoader[this._promiseNS + jsUrl] !== undefined &&
                    !this._navimiFetch.getErrors(jsUrl);
            };
            this._checkDepsUrls = (jsUrl, depArray, type) => {
                const notFound = [];
                if (!this._servicesList[jsUrl]) {
                    this._servicesList[jsUrl] = [];
                }
                const urls = (depArray || []).map(name => {
                    //@ts-ignore
                    const url = this._options[type] && this._options[type][name];
                    if (url === undefined) {
                        notFound.push(name);
                    }
                    else {
                        type === 'services' &&
                            this._servicesList[jsUrl].indexOf(name) === -1 &&
                            this._servicesList[jsUrl].push(name);
                        this._jsDepMap[url] = Object.assign(Object.assign({}, this._jsDepMap[url] || {}), { [jsUrl]: true });
                    }
                    return url;
                });
                if (notFound.length > 0) {
                    throw new Error(type + ' not defined: ' + notFound.join(', '));
                }
                return urls;
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
                        // let the js resolve the promise itself when it loads (in _insertJS or _instantiateJS)
                        this._navimiLoader[this._promiseNS + url] = resolve;
                        this._navimiLoader[this._promiseNS + url + '_reject'] = reject;
                        this._fetch(abortController, url, type).catch(reject);
                    });
                };
                return urls.length > 1 ? Promise.all(urls.map(init)) : init(urls[0]);
            };
            this.loadServices = (abortController, jsUrl, services) => {
                if (!jsUrl) {
                    return;
                }
                const servicesUrls = this._checkDepsUrls(jsUrl, services, 'services');
                const promises = servicesUrls.filter(url => url !== undefined)
                    .map(url => this.fetchJS(abortController, [url], 'service'));
                return Promise.all(promises);
            };
            this.loadComponents = (abortController, jsUrl, components) => {
                if (!jsUrl) {
                    return;
                }
                const componentsUrls = this._checkDepsUrls(jsUrl, components, 'components');
                const promises = componentsUrls.filter(url => url !== undefined)
                    .map(url => this.fetchJS(abortController, [url], 'component'));
                return Promise.all(promises);
            };
            this.initRoute = async (jsUrl, params) => {
                const jsInstance = this.getInstance(jsUrl);
                jsInstance && jsInstance.onEnter &&
                    await jsInstance.onEnter(params);
            };
            //removeIf(minify)
            this.digestHot = async ({ filePath, data }) => {
                const destroyed = [];
                const destroyDependencies = (url) => {
                    for (const jsUrl in this._jsDepMap[url]) {
                        if (destroyed.indexOf(jsUrl) === -1) {
                            destroyDependencies(jsUrl);
                        }
                    }
                    destroyed.indexOf(url) === -1 && destroyed.push(url);
                    const instance = this.getInstance(url);
                    instance && instance.destroy && instance.destroy();
                    delete this._navimiLoader[this._promiseNS + url];
                    delete this._jsInstances[url];
                };
                if (!this.isJsLoaded(filePath)) {
                    return Promise.reject();
                }
                const type = this._jsType[filePath];
                //destroy all instances
                if (type === 'library' || type === 'module') {
                    for (const jsUrl in this._jsDepMap) {
                        destroyDependencies(jsUrl);
                    }
                    for (const jsUrl in this._jsInstances) {
                        destroyDependencies(jsUrl);
                    }
                }
                else {
                    destroyDependencies(filePath);
                }
                return new Promise((resolve) => {
                    this._navimiLoader[this._promiseNS + filePath] = resolve;
                    this._insertJS(filePath, data.replace(/^\s+|\s+$/g, ''), type);
                    console.log(`${filePath} updated.`);
                });
            };
            //endRemoveIf(minify)
        }
        init(navimiFetch, navimiCSSs, navimiTemplates, navimiState, navimiComponents, options) {
            this._navimiFetch = navimiFetch;
            this._navimiCSSs = navimiCSSs;
            this._navimiTemplates = navimiTemplates;
            this._navimiState = navimiState;
            this._navimiComponents = navimiComponents;
            this._options = options;
            this._uidCounter = 0;
            // @ts-ignore
            this._navimiLoader = window[this._navimiLoaderNS] = {
                [this._callBackNS]: this._instantiateJS, // initialize JS loader namespace
            };
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
                            Accept: 'text/html'
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
                    return Promise.reject();
                }
                this.loadTemplate(data, filePath);
                console.log(`${filePath} updated.`);
                return Promise.resolve();
            };
            //endRemoveIf(minify)
        }
        init(navimiFetch) {
            this._navimiFetch = navimiFetch;
            this._regIni = new RegExp('<t ([^>]+)>');
            this._regEnd = new RegExp('</t>');
            this._regId = new RegExp('id=("[^"]+"|\'[^\']+\')');
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

    const cloneObject = (obj, clonedObjects = new Map()) => {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Error) {
            return Object.assign(new Error(obj.message), { stack: obj.stack });
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (Array.isArray(obj)) {
            const clonedArray = obj.map((item) => cloneObject(item, clonedObjects));
            clonedObjects.set(obj, clonedArray);
            return clonedArray;
        }
        if (clonedObjects.has(obj)) {
            return clonedObjects.get(obj);
        }
        const clonedObj = Object.create(Object.getPrototypeOf(obj));
        clonedObjects.set(obj, clonedObj);
        for (const [key, value] of Object.entries(obj)) {
            clonedObj[key] = cloneObject(value, clonedObjects);
        }
        return clonedObj;
    };

    const debounce = (task, wait) => {
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

    const stringify = (obj) => {
        const visited = new Map();
        let index = 0;
        const iterateObject = (obj) => {
            if (typeof obj === 'function') {
                return String(obj);
            }
            if (obj instanceof Error) {
                return obj.message;
            }
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            if (visited.has(obj)) {
                return `[Circular: ${visited.get(obj)}]`;
            }
            visited.set(obj, index++);
            if (Array.isArray(obj)) {
                const aResult = obj.map(iterateObject);
                visited.delete(obj);
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
            visited.delete(obj);
            return result;
        };
        return JSON.stringify(iterateObject(obj));
    };

    class __Navimi_State {
        constructor() {
            this._state = {};
            this._stateWatchers = {};
            this._prevState = {};
            this._stateDiff = {};
            this._getStateDiff = (keys) => {
                //start with longer keys to go deep first
                keys.sort((a, b) => b.length - a.length).map(key => {
                    if (!this._stateDiff[key]) {
                        const sOld = stringify(this.getState(key, this._prevState) || '');
                        const sNew = stringify(this.getState(key, this._state) || '');
                        if (sOld !== sNew) {
                            this._stateDiff[key] = true;
                            //set upper keys as changed so we don't test them again
                            keys.map(upperKey => {
                                if (key !== upperKey && key.indexOf(upperKey) === 0) {
                                    this._stateDiff[upperKey] = true;
                                }
                            });
                        }
                    }
                });
            };
            this._mergeState = (state, newState) => {
                if (newState instanceof Error) {
                    newState = Object.assign(Object.assign({}, newState), { message: newState.message, stack: newState.stack });
                }
                const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item) && item !== null;
                if (isObject(state) && isObject(newState)) {
                    for (const key in newState) {
                        if (isObject(newState[key])) {
                            !state[key] && Object.assign(state, { [key]: {} });
                            this._mergeState(state[key], newState[key]);
                        }
                        else {
                            Object.assign(state, { [key]: newState[key] });
                        }
                    }
                }
            };
            this.setState = (newState) => {
                const observedKeys = Object.keys(this._stateWatchers);
                if (observedKeys.length > 0) {
                    this._prevState = cloneObject(this._state);
                }
                this._mergeState(this._state, newState);
                if (observedKeys.length > 0) {
                    this._getStateDiff(observedKeys);
                    this._invokeStateWatchers();
                }
            };
            this.getState = (key, _state) => {
                const state = key ?
                    key.split('.')
                        .reduce((v, k) => (v && v[k]) || undefined, _state || this._state) :
                    _state || this._state;
                return state ? Object.freeze(cloneObject(state)) : undefined;
            };
            this.watchState = (callerUid, key, callback) => {
                if (!key || !callback) {
                    return;
                }
                if (!this._stateWatchers[key]) {
                    this._stateWatchers[key] = {};
                }
                this._stateWatchers[key] = Object.assign(Object.assign({}, this._stateWatchers[key]), { [callerUid]: [
                        ...(this._stateWatchers[key][callerUid] || []),
                        callback
                    ] });
            };
            this.unwatchState = (callerUid, key) => {
                const remove = (key) => {
                    this._stateWatchers[key][callerUid] = undefined;
                    delete this._stateWatchers[key][callerUid];
                    Object.keys(this._stateWatchers[key]).length === 0 &&
                        delete this._stateWatchers[key];
                };
                if (key) {
                    const keys = Array.isArray(key) ? key : [key];
                    keys.map(id => {
                        !this._stateWatchers[id] && (this._stateWatchers[id] = {});
                        remove(id);
                    });
                    return;
                }
                Object.keys(this._stateWatchers).map(remove);
            };
            this.clear = (key) => {
                const keys = Array.isArray(key) ? key : [key ? key : ''];
                keys.map(id => {
                    const state = id ?
                        id.split('.')
                            .reduce((v, k) => (v && v[k]) || undefined, this._state) :
                        this._state;
                    if (state instanceof Object) {
                        Object.keys(state).map(sk => {
                            if (state[sk] instanceof Object &&
                                Object.keys(state[sk]).length > 0) {
                                this.clear((id ? id + '.' : '') + sk);
                            }
                            delete state[sk];
                        });
                    }
                });
            };
        }
        init() {
            // debounce this so we fire in batches
            this._invokeStateWatchers = debounce(() => {
                const keys = Object.keys(this._stateWatchers);
                const diff = Object.keys(this._stateDiff);
                this._stateDiff = {};
                // fire deep keys first
                keys.filter(key => diff.indexOf(key) >= 0).sort((a, b) => b.length - a.length).map(key => {
                    Object.keys(this._stateWatchers[key]).map((jsUrl) => {
                        const state = this.getState(key);
                        this._stateWatchers[key][jsUrl] &&
                            this._stateWatchers[key][jsUrl].map(cb => cb && cb(state));
                    });
                });
            }, 10);
        }
    }

    class __Navimi_Hot {
        constructor() {
            //removeIf(minify)
            this.openHotWs = (hotOption) => {
                try {
                    if (!('WebSocket' in window)) {
                        console.error('Websocket is not supported by your browser!');
                        return;
                    }
                    console.warn('Connecting HOT...');
                    const port = hotOption === true ? 8080 : hotOption;
                    this._wsHotClient = null;
                    this._wsHotClient = new WebSocket(`ws://localhost:${port}`);
                    this._wsHotClient.addEventListener('message', async (e) => {
                        try {
                            const payload = JSON.parse(e.data || '');
                            if (payload.message) {
                                console.warn(payload.message);
                                return;
                            }
                            if (payload.filePath) {
                                await this._digestHot(payload);
                            }
                        }
                        catch (ex) {
                            console.error('Could not parse HOT message:', ex);
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
            //endRemoveIf(minify)
            //removeIf(minify)
            this._digestHot = async (payload) => {
                var _a;
                try {
                    payload.filePath = payload.filePath.replace(/\\/g, '/');
                    const fileType = (_a = payload.filePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase();
                    switch (fileType) {
                        case 'css':
                            await this._navimiCSSs.digestHot(payload)
                                .catch(() => { });
                            break;
                        case 'html':
                        case 'htm':
                            await this._navimiTemplates.digestHot(payload)
                                .then(() => this._initRouteFunc())
                                .catch(() => { });
                            break;
                        case 'js':
                            this._navimiJSs.digestHot(payload)
                                .then(() => this._initRouteFunc())
                                .catch(() => { });
                            break;
                        case 'gif':
                        case 'jpg':
                        case 'jpeg':
                        case 'png':
                        case 'svg':
                            this._initRouteFunc();
                            break;
                    }
                }
                catch (ex) {
                    console.error('Could not digest HOT payload: ', ex);
                }
            };
            //endRemoveIf(minify)
        }
        init(navimiCSSs, navimiJSs, navimiTemplates, initRoute) {
            //removeIf(minify)
            this._navimiCSSs = navimiCSSs;
            this._navimiJSs = navimiJSs;
            this._navimiTemplates = navimiTemplates;
            this._initRouteFunc = initRoute;
            //endRemoveIf(minify)
        }
    }

    const getNodeContent = (node) => {
        if (node.childNodes.length > 0) {
            return null;
        }
        return node.textContent;
    };

    const getNodeType = (node) => {
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                return 'text';
            case Node.COMMENT_NODE:
                return 'comment';
            default:
                return node.tagName.toLowerCase();
        }
    };

    const mergeHtmlElement = (templateNode, documentNode, callback) => {
        // Clear child nodes
        if (documentNode.childNodes.length > 0 && !templateNode.childNodes.length) {
            documentNode.innerHTML = '';
            return;
        }
        // Prepare empty node for next round
        if (!documentNode.childNodes.length && templateNode.childNodes.length) {
            const fragment = document.createDocumentFragment();
            callback(templateNode, fragment);
            documentNode.appendChild(fragment);
            return;
        }
        // Dive deeper into the tree
        if (templateNode.childNodes.length > 0) {
            callback(templateNode, documentNode);
        }
    };

    const syncAttributes = (templateNode, documentNode) => {
        if (templateNode.tagName.toLowerCase() !== documentNode.tagName.toLowerCase()) {
            return;
        }
        const documentNodeAttr = [].slice.call(documentNode.attributes);
        const templateNodeAttr = [].slice.call(templateNode.attributes);
        const update = templateNodeAttr.filter(templateAttr => {
            const documentAttr = documentNodeAttr.find((docAttr) => templateAttr.name === docAttr.name);
            return documentAttr && templateAttr.value !== documentAttr.value;
        });
        const remove = documentNodeAttr.filter((docAttr) => !templateNodeAttr.some((templateAttr) => docAttr.name === templateAttr.name));
        const add = templateNodeAttr.filter((templateAttr) => !documentNodeAttr.some((docAttr) => templateAttr.name === docAttr.name));
        remove.forEach((attr) => {
            documentNode.removeAttribute(attr.name);
        });
        [...update, ...add].forEach(({ name, value }) => {
            documentNode.setAttribute(name, value);
        });
    };

    const throttle = (task, wait, context) => {
        let timeout;
        let lastTime;
        return function (...args) {
            const now = Date.now();
            if (lastTime && now < lastTime + wait) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    lastTime = now;
                    task.apply(context, args);
                }, wait - (now - lastTime));
            }
            else {
                lastTime = now;
                task.apply(context, args);
            }
        };
    };

    class __Navimi_Components {
        constructor() {
            this._components = {};
            this._uidCounter = 0;
            this._removeComponent = (node) => {
                if (node.localName && this._components[node.localName] && node.__wrapper) {
                    node.__wrapper.unmount();
                }
            };
            this._disconnectFromParent = (node) => {
                if (node.parentComponent) {
                    node.parentComponent.childComponents =
                        node.parentComponent.childComponents
                            .filter(child => child !== node);
                }
            };
            this._removeChildComponents = (node) => {
                node.childComponents &&
                    node.childComponents.map(child => {
                        this._removeComponent(child);
                    });
            };
            this._readAttributes = (node) => {
                const prevAttributes = node.props;
                node.props = {};
                [].slice.call(node.attributes).map((attr) => {
                    const name = attr.name;
                    //@ts-ignore
                    if (typeof node[name] !== 'function') {
                        node.props = Object.assign(Object.assign({}, node.props || {}), { [name]: attr.value });
                    }
                });
                return prevAttributes;
            };
            this._traverseComponentsTree = (node, callback) => {
                if (node.localName) {
                    if (this._components[node.localName]) {
                        callback(node);
                    }
                    else {
                        [].slice.call(node.childNodes).map((childNode) => {
                            this._traverseComponentsTree(childNode, callback);
                        });
                    }
                }
            };
            this._registerTag = (node, parentNode) => {
                if (node.props || !this._components[node.localName]) {
                    return;
                }
                const componentClass = this._components[node.localName];
                // initializes the component props
                node.props = {};
                node.parentComponent = undefined;
                node.childComponents = [];
                this._findParentComponent(node, parentNode);
                this._readAttributes(node);
                const component = new componentClass(node, node.props);
                component.init();
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
            this._bindChildEvents = (parentNode, childNode) => {
                if (childNode.attributes) {
                    [].slice.call(childNode.attributes).map((attr) => {
                        const name = attr.name;
                        //@ts-ignore
                        if (typeof childNode[name] === 'function') {
                            //@ts-ignore
                            childNode[name] = childNode[name].bind(parentNode);
                        }
                    });
                }
            };
            this._registerChildNodes = (parentNode) => {
                const traverse = (node) => {
                    [].slice.call(node.childNodes).map((childNode) => {
                        if (!this._components[childNode.localName]) {
                            // bind child tags events to the parent
                            this._bindChildEvents(parentNode, childNode);
                            traverse(childNode);
                        }
                    });
                };
                traverse(parentNode);
            };
            this._mergeHtml = (template, node) => {
                const templateNodes = [].slice.call(template.childNodes);
                const documentNodes = [].slice.call(node.childNodes);
                let diffCount = documentNodes.length - templateNodes.length;
                const templateNodesLen = templateNodes.length;
                const documentNodesLen = documentNodes.length;
                for (let i = 0; i < templateNodesLen; i++) {
                    const templateNode = templateNodes[i];
                    const documentNode = documentNodes[i];
                    // new node, create it
                    if (!documentNode) {
                        node.appendChild(templateNode.cloneNode(true));
                        continue;
                    }
                    // add/remove nodes to match the template
                    if (getNodeType(templateNode) !== getNodeType(documentNode)) {
                        if (diffCount > 0) {
                            this._traverseComponentsTree(documentNode, this._removeComponent);
                            if (documentNode.parentNode) {
                                documentNode.parentNode.removeChild(documentNode);
                            }
                            i--;
                            diffCount--;
                        }
                        else {
                            node.insertBefore(templateNode.cloneNode(true), documentNode);
                        }
                        continue;
                    }
                    // update text content
                    const templateContent = getNodeContent(templateNode);
                    const documentContent = getNodeContent(documentNode);
                    if (templateContent && templateContent !== documentContent) {
                        documentNode.textContent = templateContent;
                    }
                    if (templateNode.localName) {
                        syncAttributes(templateNode, documentNode);
                        // Check if the element is a component and stop
                        if (!this._components[templateNode.localName]) {
                            mergeHtmlElement(templateNode, documentNode, this._mergeHtml);
                        }
                    }
                }
                // remove extra elements
                diffCount = documentNodesLen - templateNodesLen;
                for (let i = documentNodesLen - 1; i >= templateNodesLen; i--) {
                    this._traverseComponentsTree(documentNodes[i], this._removeComponent);
                    if (documentNodes[i].parentNode) {
                        documentNodes[i].parentNode.removeChild(documentNodes[i]);
                    }
                    diffCount--;
                }
                this._registerChildNodes(node);
            };
            this.registerComponent = (componentName, componentClass, getFunctions, services) => {
                if (!componentName || !/-/.test(componentName)) {
                    return;
                }
                if (!getFunctions) {
                    getFunctions = () => undefined;
                }
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const that = this;
                const wrappedComponentClass = class {
                    constructor(node) {
                        this.init = async () => {
                            await this.render();
                            this._node.onMount && await this._node.onMount.call(this._node);
                        };
                        this.render = async () => {
                            const { render } = this._node;
                            if (!render) {
                                return;
                            }
                            const html = await render.call(this._node, this._initialInnerHTML);
                            if (this._removed || !html || html === this._previousTemplate) {
                                return;
                            }
                            this._previousTemplate = html;
                            const template = new DOMParser().parseFromString(html, 'text/html');
                            that._mergeHtml(template.querySelector('body'), this._node);
                            this._node.onRender && this._node.onRender.call(this._node);
                        };
                        this.unmount = () => {
                            if (!this._removed) {
                                this._removed = true;
                                that._navimiState.unwatchState(this._uid);
                                that._removeChildComponents(this._node);
                                that._disconnectFromParent(this._node);
                                this._node.remove();
                                this._node.onUnmount && this._node.onUnmount();
                                this._node.update = undefined;
                                this._node.__wrapper = undefined;
                                delete this._node;
                                delete this._uid;
                                delete this._previousTemplate;
                                delete this._initialInnerHTML;
                            }
                        };
                        this._uid = `component:${that._uidCounter++}`;
                        this._node = node;
                        this._previousTemplate = undefined;
                        this._initialInnerHTML = node.innerHTML;
                        node.innerHTML = '';
                        node.__wrapper = this;
                        // inherits from HTMLElement
                        Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);
                        const component = new componentClass(node.props, getFunctions(this._uid), services);
                        // todo: check if this timer (16ms = 60fps) can become an option in case someone needs different fps
                        node.update = throttle(this.render.bind(this), 16, this);
                        // connects the component code to the tag 
                        Object.setPrototypeOf(node, component);
                    }
                };
                this._components[componentName] = wrappedComponentClass;
                return wrappedComponentClass;
            };
        }
        init(navimiState) {
            this._navimiState = navimiState;
            new window.MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        const node = mutation.target;
                        if (this._components[node.localName]) {
                            const prevAttributes = this._readAttributes(node);
                            if (!node.shouldUpdate || node.shouldUpdate(prevAttributes, node.props)) {
                                node.update && node.update();
                            }
                        }
                    }
                    else {
                        [].slice.call(mutation.addedNodes).map((addedNode) => {
                            this._traverseComponentsTree(addedNode, this._registerTag);
                        });
                        [].slice.call(mutation.removedNodes).map((removedNode) => {
                            this._traverseComponentsTree(removedNode, this._removeComponent);
                        });
                    }
                });
            }).observe(document, { childList: true, subtree: true, attributes: true });
        }
    }

    class Navimi {
        constructor(routes, options, services, core) {
            let { navimiFetch, navimiCSSs, navimiJSs, navimiTemplates, navimiMiddlewares, navimiState, navimiHot, navimiComponents } = services || {};
            navimiFetch = navimiFetch || new __Navimi_Fetch();
            navimiCSSs = navimiCSSs || new __Navimi_CSSs();
            navimiJSs = navimiJSs || new __Navimi_JSs();
            navimiTemplates = navimiTemplates || new __Navimi_Templates();
            navimiMiddlewares = navimiMiddlewares || new __Navimi_Middlewares();
            navimiState = navimiState || new __Navimi_State();
            navimiHot = navimiHot || new __Navimi_Hot();
            navimiComponents = navimiComponents || new __Navimi_Components();
            // setup DI
            navimiComponents.init(navimiState);
            navimiFetch.init(options);
            navimiCSSs.init(navimiFetch);
            navimiJSs.init(navimiFetch, navimiCSSs, navimiTemplates, navimiState, navimiComponents, options);
            navimiTemplates.init(navimiFetch);
            navimiState.init();
            const _services = {
                navimiFetch,
                navimiJSs,
                navimiCSSs,
                navimiTemplates,
                navimiMiddlewares,
                navimiState,
                navimiHot,
                navimiComponents
            };
            core ? core(routes, _services, options) :
                new __Navimi_Core(routes, _services, options);
        }
    }

    return Navimi;

})();
//# sourceMappingURL=navimi.js.map
