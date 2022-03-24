class __Navimi_Components implements INavimi_Components {

    private _components: INavimi_KeyList<any> = {};
    private _navimiHelpers: INavimi_Helpers;

    public init(navimiHelpers: INavimi_Helpers): void {

        this._components = {};
        this._navimiHelpers = navimiHelpers;

        // todo: check if I shold remove this and fire the register after the route render
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
                this._createComponentClass(componentClass, this._removeChildComponents, this._registerChildComponents);
        }
    };

    private _removeComponent = (node: INavimi_Component): void => {
        if (node.localName && this._components[node.localName]) {
            this._removeChildComponents(node);
            this._disconnectComponent(node);
            node.remove();
            node.onAfterRemove && node.onAfterRemove();
        }
    }

    private _disconnectComponent = (node: INavimi_Component): void => {
        if (node.props && node.props.parentComponent) {
            node.props.parentComponent.props.childComponents =
                node.props.parentComponent.props.childComponents
                    .filter((child: INavimi_Component) => child !== node);
        }

        if (node._tagObserver) {
            node._tagObserver.disconnect();
            node._tagObserver = null;
        }

        if (node._attrObserver) {
            node._attrObserver.disconnect();
            node._attrObserver = null;
        }
    };

    private _removeChildComponents = (node: INavimi_Component): void => {
        node.props && node.props.childComponents &&
            node.props.childComponents.map((child: INavimi_Component) => {
                this._removeComponent(child);
            });
    };

    private _readAttributes = (node: INavimi_Component): INavimi_KeyList<any> => {
        const prevAttributes = node.props.attributes;
        node.props.attributes = undefined;
        for (let attr of [].slice.call(node.attributes)) {
            let name = attr.name;
            //@ts-ignore
            if (/^n\-.*/.test(name)) {
                name = name.substring(2);
                node.props.attributes = {
                    ...node.props.attributes || {},
                    [name]: attr.value
                };
            }
        }
        return prevAttributes;
    }

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
    }

    private _registerTag = async (node: INavimi_Component, parentNode?: INavimi_Component): Promise<void> => {
        if (node.props) {
            return;
        }

        const componentClass = this._components[node.localName];

        // connects the component class to the tag 
        // todo: pass navimi services to the component class
        Object.setPrototypeOf(node, new componentClass());

        // initializes the component props
        node.props = {};

        this._readAttributes(node);

        const parent = node.parentElement;

        // observer to detect removed components
        node._tagObserver = new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let removedNode: INavimi_Component;
                //@ts-ignore
                for (removedNode of mutation.removedNodes) {
                    this._traverseTree(removedNode, this._removeComponent);
                }
            }
        });
        node._tagObserver.observe(parent, { childList: true });

        // observer to detect changes in the dom and refresh the attributes
        node._attrObserver = new MutationObserver((mutations: MutationRecord[]) => {
            if (mutations.find(mutation => mutation.type === "attributes")) {
                const prevAttributes = this._readAttributes(node);
                if (!node.shouldUpdate || node.shouldUpdate(prevAttributes, node.props.attributes)) {
                    node.update();
                }
            }
        });
        node._attrObserver.observe(node, { attributes: true });

        this._connectParentComponent(node, parentNode);

        await node.init();
    };

    private _connectParentComponent = (node: INavimi_Component, parentNode?: INavimi_Component): void => {
        let parent = node.parentNode as INavimi_Component;
        const connect = (parent: INavimi_Component): void => {
            node.props.parentComponent = parent;
            parent.props.childComponents = [
                ...parent.props.childComponents || [],
                node,
            ];
        };
        if (parentNode) {
            connect(parentNode);
            return;
        }
        // no parent defined, let's find the parent in the dom
        while (parent) {
            if (/\-/.test(parent.localName) && this._components[parent.localName]) {
                connect(parent);
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
                typeof childNode[name] === "function" && (childNode[name] = childNode[name].bind(parentNode));
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
    }

    private _createComponentClass = (
        componentClass: InstanceType<any>,
        beforeRender: (node: any) => void,
        afterRender: (node: any) => void
    ): InstanceType<any> => {

        return class extends (componentClass) {

            constructor() {
                super();
            }

            async init() {
                super.init && await super.init();
                this.render();
            }

            async update() {
                await this.render();
            }

            async render() {

                beforeRender(this);

                if (this.props.children === undefined) {
                    this.props.children = this.innerHTML;
                }

                // todo: use virtual or shadow dom.
                this.innerHTML = super.render && await super.render();

                afterRender(this);

                super.onAfterRender && super.onAfterRender();

            }
        }
    };
}