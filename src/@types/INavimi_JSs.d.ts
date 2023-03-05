import { INavimi_Components } from './INavimi_Components';
import { INavimi_CSSs } from './INavimi_CSSs';
import { INavimi_Fetch } from './INavimi_Fetch';
import { INavimi_State } from './INavimi_State';
import { INavimi_Templates } from './INavimi_Templates';
import { INavimi_Options, INavimi_HotPayload } from './Navimi';

//todo: improve name
type jsType = 'component' | 'javascript' | 'library' | 'module' | 'route' | 'service';
declare class INavimi_JSs {
    init: (
        navimiFetch: INavimi_Fetch,
        navimiCSSs: INavimi_CSSs,
        navimiTemplates: INavimi_Templates,
        navimiState: INavimi_State,
        navimiComponents: INavimi_Components,
        options: INavimi_Options) => void;
    isJsLoaded: (url: string) => boolean;
    getInstance: (url: string) => InstanceType<any>;
    fetchJS: (abortController: AbortController, urls: string[], type: jsType) => Promise<InstanceType<any> | InstanceType<any>[]>;
    loadServices: (abortController: AbortController, jsUrl: string, services: string[]) => Promise<any[]>;
    loadComponents: (abortController: AbortController, jsUrl: string, components: string[]) => Promise<any[]>;
    initRoute: (jsUrl: string, params: Record<string, any>) => Promise<void>;
    digestHot: (payload: INavimi_HotPayload) => Promise<void>;
}

export { INavimi_JSs, jsType };
