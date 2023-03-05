import { INavimi_Components, INavimi_Component, INavimi_WrappedComponent } from './@types/INavimi_Components';
import { INavimi_State } from './@types/INavimi_State';
import { INavimi_Functions } from './@types/Navimi';
import { getNodeContent } from './helpers/getNodeContent';
import { getNodeType } from './helpers/getNodeType';
import { mergeHtmlElement } from './helpers/mergeHtmlElement';
import { syncAttributes } from './helpers/syncAttributes';
import { throttle } from './helpers/throttle';

class __Navimi_Components implements INavimi_Components {

    private _navimiState: INavimi_State;
    private _components: Record<string, InstanceType<any>> = {};
    private _uidCounter = 0;

    public init(navimiState: INavimi_State): void {

        this._navimiState = navimiState;

        new window.MutationObserver((mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                    const node = mutation.target as INavimi_Component;
                    if (this._components[node.localName]) {
                        const prevAttributes = this._readAttributes(node);
                        if (!node.shouldUpdate || node.shouldUpdate(prevAttributes, node.props)) {
                            node.update && node.update();
                        }
                    }
                } else {
                    [].slice.call(mutation.addedNodes).map((addedNode: INavimi_Component) => {
                        this._traverseComponentsTree(addedNode, this._registerTag);
                    });
                    [].slice.call(mutation.removedNodes).map((removedNode: INavimi_Component) => {
                        this._traverseComponentsTree(removedNode, this._removeComponent);
                    });
                }
            });
        }).observe(document, { childList: true, subtree: true, attributes: true });
    }

    private _removeComponent = (node: INavimi_Component): void => {
        if (node.localName && this._components[node.localName] && node.__wrapper) {
            node.__wrapper.unmount();
        }
    }

    private _disconnectFromParent = (node: INavimi_Component): void => {
        if (node.parentComponent) {
            node.parentComponent.childComponents =
                node.parentComponent.childComponents
                    .filter(child => child !== node);
        }
    };

    private _removeChildComponents = (node: INavimi_Component): void => {
        node.childComponents &&
            node.childComponents.map(child => {
                this._removeComponent(child);
            });
    };

    private _readAttributes = (node: INavimi_Component): Record<string, string> => {
        const prevAttributes = node.props;
        node.props = {};
        [].slice.call(node.attributes).map((attr: any) => {
            const name = attr.name;
            //@ts-ignore
            if (typeof node[name] !== 'function') {
                node.props = {
                    ...node.props || {},
                    [name]: attr.value
                };
            }
        });
        return prevAttributes;
    };

    private _traverseComponentsTree = (node: Element, callback: (node: Element) => void): void => {
        if (node.localName) {
            if (this._components[node.localName]) {
                callback(node);
            } else {
                [].slice.call(node.childNodes).map((childNode: INavimi_Component) => {
                    this._traverseComponentsTree(childNode, callback);
                });
            }
        }
    };

    private _registerTag = (node: INavimi_Component, parentNode?: INavimi_Component): void => {
        if (node.props || !this._components[node.localName]) {
            return;
        }

        const componentClass = this._components[node.localName];

        // initializes the component props
        node.props = {};
        node.parentComponent = undefined;
        node.childComponents = [];

        this._findParentComponent(node, parentNode);
        this._readAttributes(node);

        const component = new componentClass(node, node.props);

        component.init();
    };

    private _findParentComponent = (node: INavimi_Component, parentNode?: INavimi_Component): void => {

        const register = (parent: INavimi_Component) => {
            node.parentComponent = parent;
            parent.childComponents = [
                ...parent.childComponents || [],
                node,
            ];
        }

        if (parentNode) {
            register(parentNode);
            return;
        }

        let parent = node.parentNode as INavimi_Component;

        while (parent) {
            if (/-/.test(parent.localName) && this._components[parent.localName]) {
                register(parent);
                return;
            }
            parent = parent.parentNode as INavimi_Component;
        }
    }

    private _bindChildEvents = (parentNode: Element, childNode: Element): void => {
        if (childNode.attributes) {
            [].slice.call(childNode.attributes).map((attr: any) => {
                const name = attr.name;
                //@ts-ignore
                if (typeof childNode[name] === 'function') {
                    //@ts-ignore
                    childNode[name] = childNode[name].bind(parentNode);
                }
            });
        }
    };

    private _registerChildNodes = (parentNode: Element): void => {
        const traverse = (node: Element): void => {
            [].slice.call(node.childNodes).map((childNode: Element) => {
                if (!this._components[childNode.localName]) {
                    // bind child tags events to the parent
                    this._bindChildEvents(parentNode, childNode);
                    traverse(childNode);
                }
            });
        };
        traverse(parentNode);
    };

    private _mergeHtml = (template: Element, node: Element | DocumentFragment) => {
        const templateNodes: Element[] = [].slice.call(template.childNodes);
        const documentNodes: Element[] = [].slice.call(node.childNodes);
        let diffCount = documentNodes.length - templateNodes.length;
        const templateNodesLen = templateNodes.length;
        const documentNodesLen = documentNodes.length;

        for (let i = 0; i < templateNodesLen; i++) {
            const templateNode = templateNodes[i];
            const documentNode = documentNodes[i];

            // new node, create it
            if (!documentNode) {
                node.appendChild(templateNode.cloneNode(true));
                continue;
            }

            // add/remove nodes to match the template
            if (getNodeType(templateNode) !== getNodeType(documentNode)) {
                if (diffCount > 0) {
                    this._traverseComponentsTree(documentNode as Element, this._removeComponent);
                    if (documentNode.parentNode) {
                        documentNode.parentNode.removeChild(documentNode);
                    }
                    i--;
                    diffCount--;
                } else {
                    node.insertBefore(templateNode.cloneNode(true), documentNode);
                }
                continue;
            }

            // update text content
            const templateContent = getNodeContent(templateNode);
            const documentContent = getNodeContent(documentNode);
            if (templateContent && templateContent !== documentContent) {
                documentNode.textContent = templateContent;
            }

            if (templateNode.localName) {
                syncAttributes(templateNode, documentNode);
                // Check if the element is a component and stop
                if (!this._components[templateNode.localName]) {
                    mergeHtmlElement(templateNode, documentNode, this._mergeHtml);
                }
            }
        }

        // remove extra elements
        diffCount = documentNodesLen - templateNodesLen;
        for (let i = documentNodesLen - 1; i >= templateNodesLen; i--) {
            this._traverseComponentsTree(documentNodes[i] as Element, this._removeComponent);
            if (documentNodes[i].parentNode) {
                documentNodes[i].parentNode.removeChild(documentNodes[i]);
            }
            diffCount--;
        }

        this._registerChildNodes(node as HTMLElement);
    };

    public registerComponent = (
        componentName: string,
        componentClass: typeof INavimi_Component,
        getFunctions?: (callerUid: string) => INavimi_Functions,
        services?: Record<string, InstanceType<any>>): InstanceType<any> => {

        if (!componentName || !/-/.test(componentName)) {
            return;
        }

        if (!getFunctions) {
            getFunctions = () => undefined;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;

        const wrappedComponentClass = class implements INavimi_WrappedComponent {
            private _node: INavimi_Component;
            private _removed: boolean;
            private _uid: string;
            private _previousTemplate: string | undefined;
            private _initialInnerHTML: string;

            constructor(node: INavimi_Component) {
                this._uid = `component:${that._uidCounter++}`;
                this._node = node;
                this._previousTemplate = undefined;
                this._initialInnerHTML = node.innerHTML;

                node.innerHTML = '';               
                node.__wrapper = this;

                // inherits from HTMLElement
                Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);

                const component = new componentClass(node.props, getFunctions(this._uid), services);

                // todo: check if this timer (16ms = 60fps) can become an option in case someone needs different fps
                node.update = throttle(this.render.bind(this), 16, this);

                // connects the component code to the tag 
                Object.setPrototypeOf(node, component);

            }

            init = async () => {
                await this.render();
                this._node.onMount && await this._node.onMount.call(this._node);
            }

            render = async () => {
                const { render } = this._node;
                if (!render) {
                    return;
                }

                const html = await render.call(this._node, this._initialInnerHTML);
                if (this._removed || !html || html === this._previousTemplate) {
                    return;
                }

                this._previousTemplate = html;
                const template = new DOMParser().parseFromString(html, 'text/html');
                that._mergeHtml(template.querySelector('body'), this._node);

                this._node.onRender && this._node.onRender.call(this._node);
            }

            unmount = () => {
                if (!this._removed) {
                    this._removed = true;
                    that._navimiState.unwatchState(this._uid);
                    that._removeChildComponents(this._node);
                    that._disconnectFromParent(this._node);
                    this._node.remove();
                    this._node.onUnmount && this._node.onUnmount();
                    this._node.update = undefined;
                    this._node.__wrapper = undefined;
                    delete this._node;
                    delete this._uid;
                    delete this._previousTemplate;
                    delete this._initialInnerHTML;
                }
            }

        };

        this._components[componentName] = wrappedComponentClass;

        return wrappedComponentClass;
    };

}

export default __Navimi_Components;
