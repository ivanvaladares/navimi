interface INavimi_Components {
    init: (navimiHelpers: INavimi_Helpers) => void;
    registerComponent: (name: string, componentClass: InstanceType<any>) => void;
    registerTag: (element: Element) => void;
    findParentComponent: (node: any) => void;
    findChildComponents: (parent: any, node: any) => void;
    createElement: (Element: InstanceType<any>, navimiComponents: any) => InstanceType<any>;
}