import { INavimi_State } from './INavimi_State';
import { INavimi_Functions } from './Navimi';

declare class INavimi_Components {
    init: (navimiState: INavimi_State) => void;
    registerComponent: (
        componentName: string, 
        componentClass: InstanceType<any>,
        functions?: (callerUid: string) => INavimi_Functions,
        services?: Record<string, InstanceType<any>>) => InstanceType<any>;
}

declare class INavimi_Component extends Element {
    __wrapper?: INavimi_WrappedComponent;
    props: Record<string, string>;
    parentComponent: INavimi_Component;
    childComponents: INavimi_Component[];

    constructor(props: Record<string, string>, functions: INavimi_Functions, services: Record<string, InstanceType<any>>);
    render: (children?: string) => Promise<string> | string;
    update?: () => Promise<void> | void;
    shouldUpdate?: (prevAttributes: Record<string, string>, nextAttributes: Record<string, string>) => boolean;
    onMount?: () => void;
    onRender?: () => void;
    onUnmount?: () => void;
}

declare class INavimi_WrappedComponent {
    constructor(node: INavimi_Component);
    init: () => Promise<void>;    
    render: () => Promise<void>;
    unmount: () => void;
}

export { INavimi_Components, INavimi_Component, INavimi_WrappedComponent };
