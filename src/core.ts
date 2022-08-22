class __Navimi_Core {

    private _callId: number;
    private _abortController: AbortController;
    private _currentJS: string;
    private _currentUrl: string;
    private _routesParams: INavimi_KeyList<any>;
    private _routesList: INavimi_KeyList<INavimi_Route>;
    private _options: INavimi_Options;
    private _globalCssInserted: boolean;
    private _win: any;

    private _navimiFetch: INavimi_Fetch;
    private _navimiJSs: INavimi_JSs;
    private _navimiCSSs: INavimi_CSSs;
    private _navimiTemplates: INavimi_Templates;
    private _navimiMiddlewares: INavimi_Middlewares;
    private _navimiHot: INavimi_Hot;
    private _navimiHelpers: INavimi_Helpers;

    constructor(routes: INavimi_KeyList<INavimi_Route>, services: INavimi_Services, options?: INavimi_Options) {

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

    private _init(): void {
        if (this._options.globalCssUrl || this._options.globalTemplatesUrl) {

            Promise.all([
                this._navimiCSSs.fetchCss(undefined, this._options.globalCssUrl),
                this._navimiTemplates.fetchTemplate(undefined, this._options.globalTemplatesUrl),
            ]).catch(this._reportError);

        }
    }

    private _initHot() {
        //removeIf(!minify)
        console.warn('HOT is disabled! Use the unminified version to enable it.');
        //endRemoveIf(!minify)
        //removeIf(minify)
        this._navimiHot.init(
            this._navimiCSSs,
            this._navimiJSs,
            this._navimiTemplates,
            () => this._initRoute(undefined, undefined, true),
        );
        setTimeout(this._navimiHot.openHotWs, 1000, this._options.hot);
        //endRemoveIf(minify)
    }

    private _navigateTo = (url: string, params?: INavimi_KeyList<any>): void => {
        this._initRoute(url, params);
    };

    private _reportError = (error: Error): void => {
        if (this._options.onError) {
            this._options.onError(error);
            return;
        }
        console.error(error);
    }

    private _waitForAssets = (callId: number): Promise<void> => {
        const css = this._options.globalCssUrl;
        const template = this._options.globalTemplatesUrl;
        if (!css && !template) {
            return Promise.resolve();
        }

        return new Promise<void>(resolve => {
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

    private _initRoute = async (urlToGo?: string, navParams?: INavimi_KeyList<any>, force?: boolean): Promise<void> => {
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

            const routeParams: INavimi_Context = {
                url,
                routeItem,
                params,
                ...(navParams ? navParams : {}),
            };

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
                } else {
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
                this._navimiCSSs.insertCss(this._options.globalCssUrl, 'globalCss')
            }

            if (jsUrl) {
                await this._navimiJSs.initJS(jsUrl, this._routesParams[jsUrl]);
            } else {
                const template = this._navimiTemplates.getTemplate(templatesUrl) as string;
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
            
        } catch (ex) {
            this._reportError(ex);
        }

    };

}