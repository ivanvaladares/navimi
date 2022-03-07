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
                        this.registerTag(node);
                    }
                }
            }
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    registerComponent = (name: string, componentClass: InstanceType<any>): void => {
        if (!this._components[name] && /\-/.test(name)) {
            Object.setPrototypeOf(componentClass.prototype, HTMLElement.prototype);
            this._components[name] = this.createElement(componentClass, this);
            [].slice.call(document.querySelectorAll(name)).map(this.registerTag)
        }
    };

    registerTag = (element: Element): void => {
        // connects the component class to the tag 
        const componentClass = this._components[element.localName];
        Object.setPrototypeOf(element, componentClass.prototype);
        //@ts-ignore
        element.init();
    };

    iterateChildComponents = (item: any, callback: any): void => {
        Object.keys(this._components).map(name => {
            [].slice.call(item.querySelectorAll(name)).map(callback);
        });
    };

    registerTagsEvents = (node: any, element: any): void => {
        for (let list of [].slice.call(node.attributes)) {
            if (/^on/.test(list.name)) {
                const eventName: string = list.name;
                node[eventName] = node[eventName].bind(element);
            }
        }
    };

    createElement = (Element: InstanceType<any>, navimiComponents: any): InstanceType<any> => {

        return class extends (Element) {

            init() {
                this.setAttribute("initialized", "true");
                super.init && super.init();
                this.render();
            }

            forceUpdate() {
                this.render();
            }

            render() {
                this.props = this.props || {};

                if (this.props.children === undefined) {
                    this.props.children = this.innerHTML;
                }

                navimiComponents.iterateChildComponents(this, (element: any) => {
                    element.onBeforeRemove && element.onBeforeRemove();
                });

                // todo: use virtual or shadow dom.
                this.innerHTML = super.render && super.render();

                [].slice.call(this.querySelectorAll("*")).map((node: any) => 
                    navimiComponents.registerTagsEvents(node, this));

                navimiComponents.iterateChildComponents(this, navimiComponents.registerTag);

            }
        }
    };
}