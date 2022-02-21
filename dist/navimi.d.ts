declare namespace __Navimi_CSSs {
    const isCssLoaded: (url: string) => boolean;
    const getCss: (url: string) => string;
    const fetchCss: (abortController: AbortController, url: string, autoInsert?: boolean) => Promise<void | void[]>;
    const reloadCss: (filePath: string, cssCode: string, routeList: KeyList<Route>, currentJS: string, globalCssUrl: string) => void;
}
declare namespace __Navimi_Dom {
    const setTitle: (title: string) => void;
    const setNavimiLinks: (navigateTo: (url: string, params?: KeyList<any>) => void) => void;
    const insertCss: (cssCode: string, type?: string, prepend?: boolean) => void;
    const insertJS: (jsCode: string, jsUrl: string) => void;
    const addLibrary: (jsOrCssUrl: string | string[]) => Promise<void>;
}
declare namespace __Navimi_Fetch {
    let loadErrors: {
        [key: string]: string;
    };
    const fetchFile: (url: string, options?: RequestInit) => Promise<string>;
}
declare namespace __Navimi_Helpers {
    const isSameFile: (path1: string, path2: string) => boolean;
    const timeout: (ms: number) => Promise<void>;
    const debounce: (task: (args: any[]) => any, ms: number) => () => void;
    const getUrl: () => string;
    const removeHash: (url: string) => string;
    const stringify: (obj: any) => string;
    const cloneObject: (obj: any) => KeyList<any>;
    const getRouteAndParams: (url: string, routingList: KeyList<Route>) => RouteItem;
}
declare namespace __Navimi_Hot {
    const openHotWs: (hotOption: number | boolean, callback: any) => void;
}
interface KeyList<T> {
    [key: string]: T;
}
interface Route {
    title: string;
    jsUrl?: string;
    cssUrl?: string;
    templatesUrl?: string;
    dependsOn?: string[];
    metadata?: KeyList<any>;
}
interface RouteItem {
    routeItem: Route;
    params: KeyList<any>;
}
interface RouterFunctions {
    addLibrary: (jsOrCssUrl: string | string[]) => Promise<void>;
    fetchJS: (jsUrl: string | string[]) => Promise<InstanceType<any> | InstanceType<any>[]>;
    fetchTemplate: (templateUrl: string | string[]) => Promise<void | void[]>;
    getState: (key?: string) => any;
    getTemplate: (templateId: string | string[]) => string | string[];
    navigateTo: (url: string, params?: KeyList<any>) => void;
    setNavimiLinks: () => void;
    setTitle: (title: string) => void;
    setState: (state: KeyList<any>) => void;
    unwatchState: (key?: string | string[]) => void;
    watchState: (key: string, callback: (state: any) => void) => void;
}
declare type Next = (url?: string, params?: KeyList<any>) => Promise<void> | void;
declare type Context = {
    url: string;
    routeItem: Route;
    params: KeyList<any>;
};
declare type Middleware = (context: Context, next: Next) => Promise<void> | void;
interface Options {
    globalCssUrl?: string;
    globalTemplatesUrl?: string;
    services?: {
        [serviceName: string]: string;
    };
    middlewares?: Middleware[];
    hot?: number | boolean;
    onAfterRoute?: (context: Context, navigateTo: (url: string, params?: KeyList<any>) => void) => void;
    onBeforeRoute?: (context: Context, navigateTo: (url: string, params?: KeyList<any>) => void) => boolean | Promise<boolean>;
    onError?: (error: Error) => void;
}
interface hotPayload {
    filePath?: string;
    data?: string;
    message?: string;
}
declare class NavimiRoute {
    /**
    * @typedef {Object} Functions - A collection of functions
    * @property {string} functions.title - The title that will be displayed on the browser
    * @property {string} functions.jsUrl - The path to the route script
    * @property {string=} functions.cssUrl - The path to the route css
    * @property {string=} functions.templatesUrl - The path to the templates file of this route
    * @property {string[]=} functions.dependsOn - An array of services names for this route
    * @property {Object.<string, *>=} functions.metadata - Any literal you need to pass down to this route and middlewares
    * @param {Object[]} services - A collection of services
    * @returns {Object} - The Navimi route
    */
    /**
    * @param {Object} RouterFunctions - A collection of functions
    * @param {Object[]} services - A collection of services
    * optional
    * variables initialization
    * Invoked after options.onBeforeRoute and options.middlewares
    * Invoked before options.onAfterRoute
    */
    constructor(functions: RouterFunctions, services: any[]);
    /**
     * @param {((context: Object.<string, *>} context - The context of the route ({ url, Route, params })
    * Here you should render your page components
    * Invoked after options.onBeforeRoute and options.middlewares
    * Invoked before options.onAfterRoute
     */
    init(context: Context): Promise<void> | void;
    /**
     * @param {((context: Object.<string, *>} context - The context of the route ({ url, Route, params })
    * @returns {boolean} - False if you need to keep the user on this page
    */
    beforeLeave(context: Context): void;
    /**
    * @returns {boolean} - False if you need to keep the user on this page
    */
    destroy(): void;
}
declare namespace __Navimi_JSs {
    const init: (config: any) => void;
    const isJsLoaded: (url: string) => boolean;
    const getInstance: (url: string) => InstanceType<any>;
    const fetchJS: (abortController: AbortController, urls: string[], external?: boolean) => Promise<InstanceType<any> | InstanceType<any>[]>;
    const loadServices: (abortController: AbortController, jsUrl: string, services: string[]) => void;
    const initJS: (jsUrl: string, params: KeyList<any>) => Promise<void>;
    const reloadJs: (filePath: string, jsCode: string, routeList: KeyList<Route>, currentJS: string, callback: any) => void;
}
declare namespace __Navimi_Middleware {
    const addMiddlewares: (middlewares: Middleware[]) => void;
    const executeMiddlewares: (abortController: AbortController, context: Context, callback: (url: string, params: KeyList<any>) => void) => Promise<void>;
}
/*!
 * Navimi v0.1.1
 * Developed by Ivan Valadares
 * ivanvaladares@hotmail.com
 * https://github.com/ivanvaladares/navimi
 */
declare class Navimi {
    private callId;
    private abortController;
    private currentJS;
    private currentUrl;
    private routesParams;
    private routesList;
    private options;
    private win;
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
    constructor(routes: KeyList<Route>, options?: Options);
    private navigateTo;
    private reportError;
    private initRoute;
}
declare namespace __Navimi_State {
    const setState: (newState: KeyList<any>) => void;
    const getState: (key?: string, _state?: any) => KeyList<any>;
    const watchState: (jsUrl: string, key: string, callback: (state: any) => void) => void;
    const unwatchState: (jsUrl: string, key?: string | string[]) => void;
}
declare namespace __Navimi_Templates {
    const isTemplateLoaded: (url: string) => boolean;
    const getTemplate: (templateId: string | string[]) => string | string[];
    const fetchTemplate: (abortController: AbortController, urls: string[], jsUrl?: string) => Promise<void | void[]>;
    const reloadTemplate: (filePath: string, templateCode: string, routeList: KeyList<Route>, currentJS: string, globalTemplatesUrl: string, callback: any) => void;
}
