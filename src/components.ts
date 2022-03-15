class __Navimi_Components implements INavimi_Components {

    private _components: INavimi_KeyList<any> = {};

    public init(): void {

        this._components = {};

        // todo: check if I shold remove this and fire the register after the route render
        new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let node: INavimi_Component;
                //@ts-ignore
                for (node of mutation.addedNodes) {
                    if (this._components[node.localName] && !node.props) {
                        this._registerTag(node);
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
                this._removeChildComponents(child);

                this._disconnectComponent(child);

                child.remove();

                child.onAfterRemove && child.onAfterRemove();
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

    private _registerTag = (tag: INavimi_Component): void => {
        const componentClass = this._components[tag.localName];

        // connects the component class to the tag 
        Object.setPrototypeOf(tag, componentClass.prototype);

        // initializes the component props
        tag.props = {};

        this._readAttributes(tag);

        const parent = tag.parentElement;

        // observer to detect removed components
        tag._observer = new MutationObserver((mutations: MutationRecord[]) => {
            if (mutations.find(mutation => mutation.removedNodes.length > 0)) {
                if (!parent.contains(tag)) {
                    this._removeChildComponents(tag);
                    this._disconnectComponent(tag);
                    tag.onAfterRemove && tag.onAfterRemove();
                }
            }
        });
        tag._observer.observe(parent, { childList: true });

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

        tag.init();

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

            init() {
                super.init && super.init();
                this.render();
            }

            update() {
                this.render();
            }

            render() {

                beforeRender(this);

                if (this.props.children === undefined) {
                    this.props.children = this.innerHTML;
                }

                // todo: use virtual or shadow dom.
                this.innerHTML = super.render && super.render();

                afterRender(this);

                super.onAfterRender && super.onAfterRender();

            }
        }
    };
}