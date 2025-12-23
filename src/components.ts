import { INavimi_Components, INavimi_Component } from './@types/INavimi_Components';
import { INavimi_State } from './@types/INavimi_State';
import { INavimi_Functions } from './@types/Navimi';
import { getNodeContent } from './helpers/getNodeContent';
import { getNodeType } from './helpers/getNodeType';
import { mergeHtmlElement } from './helpers/mergeHtmlElement';
import { syncAttributes } from './helpers/syncAttributes';
import { throttle } from './helpers/throttle';

class __Navimi_Components implements INavimi_Components {

    private _navimiState: INavimi_State;
    private _uidCounter = 0;

    public init(navimiState: INavimi_State): void {
        this._navimiState = navimiState;
    }

    // --- Motor de Renderização ---
    private _mergeHtml = (template: Element, node: Element | DocumentFragment) => {
        const getCleanNodes = (n: NodeList) => {
            return [].slice.call(n).filter((child: Node) => {
                return child.nodeType !== 3 || (child.textContent && child.textContent.trim().length > 0);
            });
        };

        const templateNodes: Element[] = getCleanNodes(template.childNodes) as Element[];
        const documentNodes: Element[] = getCleanNodes(node.childNodes) as Element[];

        const templateNodesLen = templateNodes.length;
        const documentNodesLen = documentNodes.length;

        for (let i = 0; i < templateNodesLen; i++) {
            const templateNode = templateNodes[i];
            const documentNode = documentNodes[i];

            if (!documentNode) {
                node.appendChild(templateNode.cloneNode(true));
                continue;
            }

            const typeMatch = getNodeType(templateNode) === getNodeType(documentNode);
            const tKey = templateNode.id || templateNode.getAttribute?.('key');
            const dKey = documentNode.id || documentNode.getAttribute?.('key');

            let keyMatch = true;
            if ((tKey && tKey !== '') || (dKey && dKey !== '')) {
                keyMatch = tKey === dKey;
            }

            if (!typeMatch || !keyMatch) {
                const nextSibling = documentNode.nextSibling;
                // Nota: O disconnectedCallback dos web components cuida da limpeza
                const newNode = templateNode.cloneNode(true);

                if (documentNode.parentNode === node) {
                    node.replaceChild(newNode, documentNode);
                } else {
                    node.insertBefore(newNode, nextSibling);
                }
                continue;
            }

            const templateContent = getNodeContent(templateNode);
            const documentContent = getNodeContent(documentNode);
            if (templateContent && templateContent !== documentContent) {
                documentNode.textContent = templateContent;
            }

            if (templateNode.localName) {
                syncAttributes(templateNode, documentNode);
                if (!templateNode.localName.includes('-')) {
                    mergeHtmlElement(templateNode, documentNode, this._mergeHtml);
                }
            }
        }

        for (let i = documentNodesLen - 1; i >= templateNodesLen; i--) {
            const nodeToRemove = documentNodes[i];
            if (nodeToRemove.parentNode) {
                nodeToRemove.parentNode.removeChild(nodeToRemove);
            }
        }
    };

    public registerComponent = (
        componentName: string,
        componentClass: any,
        getFunctions?: (callerUid: string) => INavimi_Functions,
        services?: Record<string, InstanceType<any>>): InstanceType<any> => {

        if (!componentName || !/-/.test(componentName) || customElements.get(componentName)) {
            return;
        }

        const getFuncs = getFunctions || (() => undefined);
        const self = this;

        const wrappedComponentClass = class NavimiWebComponent extends HTMLElement {
            private _instance: any;
            private _uid: string;
            private _mounted = false;
            private _previousTemplate: string | undefined;
            private _initialInnerHTML: string;
            
            // [NOVO] Observer interno para garantir liberdade total de atributos
            private _attrObserver: MutationObserver | null = null;

            public props: Record<string, any> = {};

            constructor() {
                super();
                this._uid = `component:${self._uidCounter++}`;
                this._initialInnerHTML = this.innerHTML;

                this._syncPropsFromAttributes();

                this._instance = new componentClass(this.props, getFuncs(this._uid), services);
                
                // Injeções
                this._instance.props = this.props;
                this._instance.element = this;
                this._instance.childComponents = [];
                this._instance.parentComponent = null;
                this._instance.update = throttle(this.render.bind(this), 16, this);

                // Mixins e Polyfills
                this._injectDomPolyfills();
                this._mixinClassMethods(componentClass);
            }

            private _injectDomPolyfills() {
                const domMethods = ['querySelector', 'querySelectorAll', 'getAttribute', 'setAttribute', 'removeAttribute', 'getBoundingClientRect', 'closest'];
                domMethods.forEach(method => {
                    // @ts-ignore
                    if (this[method]) {
                         // @ts-ignore
                        this._instance[method] = this[method].bind(this);
                    }
                });

                const domProps = ['classList', 'style', 'innerHTML', 'innerText'];
                domProps.forEach(prop => {
                    Object.defineProperty(this._instance, prop, {
                        // @ts-ignore
                        get: () => this[prop],
                        enumerable: true,
                        configurable: true
                    });
                });
            }

            private _mixinClassMethods(originalClass: any) {
                const proto = originalClass.prototype;
                const methods = Object.getOwnPropertyNames(proto);

                methods.forEach(method => {
                    const internalProps = ['constructor', 'render', 'update', 'onMount', 'onRender', 'onUnmount'];
                    if (internalProps.includes(method) || method.startsWith('_')) return;

                    // @ts-ignore
                    if (!this[method]) {
                        // @ts-ignore
                        this[method] = (...args) => this._instance[method].apply(this._instance, args);
                    }
                });

                Object.defineProperty(this, 'state', {
                    get: () => this._instance.state,
                    set: (v) => this._instance.state = v
                });
            }

            async connectedCallback() {
                if (!this._mounted) {
                    this._connectToParent();

                    // [LIBERDADE TOTAL] Observer escopado APENAS neste elemento.
                    // Isso permite detectar QUALQUER atributo novo (data-x, custom-prop)
                    // sem precisar declarar 'observedAttributes'.
                    this._attrObserver = new MutationObserver((mutations) => {
                        let hasChanges = false;
                        const oldProps = { ...this.props };

                        mutations.forEach(mutation => {
                            if (mutation.type === 'attributes') {
                                const name = mutation.attributeName!;
                                const val = this.getAttribute(name);
                                
                                // Se o valor mudou
                                if (this.props[name] !== val) {
                                    this.props[name] = val;
                                    hasChanges = true;
                                }
                            }
                        });

                        if (hasChanges) {
                            // Atualiza a instância
                            this._instance.props = this.props;

                            // Respeita o shouldUpdate do usuário
                            if (!this._instance.shouldUpdate || this._instance.shouldUpdate(oldProps, this.props)) {
                                this._instance.update();
                            }
                        }
                    });

                    this._attrObserver.observe(this, { attributes: true });

                    await this.render();

                    if (this._instance.onMount) {
                        await this._instance.onMount.call(this._instance);
                    }
                    this._mounted = true;
                }
            }

            disconnectedCallback() {
                // Desliga o observer para evitar memory leak
                if (this._attrObserver) {
                    this._attrObserver.disconnect();
                    this._attrObserver = null;
                }

                if (this._instance.parentComponent) {
                    this._instance.parentComponent.childComponents =
                        this._instance.parentComponent.childComponents.filter(
                            (child: any) => child !== this._instance
                        );
                }

                if (self._navimiState) {
                    self._navimiState.unwatchState(this._uid);
                }

                if (this._instance.onUnmount) {
                    this._instance.onUnmount.call(this._instance);
                }

                this._mounted = false;
            }

            async render() {
                if (!this._instance.render) return;

                const html = await this._instance.render.call(this._instance, this._initialInnerHTML);

                if (!html || html === this._previousTemplate) return;
                this._previousTemplate = html;

                const template = new DOMParser().parseFromString(html, 'text/html');
                self._mergeHtml(template.querySelector('body')!, this);

                if (this._instance.onRender) {
                    this._instance.onRender.call(this._instance);
                }
            }

            private _syncPropsFromAttributes() {
                for (const attr of Array.from(this.attributes)) {
                    this.props[attr.name] = attr.value;
                }
                if (this._instance) {
                    this._instance.props = this.props;
                }
            }

            private _connectToParent() {
                let parent = this.parentElement;
                while (parent) {
                    if (parent.tagName.includes('-') && customElements.get(parent.tagName.toLowerCase())) {
                        const parentInstance = (parent as any)._instance;
                        if (parentInstance) {
                            this._instance.parentComponent = parentInstance;
                            if (!parentInstance.childComponents.includes(this._instance)) {
                                parentInstance.childComponents.push(this._instance);
                            }
                            return;
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }

        customElements.define(componentName, wrappedComponentClass);
        return wrappedComponentClass;
    };
}

export default __Navimi_Components;
