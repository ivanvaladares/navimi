interface INavimi_Dom {
    init: (navimiCSSs: INavimi_CSSs, navimiJSs: INavimi_JSs) => void;
    setTitle: (title: string) => void;
    setNavimiLinks: () => void;
    insertCss: (cssCode: string, url: string, type: string, prepend?: boolean) => void;
    replaceCss: (cssCode: string, url: string) => void ;
    insertJS: (jsCode: string, jsUrl: string, isModule: boolean) => void;
    addLibrary: (url: string | string[] | INavimi_Library[]) => Promise<void>;
}