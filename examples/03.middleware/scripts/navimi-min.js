/**
 * Navimi v0.2.0 
 * Developed by Ivan Valadares 
 * ivanvaladares@hotmail.com 
 * https://github.com/ivanvaladares/navimi 
 */ 
class __Navimi_Core{constructor(t,e,s){this._navigateTo=(t,e)=>{this._initRoute(t,e)},this._reportError=t=>{this._options.onError?this._options.onError(t):console.error(t)},this._waitForAssets=i=>{const a=this._options.globalCssUrl,r=this._options.globalTemplatesUrl;return a||r?new Promise(e=>{const s=setInterval(()=>{let t=!0;if((a&&!this._navimiCSSs.isCssLoaded(a)||r&&!this._navimiTemplates.isTemplateLoaded(r))&&(t=!1),this._navimiFetch.getErrors(a)||this._navimiFetch.getErrors(r)||t||i<this._callId)return clearInterval(s),e()},10)}):Promise.resolve()},this._initRoute=async(t,e,s)=>{try{var i=this._navimiHelpers.removeHash(t||this._navimiHelpers.getUrl());if(!s){if(this._currentUrl===i)return;this._abortController&&this._abortController.abort(),this._abortController=window.AbortController?new AbortController:void 0}var a=++this._callId,r=void 0!==t,{routeItem:n,params:o}=this._navimiHelpers.getRouteAndParams(i,this._routesList),h=Object.assign({url:i,routeItem:n,params:o},e||{});if(!s){if(this._options.onBeforeRoute)if(!1===await this._options.onBeforeRoute(h,this._navigateTo))return;if(this._currentJSUrl){const p=this._navimiJSs.getInstance(this._currentJSUrl);if(p){const u=p.onBeforeLeave;if(u)if(!1===u(h))return void(r||history.forward());p.onLeave&&p.onLeave()}}}if(!n)return void(a===this._callId&&this._reportError(new Error("No route match for url: "+i)));if(await this._navimiMiddlewares.executeMiddlewares(this._abortController,h,(t,e)=>{this._initRoute(t,e,!0)}).catch(this._reportError),a<this._callId)return;this._currentUrl=i;var{title:l,jsUrl:c,cssUrl:_,templatesUrl:m,services:d}=n||{};if(!c&&!m)throw new Error("The route must define the 'jsUrl' or 'templatesUrl'!");if(c&&(this._currentJSUrl=c,this._routesParams[c]=h),r&&(e&&e.replaceUrl?history.replaceState(null,null,t):history.pushState(null,null,t)),await Promise.all([this._navimiJSs.loadDependencies(this._abortController,c||i,d),this._navimiCSSs.fetchCss(this._abortController,_),this._navimiTemplates.fetchTemplate(this._abortController,m),c&&this._navimiJSs.fetchJS(this._abortController,[c],"route")]).catch(this._reportError),await this._waitForAssets(a),this._navimiHelpers.setTitle(l),this._globalCssInserted||(this._globalCssInserted=!0,this._navimiCSSs.insertCss(this._options.globalCssUrl,"globalCss")),c)await this._navimiJSs.initRoute(c,this._routesParams[c]);else{var v=this._navimiTemplates.getTemplate(m);const g=document.querySelector("body");v&&g&&(g.innerHTML=v)}a===this._callId&&(this._navimiHelpers.setNavimiLinks(),this._navimiCSSs.insertCss(_,"routeCss"),this._options.onAfterRoute&&this._options.onAfterRoute(h,this._navigateTo))}catch(t){this._reportError(t)}},this._callId=0,this._abortController=window.AbortController?new AbortController:void 0,this._currentJSUrl,this._currentUrl,this._routesParams={},this._routesList=t||{},this._options=s||{},this._globalCssInserted=!1,this._win=window||{},this._navimiFetch=e.navimiFetch,this._navimiCSSs=e.navimiCSSs,this._navimiJSs=e.navimiJSs,this._navimiTemplates=e.navimiTemplates,this._navimiMiddlewares=e.navimiMiddlewares,this._navimiHot=e.navimiHot,this._navimiHelpers=e.navimiHelpers,this._win.addEventListener("popstate",()=>{this._initRoute()}),this._win.navigateTo=this._navigateTo,this._navimiMiddlewares.addMiddlewares(this._options.middlewares),(async()=>{await this._init()})(),this._initRoute(),this._options.hot&&this._initHot()}_init(){if(this._options.globalCssUrl||this._options.globalTemplatesUrl)return Promise.all([this._navimiCSSs.fetchCss(void 0,this._options.globalCssUrl),this._navimiTemplates.fetchTemplate(void 0,this._options.globalTemplatesUrl)]).catch(this._reportError)}_initHot(){}}class __Navimi_CSSs{constructor(){this._loadedCsss={},this._replaceCss=(t,e)=>{const s=document.querySelector(`[cssUrl='${e}']`);s&&(s.innerHTML=t)},this.isCssLoaded=t=>void 0!==this._loadedCsss[t],this.fetchCss=(t,e)=>!e||this._loadedCsss[e]?Promise.resolve():this._navimiFetch.fetchFile(e,{headers:{Accept:"text/css"},signal:t?t.signal:void 0}).then(t=>{this._loadedCsss[e]=t}),this.insertCss=(t,e,s)=>{if("routeCss"===e){const a=document.querySelector(`[cssType='${e}']`);if(a){if(a.getAttribute("cssUrl")===t)return;a.remove()}}if(!document.querySelector(`[cssUrl='${t}']`)){var i=this._loadedCsss[t];if(i){const r=document.createElement("style");r.innerHTML=i,t&&r.setAttribute("cssUrl",t),t&&r.setAttribute("cssType",e);const n=document.getElementsByTagName("head")[0]||document.body;s?n.prepend(r):n.appendChild(r)}}}}init(t){this._navimiFetch=t}}class __Navimi_Fetch{constructor(){this.loadErrors={},this.init=t=>{this._bustCache=t.bustCache},this.getErrors=t=>this.loadErrors[t],this.fetchFile=(a,r)=>new Promise((e,s)=>{delete this.loadErrors[a];var t=a+(this._bustCache?"?v="+this._bustCache:"");const i="Could not load the file! - "+a;fetch(t,r).then(t=>{if(!t||!t.ok)return this.loadErrors[a]=i,s(i);t.text().then(e)}).catch(()=>{this.loadErrors[a]=i,s(i)})})}}class __Navimi_Helpers{constructor(){this.parseQuery=t=>{const e={};return t.split("&").map(t=>{t=t.split("=");e[decodeURIComponent(t[0])]=decodeURIComponent(t[1]||"")}),e},this.splitPath=t=>{if(!t)return[];var e=t.indexOf("?");return(t=0<=e?t.substring(0,e):t).split("/").filter(t=>0<t.length)},this.parsePath=(t,e)=>{var s=t.indexOf("?"),i=0<s?t.substring(s+1,t.length):"";const a=this.splitPath(t),r=this.splitPath(e);let n={};0<s&&(n={queryString:this.parseQuery(i)});for(let t=0;t<r.length;t++)if(":"===r[t].charAt(0)){var o=r[t].slice(1);if(a.length<=t)return null;n[o]=decodeURIComponent(a[t])}else if(!a[t]||r[t].toLowerCase()!==a[t].toLowerCase())return null;return n},this.debounce=(e,s)=>{let i;return function(...t){clearTimeout(i),i=setTimeout(()=>{i=null,e.apply(this,t)},s)}},this.throttle=(s,i,a)=>{let r,n;return function(...t){const e=Date.now();n&&e<n+i?(clearTimeout(r),r=setTimeout(()=>{n=e,s.apply(a,t)},i)):(n=e,s.apply(a,t))}},this.getUrl=()=>{const t=document.location;var e=t.toString().match(/^[^#]*(#.+)$/);const s=e?e[1]:"";return[t.pathname,t.search,s].join("")},this.setTitle=t=>{document.title=t},this.setNavimiLinks=()=>{document.querySelectorAll("[navimi-link]").forEach(t=>{t.removeAttribute("navimi-link"),t.addEventListener("click",t=>{t.preventDefault(),window.navigateTo(t.target.pathname)})})},this.removeHash=t=>{var e=t.indexOf("#");return 0<e?t.substring(0,e):t},this.stringify=t=>{const e=[],i=s=>{if("function"==typeof s)return String(s);if(s instanceof Error)return s.message;if(null===s||"object"!=typeof s)return s;if(-1!==e.indexOf(s))return`[Circular: ${e.indexOf(s)}]`;if(e.push(s),Array.isArray(s))return t=s.map(i),e.pop(),t;var t=Object.keys(s).reduce((t,e)=>(t[e]=i(((t,e)=>{if(Object.prototype.hasOwnProperty.call(t,e))try{return t[e]}catch(t){return}return t[e]})(s,e)),t),{});return e.pop(),t};return JSON.stringify(i(t))},this.cloneObject=s=>null===s||"object"!=typeof s?s:Object.keys(s).reduce((t,e)=>(null!==s[e]&&"object"==typeof s[e]?t[e]=this.cloneObject(s[e]):t[e]=s[e],t),Array.isArray(s)?[]:{}),this.getRouteAndParams=(t,e)=>{var s=this.splitPath(t),i=e["*"];let a,r;for(const o in e){var n=this.splitPath(o);if(n.length===s.length&&(r=this.parsePath(t,o))){a=e[o];break}}return!a&&i&&(r=this.parsePath(t,t),a=i),{routeItem:a,params:r}}}}class __Navimi_Hot{constructor(){this.openHotWs=t=>{try{if(!("WebSocket"in window))return void console.error("Websocket is not supported by your browser!");console.warn("Connecting HOT...");var e=!0===t?8080:t;this._wsHotClient=null,this._wsHotClient=new WebSocket("ws://localhost:"+e),this._wsHotClient.addEventListener("message",async t=>{try{var e=JSON.parse(t.data||"");if(e.message)return void console.warn(e.message);e.filePath&&await this._digestHot(e)}catch(t){console.error("Could not parse HOT message:",t)}}),this._wsHotClient.onclose=()=>{console.warn("HOT Connection Closed!"),setTimeout(this.openHotWs,5e3,t)}}catch(t){console.error(t)}},this._digestHot=async t=>{var e;try{switch(t.filePath=t.filePath.replace(/\\/g,"/"),null==(e=t.filePath.split(".").pop())?void 0:e.toLocaleLowerCase()){case"css":await this._navimiCSSs.digestHot(t).catch(()=>{});break;case"html":case"htm":await this._navimiTemplates.digestHot(t).then(()=>this._initRouteFunc()).catch(()=>{});break;case"js":this._navimiJSs.digestHot(t).then(()=>this._initRouteFunc()).catch(()=>{});break;case"gif":case"jpg":case"jpeg":case"png":case"svg":this._initRouteFunc()}}catch(t){console.error("Could not digest HOT payload: ",t)}}}init(t,e,s,i){this._navimiCSSs=t,this._navimiJSs=e,this._navimiTemplates=s,this._initRouteFunc=i}}class __Navimi_JSs{constructor(){this._navimiLoaderNS="__navimiLoader",this._callBackNS="_jsLoaderCallback",this._promiseNS="_promise_",this._loadedJSs={},this._jsType={},this._jsInstances={},this._jsDepMap={},this._routesJSsServices={},this._resolvePromise=(t,e)=>{this._navimiLoader[this._promiseNS+e](t)},this._rejectPromise=(t,e)=>{this._navimiLoader[this._promiseNS+e+"_reject"](t)},this._awaitJS=a=>new Promise((e,s)=>{const i=setInterval(()=>{if(this._jsInstances[a])return clearInterval(i),e(this._jsInstances[a]);var t=this._jsType[a];if(("library"===t||"module"===t)&&this.isJsLoaded(a))return clearInterval(i),e("");t=this._navimiFetch.getErrors(a);return t?(clearInterval(i),s(t)):void 0},10)}),this._addLibrary=async t=>{const e=Array.isArray(t)?t:[t];if(0<e.length){const s=e.map(t=>{if("string"!=typeof t)return t;{const e=t.split(".").pop();return{url:t,type:e.toLowerCase()}}});await Promise.all(s.map(t=>{var e=t.type.toLowerCase();return"css"===e?this._navimiCSSs.fetchCss(void 0,t.url).then(()=>this._navimiCSSs.insertCss(t.url,"library",!0)):this.fetchJS(void 0,[t.url],"module"===e?"module":"library")})).catch(t=>{throw new Error(t)})}},this._fetch=async(t,e,s)=>{let i="";i=this._loadedJSs[e]||await this._navimiFetch.fetchFile(e,{headers:{Accept:"application/javascript"},signal:t?t.signal:void 0}),this._jsType[e]=s,this._insertJS(e,i.replace(/^\s+|\s+$/g,""),s)},this._insertJS=(t,e,s)=>{var i="module"===s||"library"===s?e:`((loader, url, type) => { loader(url, type, (() => { return ${e}
})())})(${this._navimiLoaderNS}.${this._callBackNS}, "${t}", "${s}")`;this._loadedJSs[t]=e;const a=document.querySelector(`[jsUrl='${t}']`),r=(a&&a.remove(),document.createElement("script")),n=(r.type="module"===s?"module":"text/javascript",r.innerHTML=i,r.setAttribute("jsUrl",t),document.getElementsByTagName("head")[0]);(n||document.body).appendChild(r),"module"!==s&&"library"!==s||this._resolvePromise(!0,t)},this._buildRoute=async(s,t)=>{const i=this;let e=t;if(Array.isArray(t)){e=t.pop();const r=t.filter(t=>"string"==typeof t);0<r.length&&this.loadDependencies(void 0,s,r)}const a=[];for(const n in this._jsDepMap)this._jsDepMap[n][s]&&a.push(n);await Promise.all(a.map(this._awaitJS));let r={};return null!=(t=this._routesJSsServices[s])&&t.map(t=>{r=Object.assign(Object.assign({},r),{[t]:this._jsInstances[this._options.services[t]]})}),new class extends e{constructor(){var t={addLibrary:i._addLibrary,setTitle:i._navimiHelpers.setTitle,navigateTo:window.navigateTo,getTemplate:i._navimiTemplates.getTemplate,fetchJS:t=>{const e=Array.isArray(t)?t:[t];return e.map(t=>{i._jsDepMap[t]=Object.assign(Object.assign({},i._jsDepMap[t]||{}),{[s]:!0})}),i.fetchJS(void 0,e,"javascript")},fetchTemplate:t=>i._navimiTemplates.fetchTemplate(void 0,t),setState:i._navimiState.setState,getState:i._navimiState.getState,setNavimiLinks:i._navimiHelpers.setNavimiLinks,unwatchState:t=>i._navimiState.unwatchState(this,t),watchState:(t,e)=>i._navimiState.watchState(this,t,e)};super(Object.freeze(t),Object.freeze(r))}onEnter(t){super.onEnter&&super.onEnter(t)}onBeforeLeave(t){return!super.onBeforeLeave||super.onBeforeLeave(t)}onLeave(){super.onLeave&&super.onLeave()}destroy(){i._navimiState.unwatchState(this),super.destroy&&super.destroy()}}},this._instantiateJS=async(e,t,s)=>{if("route"!==t)return this._jsInstances[e]=s,this._resolvePromise(s,e);try{var i=await this._buildRoute(e,s);this._jsInstances[e]=i,this._resolvePromise(i,e)}catch(t){this._rejectPromise(t,e)}},this._isJsLoading=t=>void 0!==this._navimiLoader[this._promiseNS+t]&&!this._navimiFetch.getErrors(t),this.isJsLoaded=t=>void 0!==this._loadedJSs[t],this.getInstance=t=>this._jsInstances[t],this.fetchJS=(i,t,a)=>{var e=s=>new Promise((t,e)=>this._jsInstances[s]?t(this._jsInstances[s]):!this._loadedJSs[s]||"module"!==a&&"library"!==a?this._isJsLoading(s)?this._awaitJS(s).then(t).catch(e):(this._navimiLoader[this._promiseNS+s]=t,this._navimiLoader[this._promiseNS+s+"_reject"]=e,void this._fetch(i,s,a).catch(e)):t(!0));return 1<t.length?Promise.all(t.map(e)):e(t[0])},this.loadDependencies=(e,a,t)=>{if(a){this._routesJSsServices[a]=this._routesJSsServices[a]||[];const s=((t,s)=>{const i=[];t=(t||[]).map(t=>{var e=this._options[s]&&this._options[s][t];return void 0===e?i.push(t):("services"===s&&-1===this._routesJSsServices[a].indexOf(t)&&this._routesJSsServices[a].push(t),this._jsDepMap[e]=Object.assign(Object.assign({},this._jsDepMap[e]||{}),{[a]:!0})),e});if(0<i.length)throw new Error(s+" not defined: "+i.join(", "));return t})(t,"services");t=s.filter(t=>void 0!==t).map(t=>this.fetchJS(e,[t],"service"));return Promise.all(t)}},this.initRoute=async(t,e)=>{const s=this.getInstance(t);s&&s.onEnter&&await s.onEnter(e)}}init(t,e,s,i,a,r){this._navimiHelpers=t,this._navimiFetch=e,this._navimiCSSs=s,this._navimiTemplates=i,this._navimiState=a,this._options=r,this._navimiLoader=window[this._navimiLoaderNS]={[this._callBackNS]:this._instantiateJS}}}class __Navimi_Middlewares{constructor(){this._middlewareStack=[],this.addMiddlewares=t=>{Array.isArray(t)&&this._middlewareStack.push(...t.filter(t=>void 0!==t))},this.executeMiddlewares=async(r,e,n)=>{let o;const h=async(s,i,a=0)=>{o=a;const t=this._middlewareStack[a];if(t)try{await t(e,async(t,e)=>{r&&r.signal.aborted?s():t?(n(t,e),s()):await h(s,i,a+1)})}catch(t){i(t)}else s()};return new Promise(h)}}}class Navimi{constructor(t,e,s,i){const a=null!=(h=null==s?void 0:s.navimiFetch)?h:new __Navimi_Fetch,r=null!=(h=null==s?void 0:s.navimiCSSs)?h:new __Navimi_CSSs,n=null!=(h=null==s?void 0:s.navimiJSs)?h:new __Navimi_JSs,o=null!=(h=null==s?void 0:s.navimiTemplates)?h:new __Navimi_Templates;var h=null!=(h=null==s?void 0:s.navimiMiddlewares)?h:new __Navimi_Middlewares;const l=null!=(c=null==s?void 0:s.navimiState)?c:new __Navimi_State;var c=null!=(c=null==s?void 0:s.navimiHot)?c:new __Navimi_Hot,s=null!=(s=null==s?void 0:s.navimiHelpers)?s:new __Navimi_Helpers,h=(a.init(e),r.init(a),n.init(s,a,r,o,l,e),o.init(a),l.init(s),{navimiFetch:a,navimiJSs:n,navimiCSSs:r,navimiTemplates:o,navimiMiddlewares:h,navimiState:l,navimiHot:c,navimiHelpers:s});return i?i(t,h,e):new __Navimi_Core(t,h,e)}}class __Navimi_State{constructor(){this._state={},this._stateWatchers={},this._prevState={},this._stateDiff={},this._navimiHelpers={},this._getStateDiff=t=>{t.sort((t,e)=>e.length-t.length).map(e=>{this._stateDiff[e]||this._navimiHelpers.stringify(this.getState(e,this._prevState)||"")!==this._navimiHelpers.stringify(this.getState(e,this._state)||"")&&(this._stateDiff[e]=!0,t.map(t=>{e!==t&&0===e.indexOf(t)&&(this._stateDiff[t]=!0)}))})},this._mergeState=(t,e)=>{e instanceof Error&&(e=Object.assign(Object.assign({},e),{message:e.message,stack:e.stack}));var s=t=>t&&"object"==typeof t&&!Array.isArray(t)&&null!==t;if(s(t)&&s(e))for(const i in e)s(e[i])?(t[i]||Object.assign(t,{[i]:{}}),this._mergeState(t[i],e[i])):Object.assign(t,{[i]:e[i]})},this._getCallerUid=t=>(void 0===t.___navimiUid&&(t.___navimiUid="uid:"+ ++this._uidCounter),t.___navimiUid),this.setState=t=>{var e=Object.keys(this._stateWatchers);0<e.length&&(this._prevState=this._navimiHelpers.cloneObject(this._state)),this._mergeState(this._state,t),0<e.length&&(this._getStateDiff(e),this._invokeStateWatchers())},this.getState=(t,e)=>{t=t?t.split(".").reduce((t,e)=>t&&t[e]||void 0,e||this._state):e||this._state;return t?Object.freeze(this._navimiHelpers.cloneObject(t)):void 0},this.watchState=(t,e,s)=>{e&&s&&(t=this._getCallerUid(t),this._stateWatchers[e]||(this._stateWatchers[e]={}),this._stateWatchers[e]=Object.assign(Object.assign({},this._stateWatchers[e]),{[t]:[...this._stateWatchers[e][t]||[],s]}))},this.unwatchState=(t,e)=>{const s=this._getCallerUid(t),i=t=>{this._stateWatchers[t][s]=void 0,delete this._stateWatchers[t][s],0===Object.keys(this._stateWatchers[t]).length&&delete this._stateWatchers[t]};if(e){const a=Array.isArray(e)?e:[e];void a.map(t=>{this._stateWatchers[t]||(this._stateWatchers[t]={}),i(t)})}else Object.keys(this._stateWatchers).map(i)},this.clear=t=>{const e=Array.isArray(t)?t:[t||""];e.map(e=>{const s=e?e.split(".").reduce((t,e)=>t&&t[e]||void 0,this._state):this._state;s instanceof Object&&Object.keys(s).map(t=>{s[t]instanceof Object&&0<Object.keys(s[t]).length&&this.clear((e?e+".":"")+t),delete s[t]})})}}init(t){this._navimiHelpers=t,this._uidCounter=0,this._invokeStateWatchers=t.debounce(()=>{const t=Object.keys(this._stateWatchers),e=Object.keys(this._stateDiff);this._stateDiff={},t.filter(t=>0<=e.indexOf(t)).sort((t,e)=>e.length-t.length).map(s=>{Object.keys(this._stateWatchers[s]).map(t=>{const e=this.getState(s);this._stateWatchers[s][t]&&this._stateWatchers[s][t].map(t=>t&&t(e))})})},10)}}class __Navimi_Templates{constructor(){this._templatesCache={},this._loadedTemplates={},this.loadTemplate=(t,e)=>{let s=t;if(this._regIni.exec(s))for(;t&&0<t.length;){var i=this._regIni.exec(s);if(!i||0===i.length)break;const r=this._regId.exec(i[1]);var a=0<r.length&&r[1].slice(1,-1),i=(s=s.substring(i.index+i[0].length),this._regEnd.exec(s));if(!a||!i||0===i.length)break;this._templatesCache[a]=s.substring(0,i.index)}else this._templatesCache[e]=s},this.isTemplateLoaded=t=>void 0!==this._loadedTemplates[t],this.getTemplate=t=>{const e=Array.isArray(t)?t:[t];t=e.map(t=>this._templatesCache[t]);return 1<t.length?t:t[0]},this.fetchTemplate=(t,e)=>{var s=e=>!e||this._loadedTemplates[e]?Promise.resolve():this._navimiFetch.fetchFile(e,{headers:{Accept:"text/html"},signal:t?t.signal:void 0}).then(t=>{this.loadTemplate(t,e),this._loadedTemplates[e]=!0});const i=Array.isArray(e)?e:[e];return 1<i.length?Promise.all(i.map(s)):s(i[0])}}init(t){this._navimiFetch=t,this._regIni=new RegExp("<t ([^>]+)>"),this._regEnd=new RegExp("</t>"),this._regId=new RegExp("id=(\"[^\"]+\"|'[^']+')")}}