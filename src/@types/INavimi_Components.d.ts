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

declare class INavimi_Component {
    // [NOVO] Referência ao Web Component real (DOM) injetada pelo framework
    // Use this.element para: querySelector, classList, style, events, etc.
    element: HTMLElement;

    // Props agora podem ser qualquer coisa (vindos dos atributos)
    props: Record<string, any>;

    // Referências para as instâncias lógicas de Pai/Filhos
    parentComponent?: INavimi_Component;
    childComponents: INavimi_Component[];

    constructor(props: Record<string, any>, functions: INavimi_Functions, services: Record<string, InstanceType<any>>);

    // Ciclo de Vida
    render: (children?: string) => Promise<string> | string;
    update?: () => Promise<void> | void;
    shouldUpdate?: (prevAttributes: Record<string, any>, nextAttributes: Record<string, any>) => boolean;
    
    onMount?: () => void;
    onRender?: () => void;
    onUnmount?: () => void;
}

interface INavimi_HTMLElement extends HTMLElement {
    _instance: INavimi_Component; // Acesso direto à lógica interna
    [key: string]: any; // Permite acesso aos métodos proxied (ex: el.addChild())
}
declare class INavimi_WrappedComponent {
    constructor(node: INavimi_Component);
    init: () => Promise<void>;    
    render: () => Promise<void>;
    unmount: () => void;
}

export { INavimi_Components, INavimi_Component, INavimi_HTMLElement, INavimi_WrappedComponent };
