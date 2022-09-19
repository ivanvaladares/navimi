interface INavimi_Components {
    init: (navimiHelpers: INavimi_Helpers, navimiJSs: INavimi_JSs) => void;
    registerComponent: (componentName: string, componentClass: InstanceType<any>) => void;
    registerChildComponents: (parentNode: INavimi_Component) => void;
    mergeHtml: (template: HTMLBodyElement, node: DocumentFragment) => void;
}

interface INavimi_Component extends Element {
    __rendered: boolean;
    __initalInnerHTML: string;
    __previousTemplate: string;

    props: INavimi_KeyList<any>;
    parentComponent?: INavimi_Component;
    childComponents?: INavimi_Component[];

    init: () => Promise<void> | void;
    render: () => Promise<string> | string;
    update: () => Promise<void> | void;
    
    shouldUpdate?: (prevAttributes: INavimi_KeyList<any>, nextAttributes: INavimi_KeyList<any>) => boolean;
    onRender?: () => void;
    onMount?: () => void;
    onUnmount?: () => void;
}