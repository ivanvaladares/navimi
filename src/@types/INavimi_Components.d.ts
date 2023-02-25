import { INavimi_Helpers } from './INavimi_Helpers';
import { INavimi_State } from './INavimi_State';
import { INavimi_Functions } from './Navimi';

declare class INavimi_Components {
    init: (navimiHelpers: INavimi_Helpers, navimiState: INavimi_State) => void;
    registerComponent: (
        componentName: string, 
        componentClass: InstanceType<any>,
        functions?: (callerUid: string) => INavimi_Functions,
        services?: Record<string, InstanceType<any>>) => InstanceType<any>;
}

declare class INavimi_Component extends Element {
    __removed?: boolean;
    __uid?: string;
    props: Record<string, string>;
    parentComponent: INavimi_Component;
    childComponents: INavimi_Component[];

    constructor(props: Record<string, string>, functions: INavimi_Functions, services: Record<string, InstanceType<any>>);
    init?: () => Promise<void> | void;
    render: () => Promise<string> | string;
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
}

export { INavimi_Components, INavimi_Component, INavimi_WrappedComponent };
