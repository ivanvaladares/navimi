class __Navimi_Components implements INavimi_Components {

    private _components: INavimi_KeyList<any> = {};
    private _navimiHelpers: INavimi_Helpers;

    public init(navimiHelpers: INavimi_Helpers): void {

        this._components = {};
        this._navimiHelpers = navimiHelpers;

        // todo: check if I shold remove this and fire the register after the route render
        new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let node: INavimi_Component;
                let child: INavimi_Component;
                //@ts-ignore
                for (node of mutation.addedNodes) {
                    if (node.localName) {
                        if (this._components[node.localName]) {
                            this._registerTag(node);
                        } else {
                            //@ts-ignore
                            for (child of node.children) {
                                if (child.localName && this._components[child.localName]) {
                                    this._registerTag(child);
                                }
                            }
                        }
                    }
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    public registerComponent = (name: string, componentClass: InstanceType<any>): void => {
        if (!this._components[name] && /\-/.test(name)) {
            Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);
            this._components[name] =
                this._createComponentClass(componentClass, this._removeChildComponents, this._registerChildComponents);
        }
    };

    private _removeComponent = (component: INavimi_Component): void => {
        if (component.localName && this._components[component.localName]) {
            this._removeChildComponents(component);
            this._disconnectComponent(component);
            component.remove();
            component.onAfterRemove && component.onAfterRemove();
        }
    }

    private _disconnectComponent = (node: INavimi_Component): void => {
        if (node.props && node.props.parentComponent) {
            node.props.parentComponent.props.childComponents =
                node.props.parentComponent.props.childComponents
                    .filter((child: INavimi_Component) => child != node);
        }

        if (node._observer) {
            node._observer.disconnect();
            node._observer = null;
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
        for (let list of [].slice.call(node.attributes)) {
            const name = list.name;
            //@ts-ignore
            if (typeof node[name] !== "function") {
                node.props.attributes = {
                    ...node.props.attributes || {},
                    [name]: list.value
                };
            }
        }
        return prevAttributes;
    }

    private _registerTag = async (tag: INavimi_Component): Promise<void> => {
        if (tag.props) {
            return;
        }

        const componentClass = this._components[tag.localName];

        // connects the component class to the tag 
        // todo: pass navimi services to the component class
        Object.setPrototypeOf(tag, new componentClass());

        // initializes the component props
        tag.props = {};

        this._readAttributes(tag);

        const parent = tag.parentElement;

        // observer to detect removed components
        tag._observer = new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let node: INavimi_Component;
                let child: INavimi_Component;
                //@ts-ignore
                for (node of mutation.removedNodes) {
                    if (node.localName) {
                        if (this._components[node.localName]) {
                            this._removeComponent(node);
                        } else {
                            //@ts-ignore
                            for (child of node.children) {
                                if (child.localName && this._components[child.localName]) {
                                    this._removeComponent(child);
                                }
                            }
                        }
                    }
                }
            }
        });
        tag._observer.observe(parent, { childList: true, subtree: true });

        // observer to detect changes in the dom and refresh the attributes
        tag._attrObserver = new MutationObserver((mutations: MutationRecord[]) => {
            if (mutations.find(mutation => mutation.type === "attributes")) {
                const prevAttributes = this._readAttributes(tag);
                if (!tag.shouldUpdate || tag.shouldUpdate(prevAttributes, tag.props.attributes)) {
                    tag.update();
                }
            }
        });
        tag._attrObserver.observe(tag, { attributes: true });

        this._findParentComponent(tag);

        await tag.init();
    };

    private _findParentComponent = (node: INavimi_Component): void => {
        let parent = node.parentNode as INavimi_Component;
        while (parent) {
            if (/\-/.test(parent.localName) && this._components[parent.localName]) {
                node.props.parentComponent = parent;
                parent.props.childComponents = [
                    ...parent.props.childComponents || [],
                    node,
                ];
                return;
            }
            parent = parent.parentNode as INavimi_Component;
        }
    }

    private _registerChildEvents = (parent: INavimi_Component, child: INavimi_Component): void => {
        if (child.attributes) {
            for (let list of [].slice.call(child.attributes)) {
                const name = list.name;
                //@ts-ignore
                typeof child[name] === "function" && (child[name] = child[name].bind(parent));
            }
        }
    };

    private _registerChildComponents = (parent: INavimi_Component): void => {
        const traverse = (node: INavimi_Component): void => {
            let child: INavimi_Component;
            //@ts-ignore
            for (child of node.childNodes) {
                if (this._components[child.localName]) {
                    this._registerTag(child);
                } else {
                    // bind child tags events to the parent
                    this._registerChildEvents(parent, child);
                    traverse(child);
                }
            }
        };
        traverse(parent);
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
                this.render();
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