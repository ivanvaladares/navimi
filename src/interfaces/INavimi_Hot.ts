interface INavimi_Hot {
    init: (navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs, navimiTemplates: INavimi_Templates) => void;
    openHotWs: (hotOption: number | boolean, callback: any) => void;
}