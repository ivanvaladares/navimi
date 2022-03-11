interface INavimi_Dom {
    init: (navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs) => void;
    setTitle: (title: string) => void;
    setNavimiLinks: () => void;
    insertCss: (cssCode: string, type?: string, prepend?: boolean) => void;
    insertJS: (jsCode: string, jsUrl: string, isModule: boolean) => void;
    addLibrary: (url: string | string[] | INavimi_Library[]) => Promise<void>;
}