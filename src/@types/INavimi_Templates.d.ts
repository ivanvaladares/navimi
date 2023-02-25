import { INavimi_Fetch } from './INavimi_Fetch';
import { INavimi_HotPayload } from './Navimi';

declare class INavimi_Templates {
    init: (navimiFetch: INavimi_Fetch) => void;
    isTemplateLoaded: (url: string) => boolean;
    getTemplate: (templateId: string | string[]) => string | string[];
    fetchTemplate: (abortController: AbortController, url: string | string[]) => Promise<void | void[]>;
    digestHot: (payload: INavimi_HotPayload) => Promise<void>;
}

export { INavimi_Templates };
