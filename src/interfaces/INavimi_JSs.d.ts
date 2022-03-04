interface INavimi_JSs {
    init: (navimiDom: INavimi_Dom, navimiFetch: INavimi_Fetch, navimiTemplates: INavimi_Templates, navimiState: INavimi_State, navimiHelpers: INavimi_Helpers, options: INavimi_Options) => void;
    isJsLoaded: (url: string) => boolean;
    getInstance: (url: string) => InstanceType<any>;
    fetchJS: (abortController: AbortController, urls: string[], external?: boolean, module?: boolean) => Promise<InstanceType<any> | InstanceType<any>[]>;
    loadServices: (abortController: AbortController, jsUrl: string, services: string[]) => void;
    initJS: (jsUrl: string, params: INavimi_KeyList<any>) => Promise<void>;
    reloadJs: (filePath: string, jsCode: string, routeList: INavimi_KeyList<INavimi_Route>, currentJS: string, callback: () => void) => void;
}