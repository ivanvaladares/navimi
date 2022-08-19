type jsType = "component" | "javascript" | "library" | "module" | "route" | "service";
interface INavimi_JSs {
    init: (navimiDom: INavimi_Dom, 
        navimiFetch: INavimi_Fetch, 
        navimiTemplates: INavimi_Templates, 
        navimiState: INavimi_State, 
        navimiComponents: INavimi_Components, 
        options: INavimi_Options) => void;
    isJsLoaded: (url: string) => boolean;
    getInstance: (url: string) => InstanceType<any>;
    fetchJS: (abortController: AbortController, urls: string[], type: jsType) => Promise<InstanceType<any> | InstanceType<any>[]>;
    loadDependencies: (abortController: AbortController, jsUrl: string, services: string[], components: string[]) => Promise<void>;
    initJS: (jsUrl: string, params: INavimi_KeyList<any>) => Promise<void>;
    digestHot: (payload: hotPayload) => Promise<void>;
}