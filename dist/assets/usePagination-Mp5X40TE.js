import{c as d,j as e,l as x,r as n,ae as C,ac as P}from"./index-B0KDE8pz.js";import{P as N,b as M,c as z}from"./ColumnVisibilityDropdown-ByH42Kf_.js";import{C as S}from"./FilterDropdown-bMbRwlaQ.js";/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=d("ArrowDown",[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=d("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=d("ArrowUp",[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=d("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=d("ChevronsLeft",[["path",{d:"m11 17-5-5 5-5",key:"13zhaf"}],["path",{d:"m18 17-5-5 5-5",key:"h8a8et"}]]);/**
 * @license lucide-react v0.378.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=d("ChevronsRight",[["path",{d:"m6 17 5-5-5-5",key:"xnjwq"}],["path",{d:"m13 17 5-5-5-5",key:"17xmmf"}]]);function O({value:s,onChange:c}){const[a,o]=n.useState(!1),t=[25,50,100,200,500];return e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-sm text-gray-600",children:"Sayfa başına:"}),e.jsxs(N,{open:a,onOpenChange:o,children:[e.jsx(M,{asChild:!0,children:e.jsx(x,{type:"button",variant:"outline",size:"sm",className:"h-9 w-20 px-2",children:s})}),e.jsx(z,{align:"end",sideOffset:4,className:"w-[100px] p-1 rounded-xl shadow-lg border border-gray-200 bg-white",children:e.jsx("div",{className:"space-y-1",children:t.map(l=>e.jsxs("button",{type:"button",onClick:()=>{c(l),o(!1)},className:C("w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",s===l?"bg-blue-50 text-blue-700":"text-gray-700 hover:bg-gray-50"),children:[e.jsx("span",{children:l}),s===l&&e.jsx(P,{size:14,className:"text-blue-600"})]},l))})})]})]})}function B({currentPage:s,totalPages:c,itemsPerPage:a,totalItems:o,onPageChange:t,onItemsPerPageChange:l,startIndex:i,endIndex:h,className:m=""}){const p=s<c,r=s>1;return e.jsxs("div",{className:`flex items-center justify-between gap-4 flex-wrap ${m}`,children:[e.jsxs("div",{className:"text-sm text-gray-600",children:[e.jsxs("span",{className:"font-medium",children:[i+1,"-",h]})," ","/ ",o," kayıt",c>1&&e.jsxs("span",{className:"ml-2 text-gray-500",children:["(Sayfa ",s," / ",c,")"]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[l&&e.jsx(O,{value:a,onChange:l}),c>1&&e.jsxs(e.Fragment,{children:[e.jsx(x,{variant:"outline",size:"sm",onClick:()=>t(1),disabled:!r,className:"h-9 w-9 p-0",title:"İlk sayfa",children:e.jsx(A,{size:16})}),e.jsx(x,{variant:"outline",size:"sm",onClick:()=>t(s-1),disabled:!r,className:"h-9 w-9 p-0",title:"Önceki sayfa",children:e.jsx(I,{size:16})}),e.jsx(x,{variant:"outline",size:"sm",onClick:()=>t(s+1),disabled:!p,className:"h-9 w-9 p-0",title:"Sonraki sayfa",children:e.jsx(S,{size:16})}),e.jsx(x,{variant:"outline",size:"sm",onClick:()=>t(c),disabled:!p,className:"h-9 w-9 p-0",title:"Son sayfa",children:e.jsx(L,{size:16})})]})]})]})}function F(s,c=50){const[a,o]=n.useState(1),[t,l]=n.useState(c),i=n.useMemo(()=>Math.max(1,Math.ceil(s.length/t)),[s.length,t]),h=n.useMemo(()=>(a-1)*t,[a,t]),m=n.useMemo(()=>Math.min(h+t,s.length),[h,t,s.length]),p=n.useMemo(()=>s.slice(h,m),[s,h,m]),r=n.useCallback(u=>{const w=Math.max(1,Math.min(u,i));o(w)},[i]),f=n.useCallback(()=>{r(a+1)},[a,r]),g=n.useCallback(()=>{r(a-1)},[a,r]),j=n.useCallback(()=>{r(1)},[r]),y=n.useCallback(()=>{r(i)},[r,i]),k=a<i,v=a>1;n.useMemo(()=>{a>i&&o(1)},[a,i]);const b=n.useCallback(u=>{l(u),o(1)},[]);return{paginatedItems:p,currentPage:a,totalPages:i,itemsPerPage:t,startIndex:h,endIndex:m,goToPage:r,nextPage:f,prevPage:g,firstPage:j,lastPage:y,hasNextPage:k,hasPrevPage:v,setItemsPerPage:b}}export{U as A,B as P,E as a,T as b,F as u};
