type jsType = 'component' | 'javascript' | 'library' | 'module' | 'route' | 'service';
interface INavimi_JSs {
    init: (navimiHelpers: INavimi_Helpers,
        navimiFetch: INavimi_Fetch,
        navimiCSSs: INavimi_CSSs,
        navimiTemplates: INavimi_Templates,
        navimiState: INavimi_State,
        navimiComponents: INavimi_Components,
        options: INavimi_Options) => void;
    isJsLoaded: (url: string) => boolean;
    getInstance: (url: string) => InstanceType<any>;
    fetchJS: (abortController: AbortController, urls: string[], type: jsType) => Promise<InstanceType<any> | InstanceType<any>[]>;
    loadServices: (abortController: AbortController, jsUrl: string, services: string[]) => Promise<any[]>;
    loadComponents: (abortController: AbortController, jsUrl: string, components: string[]) => Promise<any[]>;
    initRoute: (jsUrl: string, params: INavimi_KeyList<any>) => Promise<void>;
    digestHot: (payload: hotPayload) => Promise<void>;
}