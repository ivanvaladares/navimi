

interface Route {
    title: string;
    jsUrl?: string;
    cssUrl?: string;
    templatesUrl?: string;
    dependsOn?: string[];
    metadata?: { [key: string]: any };
}

interface RouterFunctions {
    addLibrary: (jsOrCssUrl: string | string[]) => Promise<void>;
    fetchJS: (jsUrl: string | string[]) => Promise<InstanceType<any> | InstanceType<any>[]>;
    fetchTemplate: (templateUrl: string | string[]) => Promise<void | void[]>;
    getState: (key?: string) => any;
    getTemplate: (templateId: string | string[]) => string | string[];
    navigateTo: (url: string, params?: { [key: string]: any }) => void;
    setNavimiLinks: () => void;
    setTitle: (title: string) => void;
    setState: (state: { [key: string]: any }) => void;
    unwatchState: (key?: string | string[]) => void;
    watchState: (key: string, callback: (state: any) => void) => void;
}

type Next = (url?: string, params?: { [key: string]: any }) => Promise<void> | void;
type Context = { url: string, routeItem: Route, params: { [key: string]: any } };
type Middleware = (context: Context, next: Next) => Promise<void> | void;

interface Options {
    globalCssUrl?: string;
    globalTemplatesUrl?: string;
    services?: { [serviceName: string]: string };
    middlewares?: Middleware[];
    hot?: number | boolean;
    onAfterRoute?: (context: Context, navigateTo: (url: string, params?: { [key: string]: any }) => void) => void;
    onBeforeRoute?: (context: Context, navigateTo: (url: string, params?: { [key: string]: any }) => void) => boolean;
    onError?: (error: Error) => void;
}