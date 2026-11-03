import * as T from '../vendor/r3-three.js';
const { OrbitControls } = T;
async function resource(name) {
  const response = await fetch(new URL(name, import.meta.url));
  if (!response.ok) throw Error(name+' '+response.status);
  return response;
}
const [COORDS, MESHES, ledShapes, packed] = await Promise.all([
  ...['r3-assembly.json','r3-mesh.json','r3-led-model.json'].map(name => resource(name).then(r=>r.json())),
  resource('r3-mesh.bin.gz')
]);
COORDS.BOARD={x:152.4,y:102.4,pads:[],side:'top'};
COORDS.PCBA={x:153,y:95,pads:[],side:'top'};
const ledRefs=['U4','U5','U6','U7'];
const ledGeometries=ledShapes.map(({positions,indices})=>{
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
});
const $=id=>document.getElementById(id),view=$('viewport');
const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.1,1800);camera.up.set(0,1,0);
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));view.appendChild(renderer.domElement);renderer.outputColorSpace=T.SRGBColorSpace;
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=9;controls.maxDistance=650;
scene.add(new T.HemisphereLight(0xe2efff,0x8e9da5,1.5));for(const [x,y,z,p] of [[-80,180,50,1.9],[80,80,-100,1.1],[0,-130,35,1.6]]){const l=new T.DirectionalLight(0xffffff,p);l.position.set(x,y,z);scene.add(l)}
const root=new T.Group(),guides=new T.Group(),context=new T.Group(),finish=new T.Group();scene.add(root,guides,context,finish);
const materialCache=new Map();const mat=(color,extra={})=>{const key=JSON.stringify([color,extra]);if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color,roughness:.65,metalness:.12,...extra}));return materialCache.get(key)};
const silver=mat(0xc8d1d8,{metalness:.75}),glass=mat(0xa44523),black=mat(0x1d2127),blue=mat(0x5692ba),gold=mat(0xcbb875),amber=mat(0xffb044,{emissive:0x976014});
function box(w,h,d,m){return new T.Mesh(new T.BoxGeometry(w,h,d),m)}
function rod(a,b,r=.22,m=silver){a=new T.Vector3(...a);b=new T.Vector3(...b);const d=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),8),m);o.position.copy(a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
function path(points,r=.22,m=silver){class Polyline extends T.Curve{constructor(){super();this.p=points.map(p=>new T.Vector3(...p));this.lengths=[0];for(let i=1;i<this.p.length;i++)this.lengths.push(this.lengths.at(-1)+this.p[i].distanceTo(this.p[i-1]));}getPoint(t,target=new T.Vector3()){const len=t*this.lengths.at(-1);let i=1;while(i<this.p.length-1&&this.lengths[i]<len)i++;return target.copy(this.p[i-1]).lerp(this.p[i],(len-this.lengths[i-1])/(this.lengths[i]-this.lengths[i-1]||1));}}return new T.Mesh(new T.TubeGeometry(new Polyline(),24,r,6,false),m)}
function release(o){while(o.children.length){const c=o.children[0];o.remove(c);c.traverse(n=>{if(!n.userData.shared)n.geometry?.dispose()});}}
function location(ref){const p=COORDS[ref];return new T.Vector3(p.x-152.4,0,p.y-102.4)}
function pin(ref,id){const p=COORDS[ref].pads.find(p=>p.pin===id);return new T.Vector3(p.x-152.4,0,p.y-102.4)}
const nativeHolders={};let geometry,board,selected='D1',dynamic=new T.Group(),marks=new T.Group(),playing=false,t=0,last=0;
scene.add(dynamic,marks);
const options=[['BOARD','R3 · 基板全体'],['PCBA','表面の実装部品'],...ledRefs.map(r=>[r,r+' · 砲弾型LED']),['SW1','SW1 · RESET'],...Array.from({length:60},(_,i)=>[`D${i+1}`,`D${i+1} · 1N4148`]),...['R6','R8','R7','R9','R10','R12'].map(r=>[r,`${r} · 縦型抵抗`]),['U1','U1 · マイコン / リフロー'],['J1','J1 · USB-C / リフロー'],['SW2','SW2 · 電源スイッチ'],['J3 POLARIS','J3 · 昇圧基板'],...['BC1','BC2','BC3','BC4'].map(r=>[r,`${r} · 電池端子`]),...Array.from({length:60},(_,i)=>['MX'+(i+1),'MX'+(i+1)+' · Kailhソケット'])];
for(const [value,text] of options){const o=document.createElement('option');o.value=value;o.textContent=text;$('part').append(o)}
const isD=r=>/^D\d+$/.test(r),isR=r=>/^R\d+$/.test(r),reflow=r=>r==='U1'||r==='J1';
function leaded(ref,bend=1,trim=0){const group=new T.Group(),p1=pin(ref,'1'),p2=pin(ref,'2'),center=p1.clone().add(p2).multiplyScalar(.5),u=p2.clone().sub(p1).normalize(),pitch=p1.distanceTo(p2),vertical=isR(ref);
 group.position.copy(center);group.rotation.y=-Math.atan2(u.z,u.x);
 if(!vertical){group.add(rod([-1.8,1.25,0],[1.8,1.25,0],.85,glass));group.add(rod([-1.45,1.25,0],[-.95,1.25,0],.87,black));for(const sign of [-1,1]){const r=.45,a=bend*Math.PI/2,pts=[[sign*1.8,1.25,0],[sign*(pitch/2-r),1.25,0]];for(let i=1;i<=16;i++){const q=a*i/16;pts.push([sign*(pitch/2-r+r*Math.sin(q)),1.25-r*(1-Math.cos(q)),0]);}const e=pts.at(-1),L=T.MathUtils.lerp(5.8,3.4,trim);pts.push([e[0]+sign*L*Math.cos(a),e[1]-L*Math.sin(a),0]);group.add(path(pts));}}
 else{const x=-pitch/2;group.add(rod([x,.6,0],[x,6.4,0],1.05,blue));for(const y of [1.6,2.3,3.1,4.6])group.add(rod([x,y,0],[x,y+.22,0],1.07,y===4.6?gold:black));group.add(rod([x,.6,0],[x,T.MathUtils.lerp(-4,-2.6,trim),0]));const r=pitch/2,a=Math.PI*bend,pts=[[x,6.4,0],[x,6.8,0]];for(let i=1;i<=32;i++){const q=a*i/32;pts.push([x+r*(1-Math.cos(q)),6.8+r*Math.sin(q),0]);}const e=pts.at(-1),L=T.MathUtils.lerp(10.8,9.4,trim)+r*(Math.PI-a);pts.push([e[0]+L*Math.sin(a),e[1]+L*Math.cos(a),0]);group.add(path(pts));if(bend>.98)group.add(rod([pitch/2,.8,0],[pitch/2,5.8,0],.43,black));}
 return group;
}
function proxy(ref){const g=new T.Group();g.userData.ref=ref;g.position.copy(location(ref));let m;
 if(ledRefs.includes(ref)){
   ledGeometries.forEach((geo,i)=>{const mesh=new T.Mesh(geo,i?silver:mat(0xeadfc7,{roughness:.32}));
     mesh.userData.shared=true;g.add(mesh)});
 } else if(ref==='SW1'){
   const dx=3.25,dz=2.25;
   m=box(6,3.8,6,black);m.position.set(dx,1.9,dz);g.add(m);
   m=box(6,.35,6,silver);m.position.set(dx,3.95,dz);g.add(m);
   g.add(rod([dx,4,dz],[dx,8,dz],1.75,mat(0xe09a34)));
 } else if(ref==='C1'||ref==='C2'){
   const a=pin(ref,'1').sub(location(ref)),b=pin(ref,'2').sub(location(ref));
   for(const p of [a,b])g.add(rod([p.x,-2,p.z],[p.x,2.5,p.z],.24));
   m=box(4,3,2.2,mat(0xcba974));m.position.set((a.x+b.x)/2,3.5,(a.z+b.z)/2);g.add(m);
 } else if(ref==='R1'||ref==='R2'){
   const a=pin(ref,'1').sub(location(ref)),b=pin(ref,'2').sub(location(ref));
   const u=b.clone().sub(a).normalize(),c=a.clone().lerp(b,.5);
   for(const p of [a,b]) g.add(rod([p.x,-2,p.z],[p.x,1.2,p.z]));
   g.add(rod([a.x,1.2,a.z],[b.x,1.2,b.z]));
   g.add(rod([c.x-2*u.x,1.2,c.z-2*u.z],[c.x+2*u.x,1.2,c.z+2*u.z],.95,blue));
 } else  if(ref==='U1'){m=box(10.5,.5,15.5,mat(0x275a70));m.position.y=.25;g.add(m);m=box(9.5,1.55,10.1,silver);m.position.set(0,1.275,1.5);g.add(m);m=box(6.5,1,2.7,silver);m.position.set(0,1,-5.8);g.add(m)}
 else if(ref==='J1'){m=box(8.94,3,7.3,silver);m.position.set(0,-3.1,-3.75);g.add(m);m=box(6.8,1.5,.25,black);m.position.set(0,-3.1,-7.42);g.add(m)}
 else if(ref==='SW2'){m=box(5.5,4.8,19.6,silver);m.position.y=2.4;g.add(m);m=box(3.4,6,4,black);m.position.set(0,7.5,-3);g.add(m);for(const p of COORDS[ref].pads.filter(p=>['1','2','3'].includes(p.pin)))g.add(rod([p.x-COORDS[ref].x,0,p.y-COORDS[ref].y],[p.x-COORDS[ref].x,-4,p.y-COORDS[ref].y],.3))}
 else if(ref==='J3 POLARIS'){g.position.set(163.998-152.4,-1.6,106-102.4);m=box(14.1,1,17.6,mat(0x277763));m.position.y=-.6;g.add(m);for(const pad of COORDS[ref].pads){m=box(1.7,.2,1.7,gold);m.position.set(pad.x-163.998,-1.2,pad.y-106);g.add(m)}}
 else if(ref.startsWith('BC')&&nativeHolders[ref]){for(const original of nativeHolders[ref].children){const mesh=original.clone();mesh.userData.shared=true;g.add(mesh)}}
 else if(COORDS[ref].bodyOutline){const shape=new T.Shape(COORDS[ref].bodyOutline.map(([x,z])=>new T.Vector2(x,z)));for(const [x,z] of COORDS[ref].bodyHoles){const hole=new T.Path();hole.absarc(x,z,.6,0,Math.PI*2,true);shape.holes.push(hole)}const geo=new T.ExtrudeGeometry(shape,{depth:2.2,bevelEnabled:false});geo.rotateX(Math.PI/2);m=new T.Mesh(geo,black);m.position.y=-1.6;g.add(m);for(const pad of COORDS[ref].pads.filter(p=>['1','2'].includes(p.pin))){m=box(2.4,.4,2.3,silver);m.position.set(pad.x-COORDS[ref].x,-3.75,pad.y-COORDS[ref].y);g.add(m)}}
 return g;
}
function ring(p){const g=new T.Mesh(new T.TorusGeometry(.9,.13,8,24),amber);g.rotation.x=Math.PI/2;g.position.copy(p);g.position.y=COORDS[selected].side==='bottom'?-1.72:.12;return g}
function target(){return isD(selected)||isR(selected)?pin(selected,'1').add(pin(selected,'2')).multiplyScalar(.5):location(selected)}
function focus(mode='detail'){if(selected==='BOARD'&&mode==='detail')mode='whole';const p=target(),factor=Math.max(1,1/Math.max(camera.aspect,.45)),isBottom=COORDS[selected].side==='bottom';controls.target.copy(mode==='whole'?new T.Vector3(0,0,0):p.clone().add(new T.Vector3(0,isBottom?-7:7,0)));if(selected==='PCBA'&&mode==='detail'){controls.target.set(0,0,1);camera.up.set(0,0,-1);camera.position.set(0,142,1);controls.update();return}if(selected==='BOARD'&&mode==='bottom'){camera.up.set(0,0,-1);camera.position.set(0,-Math.max(165,440/camera.aspect),-.01);controls.update();return}camera.up.set(0,1,0);if(mode==='whole')camera.position.set(0,Math.max(125,440/camera.aspect),Math.max(72,230/camera.aspect));else if(mode==='top')camera.position.copy(p).add(new T.Vector3(0,80*factor,.01));else if(mode==='bottom')camera.position.copy(p).add(new T.Vector3(0,-80*factor,.01));else {const d=(isD(selected)?40:isR(selected)?55:70)*factor;camera.position.copy(p).add(new T.Vector3(d*.2,isBottom?-d:d,-d*.35));}controls.update();}
function nozzle(g,p,heat,side){if(!heat)return;const a=p.clone().add(new T.Vector3(7,side*14,3)),b=p.clone().add(new T.Vector3(2,side*4,0));g.add(rod(a.toArray(),b.toArray(),1.2,silver));g.add(rod(a.clone().add(new T.Vector3(3,side*7,1)).toArray(),a.toArray(),2.5,black));for(let i=-1;i<=1;i++){const pts=[];for(let j=0;j<10;j++){const q=j/9;pts.push([p.x+i*.9+Math.sin(q*8+performance.now()*.006)*.25,p.y+side*(1+q*3),p.z]);}g.add(path(pts,.09,mat(0xffb561,{emissive:0xa65a20})));}}
function update(){release(dynamic);
 if(selected==='BOARD'||selected==='PCBA'){
   $('stage').textContent='60キー R3';$('badgeRef').textContent=selected==='PCBA'?'表面実装部品':'組み立て配置';
   $('modelType').textContent='2026-11-03 STEP';$('detail').textContent='ドラッグで回転、ホイールで拡大。';
   $('timeline').value=1000;$('progress').textContent='全体表示';return;
 }
 const lead=isD(selected)||isR(selected),bottom=COORDS[selected].side==='bottom',side=bottom?-1:1;
 if(lead){const bend=T.MathUtils.smoothstep(t,0,.48),drop=T.MathUtils.smoothstep(t,.50,.82),trim=T.MathUtils.smoothstep(t,.9,1),g=leaded(selected,bend,trim);g.position.y=10*(1-drop);dynamic.add(g);$('stage').textContent=t<.48?'① リードを成形':t<.82?'② 穴へまっすぐ挿す':'③ 裏面で接合・余り足を切る';$('detail').textContent=isR(selected)?'折返し側を弧に沿って曲げ、2.54 mmの2穴へ。図の本体は直径2.1 mm・長さ5.8 mmの説明用形状です。':'黒い帯をパッド1の丸印へ。曲げ点は本体から離し、左右の足を90°曲げます。穴ピッチ7.62 mm。接合と切断は挿入後に裏面から行います。';}
 else {const g=proxy(selected),land=T.MathUtils.smoothstep(t,reflow(selected)?.18:0,reflow(selected)?.48:1);g.position.y+=side*(ledRefs.includes(selected)?8:20)*(1-land);dynamic.add(g);if(reflow(selected)){const p=location(selected);p.y=bottom?-1.7:.1;for(const pad of COORDS[selected].pads.filter(p=>p.pin&&p.net)){const m=new T.Mesh(new T.SphereGeometry(.28,8,6),mat(0x9a9a9a));m.scale.y=.4;m.position.set(pad.x-152.4,p.y,pad.y-102.4);dynamic.add(m)}nozzle(dynamic,p,t>.5&&t<.86,side);$('stage').textContent=t<.18?'① ペースト':t<.48?'② 位置合わせ':t<.86?'③ リフロー':'④ 冷却';$('detail').textContent='ペーストを置き、ピンセットで位置を合わせ、熱風でリフロー。冷えるまで動かしません。加熱条件は部品・ペーストの指定に従い、周囲の樹脂部品を保護します。';}else{$('stage').textContent='取り付け位置へ';$('detail').textContent=ledRefs.includes(selected)?'1番（DIN）を基板の1番印へ。樹脂底を基板から3 mm浮かせて挿入します。':selected.startsWith('BC')?'実際のEasyEDA金具モデル。金具の向きと、隣の金具・折返しリードとの接触を確認。電池は最後に入れます。':selected==='J3 POLARIS'?'外形と5接合点を示す配置補助図です。子基板の内部部品は省略。本文のパッド番号と照合してください。':'明るい輪がPCB上の接合位置です。裏面の部品は裏から確認し、先に仮止めして向きを合わせます。';}}
 $('timeline').value=String(Math.round(t*1000));$('progress').textContent=Math.round(t*100)+'%';$('badgeRef').textContent=selected==='J3 POLARIS'?'J3 · 昇圧基板':selected;$('modelType').textContent=selected.startsWith('BC')?'EasyEDA実モデル':selected.startsWith('MX')?'実フットプリント外形 / 厚さは説明用':'説明用モデル / 着地点は実PCB';
 const counts=Object.entries(nativeHolders).map(([ref,g])=>[ref,Number(g.visible)+dynamic.children.filter(o=>o.userData.ref===ref&&o.visible).length]);$('render-stats').textContent=`電池金具の表示：${counts.reduce((n,[,v])=>n+v,0)}個（${counts.map(([r,n])=>r+' '+n).join(' / ')}）。元モデルと動くモデルを同時には表示しません。`;
}
function choose(){selected=$('part').value;
 for(const id of ['play','restart','timeline','phases','progress'])$(id).hidden=selected==='BOARD'||selected==='PCBA';
 buildContext();for(const [ref,g] of Object.entries(nativeHolders))g.visible=ref!==selected&&selected!=='PCBA';t=ledRefs.includes(selected)?1:0;playing=false;$('play').textContent= '再生';release(marks);for(const p of COORDS[selected].pads.filter(p=>p.pin)){marks.add(ring(new T.Vector3(p.x-152.4,0,p.y-102.4)));}for(const g of context.children)g.visible=g.userData.ref!==selected&&selected!=='PCBA';
 const stages=ledRefs.includes(selected)?[['0','持ち上げる'],['.35','向き合わせ'],['.82','仮挿し'],['1','取り付け位置']]:reflow(selected)?[['0','ペースト'],['.35','配置'],['.7','リフロー'],['1','冷却']]:isD(selected)||isR(selected)?[['0','成形前'],['.48','曲げる'],['.82','挿す'],['1','仕上げ']]:[['0','離す'],['.35','近づける'],['.82','位置合わせ'],['1','着地']];document.querySelectorAll('[data-t]').forEach((b,i)=>{b.dataset.t=stages[i][0];b.textContent=stages[i][1]});
 $('scaleNote').textContent=selected==='PCBA'?'表面PCBA・17点':selected==='BOARD'?'基板表面を基準に表示':ledRefs.includes(selected)?'OST4ML5B32A / 4端子、足ピッチ1.25 mm':selected==='SW1'?'RESET':isD(selected)?'1N4148 / P 7.62 mm':isR(selected)?'1/4 W / 1% / P 2.54 mm':selected==='U1'?'MDBT50Q-1MV2':selected==='J1'?'TYPE-C-31-M-12':selected==='SW2'?'SS-12F16G6':selected.startsWith('BC')?'MY-AA-07 / C2979180':selected.startsWith('MX')?'CPG151101S11':'昇圧基板';
 $('warning').textContent=isD(selected)?'ガラス本体を支点に折り曲げず、本体から離れたリードを工具で支えます。':isR(selected)?'実装高さ8.5 mm以下。本体寸法と金具の干渉を実物確認。':reflow(selected)?'U1・J1はリフロー工程。加熱中は電池・USB・ST-Linkを接続しません。':'組み立て中は無通電。実物の向き・絶縁・高さを確認します。';focus();update();invalidate();}
let contextBuilt=false;
function buildContext(){
 if(!contextBuilt){
   const refs=options.map(o=>o[0]).filter(r=>r!=='BOARD'&&r!=='PCBA'&&!r.startsWith('BC')).concat(['R1','R2','C1','C2']);
   for(const ref of refs){
     const node=isD(ref)||(isR(ref)&&!['R1','R2'].includes(ref))?leaded(ref,1,1):proxy(ref);
     node.userData.ref=ref;context.add(node);
   }
   contextBuilt=true;
 }
 context.visible=$('surroundings').checked;for(const mesh of root.children){if(mesh.name==='step-R11')mesh.visible=selected!=='PCBA'}
}
function resize(){const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();invalidate()}new ResizeObserver(resize).observe(view);
$('part').addEventListener('change',()=>{choose();view.scrollIntoView({block:'center'})});$('timeline').addEventListener('input',()=>{playing=false;$('play').textContent='再生';t=Number($('timeline').value)/1000;update()});$('play').onclick=()=>{view.scrollIntoView({block:'center'});playing=!playing;if(t>=1)t=0;$('play').textContent=playing?'一時停止':'再生'};$('restart').onclick=()=>{playing=false;t=0;$('play').textContent='再生';update()};for(const b of document.querySelectorAll('[data-t]'))b.onclick=()=>{view.scrollIntoView({block:'center'});playing=false;t=Number(b.dataset.t);$('play').textContent='再生';update()};$('focus').onclick=()=>focus();$('whole').onclick=()=>focus('whole');$('top').onclick=()=>focus('top');$('bottom').onclick=()=>focus('bottom');$('surroundings').onchange=()=>context.visible=$('surroundings').checked;for(const mesh of root.children){if(mesh.name==='step-R11')mesh.visible=selected!=='PCBA'}$('caps').onchange=()=>finish.visible=$('caps').checked;
let framePending=false,visible=true;
function invalidate(){if(!framePending&&visible&&!document.hidden){framePending=true;requestAnimationFrame(frame)}}
function frame(ms){framePending=false;if(!visible||document.hidden)return;const dt=Math.min((ms-last)/1000,.05);if(playing){if(ms-last<32){invalidate();return}t=Math.min(1,t+dt/8);last=ms;update();if(t===1){playing=false;$('play').textContent='再生'}}controls.update();renderer.render(scene,camera);if(playing)invalidate()}
controls.addEventListener('change',invalidate);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)invalidate()}).observe(view);
document.addEventListener('visibilitychange',()=>{playing=false;$('play').textContent='再生';invalidate()});
document.addEventListener('guide-pause',()=>{playing=false;$('play').textContent='再生'});
document.addEventListener('guide-part',e=>{const {ref,parts}=e.detail;$('part').replaceChildren();for(const [value,text] of options.filter(([value])=>parts.includes(value))){const o=document.createElement('option');o.value=value;o.textContent=text;$('part').append(o)}$('part').value=ref;choose();resize();invalidate()});
for(const control of ['play','restart','timeline','part','focus','whole','top','bottom','surroundings'])$(control).addEventListener(control==='timeline'?'input':'click',invalidate);
$('part').addEventListener('change',invalidate);$('surroundings').addEventListener('change',invalidate);for(const b of document.querySelectorAll('[data-t]'))b.addEventListener('click',invalidate);
try{const bytes=await packed.arrayBuffer();
const compressed=new Uint8Array(bytes,0,2);
const data=compressed[0]===31&&compressed[1]===139?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():bytes;
for(const item of MESHES){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(data,item.offset,item.vertices*3),3));geo.setIndex(new T.BufferAttribute(new Uint32Array(data,item.offset+item.vertices*12,item.indices),1));geo.computeVertexNormals();const mesh=new T.Mesh(geo,mat(new T.Color(...item.color).getHex(),{flatShading:true,side:T.DoubleSide}));mesh.userData.shared=true;
 if(item.ref.startsWith('step-')){mesh.name=item.ref;root.add(mesh)}else{if(!nativeHolders[item.ref]){const g=new T.Group();g.position.copy(location(item.ref));nativeHolders[item.ref]=g;root.add(g)}nativeHolders[item.ref].add(mesh)}}
 resize();choose();$('status').textContent='';$('play').disabled=false;document.body.dataset.ready='true';document.dispatchEvent(new Event('guide-ready'));invalidate();
}catch(e){$('status').textContent='3Dを表示できません。WebGL対応ブラウザで開いてください。 '+e.message;console.error(e)}