interface INavimi_Components {
    init: (navimiHelpers: INavimi_Helpers) => void;
    registerComponent: (componentName: string, componentClass: InstanceType<any>) => void;
}

interface INavimi_Component extends Element {
    __tagObserver: MutationObserver;
    __attrObserver: MutationObserver;
    __initalInnerHtml: string;
    __rendered: boolean;
    __oldTemplate: string;

    props: INavimi_KeyList<any>;
    parentComponent?: INavimi_Component;
    childComponents?: INavimi_Component[];

    init: () => Promise<void> | void;
    render: () => Promise<string> | string;
    update: () => Promise<void> | void;
    
    shouldUpdate?: (prevAttributes: INavimi_KeyList<any>, nextAttributes: INavimi_KeyList<any>) => boolean;
    onMount?: () => void;
    onRender?: () => void;
    onUnmount?: () => void;
}