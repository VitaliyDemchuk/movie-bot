(function(e){function r(r){for(var n,u,c=r[0],i=r[1],p=r[2],l=0,f=[];l<c.length;l++)u=c[l],Object.prototype.hasOwnProperty.call(o,u)&&o[u]&&f.push(o[u][0]),o[u]=0;for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(e[n]=i[n]);s&&s(r);while(f.length)f.shift()();return a.push.apply(a,p||[]),t()}function t(){for(var e,r=0;r<a.length;r++){for(var t=a[r],n=!0,c=1;c<t.length;c++){var i=t[c];0!==o[i]&&(n=!1)}n&&(a.splice(r--,1),e=u(u.s=t[0]))}return e}var n={},o={app:0},a=[];function u(r){if(n[r])return n[r].exports;var t=n[r]={i:r,l:!1,exports:{}};return e[r].call(t.exports,t,t.exports,u),t.l=!0,t.exports}u.m=e,u.c=n,u.d=function(e,r,t){u.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:t})},u.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},u.t=function(e,r){if(1&r&&(e=u(e)),8&r)return e;if(4&r&&"object"===typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(u.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&r&&"string"!=typeof e)for(var n in e)u.d(t,n,function(r){return e[r]}.bind(null,n));return t},u.n=function(e){var r=e&&e.__esModule?function(){return e["default"]}:function(){return e};return u.d(r,"a",r),r},u.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},u.p="/";var c=window["webpackJsonp"]=window["webpackJsonp"]||[],i=c.push.bind(c);c.push=r,c=c.slice();for(var p=0;p<c.length;p++)r(c[p]);var s=i;a.push([0,"chunk-vendors"]),t()})({0:function(e,r,t){e.exports=t("56d7")},"56d7":function(e,r,t){"use strict";t.r(r);t("e260"),t("e6cf"),t("cca6"),t("a79d");var n=t("7a23");function o(e,r,t,o,a,u){var c=Object(n["d"])("Main");return Object(n["c"])(),Object(n["b"])(c)}function a(e,r,t,o,a,u){return Object(n["c"])(),Object(n["b"])("pre",null,Object(n["e"])(JSON.stringify(e.users,null,2)),1)}t("96cf");var u=t("1da1"),c=t("bc3a"),i=t.n(c),p={data:function(){return{users:[],payload:{page:0}}},created:function(){this.init()},methods:{init:function(){var e=this;return Object(u["a"])(regeneratorRuntime.mark((function r(){var t;return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:return r.prev=0,r.next=3,i.a.post("/api/user/list",e.payload);case 3:t=r.sent,e.users=t.data,r.next=10;break;case 7:r.prev=7,r.t0=r["catch"](0),console.error(r.t0);case 10:case"end":return r.stop()}}),r,null,[[0,7]])})))()}}};p.render=a;var s=p,l={name:"App",components:{Main:s}};l.render=o;var f=l;Object(n["a"])(f).mount("#app")}});
//# sourceMappingURL=app.c8a320af.js.map