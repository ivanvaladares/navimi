class __Navimi_Components implements INavimi_Components {

    private _components: INavimi_KeyList<any> = {};
    private _navimiHelpers: INavimi_Helpers;

    public init(navimiHelpers: INavimi_Helpers): void {

        this._components = {};
        this._navimiHelpers = navimiHelpers;

        new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let addedNode: INavimi_Component;
                //@ts-ignore
                for (addedNode of mutation.addedNodes) {
                    this._traverseTree(addedNode, this._registerTag);
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    public registerComponent = (componentName: string, componentClass: InstanceType<any>): void => {
        if (!this._components[componentName] && /\-/.test(componentName)) {
            Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);
            this._components[componentName] =
                this._createComponentClass(componentClass, this._registerChildComponents, this.mergeHtml);
        }
    };

    private _removeComponent = (node: INavimi_Component): void => {
        if (node.localName && node.__rendered && this._components[node.localName]) {
            node.__rendered = false;
            this._removeChildComponents(node);
            this._disconnectComponent(node);
            node.remove();
            node.onUnmount && node.onUnmount();
        }
    }

    private _disconnectComponent = (node: INavimi_Component): void => {
        if (node.parentComponent) {
            node.parentComponent.childComponents =
                node.parentComponent.childComponents
                    .filter((child: INavimi_Component) => child !== node);
        }

        if (node.__tagObserver) {
            node.__tagObserver.disconnect();
            node.__tagObserver = null;
        }

        if (node.__attrObserver) {
            node.__attrObserver.disconnect();
            node.__attrObserver = null;
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
        for (let attr of [].slice.call(node.attributes)) {
            const name = attr.name;
            //@ts-ignore
            if (typeof node[name] !== "function") {
                node.props = {
                    ...node.props || {},
                    [name]: attr.value
                };
            }
        }
        return prevAttributes;
    };

    private _traverseTree = (node: INavimi_Component, callback: (node: INavimi_Component) => void): void => {
        if (node.localName) {
            if (this._components[node.localName]) {
                callback(node);
            } else {
                let childNode: INavimi_Component;
                //@ts-ignore
                for (childNode of node.children) {
                    this._traverseTree(childNode, callback);
                }
            }
        }
    };

    private _registerTag = async (node: INavimi_Component, parentNode?: INavimi_Component): Promise<void> => {
        if (node.props) {
            return;
        }

        const componentClass = this._components[node.localName];

        // initializes the component props
        node.props = {};
        node.__rendered = false;
        node.__oldTemplate = undefined;
        node.__initalInnerHtml = node.innerHTML;
        node.innerHTML = "";
        node.parentComponent = undefined;
        node.childComponents = [];

        this._findParentComponent(node, parentNode);
        this._readAttributes(node);

        // connects the component class to the tag 
        // todo: pass navimi services to the component class
        Object.setPrototypeOf(node, new componentClass());
        
        // todo: check if this time (10) can become an option in case someone needs higher frame rates
        node.update = this._navimiHelpers.throttle(node.render, 10, node); 

        // observer to detect removed components
        node.__tagObserver = new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let removedNode: INavimi_Component;
                //@ts-ignore
                for (removedNode of mutation.removedNodes) {
                    this._traverseTree(removedNode, this._removeComponent);
                }
            }
        });
        node.__tagObserver.observe(document.documentElement, { childList: true, subtree: true });

        // observer to detect changes in the dom and refresh the attributes
        node.__attrObserver = new MutationObserver((mutations: MutationRecord[]) => {
            if (mutations.find(mutation => mutation.type === "attributes")) {
                const prevAttributes = this._readAttributes(node);
                if (!node.shouldUpdate || node.shouldUpdate(prevAttributes, node.props)) {
                    node.update();
                }
            }
        });
        node.__attrObserver.observe(node, { attributes: true });

        await node.init();
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
            if (/\-/.test(parent.localName) && this._components[parent.localName]) {
                register(parent);
                return;
            }
            parent = parent.parentNode as INavimi_Component;
        }
    }

    private _registerChildEvents = (parentNode: INavimi_Component, childNode: INavimi_Component): void => {
        if (childNode.attributes) {
            for (let attr of [].slice.call(childNode.attributes)) {
                const name = attr.name;
                //@ts-ignore
                if (typeof childNode[name] === "function") {
                    //@ts-ignore
                    childNode[name] = childNode[name].bind(parentNode);
                }
            }
        }
    };

    private _registerChildComponents = (parentNode: INavimi_Component): void => {
        const traverse = (node: INavimi_Component): void => {
            let childNode: INavimi_Component;
            //@ts-ignore
            for (childNode of node.childNodes) {
                if (this._components[childNode.localName]) {
                    this._registerTag(childNode, parentNode);
                } else {
                    // bind child tags events to the parent
                    this._registerChildEvents(parentNode, childNode);
                    traverse(childNode);
                }
            }
        };
        traverse(parentNode);
    };

    private mergeHtml = (template: DocumentFragment, node: DocumentFragment) => {

        const getNodeType = (node: any) => {
            if (node.nodeType === 3) return 'text';
            if (node.nodeType === 8) return 'comment';
            return node.tagName.toLowerCase();
        };

        const getNodeContent = (node: any) => {
            if (node.childNodes && node.childNodes.length > 0) return null;
            return node.textContent;
        };

        var documentNodes = [].slice.call(node.childNodes);
        var templateNodes = [].slice.call(template.childNodes);
        var diffCount = documentNodes.length - templateNodes.length;

        for (let index = 0; index < templateNodes.length; index++) {

            let templateNode = templateNodes[index];

            // new node, create it
            if (!documentNodes[index]) {
                node.appendChild(templateNode.cloneNode(true));
                continue;
            }

            // add/remove nodes to match the template
            if (getNodeType(templateNode) !== getNodeType(documentNodes[index])) {
                if (diffCount > 0) {
                    this._traverseTree(documentNodes[index], this._removeComponent);
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
            var templateContent = getNodeContent(templateNode);
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
                };

                // clear child nodes
                if (documentNodes[index].childNodes.length > 0 && templateNode.childNodes.length < 1) {
                    documentNodes[index].innerHTML = '';
                    continue;
                }

                // prepare empty node for next round
                if (documentNodes[index].childNodes.length < 1 && templateNode.childNodes.length > 0) {
                    var fragment = document.createDocumentFragment();
                    this.mergeHtml(templateNode, fragment);
                    documentNodes[index].appendChild(fragment);
                    continue;
                }

                // dive deeper into the tree
                if (templateNode.childNodes.length > 0) {
                    this.mergeHtml(templateNode, documentNodes[index]);
                }
            }

        }

        // remove extra elements
        diffCount = documentNodes.length - templateNodes.length;
        while (diffCount > 0) {
            const index = documentNodes.length - diffCount;
            this._traverseTree(documentNodes[index], this._removeComponent);
            documentNodes[index].parentNode &&
                documentNodes[index].parentNode.removeChild(documentNodes[index]);
            diffCount--;
        }

    };

    private _createComponentClass = (
        componentClass: InstanceType<any>,
        registerChildComponents: (node: any) => void,
        mergeHtml: (template: any, node: any) => void
    ): InstanceType<any> => {

        return class extends (componentClass) {

            constructor(props: any) {
                super(props);
            }

            async init() {
                super.init && await super.init();
                await this.render();
                super.onMount && await super.onMount();
            }

            async render() {

                this.__rendered = true;

                const html = super.render && await super.render(this.__initalInnerHtml);

                if (html && html !== this.__oldTemplate) {

                    this.__oldTemplate = html;

                    const domParser = new DOMParser();

                    const template = domParser.parseFromString(html, "text/html");

                    mergeHtml(template.querySelector("body"), this);

                    registerChildComponents(this);
                }

                super.onRender && super.onRender();

            }
        }
    };
}