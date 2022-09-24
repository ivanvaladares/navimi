
interface INavimi_KeyList<T> {
    [key: string]: T
}

interface INavimi_Route {
    title: string;
    jsUrl?: string;
    cssUrl?: string;
    templatesUrl?: string;
    services?: string[];
    components?: string[];
    metadata?: INavimi_KeyList<any>;
}

interface INavimi_Library {
    url: string;
    type: "css" | "library" | "module";
}

interface INavimi_Functions {
    addLibrary: (url: string | string[] | INavimi_Library[]) => Promise<void>;
    fetchJS: (jsUrl: string | string[]) => Promise<InstanceType<any> | InstanceType<any>[]>;
    fetchTemplate: (templateUrl: string | string[]) => Promise<void | void[]>;
    getState: (key?: string) => any;
    getTemplate: (templateId: string | string[]) => string | string[];
    navigateTo: (url: string, params?: INavimi_KeyList<any>) => void;
    setNavimiLinks: () => void;
    setTitle: (title: string) => void;
    setState: (state: INavimi_KeyList<any>) => void;
    unwatchState: (key?: string | string[]) => void;
    watchState: (key: string, callback: (state: any) => void) => void;
}

type INavimi_Next = (url?: string, params?: INavimi_KeyList<any>) => Promise<void> | void;
type INavimi_Context = { url: string, routeItem: INavimi_Route, params: INavimi_KeyList<any> };
type INavimi_Middleware = (context: INavimi_Context, next: INavimi_Next) => Promise<void> | void;

interface INavimi_Options {
    globalCssUrl?: string;
    globalTemplatesUrl?: string;
    services?: INavimi_KeyList<string>;
    components?: INavimi_KeyList<string>;
    middlewares?: INavimi_Middleware[];
    hot?: number | boolean;
    bustCache?: string;
    onAfterRoute?: (context: INavimi_Context, navigateTo: (url: string, params?: INavimi_KeyList<any>) => void) => void;
    onBeforeRoute?: (context: INavimi_Context, navigateTo: (url: string, params?: INavimi_KeyList<any>) => void) => boolean | Promise<boolean>;
    onError?: (error: Error) => void;
}

interface INavimi_Services {
    navimiFetch?: INavimi_Fetch;
    navimiJSs?: INavimi_JSs;
    navimiCSSs?: INavimi_CSSs;
    navimiTemplates?: INavimi_Templates;
    navimiMiddlewares?: INavimi_Middlewares;
    navimiState?: INavimi_State;
    navimiHot?: INavimi_Hot;
    navimiHelpers?: INavimi_Helpers;
    navimiComponents?: INavimi_Components;
}

interface hotPayload {
    filePath?: string;
    data?: string;
    message?: string;
}