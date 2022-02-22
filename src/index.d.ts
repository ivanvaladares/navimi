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
    bustCache?: string;
    onAfterRoute?: (context: Context, navigateTo: (url: string, params?: KeyList<any>) => void) => void;
    onBeforeRoute?: (context: Context, navigateTo: (url: string, params?: KeyList<any>) => void) => boolean | Promise<boolean>;
    onError?: (error: Error) => void;
}
