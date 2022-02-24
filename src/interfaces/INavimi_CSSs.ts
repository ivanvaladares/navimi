interface INavimi_CSSs {
    init: (navimiDom: INavimi_Dom, navimiFetch: INavimi_Fetch) => void;
    isCssLoaded: (url: string) => boolean;
    getCss: (url: string) => string;
    fetchCss: (abortController: AbortController, url: string, autoInsert?: boolean) => Promise<void | void[]>;
    reloadCss: (filePath: string, cssCode: string, routeList: INavimi_KeyList<INavimi_Route>, currentJS: string, globalCssUrl: string) => void;
}