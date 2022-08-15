interface INavimi_JSs {
    init: (navimiDom: INavimi_Dom, 
        navimiFetch: INavimi_Fetch, 
        navimiTemplates: INavimi_Templates, 
        navimiState: INavimi_State, 
        navimiComponents: INavimi_Components, 
        navimiHelpers: INavimi_Helpers, 
        options: INavimi_Options) => void;
    isJsLoaded: (url: string) => boolean;
    getInstance: (url: string) => InstanceType<any>;
    fetchJS: (abortController: AbortController, urls: string[], type: string) => Promise<InstanceType<any> | InstanceType<any>[]>;
    loadDependencies: (abortController: AbortController, jsUrl: string, services: string[], components: string[]) => Promise<void>;
    initJS: (jsUrl: string, params: INavimi_KeyList<any>) => Promise<void>;
    reloadJs: (filePath: string, jsCode: string, callback: Function) => void;
}