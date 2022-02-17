/*! 
 * Navimi v0.1.1
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com
 * https://github.com/ivanvaladares/navimi
 */

class Navimi {

    private controller: AbortController;
    private currentJS: string;
    private currentUrl: string;
    private routesParams: { [url: string]: any };
    private routesList: { [url: string]: Route };
    private options: Options;

    private pagesNamespace: string;
    private pagesMainCallBack: string;

    private win: any;
    private callId: number;

    /**
    * @typedef {Object} Route - An route definition
    * @property {string} routes.title - The title that will be displayed on the browser
    * @property {string} routes.jsUrl - The path to the route script
    * @property {string=} routes.cssUrl - The path to the route css
    * @property {string=} routes.templatesUrl - The path to the templates file of this route 
    * @property {string[]=} routes.dependsOn - An array of services names for this route
    * @property {Object.<string, *>=} routes.metadata - Any literal you need to pass down to this route and middlewares 
    * @param {Object.<string, Route>} routes - A collection of Route
    * @param {Object} [options] - Navimi options 
    * @param {string=} options.globalCssUrl - The path to the global css
    * @param {string=} options.globalTemplatesUrl - The path to the global templates file
    * @param {Object.<string, string>=} options.services - A collection of all services {[service name]: script path}
    * @param {((context: Object.<string, *>, next:(url: string, params?: Object.<string, *>) => void) => void)[]=} options.middlewares - An array of functions to capture the request
    * @param {(number | boolean)=} options.hot - The port to the websocket at localhost
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onAfterRoute - A function invoked after the routing is done
    * @param {((context: Object.<string, *>, navigateTo: (url: string, params?: Object.<string, *>) => void)=} options.onBeforeRoute - A function invoked before middlewares and routing
    * @param {function(Error): void=} options.onError - A function to capture erros from routes
    * @returns {Object} - The Navimi instance 
    */
    constructor(routes: { [url: string]: Route }, options?: Options) {

        this.pagesNamespace = "__spaPages";
        this.pagesMainCallBack = "_mainCallback";
        this.win = window ? window : {};
        this.controller = new AbortController();
        this.currentJS = undefined;
        this.currentUrl = undefined;
        this.routesParams = {};       
        this.routesList = routes || {};
        this.options = options || {};
        this.callId = 0;

        //@ts-ignore
        this.win.addEventListener('popstate', () => {
            this.initRoute();
        });

        //@ts-ignore
        this.win.navigateTo = this.navigateTo;

        __Navimi_JSs.init({
            pagesNamespace: this.pagesNamespace,
            pagesMainCallBack: this.pagesMainCallBack,
            navigateTo: this.navigateTo.bind(this),
            options: this.options,
        });

        //add middlewares
        __Navimi_Middleware.addMiddlewares(this.options.middlewares);

        (async () => {
            if (this.options.globalCssUrl || this.options.globalTemplatesUrl) {

                await Promise.all([
                    __Navimi_CSSs.fetchCss(undefined, this.options.globalCssUrl),
                    __Navimi_Templates.fetchTemplate(undefined, [this.options.globalTemplatesUrl]),
                ]).catch(this.reportError);

                __Navimi_Dom.insertCss(__Navimi_CSSs.getCss(this.options.globalCssUrl), "globalCss");
            }
        })();

        this.initRoute();

        if (this.options.hot && this.win["__Navimi_Hot"]) {
            setTimeout(this.win["__Navimi_Hot"], 1000, this.options.hot);
        }
    }

    private navigateTo = (url: string, params?: { [key: string]: any }): void => {
        this.initRoute(url, params);
    };

    private reportError = (error: Error): void => {
        if (this.options.onError) {
            this.options.onError(error);
            return;
        }
        console.error(error);
    }

    private initRoute = async (urlToGo?: string, navParams?: { [key: string]: any }, force?: boolean): Promise<void> => {
        const url = __Navimi_Helpers.removeHash(urlToGo || __Navimi_Helpers.getUrl());

        if (!force) {
            if (this.currentUrl === url) {
                return;
            }
            this.controller.abort();
            this.controller = new AbortController();
        }

        const callId = ++this.callId;
        const pushState = urlToGo !== undefined;

        let { routeItem, params } = __Navimi_Helpers.getRouteAndParams(url, this.routesList);

        if (navParams !== undefined) {
            params = {
                ...params,
                ...navParams
            };
        }

        if (this.options.onBeforeRoute) {
            const shouldContinue = await this.options.onBeforeRoute({ url, routeItem, params }, this.navigateTo);
            if (shouldContinue === false) {
                return;
            }
        }

        if (this.currentJS && !force) {
            const currentJsInstance = __Navimi_JSs.getInstance(this.currentJS);

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
            callId === this.callId && this.reportError(new Error("No route match for url: " + url));
            return;
        }

        try {
            await __Navimi_Middleware.executeMiddlewares(this.controller, { url, routeItem, params }, (url: string, params: any) => {
                this.initRoute(url, params, true);
            });
        } catch {
            return;
        }

        if (callId < this.callId) {
            return;
        }

        this.currentUrl = url;

        try {

            const { title, jsUrl, cssUrl, templatesUrl, dependsOn } = routeItem || {};

            if (!jsUrl && !templatesUrl) {
                throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");
            }

            if (jsUrl) {
                this.currentJS = jsUrl;
                this.routesParams[jsUrl] = { url, routeItem, params };
            }

            if (pushState) {
                if (navParams?.replaceUrl) {
                    history.replaceState(null, null, urlToGo);
                } else {
                    history.pushState(null, null, urlToGo);
                }
            }

            __Navimi_CSSs.fetchCss(this.controller, cssUrl).catch(_ => { }); //todo: should report error?
            __Navimi_Templates.fetchTemplate(this.controller, [templatesUrl]).catch(_ => { }); //todo: should report error?
            try {
                __Navimi_JSs.loadServices(this.controller, jsUrl, dependsOn); //todo: should report error?
            } catch (ex) {
                this.reportError(ex);
            }
    
            if (jsUrl) {
                await __Navimi_JSs.fetchJS(this.controller, [jsUrl], false);
            }

            //wait css and template to load if any
            while ((cssUrl && !__Navimi_CSSs.isCssLoaded(cssUrl)) ||
                (templatesUrl && !__Navimi_Templates.isTemplateLoaded(templatesUrl)) ||
                (this.options.globalCssUrl &&
                    !__Navimi_CSSs.isCssLoaded(this.options.globalCssUrl)) ||
                (this.options.globalTemplatesUrl &&
                    !__Navimi_Templates.isTemplateLoaded(this.options.globalTemplatesUrl))) {

                await __Navimi_Helpers.timeout(10);
                if (callId < this.callId) {
                    return;
                }
                if ((cssUrl && __Navimi_Fetch.loadErrors[cssUrl]) ||
                    (templatesUrl && __Navimi_Fetch.loadErrors[templatesUrl]) ||
                    (this.options.globalCssUrl &&
                        __Navimi_Fetch.loadErrors[this.options.globalCssUrl]) ||
                    (this.options.globalTemplatesUrl &&
                        __Navimi_Fetch.loadErrors[this.options.globalTemplatesUrl])) {
                    this.reportError(
                        new Error(
                            __Navimi_Fetch.loadErrors[cssUrl] ||
                            __Navimi_Fetch.loadErrors[templatesUrl] ||
                            __Navimi_Fetch.loadErrors[this.options.globalCssUrl] ||
                            __Navimi_Fetch.loadErrors[this.options.globalTemplatesUrl]
                        )
                    );
                    return;
                }
            }

            __Navimi_Dom.setTitle(title);

            try {

                if (jsUrl) {
                    await __Navimi_JSs.initJS(jsUrl, this.routesParams[jsUrl]);
                } else {
                    const template = __Navimi_Templates.getTemplate(templatesUrl) as string;
                    const body = document.querySelector("body");
                    if (template && body) {
                        body.innerHTML = template;
                    }
                    return;
                }

            } catch (ex) {
                this.reportError(ex);

            } finally {

                if (callId < this.callId) {
                    return;
                }
    
                __Navimi_Dom.setNavimiLinks(this.navigateTo);
                
                __Navimi_Dom.insertCss(__Navimi_CSSs.getCss(cssUrl), "pageCss");
    
                this.options.onAfterRoute &&
                    this.options.onAfterRoute({ url, routeItem, params }, this.navigateTo);
            }

        } catch (ex) {
            this.reportError(ex);
        }
    };

}