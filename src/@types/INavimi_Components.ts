interface INavimi_Components {
    init: (navimiHelpers: INavimi_Helpers, navimiState: INavimi_State) => void;
    registerComponent: (
        componentName: string, 
        componentClass: InstanceType<any>,
        functions: (callerUid: string) => INavimi_Functions,
        services: INavimi_KeyList<InstanceType<any>>) => InstanceType<any>;
}

interface INavimi_Component extends Element {
    __removed: boolean;

    props: INavimi_KeyList<any>;
    parentComponent?: INavimi_Component;
    childComponents?: INavimi_Component[];

    init: () => Promise<void> | void;
    render: () => Promise<string> | string;
    update: () => Promise<void> | void;
    shouldUpdate?: (prevAttributes: INavimi_KeyList<any>, nextAttributes: INavimi_KeyList<any>) => boolean;
    ___onUnmount?: () => void;
}