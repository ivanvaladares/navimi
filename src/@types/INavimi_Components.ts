interface INavimi_Components {
    init: (navimiHelpers: INavimi_Helpers) => void;
    registerComponent: (name: string, componentClass: InstanceType<any>) => void;
}

interface INavimi_ComponentProps {
    parentComponent?: INavimi_Component;
    childComponents?: INavimi_Component[];
    attributes?: INavimi_KeyList<any>;
    children?: string;
}

interface INavimi_Component extends Element {
    _observer: MutationObserver;
    _attrObserver: MutationObserver;

    props: INavimi_ComponentProps;

    init: () => Promise<void> | void;
    update: () => Promise<void> | void;
    render: () => Promise<string> | string;
    shouldUpdate?: (prevAttributes: INavimi_KeyList<any>, nextAttributes: INavimi_KeyList<any>) => boolean;
    onAfterRender?: () => void;
    onAfterRemove?: () => void;
}