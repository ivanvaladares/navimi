class __Navimi_Core {

    private _callId: number;
    private _abortController: AbortController;
    private _currentJS: string;
    private _currentUrl: string;
    private _routesParams: INavimi_KeyList<any>;
    private _routesList: INavimi_KeyList<INavimi_Route>;
    private _options: INavimi_Options;
    private _win: any;

    private _navimiFetch: INavimi_Fetch;
    private _navimiJs: INavimi_JSs;
    private _navimiCss: INavimi_CSSs;
    private _navimiDom: INavimi_Dom;
    private _navimiTemplates: INavimi_Templates;
    private _navimiMiddleware: INavimi_Middlewares;
    private _navimiHot: INavimi_Hot;
    private _navimiHelpers: INavimi_Helpers;

    constructor(routes: INavimi_KeyList<INavimi_Route>, options?: INavimi_Options, denpendencies?: any) {

        this._callId = 0;
        this._abortController = new AbortController();
        this._currentJS = undefined;
        this._currentUrl = undefined;
        this._routesParams = {};
        this._routesList = routes || {};
        this._options = options || {};
        this._win = window ? window : {};

        this._navimiFetch = denpendencies.navimiFetch
        this._navimiDom = denpendencies.navimiDom;
        this._navimiCss = denpendencies.navimiCss;
        this._navimiJs = denpendencies.navimiJs;
        this._navimiTemplates = denpendencies.navimiTemplates;
        this._navimiMiddleware = denpendencies.navimiMiddleware;
        this._navimiHot = denpendencies.navimiHot;
        this._navimiHelpers = denpendencies.navimiHelpers;

        this._win.addEventListener('popstate', () => {
            this._initRoute();
        });

        this._win.navigateTo = this._navigateTo;

        //add middlewares
        this._navimiMiddleware.addMiddlewares(this._options.middlewares);

        (async () => {
            await this._init();
        })();

        this._initRoute();

        if (this._options.hot) {
            this._initHot();
        }
    }

    private async _init(): Promise<void> {
        if (this._options.globalCssUrl || this._options.globalTemplatesUrl) {

            await Promise.all([
                this._navimiCss.fetchCss(undefined, this._options.globalCssUrl),
                this._navimiTemplates.fetchTemplate(undefined, [this._options.globalTemplatesUrl]),
            ]).catch(this._reportError);

            this._navimiDom.insertCss(this._navimiCss.getCss(this._options.globalCssUrl), "globalCss");
        }
    }

    private _initHot() {
        if (__NAVIMI_PROD) {
            console.warn('HOT is disabled! Use the unminified version to enable it.');
        }
        if (__NAVIMI_DEV) {
            setTimeout(this._navimiHot.openHotWs, 1000, this._options.hot,
                (callback: (globalCssUrl: string,
                    globalTemplatesUrl: string,
                    currentJs: string,
                    routesList: INavimi_KeyList<INavimi_Route>,
                    initRoute: any) => void) => {

                    callback(this._options.globalCssUrl,
                        this._options.globalTemplatesUrl,
                        this._currentJS,
                        this._routesList, () => {
                            this._initRoute(undefined, this._routesParams[this._currentJS], true);
                        });
                });
        }
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

    private _initRoute = async (urlToGo?: string, navParams?: INavimi_KeyList<any>, force?: boolean): Promise<void> => {
        const url = this._navimiHelpers.removeHash(urlToGo || this._navimiHelpers.getUrl());

        if (!force) {
            if (this._currentUrl === url) {
                return;
            }
            this._abortController.abort();
            this._abortController = new AbortController();
        }

        const callId = ++this._callId;
        const pushState = urlToGo !== undefined;

        let { routeItem, params } = this._navimiHelpers.getRouteAndParams(url, this._routesList);

        if (navParams !== undefined) {
            params = {
                ...params,
                ...navParams
            };
        }

        if (this._options.onBeforeRoute) {
            const shouldContinue = await this._options.onBeforeRoute({ url, routeItem, params }, this._navigateTo);
            if (shouldContinue === false) {
                return;
            }
        }

        if (this._currentJS && !force) {
            const currentJsInstance = this._navimiJs.getInstance(this._currentJS);

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

        await this._navimiMiddleware.executeMiddlewares(this._abortController, { url, routeItem, params }, (url: string, params: any) => {
            this._initRoute(url, params, true);
        });

        if (callId < this._callId) {
            if (__NAVIMI_DEV) {
                console.warn("Navimi: A middleware has exited with an Url");
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
                if (navParams?.replaceUrl) {
                    history.replaceState(null, null, urlToGo);
                } else {
                    history.pushState(null, null, urlToGo);
                }
            }

            this._navimiCss.fetchCss(this._abortController, cssUrl).catch(_ => { });
            this._navimiTemplates.fetchTemplate(this._abortController, [templatesUrl]).catch(_ => { });
            try {
                this._navimiJs.loadServices(this._abortController, jsUrl, dependsOn);
            } catch (ex) {
                this._reportError(ex);
            }

            if (jsUrl) {
                await this._navimiJs.fetchJS(this._abortController, [jsUrl], false);
            }

            //wait css and template to load if any
            while ((cssUrl && !this._navimiCss.isCssLoaded(cssUrl)) ||
                (templatesUrl && !this._navimiTemplates.isTemplateLoaded(templatesUrl)) ||
                (this._options.globalCssUrl &&
                    !this._navimiCss.isCssLoaded(this._options.globalCssUrl)) ||
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
                    this._reportError(
                        new Error(
                            this._navimiFetch.getErrors(cssUrl) ||
                            this._navimiFetch.getErrors(templatesUrl) ||
                            this._navimiFetch.getErrors(this._options.globalCssUrl) ||
                            this._navimiFetch.getErrors(this._options.globalTemplatesUrl)
                        )
                    );
                    return;
                }
            }

            this._navimiDom.setTitle(title);

            try {

                if (jsUrl) {
                    await this._navimiJs.initJS(jsUrl, this._routesParams[jsUrl]);
                } else {
                    const template = this._navimiTemplates.getTemplate(templatesUrl) as string;
                    const body = document.querySelector("body");
                    if (template && body) {
                        body.innerHTML = template;
                    }
                    return;
                }

            } catch (ex) {
                this._reportError(ex);

            } finally {

                if (callId < this._callId) {
                    return;
                }

                this._navimiDom.setNavimiLinks();

                this._navimiDom.insertCss(this._navimiCss.getCss(cssUrl), "routeCss");

                this._options.onAfterRoute &&
                    this._options.onAfterRoute({ url, routeItem, params }, this._navigateTo);
            }

        } catch (ex) {
            this._reportError(ex);
        }

    };

}