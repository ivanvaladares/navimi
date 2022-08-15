interface INavimi_Templates {
    init: (navimiFetch: INavimi_Fetch) => void;
    isTemplateLoaded: (url: string) => boolean;
    getTemplate: (templateId: string | string[]) => string | string[];
    fetchTemplate: (abortController: AbortController, url: string | string[]) => Promise<void | void[]>;
    reloadTemplate: (filePath: string, templateCode: string, callback: Function) => void;
}
