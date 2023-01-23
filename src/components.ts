class __Navimi_Components implements INavimi_Components {

    private _navimiHelpers: INavimi_Helpers;
    private _navimiState: INavimi_State;
    private _components: INavimi_KeyList<any> = {};
    private _uidCounter = 0;

    public init(navimiHelpers: INavimi_Helpers, navimiState: INavimi_State): void {
        
        this._navimiHelpers = navimiHelpers;
        this._navimiState = navimiState;

        new window.MutationObserver((mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                    const node = mutation.target as INavimi_Component;
                    if (this._components[node.localName]) {
                        const prevAttributes = this._readAttributes(node);
                        if (!node.shouldUpdate || node.shouldUpdate(prevAttributes, node.props)) {
                            node.update();
                        }
                    }
                } else {
                    [].slice.call(mutation.addedNodes).map((addedNode: INavimi_Component) => {
                        this._traverseComponentsTree(addedNode, this._registerTag);
                    });
                    [].slice.call(mutation.removedNodes).map((removedNode: INavimi_Component) => {
                        // todo: create a queue to remove components and give priority to adding components
                        this._traverseComponentsTree(removedNode, this._removeComponent);
                    });
                }
            });
        }).observe(document, { childList: true, subtree: true, attributes: true });
    }

    private _removeComponent = (node: INavimi_Component): void => {
        if (node.localName && !node.__removed && this._components[node.localName]) {
            node.__removed = true;
            this._removeChildComponents(node);
            this._disconnectComponent(node);
            node.remove();
            node.___onUnmount && node.___onUnmount();
        }
    }

    private _disconnectComponent = (node: INavimi_Component): void => {
        if (node.parentComponent) {
            node.parentComponent.childComponents =
                node.parentComponent.childComponents
                    .filter((child: INavimi_Component) => child !== node);
        }
    };

    private _removeChildComponents = (node: INavimi_Component): void => {
        node.childComponents &&
            node.childComponents.map((child: INavimi_Component) => {
                this._removeComponent(child);
            });
    };

    private _readAttributes = (node: INavimi_Component): INavimi_KeyList<any> => {
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

    private _traverseComponentsTree = (node: INavimi_Component, callback: (node: INavimi_Component) => void): void => {
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

        const component = new componentClass(node);

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

    private _bindChildEvents = (parentNode: INavimi_Component, childNode: INavimi_Component): void => {
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

    private _registerChildNodes = (parentNode: INavimi_Component): void => {
        const traverse = (node: INavimi_Component): void => {
            [].slice.call(node.childNodes).map((childNode: INavimi_Component) => {
                if (!this._components[childNode.localName]) {
                    // bind child tags events to the parent
                    this._bindChildEvents(parentNode, childNode);
                    traverse(childNode);
                }
            });
        };
        traverse(parentNode);
    };

    private _mergeHtml = (template: HTMLBodyElement, node: DocumentFragment) => {

        const getNodeType = (node: any) => {
            if (node.nodeType === 3) return 'text';
            if (node.nodeType === 8) return 'comment';
            return node.tagName.toLowerCase();
        };

        const getNodeContent = (node: any) => {
            if (node.childNodes && node.childNodes.length > 0) return null;
            return node.textContent;
        };

        const templateNodes = [].slice.call(template.childNodes);
        let documentNodes = [].slice.call(node.childNodes);
        let diffCount = documentNodes.length - templateNodes.length;

        for (let index = 0; index < templateNodes.length; index++) {

            const templateNode = templateNodes[index];

            // new node, create it
            if (!documentNodes[index]) {
                node.appendChild(templateNode.cloneNode(true));
                continue;
            }

            // add/remove nodes to match the template
            if (getNodeType(templateNode) !== getNodeType(documentNodes[index])) {
                if (diffCount > 0) {
                    this._traverseComponentsTree(documentNodes[index], this._removeComponent);
                    if (documentNodes[index].parentNode) {
                        documentNodes[index].parentNode.removeChild(documentNodes[index]);
                    }
                    index--;
                } else {
                    node.insertBefore(templateNode.cloneNode(true), documentNodes[index]);
                }
                documentNodes = [].slice.call(node.childNodes);
                continue;
            }

            // update text content
            const templateContent = getNodeContent(templateNode);
            if (templateContent && templateContent !== getNodeContent(documentNodes[index])) {
                documentNodes[index].textContent = templateContent;
            }

            if (templateNode.localName) {

                // sync attributes
                if (templateNode.localName === documentNodes[index].localName) {
                    const attr1 = [].slice.call(documentNodes[index].attributes);
                    const attr2 = [].slice.call(templateNode.attributes);

                    const update = attr2.filter((n: any) => attr1.find((x: any) => n.name === x.name && n.value !== x.value));
                    const remove = attr1.filter((n: any) => !attr2.find((x: any) => n.name === x.name));
                    const add = attr2.filter((n: any) => !attr1.find((x: any) => n.name === x.name));

                    remove.map((attr: any) => {
                        documentNodes[index].removeAttribute(attr.name);
                    });

                    [...update, ...add].map((attr: any) => {
                        documentNodes[index].setAttribute(attr.name, attr.value);
                    });
                }

                if (this._components[templateNode.localName]) {
                    // stop here! do not work on others component's childrens
                    continue;
                }

                // clear child nodes
                if (documentNodes[index].childNodes.length > 0 && templateNode.childNodes.length < 1) {
                    documentNodes[index].innerHTML = '';
                    continue;
                }

                // prepare empty node for next round
                if (documentNodes[index].childNodes.length < 1 && templateNode.childNodes.length > 0) {
                    const fragment = document.createDocumentFragment();
                    this._mergeHtml(templateNode, fragment);
                    documentNodes[index].appendChild(fragment);
                    continue;
                }

                // dive deeper into the tree
                if (templateNode.childNodes.length > 0) {
                    this._mergeHtml(templateNode, documentNodes[index]);
                }
            }

        }

        // remove extra elements
        diffCount = documentNodes.length - templateNodes.length;
        while (diffCount > 0) {
            const index = documentNodes.length - diffCount;
            this._traverseComponentsTree(documentNodes[index], this._removeComponent);
            documentNodes[index].parentNode &&
                documentNodes[index].parentNode.removeChild(documentNodes[index]);
            diffCount--;
        }

        this._registerChildNodes(node as unknown as INavimi_Component);

    };

    public registerComponent = (
        componentName: string,
        componentClass: InstanceType<any>,
        getFunctions: (callerUid: string) => INavimi_Functions,
        services: INavimi_KeyList<InstanceType<any>>): InstanceType<any> => {

        if (!componentName || !/-/.test(componentName)) {
            return;
        }

        if (!getFunctions) {
            getFunctions = () => undefined;
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;

        Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);

        const wrappedComponentClass = class {

            private _component: any;
            private _node: any;
            private _uid: string;
            private _previousTemplate: string;
            private _initalInnerHTML: string;

            constructor(node: any) {
                this._uid = `component:${that._uidCounter++}`;
                this._node = node;

                this._previousTemplate = undefined;
                this._initalInnerHTML = node.innerHTML;
                node.innerHTML = '';

                this._component = new componentClass(this._node.props, getFunctions(this._uid), services);

                // connects the component code to the tag 
                Object.setPrototypeOf(this._node, this._component);

                // todo: check if this timer (16ms = 60fps) can become an option in case someone needs different fps
                this._component.update = that._navimiHelpers.throttle(this.render, 16, this._node);

                this._component.___onUnmount = () => {
                    that._navimiState.unwatchState(this._uid);
                    this._component.onUnmount && this._component.onUnmount.call(this._node);
                }
            }

            init = async () => {
                await this.render();
                this._component.onMount && await this._component.onMount.call(this._node);
            }

            render = async () => {
                const html = this._component.render && await this._component.render.call(this._node, this._initalInnerHTML);

                if (html && html !== this._previousTemplate) {

                    this._previousTemplate = html;

                    const template = new DOMParser().parseFromString(html, 'text/html');

                    that._mergeHtml(template.querySelector('body'), this._node);
                }

                this._component.onRender && this._component.onRender.call(this._node);
            }
        };

        this._components[componentName] = wrappedComponentClass;

        return wrappedComponentClass;
    };

}

//removeIf(dist)
module.exports.components = __Navimi_Components;
//endRemoveIf(dist)