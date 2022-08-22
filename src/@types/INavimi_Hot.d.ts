interface INavimi_Hot {
    // eslint-disable-next-line @typescript-eslint/ban-types
    init: (navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs, navimiTemplates: INavimi_Templates, initRoute: Function) => void;
    openHotWs: (hotOption: number | boolean) => void;
}