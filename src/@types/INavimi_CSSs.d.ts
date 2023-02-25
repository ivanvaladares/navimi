import { INavimi_Fetch } from './INavimi_Fetch';
import { INavimi_HotPayload } from './Navimi';

declare class INavimi_CSSs {
    init: (navimiFetch: INavimi_Fetch) => void;
    isCssLoaded: (url: string) => boolean;
    fetchCss: (abortController: AbortController, url: string) => Promise<void>;
    insertCss: (url: string, type: string, prepend?: boolean) => void;
    style: (...styles: object[]) => string;
    digestHot: (payload: INavimi_HotPayload) => Promise<void>;
}

interface INavimi_CssRule {
    child: string;
    media: string;
    cssRule: string[];
    className?: string;
}

export { INavimi_CSSs, INavimi_CssRule };
