interface INavimi_CSSs {
    init: (navimiFetch: INavimi_Fetch) => void;
    isCssLoaded: (url: string) => boolean;
    fetchCss: (abortController: AbortController, url: string) => Promise<void>;
    insertCss: (url: string, type: string, prepend?: boolean) => void;
    style: (...styles: object[]) => string;
    digestHot: (payload: hotPayload) => Promise<void>;
}

interface INavimi_CssRule {
    child: string;
    media: string;
    cssRule: string[];
    className?: string;
}
