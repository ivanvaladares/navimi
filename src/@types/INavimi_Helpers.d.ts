import { INavimi_Route } from './Navimi';

type SerializableObject = Record<string, Serializable>;

type Serializable = SerializableObject | SerializableObject[] | string | number | boolean | null;

declare class INavimi_Helpers {
    // eslint-disable-next-line @typescript-eslint/ban-types
    debounce: (task: Function, wait: number) => () => void;
    // eslint-disable-next-line @typescript-eslint/ban-types
    throttle: (task: Function, wait: number, context: any) => () => void;
    getUrl: () => string;
    setTitle: (title: string) => void;
    setNavimiLinks: () => void;
    removeHash: (url: string) => string;
    stringify: (obj: any) => string;
    cloneObject: (obj: any) => Record<string, any>;
    getRouteAndParams: (url: string, routingList: Record<string, INavimi_Route>) => {routeItem: INavimi_Route, params: any};
    getNodeType: (node: Element) => string;
    getNodeContent: (node: Node) => string | null;
    mergeHtmlElement: (templateNode: Element, documentNode: Element, callback: (template: Element, node: Element | DocumentFragment) => void) => void;
    syncAttributes: (templateNode: Element, documentNode: Element) => void;
}

export { INavimi_Helpers };