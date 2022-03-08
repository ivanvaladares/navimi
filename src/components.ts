class __Navimi_Components implements INavimi_Components {

    private _components: INavimi_KeyList<any> = {};
    private _navimiHelpers: INavimi_Helpers;

    public init(navimiHelpers: INavimi_Helpers): void {

        this._navimiHelpers = navimiHelpers;
        this._components = {};

        // todo: remove this and fire the register after the route render
        new MutationObserver((mutations: MutationRecord[]) => {
            for (let mutation of mutations) {
                let node: any;
                for (node of mutation.addedNodes) {
                    if (this._components[node.localName] && !node.attributes["initialized"]) {
                        this._registerTag(node);
                    }
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    public registerComponent = (name: string, componentClass: InstanceType<any>): void => {
        if (!this._components[name] && /\-/.test(name)) {
            Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);
            this._components[name] = this._createElement(componentClass, this);
        }
    };

    private _registerTag = (element: Element): void => {
        // connects the component class to the tag 
        const componentClass = this._components[element.localName];
        Object.setPrototypeOf(element, componentClass.prototype);
        //@ts-ignore
        element.init();
    };

    private _findParentComponent = (node: any): void => {
        let parent = node.parentNode;
        while (parent) {
            if (/\-/.test(parent.localName) && this._components[parent.localName]) {
                node.props.parentComponent = parent;
                parent.props.childComponents = [
                    ...parent.props.childComponents || [],
                    node,
                ];
                return;
            }
            parent = parent.parentNode;
        }
    }

    private _registerChildEvents = (parent: any, child: any): void => {
        if (child.attributes) {
            for (let list of [].slice.call(child.attributes)) {
                if (/^on/.test(list.name)) {
                    const eventName = list.name;
                    child[eventName] = child[eventName].bind(parent);
                }
            }
        }
    };

    private _registerChildComponents = (parent: any): void => {
        const traverse = (node: any): void => {
            for (let child of node.childNodes) {
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

    private _createElement = (Element: InstanceType<any>, navimiComponents: any): InstanceType<any> => {

        return class extends (Element) {

            init() {
                this.setAttribute("initialized", "true");
                this.props = this.props || {};
                navimiComponents._findParentComponent(this);
                super.init && super.init();
                this.render();
            }

            forceUpdate() {
                this.render();
            }

            render() {

                if (this.props.children === undefined) {
                    this.props.children = this.innerHTML;
                }

                this.props.childComponents && this.props.childComponents.map((child: any) => {
                    child.onBeforeRemove && child.onBeforeRemove();
                });

                // todo: use virtual or shadow dom.
                this.innerHTML = super.render && super.render();

                navimiComponents._registerChildComponents(this);
            
                super.onAfterRender && super.onAfterRender();

            }
        }
    };
}