import { INavimi_CSSs } from './INavimi_CSSs';
import { INavimi_JSs } from './INavimi_JSs';
import { INavimi_Templates } from './INavimi_Templates';

declare class INavimi_Hot {
    init: (navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs, navimiTemplates: INavimi_Templates, initRoute: () => void) => void;
    openHotWs: (hotOption: number | boolean) => void;
}

export { INavimi_Hot };