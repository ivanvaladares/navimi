class Navimi{constructor(t,s){this.timeout=(t=>new Promise(s=>setTimeout(s,t))),this.debounce=((t,s)=>{let e;return function(){clearTimeout(e),e=setTimeout(()=>{e=null,t.apply(this,arguments)},s)}}),this.setNavimiLinks=(()=>{document.querySelectorAll("[navimi-link]").forEach(t=>{t.removeAttribute("navimi-link"),t.setAttribute("navimi-linked",""),t.addEventListener("click",t=>{t.preventDefault(),this.navigateTo(t.target.pathname)})})}),this.navigateTo=((t,s)=>{this.initRoute(t,s)}),this.setTitle=(t=>{document.title=t}),this.getUrl=(()=>{const t=document.location,s=t.toString().match(/^[^#]*(#.+)$/),e=s?s[1]:"";return[t.pathname,t.search,e].join("")}),this.splitPath=(t=>{if(!t)return[];const s=t.indexOf("?");return(t=s>=0?t.substr(0,s):t).split("/").filter(t=>t.length>0)}),this.removeHash=(t=>{const s=t.indexOf("#");return s>0?t.substr(0,s):t}),this.parseQuery=(t=>{const s={};return t.split("&").map(t=>{const e=t.split("=");s[decodeURIComponent(e[0])]=decodeURIComponent(e[1]||"")}),s}),this.parsePath=((t,s)=>{const e=t.indexOf("?"),i=e>0?t.substr(e+1,t.length):"",r=this.splitPath(t),a=this.splitPath(s);let o={};e>0&&(o={queryString:this.parseQuery(i)});for(let t=0;t<a.length;t++)if(":"===a[t].charAt(0)){const s=a[t].slice(1);if(r.length<=t)return null;o[s]=decodeURIComponent(r[t])}else if(!r[t]||a[t].toLocaleLowerCase()!==r[t].toLocaleLowerCase())return null;return o}),this.getStateDiff=(t=>{t.sort((t,s)=>s.length-t.length).map(s=>{if(!this.stateDiff[s]){JSON.stringify(this.getState(s,this.prevState)||"")!==JSON.stringify(this.getState(s,this.state)||"")&&(this.stateDiff[s]=!0,t.map(t=>{s!==t&&0===s.indexOf(t)&&(this.stateDiff[t]=!0)}))}})}),this.invokeStateWatchers=this.debounce(()=>{const t=Object.keys(this.stateWatchers),s=Object.keys(this.stateDiff);this.stateDiff={},t.filter(t=>s.includes(t)).sort((t,s)=>s.length-t.length).map(t=>{Object.keys(this.stateWatchers[t]).map(s=>{const e=this.getState(t);this.stateWatchers[t][s]&&this.stateWatchers[t][s].map(t=>t&&t(e))})})},10),this.setState=(t=>{const s=Object.keys(this.stateWatchers);s.length>0&&(this.prevState=JSON.parse(JSON.stringify(this.state))),this.mergeState(this.state,t),s.length>0&&(this.getStateDiff(s),this.invokeStateWatchers())}),this.getState=((t,s)=>{const e=t?t.split(".").reduce((t,s)=>t&&t[s]||void 0,s||this.state):s||this.state;return e?Object.freeze(JSON.parse(JSON.stringify(e))):void 0}),this.watchState=((t,s,e)=>{s&&e&&(this.stateWatchers[s]||(this.stateWatchers[s]={}),this.stateWatchers[s]=Object.assign(Object.assign({},this.stateWatchers[s]),{[t]:[...this.stateWatchers[s][t]||[],e]}))}),this.unwatchState=((t,s)=>{const e=s=>{this.stateWatchers[s][t]=void 0,delete this.stateWatchers[s][t],0===Object.keys(this.stateWatchers[s]).length&&delete this.stateWatchers[s]};if(s){(Array.isArray(s)?s:[s]).map(t=>{!this.stateWatchers[t]&&(this.stateWatchers[t]={}),e(t)})}else Object.keys(this.stateWatchers).map(e)}),this.reportError=(t=>{this.options.onError?this.options.onError(Error(t)):console.error(t)}),this.openHotWs=(t=>{try{console.log("Connecting HOT...");const s=!0===t?8080:t;this.wsHotClient=null,this.wsHotClient=new WebSocket(`ws://localhost:${s}`),this.wsHotClient.addEventListener("message",t=>{try{const s=JSON.parse(t.data||"");if(s.message)return void console.log(s.message);s.filePath&&this.digestHot(s)}catch(t){console.error("Could not parse HOT message:",t)}}),this.wsHotClient.onclose=(()=>{console.warn("HOT Connection Closed!"),setTimeout(this.openHotWs,5e3,t)})}catch(t){console.error(t)}}),this.digestHot=(t=>{const s=(t,s)=>t&&s&&t.split("?").shift().toLocaleLowerCase()==s.split("?").shift().toLocaleLowerCase();try{const e=t.filePath.replace(/\\/g,"/"),i=this.win[this.pagesNamespace];if(s(this.options.globalCssUrl,e))return console.log(`${t.filePath} updated.`),this.loadedCsss[t.filePath]=t.data,void this.insertCss(t.data,"globalCss");if(this.currentJS&&s(this.options.globalTemplatesUrl,e))return console.log(`${t.filePath} updated.`),this.parseTemplate(t.data,this.options.globalTemplatesUrl),this.initJS(this.currentJS),void this.setNavimiLinks();if(this.currentJS&&this.externalJSsMap[e])return console.log(`${t.filePath} updated.`),i[this.callbackNS+e]=(()=>{Object.keys(this.externalJSsMap[e]).map(t=>{this.routesJSs[t]=void 0,t===this.currentJS&&this.initRoute(void 0,void 0,!0)})}),void this.insertJS(t.data,e,!0);if(this.currentJS&&this.externalTemplatesMap[e])return console.log(`${t.filePath} updated.`),this.parseTemplate(t.data),void(Object.keys(this.externalTemplatesMap[e]).find(t=>t===this.currentJS)&&this.initJS(this.currentJS));for(const r in this.routingList){const a=this.routingList[r];if(this.currentJS&&s(a.jsUrl,e))return void(this.routesJSs[a.jsUrl]&&(console.log(`${t.filePath} updated.`),this.routesJSs[a.jsUrl]=void 0,i[this.callbackNS+a.jsUrl]=(()=>{this.currentJS===a.jsUrl&&this.initJS(this.currentJS)}),this.insertJS(t.data,a.jsUrl,!1),this.setNavimiLinks()));if(s(a.cssUrl,e))return console.log(`${t.filePath} updated.`),this.loadedCsss[a.cssUrl]=t.data,void((this.currentJS&&this.currentJS===a.jsUrl||a.cssUrl===this.currentRouteItem.cssUrl)&&this.insertCss(t.data,"pageCss"));if(s(a.templatesUrl,e))return console.log(`${t.filePath} updated.`),this.parseTemplate(t.data,a.templatesUrl),(this.currentJS&&this.currentJS===a.jsUrl||a.templatesUrl===this.currentRouteItem.templatesUrl)&&this.initJS(this.currentJS),void this.setNavimiLinks()}}catch(t){console.error("Could not digest HOT message: ",t)}}),this.fetchFile=((t,s)=>new Promise((e,i)=>{delete this.loadErrors[t],fetch(t,s).then(async s=>{if(!s||!s.ok){const s=`Could not load the file! - ${t}`;return this.loadErrors[t]=s,i(s)}e(await s.text())}).catch(s=>{this.loadErrors[t]=s.message,i(s)})})),this.parseTemplate=((t,s)=>{const e=new RegExp("<t ([^>]+)>"),i=new RegExp("</t>"),r=new RegExp('id="([^"]+)"');let a=t;if(e.exec(a))for(;t&&t.length>0;){const t=e.exec(a);if(!t||0===t.length)break;const s=r.exec(t[1]),o=s.length>0&&s[1];a=a.substr(t.index+t[0].length);const h=i.exec(a);if(!o||!h||0===h.length)break;this.templatesCache[o]=a.substr(0,h.index)}else this.templatesCache[s]=a}),this.fetchTemplate=((t,s)=>{const e=s=>new Promise(async(e,i)=>{if(!s||this.loadedTemplates[s])return e();try{const r=await this.fetchFile(s,{headers:{Accept:"text/html"},signal:t?this.controller.signal:void 0});this.parseTemplate(r,s),this.loadedTemplates[s]=!0,e()}catch(t){i(t)}});return s.length>1?Promise.all(s.map(e)):e(s[0])}),this.fetchCss=((t,s,e)=>new Promise(async(i,r)=>{if(!t||this.loadedCsss[t])return i();try{const a=await this.fetchFile(t,{headers:{Accept:"text/css"},signal:s?void 0:this.controller.signal});e?(this.insertCss(a,void 0,!0),this.loadedCsss[t]="loaded"):this.loadedCsss[t]=a,i()}catch(t){r(t)}})),this.fetchJS=((t,s)=>new Promise(async(e,i)=>{try{const r=await this.fetchFile(t,{headers:{Accept:"application/javascript"},signal:this.controller.signal});this.loadedJs[t]=!0,this.insertJS(r,t,s),e()}catch(t){i(t)}})),this.addLibrary=(async t=>{let s=Array.isArray(t)?t:[t];(s=s.filter(t=>!this.loadedJs[t])).length>0&&await Promise.all(s.map(t=>{return"css"===t.split(".").pop().toLocaleLowerCase()?this.fetchCss(t,!1,!0):this.fetchJS(t)})).catch(t=>{throw new Error(t)})}),this.insertCss=((t,s,e)=>{const i=s?document.querySelector(`[${s}]`):void 0;if(i&&i.remove(),!t)return;const r=document.createElement("style");r.innerHTML=t,s&&r.setAttribute(s,"");const a=document.getElementsByTagName("head")[0]||document.body;e?a.prepend(r):a.appendChild(r)}),this.insertJS=((t,s,e)=>{const i=document.querySelector(`[jsUrl='${s}']`);i&&i.remove();let r=void 0!==e?`(function(){window.${this.pagesNamespace}.${this.pagesMainCallBack}("${s}", ${e}, (function(){return ${t}   \n    })())}())`:t;const a=document.createElement("script");a.type="text/javascript",a.innerHTML=r,a.setAttribute("jsUrl",s),(document.getElementsByTagName("head")[0]||document.body).appendChild(a)}),this.getTemplate=(t=>{const s=(Array.isArray(t)?t:[t]).map(t=>this.templatesCache[t]);return s.length>1?s:s[0]}),this.executeMiddlewares=(async(t,s)=>{let e=-1;const i=async(r,a,o)=>{if(r===e)throw new Error("next() called multiple times");e=r;const h=this.middlewareStack[r];if(h){let e=!1;await h(t,this.navigateTo,()=>{e=!0,s===this.callId&&i(r+1,a,o)}),e||o()}else a()};await new Promise(async(t,s)=>{await i(0,t,s)})}),this.setupRoute=(async t=>{const s=this.win[this.pagesNamespace],e=async(t,e,i)=>{if(setTimeout(()=>{delete s[this.callbackNS+t],delete s[this.callbackNS+t+"_reject"]},1e3),e)return this.externalJSs[t]=i,Object.freeze(i);const a=Object.freeze({addLibrary:this.addLibrary,setTitle:this.setTitle,navigateTo:this.navigateTo,getTemplate:this.getTemplate,fetchJS:s=>{const e=Array.isArray(s)?s:[s];return e.map(s=>{this.externalJSsMap[s]=Object.assign(Object.assign({},this.externalJSsMap[s]||{}),{[t]:!0})}),r(!0,e)},fetchTemplate:s=>{const e=Array.isArray(s)?s:[s];return e.map(s=>{this.externalTemplatesMap[s]=Object.assign(Object.assign({},this.externalTemplatesMap[s]||{}),{[t]:!0})}),this.fetchTemplate(!0,e)},setState:this.setState,getState:this.getState,unwatchState:s=>this.unwatchState(t,s),watchState:(s,e)=>this.watchState(t,s,e)});let o;if(this.routesJSsServices[t].length>0){for(;-1!==this.routesJSsServices[t].map(t=>void 0===this.externalJSs[this.options.services[t]]).indexOf(!0);){if(this.routesJSsServices[t].map(t=>this.options.services[t]).find(t=>this.loadErrors[t]))return;await this.timeout(10)}this.routesJSsServices[t].map(t=>{o=Object.assign(Object.assign({},o),{[t]:this.externalJSs[this.options.services[t]]})})}try{this.unwatchState(t);let e=new i(a,o);return this.routesJSs[t]=e,e}catch(e){s[this.callbackNS+t+"_reject"](e)}},i=t=>new Promise((e,i)=>{const r=setInterval(()=>this.routesJSs[t]?(clearInterval(r),e(this.routesJSs[t])):void 0===s[this.callbackNS+t]?(clearInterval(r),i(`Error loading file! ${t}`)):void 0,50)}),r=(t,e)=>{const r=e=>new Promise(async(r,a)=>{if(t){if(this.externalJSs[e])return r(this.externalJSs[e])}else if(this.routesJSs[e])return r(this.routesJSs[e]);s[this.callbackNS+e]?await i(e).then(r).catch(a):(s[this.callbackNS+e]=r,s[this.callbackNS+e+"_reject"]=a,this.fetchJS(e,t).catch(t=>{delete s[this.callbackNS+e],s[this.callbackNS+e+"_reject"](t)}))});return e.length>1?Promise.all(e.map(r)):r(e[0])};s[this.pagesMainCallBack]||(s[this.pagesMainCallBack]=((t,i,r)=>{s[this.callbackNS+t](e(t,i,r))}));const{jsUrl:a,cssUrl:o,templatesUrl:h,dependsOn:n}=t;if(this.fetchCss(o).catch(t=>{}),this.fetchTemplate(!0,[h]).catch(t=>{}),a){if(this.routesJSsServices[a]=this.routesJSsServices[a]||[],n&&n.length>0){let t=[];const s=n.map(s=>{const e=this.options.services[s];return void 0===e?t.push(s):(-1===this.routesJSsServices[a].indexOf(s)&&this.routesJSsServices[a].push(s),this.externalJSsMap[e]=Object.assign(Object.assign({},this.externalJSsMap[e]||{}),{[a]:!0})),e});if(t.length>0)return void this.reportError("Service(s) not defined: "+t.join(", "));Promise.all(s.filter(t=>void 0!==t).map(t=>r(!0,[t]))).catch(this.reportError)}return r(!1,[a])}}),this.initRoute=(async(t,s,e)=>{const i=this.removeHash(t||this.getUrl());if(!e){if(this.currentUrl===i)return;this.controller.abort(),this.controller=new AbortController}const r=++this.callId,a=void 0!==t,o=this.splitPath(i);let h,n;for(const t in this.routingList){if(this.splitPath(t).length===o.length&&(n=this.parsePath(i,t))){h=this.routingList[t];break}}const l=this.routingList["*"];if(!h&&l&&(h=l),void 0!==s&&(n=Object.assign(Object.assign({},n),s)),this.options.onBeforeRoute){if(!1===await this.options.onBeforeRoute({url:i,routeItem:h,params:n},this.navigateTo))return}if(this.currentJS&&!e){const t=this.routesJSs[this.currentJS]&&this.routesJSs[this.currentJS].beforeLeave;if(t&&!1===t({url:i,routeItem:h,params:n}))return void(a||history.forward());this.routesJSs[this.currentJS]&&this.routesJSs[this.currentJS].destroy&&this.routesJSs[this.currentJS].destroy()}if(h){try{await this.executeMiddlewares({url:i,routeItem:h,params:n},r)}catch(t){return}if(!(r<this.callId)){this.currentRouteItem=h,this.currentUrl=i;try{const{title:s,jsUrl:e,cssUrl:o,templatesUrl:l}=h||{};if(!e&&!l)throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");for(e&&(this.currentJS=e,this.currentParams[e]={url:i,routeItem:h,params:n}),a&&history.pushState(null,null,t),await this.setupRoute(h);o&&!this.loadedCsss[o]||l&&!this.loadedTemplates[l]||this.options.globalCssUrl&&!this.loadedCsss[this.options.globalCssUrl]||this.options.globalTemplatesUrl&&!this.loadedTemplates[this.options.globalTemplatesUrl];){if(await this.timeout(10),r<this.callId)return;if(o&&this.loadErrors[o]||l&&this.loadErrors[l]||this.options.globalCssUrl&&this.loadErrors[this.options.globalCssUrl]||this.options.globalTemplatesUrl&&this.loadErrors[this.options.globalTemplatesUrl])return void this.reportError(this.loadErrors[o]||this.loadErrors[l]||this.loadErrors[this.options.globalCssUrl]||this.loadErrors[this.options.globalTemplatesUrl])}if(this.setTitle(s),await this.initJS(e),r<this.callId)return;this.setNavimiLinks(),this.insertCss(this.loadedCsss[o],"pageCss"),this.options.onAfterRoute&&this.options.onAfterRoute({url:i,routeItem:h,params:n},this.navigateTo)}catch(t){r===this.callId&&this.reportError(t.message)}}}else r===this.callId&&this.reportError("No route match for url: "+i)}),this.initJS=(async t=>{if(t)this.routesJSs[t]&&this.routesJSs[t].init&&await this.routesJSs[t].init(this.currentParams[t]);else{const t=this.currentRouteItem?this.currentRouteItem.templatesUrl:null,s=this.getTemplate(t),e=document.querySelector("body");s&&e&&(e.innerHTML=s)}}),this.pagesNamespace="__spaPages",this.pagesMainCallBack="_mainCallback",this.callbackNS="_callback_",this.win=window||{},this.controller=new AbortController,this.currentRouteItem=void 0,this.currentJS=void 0,this.currentUrl=void 0,this.currentParams={},this.routesJSs={},this.routesJSsServices={},this.externalJSs={},this.externalJSsMap={},this.externalTemplatesMap={},this.routingList=t||{},this.loadErrors={},this.loadedCsss={},this.loadedJs={},this.loadedTemplates={},this.templatesCache={},this.options=s||{},this.state={},this.prevState={},this.stateDiff={},this.stateWatchers={},this.middlewareStack=[],this.callId=0,this.win.addEventListener("popstate",()=>{this.initRoute()}),this.win.navigateTo=this.navigateTo,this.win[this.pagesNamespace]={};const e=this.options.middlewares;Array.isArray(e)&&this.middlewareStack.push(...e.filter(t=>void 0!==t)),(async()=>{(this.options.globalCssUrl||this.options.globalTemplatesUrl)&&(await Promise.all([this.fetchCss(this.options.globalCssUrl,!0),this.fetchTemplate(!1,[this.options.globalTemplatesUrl])]).catch(this.reportError),this.insertCss(this.loadedCsss[this.options.globalCssUrl],"globalCss"))})(),this.initRoute(),this.options.hot&&"WebSocket"in this.win&&setTimeout(this.openHotWs,1e3,this.options.hot)}mergeState(t,s){const e=t=>t&&"object"==typeof t&&!Array.isArray(t)&&null!==t;if(e(t)&&e(s))for(const i in s)e(s[i])?(!t[i]&&Object.assign(t,{[i]:{}}),this.mergeState(t[i],s[i])):Object.assign(t,{[i]:s[i]})}}