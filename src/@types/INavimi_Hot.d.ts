interface INavimi_Hot {
    init: (navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs, navimiTemplates: INavimi_Templates, initRoute: Function) => void;
    openHotWs: (hotOption: number | boolean) => void;
}