import { INavimi_Components } from './INavimi_Components';
import { INavimi_CSSs } from './INavimi_CSSs';
import { INavimi_Fetch } from './INavimi_Fetch';
import { INavimi_Helpers } from './INavimi_Helpers';
import { INavimi_Hot } from './INavimi_Hot';
import { INavimi_JSs } from './INavimi_JSs';
import { INavimi_Middlewares } from './INavimi_Middleware';
import { INavimi_State } from './INavimi_State';
import { INavimi_Templates } from './INavimi_Templates';

interface INavimi_Route {
    title: string;
    jsUrl?: string;
    cssUrl?: string;
    templatesUrl?: string;
    services?: string[];
    components?: string[];
    metadata?: Record<string, any>;
}

interface INavimi_Library {
    url: string;
    type: 'css' | 'library' | 'module';
}

interface INavimi_Functions {
    addLibrary: (url: string | string[] | INavimi_Library[]) => Promise<void>;
    fetchJS: (jsUrl: string | string[]) => Promise<InstanceType<any> | InstanceType<any>[]>;
    fetchTemplate: (templateUrl: string | string[]) => Promise<void | void[]>;
    getState: (key?: string) => any;
    getTemplate: (templateId: string | string[]) => string | string[];
    navigateTo: (url: string, params?: Record<string, any>) => void;
    setNavimiLinks: () => void;
    setTitle: (title: string) => void;
    setState: (state: Record<string, any>) => void;
    unwatchState: (key?: string | string[]) => void;
    watchState: (key: string, callback: (state: any) => void) => void;
    style: (...styles: object[]) => string;
}

type INavimi_Next = (url?: string, params?: Record<string, any>) => Promise<void> | void;
type INavimi_Context = { url: string, routeItem: INavimi_Route, params: Record<string, any> };
type INavimi_Middleware = (context: INavimi_Context, next: INavimi_Next) => Promise<void> | void;

interface INavimi_Options {
    globalCssUrl?: string;
    globalTemplatesUrl?: string;
    services?: Record<string, string>;
    components?: Record<string, string>;
    middlewares?: INavimi_Middleware[];
    hot?: number | boolean;
    bustCache?: string;
    onAfterRoute?: (context: INavimi_Context, navigateTo: (url: string, params?: Record<string, any>) => void) => void;
    onBeforeRoute?: (context: INavimi_Context, navigateTo: (url: string, params?: Record<string, any>) => void) => boolean | Promise<boolean>;
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

interface INavimi_HotPayload {
    filePath?: string;
    data?: string;
    message?: string;
}

declare class INavimi {
    constructor(routes: string, options?: INavimi_Options, services?: INavimi_Services, 
        core?: (routes: Record<string, INavimi_Route>, services?: INavimi_Services, options?: INavimi_Options) => any): INavimi;
}

export {
    INavimi_Route,
    INavimi_Library,
    INavimi_Functions, 
    INavimi_Next, 
    INavimi_Context, 
    INavimi_Middleware, 
    INavimi_Options, 
    INavimi_Services, 
    INavimi_HotPayload,
    INavimi
}
