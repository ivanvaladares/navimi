interface INavimi_CSSs {
    init: (navimiDom: INavimi_Dom, navimiFetch: INavimi_Fetch) => void;
    isCssLoaded: (url: string) => boolean;
    getCss: (url: string) => string;
    fetchCss: (abortController: AbortController, url: string) => Promise<string>;
    reloadCss: (filePath: string, cssCode: string) => void;
}