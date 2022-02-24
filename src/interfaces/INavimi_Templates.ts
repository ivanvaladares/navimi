interface INavimi_Templates {
    init: (navimiFetch: INavimi_Fetch) => void;
    isTemplateLoaded: (url: string) => boolean;
    getTemplate: (templateId: string | string[]) => string | string[];
    fetchTemplate: (abortController: AbortController, urls: string[], jsUrl?: string) => Promise<void | void[]>;
    reloadTemplate: (filePath: string, templateCode: string, routeList: INavimi_KeyList<INavimi_Route>, currentJS: string, globalTemplatesUrl: string, callback: any) => void;
}
