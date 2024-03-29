import { INavimi_CSSs } from './@types/INavimi_CSSs';
import { INavimi_Fetch } from './@types/INavimi_Fetch';
import { INavimi_Hot } from './@types/INavimi_Hot';
import { INavimi_JSs } from './@types/INavimi_JSs';
import { INavimi_Middlewares } from './@types/INavimi_Middleware';
import { INavimi_Templates } from './@types/INavimi_Templates';
import { INavimi_Core } from './@types/iNavimi_Core';
import { 
    INavimi_Route, 
    INavimi_Options, 
    INavimi_Services, 
    INavimi_Context 
} from './@types/Navimi';
import { removeHash } from './helpers/removeHash';
import { getUrl } from './helpers/getUrl';
import { getRouteAndParams } from './helpers/getRouteAndParams';
import { setTitle } from './helpers/setTitle';
import { setNavimiLinks } from './helpers/setNavimiLinks';

class __Navimi_Core implements INavimi_Core {

    private _callId: number;
    private _abortController: AbortController;
    private _currentJSUrl: string;
    private _currentUrl: string;
    private _routesParams: Record<string, unknown>;
    private _routesList: Record<string, INavimi_Route>;
    private _options: INavimi_Options;
    private _globalCssInserted: boolean;
    private _win: any;

    private _navimiFetch: INavimi_Fetch;
    private _navimiJSs: INavimi_JSs;
    private _navimiCSSs: INavimi_CSSs;
    private _navimiTemplates: INavimi_Templates;
    private _navimiMiddlewares: INavimi_Middlewares;
    private _navimiHot: INavimi_Hot;

    constructor(routes: Record<string, INavimi_Route>, services: INavimi_Services, options?: INavimi_Options) {

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

    private _init(): Promise<void | [void, void | void[]]> {
        if (this._options.globalCssUrl || this._options.globalTemplatesUrl) {

            return Promise.all([
                this._navimiCSSs.fetchCss(undefined, this._options.globalCssUrl),
                this._navimiTemplates.fetchTemplate(undefined, this._options.globalTemplatesUrl),
            ]).catch(this._reportError);

        }
    }

    private _initHot(): void {
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

    private _navigateTo = (url: string, params?: Record<string, unknown>): void => {
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

    private _initRoute = async (urlToGo?: string, navParams?: Record<string, unknown>, force?: boolean): Promise<void> => {
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

            const routeParams: INavimi_Context = {
                url,
                routeItem,
                params,
                ...(navParams ? navParams : {}),
            };

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
                } else {
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
                this._navimiCSSs.insertCss(this._options.globalCssUrl, 'globalCss')
            }

            if (jsUrl) {
                await this._navimiJSs.initRoute(jsUrl, this._routesParams[jsUrl]);
            } else {
                const template = this._navimiTemplates.getTemplate(templatesUrl) as string;
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
            
        } catch (ex) {
            this._reportError(ex);
        }

    };

}

export default __Navimi_Core;
