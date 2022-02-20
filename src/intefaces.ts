interface KeyList<T> {
    [key: string]: T
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

type Next = (url?: string, params?: KeyList<any>) => Promise<void> | void;
type Context = { url: string, routeItem: Route, params: KeyList<any> };
type Middleware = (context: Context, next: Next) => Promise<void> | void;

interface Options {
    globalCssUrl?: string;
    globalTemplatesUrl?: string;
    services?: { [serviceName: string]: string };
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