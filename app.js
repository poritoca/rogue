
// --- 矢メッセージ簡素化ヘルパー ---
function isSpecialArrowKind(kind){
  return ['bomb','bomb3','cone3','pierce','line','sleep','stop','warp','ignite','slow','stun'].includes(kind);
}
function pickupArrowMsg(kind){
  return isSpecialArrowKind(kind) ? '矢束を拾った（ランダム効果）' : '矢束を拾った';
}
function loadArrowMsg(cnt){
  return `矢を装填した（${cnt}）`;
}
function refillArrowMsg(cnt){
  return `矢を補充（${cnt}）`;
}


/*** 端末ズーム抑止 ***/
document.addEventListener('gesturestart', e => { e.preventDefault(); }, {passive:false});
let __lastTouchEnd = 0;
document.addEventListener('touchend', (e)=>{
  const now = Date.now();
  if (now - __lastTouchEnd <= 350) e.preventDefault();
  __lastTouchEnd = now;
}, {passive:false});
window.addEventListener('touchmove', (e)=>{ if(e.target.closest('#viewport, .pad, .act, .btn, .panel')) e.preventDefault(); }, {passive:false});

/*** ユーティリティ ***/
const $=q=>document.querySelector(q);
function bindTap(sel, fn){ document.querySelectorAll(sel).forEach(el=>{ let f=false; const h=e=>{if(f)return; f=true; e.preventDefault(); fn(e,el); setTimeout(()=>f=false,0);}; el.addEventListener('touchstart',h,{passive:false}); el.addEventListener('click',h,{passive:false}); }); }
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const choice=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function toast(m, cls=""){
  const layer=$("#toast"); const d=document.createElement('div');
  d.className='toast' + (cls?(' '+cls):''); d.textContent=m; layer.appendChild(d);
  setTimeout(()=>{ d.style.opacity='0'; d.style.transform='translateY(-8px)'; setTimeout(()=>d.remove(),280); },2200);
}
// 数値ガード
const num = (v, d=0) => (typeof v === 'number' && isFinite(v)) ? v : (Number(v)===Number(v) ? Number(v) : d);
/* clone（浅い） */
function clone(o){ if(Array.isArray(o)) return o.map(x=>clone(x)); if(o && typeof o==='object') return Object.assign({},o); return o; }
/* FX helpers */
function fxSlash(){ const fx=$("#fx"); const d=document.createElement('div'); d.className='fx fx-slash'; fx.appendChild(d); setTimeout(()=>d.remove(),650); }
function fxSpark(){
  const fx=$("#fx");
  const d=document.createElement('div'); d.className='fx fx-spark'; fx.appendChild(d);
  // パーティクルを数十個
  for(let i=0;i<26;i++){
    const p=document.createElement('div'); p.className='spark-dot';
    const x=Math.random()*window.innerWidth, y=Math.random()*window.innerHeight*0.6+window.innerHeight*0.2;
    const dx=(Math.random()*120-60)+'px', dy=(-(80+Math.random()*120))+'px';
    p.style.setProperty('--x', x+'px'); p.style.setProperty('--y', y+'px');
    p.style.setProperty('--dx', dx); p.style.setProperty('--dy', dy);
    fx.appendChild(p); setTimeout(()=>p.remove(),900);
  }
  setTimeout(()=>d.remove(),800);
}
function fxOmin(){ const fx=$("#fx"); const d=document.createElement('div'); d.className='fx fx-omin'; fx.appendChild(d); setTimeout(()=>d.remove(),900); }

/*** ここから PART 2 へ続く ***/
/*** 定数・パラメータ ***/
const VIEW_W=23, VIEW_H=11; 
const MAX_FLOOR=999; 
const INV_BASE_MAX=30;           // 所持上限30
const scaleAccel = 0.18;         // 敵強化加速度
const NATURAL_SPAWN_MIN = 6;     // 自然湧き閾値
const NATURAL_SPAWN_CHECK = 8;   // 何ターンごとにチェック

/*** アイテム定義 ***/
const WEAPONS=[
  {name:"木の棒",atk:2},{name:"鉄の剣",atk:4},
  {name:"長巻(縦3)",atk:5,aoe:"v3"},
  {name:"広刃(横3)",atk:5,aoe:"h3"},
  {name:"八方刀(周囲)",atk:4,aoe:"around"},
  {name:"吸血剣",atk:3,lifesteal:0.1},
  {name:"疾風剣(二回)",atk:3,multi:2},
  {name:"一撃槌(10%特大)",atk:6,critPct:0.10,critMul:3},
  {name:"地割れ斧",atk:6,quakePct:0.10,quakeLen:10},
  {name:"豪斬(25%で3倍)",atk:7,critPct:0.25,critMul:3},
  {name:"賭斧(50%3倍/50%ミス)",atk:8,gamble:true},
  {name:"破城槌(壁破壊)",atk:5,wallBreak:true},
  {name:"巨人剣",atk:9},
  {name:"聖光剣(周囲)",atk:7,aoe:"around"},
  {name:"魔喰刃(吸収)",atk:5,lifesteal:0.15},
  {name:"旋風刃(二回)",atk:4,multi:2},
  {name:"穿突槍(直線3)",atk:5,pierce:3},
  {name:"雷迅刀(横3)",atk:6,aoe:"h3"},
  {name:"氷華刀(周囲)",atk:5,aoe:"around"},
  {name:"古代剣",atk:10}
];
const ARMORS=[
  {name:"布の服",def:1},{name:"革の盾",def:2},{name:"青銅盾",def:3},{name:"鋼鉄盾",def:5},
  {name:"重装盾(無効50%)",def:4,nullify:0.5},
  {name:"鏡盾(反射25%)",def:4,reflect:0.25},
  {name:"再生盾",def:4,regen:true},
  {name:"竜鱗盾",def:6,nullify:0.2,reflect:0.2},
  {name:"闇紋盾",def:6,nullify:0.3,reflect:0.3},
  {name:"黄金盾",def:8},
  {name:"聖盾",def:5,nullify:0.5,reflect:0.5},
  {name:"守護盾",def:5,regen:true},
  {name:"黒曜盾",def:9,nullify:0.4},
  {name:"幻盾",def:3,reflect:0.25},
  {name:"堅守盾",def:7},
  {name:"祈祷盾",def:5,regen:true,nullify:0.2},
  {name:"竜神盾",def:8,nullify:0.5,reflect:0.5,regen:true},
  {name:"霧盾",def:3,nullify:0.15},
  {name:"武者盾",def:6,nullify:0.2},
  {name:"騎士盾",def:5}
];

const HERBS=[
  {name:"回復草",type:"herb",effect:(g,t)=>{const mh=num(t.maxHp,1); t.hp=Math.min(mh, num(t.hp,1)+Math.floor(mh*0.5)); g.msg("HPが回復した！"); fxSpark(); }},
  {name:"毒草",type:"herb",effect:(g,t)=>{ if(t===g.p){ g.p.str=Math.max(1, num(g.p.str,10)-1); g.msg("力が下がった…"); }else{ t.atk=Math.max(1, num(t.atk,1)-1); g.msg(`${t.name}は弱くなった`);} }},
  {name:"ちから草",type:"herb",effect:(g,t)=>{ if(t===g.p){ g.p.str=num(g.p.str,10)+1; g.msg("力が上がった！"); fxSpark(); }else{ t.atk=num(t.atk,1)+1; g.msg(`${t.name}は少し強くなった`);} }},
  {name:"眠り草",type:"herb",effect:(g,t)=>{ t.sleep=3; g.msg((t===g.p?"眠気が…":"眠った！")); }},
  {name:"無敵草",type:"herb",effect:(g,t)=>{ if(t===g.p){ g.p.invincible=Math.max(1,num(g.p.invincible,0))+5; g.msg("しばらく無敵！"); fxSpark(); }}},
  {name:"復活草",type:"herb",revive:true,effect:()=>{}},
  // ★ 身代わり草：方向指定で当たったモンスターをデコイ化
  {name:"身代わり草",type:"herb",effect:(g)=>{ g.msg("身代わりにしたい方向を選んでください"); g.waitTarget={mode:'herbDecoy'}; }}
];

const SCROLLS=[
  {name:"識別の巻物",type:"scroll",effect:(g)=>{const u=g.inv.filter(it=>!it.ided); if(!u.length){g.msg("識別する物がない");return;} g.waitId=true; g.msg("識別するアイテムを選択");}},
  {name:"脱出の巻物",type:"scroll",effect:(g)=>{g.win("脱出成功！");}},
  {name:"天の恵み(武器強化)",type:"scroll",effect:(g)=>{ if(!g.p.wep){g.msg("武器がない");return;} const big=Math.random()<0.10; const up=big?3:1; g.p.wep.plus=num(g.p.wep.plus,0)+up; g.msg(`${g.p.wep.name}+${num(g.p.wep.plus,0)}${big?"（会心強化！）":""}`); g.flashInv(it=>it===g.p.wep); fxSpark(); } },
  {name:"地の恵み(盾強化)",type:"scroll",effect:(g)=>{ if(!g.p.arm){g.msg("盾がない");return;} const big=Math.random()<0.10; const up=big?3:1; g.p.arm.plus=num(g.p.arm.plus,0)+up; g.msg(`${g.p.arm.name}+${num(g.p.arm.plus,0)}${big?"（会心強化！）":""}`); g.flashInv(it=>it===g.p.arm); fxSpark(); } },
  {name:"大部屋の巻物",type:"scroll",effect:(g)=>{g.makeBigRoom();g.msg("大部屋になった！"); fxOmin(); }},
  {name:"真空斬りの巻物",type:"scroll",effect:(g)=>{g.vacuumSlash(); fxSlash(); }},
  {name:"バクスイの巻物",type:"scroll",effect:(g)=>{g.sleepAll(6);g.msg("周囲に眠りの力が広がった"); }}
];

const ARROWS = [
  {name:"木の矢束",type:"arrow",count:15,dmg:5,kind:"normal"},
  {name:"爆発矢束",type:"arrow",count:6,dmg:8,kind:"bomb"},
  {name:"拡散矢束",type:"arrow",count:6,dmg:5,kind:"cone3"},
  {name:"穿通矢束",type:"arrow",count:8,dmg:6,kind:"pierce"},
  {name:"雷撃矢束",type:"arrow",count:5,dmg:7,kind:"line"},
  {name:"眠り矢束",type:"arrow",count:6,dmg:3,kind:"sleep"},
  {name:"封脚矢束",type:"arrow",count:6,dmg:3,kind:"stop"},
  {name:"転移矢束",type:"arrow",count:4,dmg:2,kind:"warp"},
  {name:"広爆矢束",type:"arrow",count:4,dmg:6,kind:"bomb3"},
  {name:"烈火矢束",type:"arrow",count:5,dmg:9,kind:"ignite"},
  {name:"凍結矢束",type:"arrow",count:5,dmg:6,kind:"slow"},
  {name:"重圧矢束",type:"arrow",count:5,dmg:8,kind:"stun"}
];

const WANDS = [
  {name:"一時しのぎの杖",type:"wand",uses:5,cast:(g,t)=>{if(!t){g.msg("外れた");return;}const p=g.findFree();if(!p){g.msg("効果なし");return;}g.moveMonsterNoAnim(t,p.x,p.y);g.msg(`${t.name}は吹き飛ばされた！`);}},
  {name:"吹き飛ばしの杖",type:"wand",uses:8,cast:(g,t,dx,dy)=>{if(!t){g.msg("外れた");return;}for(let i=0;i<10;i++){const nx=t.x+dx,ny=t.y+dy;if(g.isWall(nx,ny)||g.monAt(nx,ny)||g.isOut(nx,ny))break;g.setMonPos(t,nx,ny);}g.msg(`${t.name}は吹き飛ばされた！`);}},
  {name:"場所替えの杖",type:"wand",uses:6,cast:(g,t)=>{if(!t){g.msg("外れた");return;}const px=g.p.x,py=g.p.y;g.setMonPos(t,px,py);g.p.x=t._ox;g.p.y=t._oy;g.msg(`${t.name}と入れ替わった！`);}},
  {name:"炎の杖",type:"wand",uses:10,cast:(g,t)=>{if(!t){g.msg("外れた");return;}g.hit(g.p,t,10);g.msg("炎が直撃！");}},
  {name:"眠りの杖",type:"wand",uses:8,cast:(g,t)=>{if(!t){g.msg("外れた");return;} t.sleep=3; g.msg(`${t.name}を眠らせた`);}},
  {name:"封脚の杖",type:"wand",uses:8,cast:(g,t)=>{if(!t){g.msg("外れた");return;} t.stop=3; g.msg(`${t.name}の足を封じた`);}},
  {name:"転移の杖",type:"wand",uses:6,cast:(g,t)=>{if(!t){g.msg("外れた");return;} const p=g.randomRoomCell(); if(p){ g.setMonPos(t,p.x,p.y); g.msg(`${t.name}を転移！`);}}},
  {name:"爆裂の杖",type:"wand",uses:6,cast:(g,t)=>{ if(!t){g.msg("外れた");return;} g.explode(t.x,t.y,2,10,true); g.msg("爆裂！"); fxSlash(); }},
  {name:"大爆裂の杖",type:"wand",uses:3,cast:(g,t)=>{ if(!t){g.msg("外れた");return;} g.explode(t.x,t.y,3,14,true); g.msg("大爆裂！"); fxSlash(); }},
  {name:"稲妻の杖",type:"wand",uses:8,cast:(g,t,dx,dy)=>{ let x=g.p.x,y=g.p.y; for(let i=0;i<10;i++){ x+=dx; y+=dy; if(g.isOut(x,y)||g.isWall(x,y)) break; const m=g.monAt(x,y); if(m){ g.hit(g.p,m,8); } } g.msg(`稲妻が走る`); fxSlash(); }},
  {name:"周囲凍結の杖",type:"wand",uses:6,cast:(g)=>{ let c=0; g.forEachAround(g.p.x,g.p.y,(x,y)=>{const m=g.monAt(x,y); if(m){ m.stop=2; g.hit(g.p,m,5); c++; }}); g.msg(`周囲を凍結（${c}体）`); }},
  {name:"部屋全滅の杖",type:"wand",uses:2,cast:(g)=>{ const rid=g.roomIdAt(g.p.x,g.p.y); let c=0; for(const m of g.mons.slice()){ if(g.roomIdAt(m.x,m.y)===rid){ g.hit(g.p,m,12); c++; }} g.msg(`部屋に雷撃！（${c}体）`); fxSlash(); }},
  {name:"強化の杖",type:"wand",uses:5,cast:(g,t)=>{ if(!t){g.msg("外れた");return;} t.atk=Math.floor(num(t.atk,1)*1.5); t.def=Math.floor(num(t.def,0)*1.5); t.maxHp=Math.floor(num(t.maxHp,1)*1.5); t.hp=num(t.maxHp,1); g.msg(`${t.name}は強化された！`); }},
  {name:"弱体の杖",type:"wand",uses:6,cast:(g,t)=>{ if(!t){g.msg("外れた");return;} t.atk=Math.max(1,Math.floor(num(t.atk,1)*0.7)); t.def=Math.max(0,Math.floor(num(t.def,0)*0.7)); t.hp=Math.max(1,Math.floor(num(t.hp,1)*0.7)); g.msg(`${t.name}は弱体化！`); }},
  // ★ 身代わりの杖：10〜40Tデコイ化
  {name:"身代わりの杖",type:"wand",uses:5,cast:(g,t)=>{ if(!t){g.msg("外れた");return;} const T=rand(10,40); g.makeDecoy(t,T); }}
];

const POTS=[{name:"保存の壺",type:"pot",cap:4},{name:"爆裂の壺",type:"potBomb",cap:1}];

const MON=[
  {name:"スライム",ch:"s",hp:10,atk:3,def:0,xp:5,ai:"normal"},
  {name:"ゴブリン",ch:"g",hp:14,atk:5,def:1,xp:8,ai:"normal"},
  {name:"アーチャ",ch:"a",hp:12,atk:4,def:1,xp:10,ai:"ranged"},
  {name:"バーサク",ch:"b",hp:20,atk:7,def:2,xp:15,ai:"mad"},
  {name:"ドラコ",ch:"D",hp:28,atk:11,def:3,xp:28,ai:"ranged"},
  {name:"店主",ch:"S",hp:60,atk:22,def:10,xp:0,ai:"shop",spd:2}
];

/*** 説明＆範囲表示 ***/
function itemDesc(it){
  const base = {weapon:()=>`攻撃+${num(it.atk,0)}${it.plus?` (+${num(it.plus,0)})`:''}`, armor:()=>`防御+${num(it.def,0)}${it.plus?` (+${num(it.plus,0)})`:''}`,
    herb:()=>`草：様々な効果`, scroll:()=>`巻物：${it.name}`, wand:()=>`杖（${num(it.uses,0)}回）`, arrow:()=>`矢 x${num(it.count,0)}`}[it.type] || (()=>it.type||'item');
  let extra=[];
  if(it.aoe==="h3") extra.push("攻撃範囲：横3");
  if(it.aoe==="v3") extra.push("攻撃範囲：縦3");
  if(it.aoe==="around") extra.push("攻撃範囲：周囲8");
  if(it.pierce) extra.push(`直線${num(it.pierce,0)}マス`);
  if(it.lifesteal) extra.push(`与ダメの${Math.floor(num(it.lifesteal,0)*100)}%吸収`);
  if(it.gamble) extra.push("50%で3倍/50%でミス");
  if(it.wallBreak) extra.push("壁破壊可能");
  if(it.nullify) extra.push(`被ダメ${Math.floor(num(it.nullify,0)*100)}%で無効`);
  if(it.reflect) extra.push(`被ダメ${Math.floor(num(it.reflect,0)*100)}%で反射`);
  if(it.regen) extra.push("自動回復");
  if(it.kind==="bomb") extra.push("命中で爆発(半径2)");
  if(it.kind==="bomb3") extra.push("命中で大爆発(半径3)");
  if(it.kind==="line") extra.push("直線10マスに雷撃");
  if(it.kind==="pierce") extra.push("敵を貫通");
  if(it.kind==="cone3") extra.push("前方3列拡散");
  if(it.kind==="sleep") extra.push("睡眠付与");
  if(it.kind==="stop") extra.push("3ターン移動不能");
  if(it.kind==="warp") extra.push("部屋ランダム転移");
  if(it.kind==="ignite") extra.push("追加火ダメ");
  if(it.kind==="slow") extra.push("行動遅延");
  if(it.kind==="stun") extra.push("1ターン硬直");
  if(it.name==="身代わりの杖"||it.name==="身代わり草") extra.push("対象を10〜40T身代わり化（緑ログ）");
  return [base(), ...extra].join(" / ");
}
function rangeAsciiFor(it){
  const W=15,H=9,cx=7,cy=4;
  const grid=Array.from({length:H},()=>Array(W).fill('.'));
  grid[cy][cx]='@';
  function mark(x,y,ch){ if(x>=0&&y>=0&&x<W&&y<H) grid[y][x]=ch; }
  const hit='*', blast='o', line='-';
  if(it.aoe==="h3"){ mark(cx-1,cy,hit); mark(cx,cy,hit); mark(cx+1,cy,hit); }
  if(it.aoe==="v3"){ mark(cx,cy-1,hit); mark(cx,cy,hit); mark(cx,cy+1,hit); }
  if(it.aoe==="around"){ for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(dx||dy) mark(cx+dx,cy+dy,hit); } }
  if(it.pierce){ for(let i=1;i<=num(it.pierce,0)&&cx+i<W;i++) mark(cx+i,cy,hit); }
  if(it.kind==="line"){ for(let i=1;i<=10&&cx+i<W;i++) mark(cx+i,cy,line); }
  if(it.kind==="bomb"){ mark(cx+3,cy,blast); for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){ if(dx*dx+dy*dy<=4) mark(cx+3+dx,cy+dy,blast);} }
  if(it.kind==="bomb3"){ mark(cx+3,cy,blast); for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){ if(dx*dx+dy*dy<=9) mark(cx+3+dx,cy+dy,blast);} }
  if(it.name==="稲妻の杖"){ for(let i=1;i<=10&&cx+i<W;i++) mark(cx+i,cy,line); }
  if(it.name==="爆裂の杖"||it.name==="大爆裂の杖"){ const r=(it.name==="大爆裂の杖")?3:2; for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){ if(dx*dx+dy*dy<=r*r) mark(cx+3+dx,cy+dy,blast); } }
  return grid.map(row=>row.join('')).join('\n');
}

/*** 整頓タブ補助 ***/
const TAB_ORDER = ["herb","arrow","scroll","wand","weapon","armor","pot","potBomb","other"];
const TAB_LABEL = {
  herb:"草", arrow:"矢", scroll:"巻物", wand:"杖",
  weapon:"武器", armor:"防具", pot:"壺", potBomb:"爆発壺", other:"その他"
};
function catOf(it){ if(!it||!it.type) return "other"; return TAB_ORDER.includes(it.type)?it.type:"other"; }
function sortByCategory(cat, arr){
  const getPow = it => (num(it.atk,0)+num(it.plus,0));
  const getDef = it => (num(it.def,0)+num(it.plus,0));
  if(cat==="weapon") return arr.sort((a,b)=> (getPow(b)-getPow(a)) || (a.name>b.name?1:-1));
  if(cat==="armor")  return arr.sort((a,b)=> (getDef(b)-getDef(a)) || (a.name>b.name?1:-1));
  if(cat==="wand")   return arr.sort((a,b)=> num(b.uses,0)-num(a.uses,0) || (a.name>b.name?1:-1));
  if(cat==="arrow")  return arr.sort((a,b)=> num(b.dmg,0)-num(a.dmg,0) || num(b.count,0)-num(a.count,0) || (a.kind>b.kind?1:-1));
  if(cat==="pot")    return arr.sort((a,b)=> num(b.cap,0)-num(a.cap,0) || (a.name>b.name?1:-1));
  if(cat==="potBomb")return arr.sort((a,b)=> (a.name>b.name?1:-1));
  return arr.sort((a,b)=> (a.name>b.name?1:-1));
}
function groupDisplay(arr){
  const map=new Map();
  for(const it of arr){
    const key = JSON.stringify({t:it.type,n:it.name,k:it.kind||null,p:it.plus||0,a:it.atk||0,d:it.def||0});
    if(!map.has(key)) map.set(key, {item:it, count:0, members:[]});
    const g=map.get(key); g.count++; g.members.push(it);
  }
  return [...map.values()];
}

/*** 汎用 ***/
const MON_SPAWN_POOL = MON;
function itemChar(it){ if(it.type==='weapon')return ')'; if(it.type==='armor')return ']'; if(it.type==='scroll')return '?'; if(it.type==='herb')return '!'; if(it.type==='wand')return '/'; if(it.type==='arrow')return '^'; if(it.type==='pot'||it.type==='potBomb')return '0'; if(it.type==='gold')return '$'; return '*'; }
function pickIdedWeapon(){ const w={...choice(WEAPONS)}; w.type='weapon'; w.ided=true; return w; }
function pickIdedArmor(){ const a={...choice(ARMORS)}; a.type='armor'; a.ided=true; return a; }
function priceOf(it){
  if(it.type==='weapon') return (num(it.atk,0)+num(it.plus,0))*120;
  if(it.type==='armor')  return (num(it.def,0)+num(it.plus,0))*120;
  if(it.type==='wand')   return 160+num(it.uses,5)*20;
  if(it.type==='scroll') return 120;
  if(it.type==='herb')   return 90;
  if(it.type==='arrow')  return 12*num(it.count,1);
  if(it.type==='pot')    return 220+num(it.cap,1)*60;
  if(it.type==='potBomb')return 300;
  return 80;
}
function scaleMon(def,x,y,lv){
  const m=clone(def); m.x=x; m.y=y;
  const f=Math.pow(1+scaleAccel, num(lv,1));
  m.hp=Math.max(1,Math.floor(num(m.hp,1)*f)); m.maxHp=m.hp;
  m.atk=Math.max(1,Math.floor(num(m.atk,1)*f));
  m.def=Math.max(0,Math.floor(num(m.def,0)*f));
  m.xp=Math.max(1,Math.floor(num(m.xp,1)*f));
  m.hostile=true; return m;
}

/*** Game クラス ***/
class Game{
  constructor(){
    this.w=56; this.h=30;
    this.map=[]; this.vis=[]; this.rooms=[]; this.nearStairs=new Set();
    this.items=[]; this.mons=[]; this.traps=[];
    this.turn=0; this.bestFloor=parseInt(localStorage.getItem('bestF')||'0',10);
    this.bestScore=parseInt(localStorage.getItem('bestScore')||'0',10);
    this.shopCells=new Set(); this.mhRoomIds=new Set();
    this.autoPickup=localStorage.getItem('autoPickup')!=='OFF';
    this.invTabbed = (localStorage.getItem('invTabbed')==='ON');

    this.p={
      x:0,y:0,
      hp:num(36),maxHp:num(36),str:num(10),
      baseAtk:num(5),baseDef:num(1),lv:num(1),xp:num(0),
      ar:num(0),arrow:null,wep:null,arm:null,gold:num(0),
      lastDir:[0,1],invincible:num(0),_ox:0,_oy:0
    };
    this.inv=[]; this.waitTarget=null; this.waitId=false;
    this.viewW=VIEW_W; this.viewH=VIEW_H;
    this.haveEscape=false;
  }
  // ラッパ（Game内から呼べるように）
  fxSlash(){ fxSlash(); } fxSpark(){ fxSpark(); } fxOmin(){ fxOmin(); }

  msg(s){ toast(s); }
  msgGreen(s){ toast(s,"toast-green"); }

  isOut(x,y){ return x<0||y<0||x>=this.w||y>=this.h; }
  isWall(x,y){ return this.map[y][x]==='#'; }
  monAt(x,y){ return this.mons.find(m=>m.x===x&&m.y===y); }
  itemsAt(x,y){ return this.items.filter(i=>i.x===x&&i.y===y); }
  itemAt(x,y){ return this.items.find(i=>i.x===x&&i.y===y); }
  setMonPos(m,x,y){ m._ox=m.x; m._oy=m.y; m.x=x; m.y=y; }
  moveMonsterNoAnim(m,x,y){ this.setMonPos(m,x,y); }
  baseInvMax(){ let extra=0; for(const it of this.inv){ if(it.type==='pot' && it.cap) extra+=num(it.cap,0); } return INV_BASE_MAX+extra; }

  /*** 生成 ***/
  gen(floor=1){
    this.map=Array.from({length:this.h},()=>Array(this.w).fill('#'));
    this.vis=Array.from({length:this.h},()=>Array(this.w).fill(false));
    this.rooms=[]; this.items=[]; this.mons=[]; this.traps=[]; this.shopCells.clear(); this.mhRoomIds.clear(); this.nearStairs.clear();

    const R=rand(7,11);
    for(let i=0;i<R;i++){
      for(let t=0;t<60;t++){
        const rw=rand(5,12), rh=rand(4,10), rx=rand(1,this.w-rw-2), ry=rand(1,this.h-rh-2);
        const overlap=this.rooms.some(r=>rx<r.x+r.w+1 && rx+rw+1>r.x && ry<r.y+r.h+1 && ry+rh+1>r.y);
        if(overlap) continue;
        for(let y=ry;y<ry+rh;y++) for(let x=rx;x<rx+rw;x++) this.map[y][x]='.';
        const id=this.rooms.length; this.rooms.push({x:rx,y:ry,w:rw,h:rh,id}); break;
      }
    }
    if(!this.rooms.length){ const cx=~~(this.w/2)-4, cy=~~(this.h/2)-3; for(let y=cy;y<cy+6;y++) for(let x=cx;x<cx+8;x++) this.map[y][x]='.'; this.rooms.push({x:cx,y:cy,w:8,h:6,id:0}); }
    const carve=(ax,ay,bx,by)=>{ for(let x=Math.min(ax,bx);x<=Math.max(ax,bx);x++) this.map[ay][x]='.'; for(let y=Math.min(ay,by);y<=Math.max(ay,by);y++) this.map[y][bx]='.'; };
    for(let i=1;i<this.rooms.length;i++){ const A=this.rooms[i-1], B=this.rooms[i]; const ax=A.x+~~(A.w/2), ay=A.y+~~(A.h/2), bx=B.x+~~(B.w/2), by=B.y+~~(B.h/2); carve(ax,ay,bx,by); }

    const start=this.rooms[0]; this.p.x=start.x+~~(start.w/2); this.p.y=start.y+~~(start.h/2);
    const far=this.rooms.reduce((a,b)=> ( (this.d2Room(a) > this.d2Room(b)) ? a:b ));
    const stx=far.x+~~(far.w/2), sty=far.y+~~(far.h/2); this.map[sty][stx]='>';
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ if(dx||dy){ const nx=stx+dx, ny=sty+dy; if(!this.isOut(nx,ny)) this.nearStairs.add(`${nx},${ny}`);} }

    this.ensureConnectivity(this.p.x,this.p.y);

    for(const r of this.rooms){
      const isStart=(this.p.x>=r.x&&this.p.x<r.x+r.w&&this.p.y>=r.y&&this.p.y<r.y+r.h);
      let isShop=Math.random()<0.04 && !isStart && r.w>=6 && r.h>=6;
      let isMH=(Math.random()<0.08 && !isStart && r.w>=20 && r.h>=20);
      if(!isShop && !isMH && Math.random()<0.03 && r.w>=24 && r.h>=24) isMH=true;
      if(isShop && isMH) (Math.random()<0.5)? isMH=false: isShop=false;
      if(isShop) this.genShop(r);
      if(isMH){ this.genMH(r); this.mhRoomIds.add(r.id); }
      if(!isShop && !isMH){
        for(let i=0;i<rand(0,3);i++){ const p=this.freeIn(r,true); if(!p) break; const t=choice(MON_SPAWN_POOL.slice(0,5)); const lv=Math.max(1,Math.floor(num(this.floor,1)/1)); this.mons.push(scaleMon(t,p.x,p.y,lv)); }
        for(let i=0;i<rand(0,1);i++){ const p=this.freeIn(r,false); if(p) this.spawnRandomItem(p.x,p.y,floor); }
        if(Math.random()<0.10){ const p=this.freeIn(r,true); if(p) this.traps.push({x:p.x,y:p.y,type:"arrow",seen:false}); }
      }
    }
    for(let i=0;i<rand(2,4);i++){ const p=this.freeIn(null,false); if(p) this.spawnRandomItem(p.x,p.y,floor); }
    for(let i=0;i<rand(2,4);i++){ const p=this.freeIn(null,false); if(p) this.items.push({name:"G",type:"gold",amount:rand(10,100)*num(floor,1),ch:"$",x:p.x,y:p.y}); }

    if(this.inv.length===0){
      const w=pickIdedWeapon(), a=pickIdedArmor(); w.ided=a.ided=true; this.inv.push(w,a); this.p.wep=w; this.p.arm=a;
      const ar={...choice(ARROWS)}; ar.ided=true; this.inv.push(ar);
    }
    this.haveEscape = this.inv.some(it=>it.type==='scroll' && it.name.includes("脱出"));
    this.floor=num(floor,1);
    this.msg(`地下${this.floor}階に到着した。`);
    this.revealRoomAt(this.p.x,this.p.y,true);
    
    // 正規化：店主は初期は非敵対に固定
    if(this.mons){ for(const m of this.mons){ if(m && m.ai==='shop' && m.hostile==null){ m.hostile=false; m.isShop=true; } } }
this.render();
  }
  d2Room(r){ const cx=r.x+~~(r.w/2), cy=r.y+~~(r.h/2); const dx=this.p.x-cx, dy=this.p.y-cy; return dx*dx+dy*dy; }

  ensureConnectivity(sx,sy){
    const vis=Array.from({length:this.h},()=>Array(this.w).fill(false));
    const st=[[sx,sy]]; vis[sy][sx]=true;
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    while(st.length){ const [x,y]=st.pop(); for(const d of dirs){ const nx=x+d[0], ny=y+d[1]; if(nx<0||ny<0||nx>=this.w||ny>=this.h) continue; if(vis[ny][nx]) continue; if(this.map[ny][nx]==='#') continue; vis[ny][nx]=true; st.push([nx,ny]); } }
    let changed=false;
    for(let y=1;y<this.h-1;y++) for(let x=1;x<this.w-1;x++){
      if(this.map[y][x]==='.' && !vis[y][x]){ let tx=sx, ty=sy; let cx=x, cy=y;
        while(cx!==tx){ this.map[cy][cx]='.'; cx+=(tx>cx?1:-1); }
        while(cy!==ty){ this.map[cy][cx]='.'; cy+=(ty>cy?1:-1); }
        changed=true;
      }
    }
    if(changed) this.ensureConnectivity(sx,sy);
  }

  genShop(r){
    const cx=r.x+~~(r.w/2), cy=r.y+~~(r.h/2);
    const keep=scaleMon(MON[5],cx,cy,1); keep.hostile=false; keep.isShop=true; this.mons.push(keep);
    for(let i=0;i<9;i++){ const p=this.freeIn(r,false); if(!p) continue; const it=this.spawnRandomItem(p.x,p.y,Math.max(1,num(this.floor,1))); it.price=priceOf(it); this.shopCells.add(`${p.x},${p.y}`); }
  }
  genMH(r){
    for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++){
      if(this.map[y][x]!=='.') continue;
      if(Math.random()<0.75){ if(!this.monAt(x,y)){ const t=choice(MON_SPAWN_POOL.slice(0,5)); const lv=Math.max(1,Math.floor(num(this.floor,1)/1)); this.mons.push(scaleMon(t,x,y,lv)); } }
      else if(Math.random()<0.32){ if(!this.itemAt(x,y)) this.spawnRandomItem(x,y,this.floor); }
      if(Math.random()<0.22){ this.traps.push({x,y,type:"arrow",seen:false}); }
    }
  }
  freeIn(room,avoidAll=false){
    for(let t=0;t<200;t++){
      const x=rand(room?room.x+1:1, room?room.x+room.w-2:this.w-2);
      const y=rand(room?room.y+1:1, room?room.y+room.h-2:this.h-2);
      if(this.map[y][x]!=='.') continue;
      if((avoidAll && (x===this.p.x&&y===this.p.y)) || (avoidAll && this.monAt(x,y)) ) continue;
      return {x,y};
    } return null;
  }
  findFree(){ for(let t=0;t<500;t++){ const x=rand(1,this.w-2), y=rand(1,this.h-2); if(this.map[y][x]==='.' && !this.monAt(x,y) && !(x===this.p.x&&y===this.p.y)) return {x,y}; } return null; }
  randomRoomCell(){ const r=choice(this.rooms); return this.freeIn(r,false); }

  spawnRandomItem(x,y,floor){
    if(!this.haveEscape && Math.random()<0.18){
      const scroll=SCROLLS.find(s=>s.name.includes("脱出"));
      const it={...scroll}; it.x=x; it.y=y; it.ch=itemChar(it); this.items.push(it); return it;
    }
    const r=Math.random(); let it=null;
    // 出現傾斜（草→矢→巻→杖→武→防）
    if      (r < 0.30){ it={...choice(HERBS)}; }
    else if (r < 0.52){ it={...choice(ARROWS)}; }
    else if (r < 0.70){ it={...choice(SCROLLS)}; }
    else if (r < 0.82){ it={...choice(WANDS)}; }
    else if (r < 0.92){ it={...choice(WEAPONS), type:'weapon'}; }
    else              { it={...choice(ARMORS), type:'armor'}; }
    it.x=x; it.y=y; it.ch=itemChar(it); this.items.push(it);
    return it;
  }

  revealRoomAt(x,y){
    const rid=this.roomIdAt(x,y);
    if(rid<0){ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const nx=x+dx, ny=y+dy; if(this.isOut(nx,ny)) continue; this.vis[ny][nx]=true; } return; }
    const r=this.rooms.find(r=>r.id===rid);
    for(let yy=r.y;yy<r.y+r.h;yy++) for(let xx=r.x;xx<r.x+r.w;xx++) this.vis[yy][xx]=true;
    for(let yy=r.y-1;yy<=r.y+r.h;yy++) for(let xx=r.x-1;xx<=r.x+r.w;xx++){ if(xx<0||yy<0||xx>=this.w||yy>=this.h) continue; if(this.map[yy][xx]==='.') this.vis[yy][xx]=true; }
  }
  roomIdAt(x,y){ for(const r of this.rooms){ if(x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h) return r.id; } return -1; }

  tileChar(x,y){
    if(this.isOut(x,y)) return " ";
    if(!this.vis[y][x]) return "#";
    if(this.map[y][x]==='#') return "#";
    const layers=[];
    if(this.map[y][x]==='>') layers.push('>');
    const its=this.itemsAt(x,y); if(its.length) layers.push(its[0].ch||'*');
    const m=this.monAt(x,y); if(m) layers.push(m.ch);
    if(this.p.x===x && this.p.y===y) layers.push('@');
    if(layers.length===0) return (this.nearStairs.has(`${x},${y}`)?'·':'.');
    const pick = layers[(Math.floor(Date.now()/1000)) % layers.length];
    return pick;
  }

  render(){
    const halfW=~~(this.viewW/2), halfH=~~(this.viewH/2);
    this.offX=clamp(this.p.x-halfW, 0, this.w-this.viewW);
    this.offY=clamp(this.p.y-halfH, 0, this.h-this.viewH);
    let out="";
    for(let y=0;y<this.viewH;y++){
      for(let x=0;x<this.viewW;x++){
        out+=this.tileChar(x+this.offX,y+this.offY);
      } out+="\n";
    }
    $("#viewport").textContent=out;
    $("#chipBest").textContent=`Best ${this.bestFloor}F / Score ${this.bestScore}`;
    const eW=this.p.wep?`（E）`:""; const eA=this.p.arm?`（E）`:""; const eAr=this.p.arrow?`（E）`:"";
    $("#stats").textContent =
`Lv:${num(this.p.lv,1)}  HP:${num(this.p.hp,0)}/${num(this.p.maxHp,1)}  力:${num(this.p.str,10)}  階:${num(this.floor,1)}  G:${num(this.p.gold,0)}
攻:${this.calcPlayerAtk()}  守:${this.calcPlayerDef()}
矢:${num(this.p.ar,0)}（${this.p.arrow?this.p.arrow.kind:'なし'}）
武:${this.p.wep?this.p.wep.name+(this.p.wep.plus?('+'+num(this.p.wep.plus,0)):''):'なし'}${this.p.wep?eW:''}
盾:${this.p.arm?this.p.arm.name+(this.p.arm.plus?('+'+num(this.p.arm.plus,0)):''):'なし'}${this.p.arm?eA:''}
矢装填:${this.p.arrow?this.p.arrow.kind:'なし'}${this.p.arrow?eAr:''}
自動拾い:${this.autoPickup?'ON':'OFF'}`;
    $("#lowHP").style.opacity = (num(this.p.hp,0)/Math.max(1,num(this.p.maxHp,1))<0.2)?1:0;
  }

  calcPlayerAtk(){
    const base = num(this.p.baseAtk, 0);
    const wAtk = this.p.wep ? num(this.p.wep.atk, 0) + num(this.p.wep.plus, 0) : 0;
    const str  = num(this.p.str, 10);
    let a = base + wAtk;
    a = Math.floor(num(a,0) * (str/10));
    return Math.max(0, a);
  }
  calcPlayerDef(){
    const base = num(this.p.baseDef, 0);
    const aDef = this.p.arm ? num(this.p.arm.def, 0) + num(this.p.arm.plus, 0) : 0;
    return Math.max(0, base + aDef);
  }
  needExp(){ return 100; }
/*** ここから PART 3 へ続く ***/
  // ダメージ処理
  hit(att,def,base){
    const atk = (att===this.p) ? this.calcPlayerAtk() : num(att && att.atk, 0);
    let defv  = (def===this.p) ? this.calcPlayerDef() : num(def && def.def, 0);
    let dmgBase = num(base, 0);
    const rnd = rand(-1,1);

    let dmg = (dmgBase + atk - defv + rnd);

    if(att===this.p && this.p.wep){
      const w=this.p.wep;
      if(w.gamble){
        if(Math.random()<0.5){ this.msg("空振り！"); dmg = 0; }
        else { dmg = Math.max(1, num(dmg,1)) * 3; this.msg("会心の超一撃！"); }
      }
      if(w.critPct && Math.random() < num(w.critPct,0)){
        dmg = Math.max(1, num(dmg,1)) * num(w.critMul,2);
        this.msg("会心！");
      }
    }

    dmg = Math.floor(num(dmg, 1));
    if (!isFinite(dmg) || dmg < 0) dmg = 0;

    const vp=$("#viewport"); vp.classList.remove('shake'); void vp.offsetWidth; vp.classList.add('shake');
    if(dmg>0) fxSlash();

    if(def===this.p && this.p.arm){
      const a=this.p.arm;
      if(a.nullify && Math.random() < num(a.nullify,0)){ this.msg("攻撃を無効化した！"); dmg=0; }
      if(dmg>0 && a.reflect && Math.random() < num(a.reflect,0)){
        this.msg("攻撃を反射！");
        const ret = Math.max(1, dmg);
        if(att){ att.hp = Math.max(0, num(att.hp,1) - ret); if(att.hp<=0) this.kill(att,this.p); }
        dmg=0;
      }
    }

    if(dmg<=0){ this.render(); return; }
    def.hp = Math.max(0, num(def.hp,1) - dmg);

    if(def===this.p){
      this.msg(`${dmg}のダメージ！`);
      if(this.p.invincible>0) this.p.invincible = Math.max(0, num(this.p.invincible,0)-1);
      if(num(this.p.hp,0)<=0){
        const idx=this.inv.findIndex(x=>x.type==="herb" && x.revive);
        if(idx>=0){
          this.inv.splice(idx,1);
          this.p.maxHp = Math.max(1, num(this.p.maxHp,1));
          this.p.hp = Math.max(1, Math.floor(num(this.p.maxHp,1)*0.7));
          this.msg("復活草が発動！");
          fxSpark();
          this.render(); return;
        }
        this.gameOver();
      }
    }else{
      this.msg(`${def.name}に${dmg}ダメージ`);
      if(num(def.hp,0)<=0) this.kill(def,att);
      else if(att===this.p && this.p.wep && this.p.wep.lifesteal){
        const heal = Math.floor(Math.max(0, dmg * num(this.p.wep.lifesteal,0)));
        if(heal>0){
          this.p.hp = Math.min(num(this.p.maxHp,1), num(this.p.hp,1)+heal);
          this.msg(`HPを${heal}回復`);
          fxSpark();
        }
      }
    }
    this.render();
  }

  // キル後処理（デコイ対応）
  kill(m,killer){
    // デコイの勝敗で強化
    if(killer && killer.decoy){
      killer.atk=Math.max(1,num(killer.atk,1)*2);
      killer.def=Math.max(0,num(killer.def,0)*2);
      killer.maxHp=Math.max(1,num(killer.maxHp,1)*2);
      killer.hp=killer.maxHp; killer.doubled=true;
      this.msgGreen(`${killer.name}（身代わり）が強化された！`);
    }
    // デコイが倒された場合、倒した側を強化
    if(m.decoy){
      const foe = killer && killer!==this.p ? killer : null;
      if(foe){
        foe.atk=Math.max(1,num(foe.atk,1)*2);
        foe.def=Math.max(0,num(foe.def,0)*2);
        foe.maxHp=Math.max(1,num(foe.maxHp,1)*2);
        foe.hp=foe.maxHp; foe.doubled=true;
        this.msgGreen(`${foe.name}が身代わりを倒し、強化された！`);
      }
    }

    if(killer===this.p){
      let exp = m.doubled ? num(m.xp,1)*5 : num(m.xp,1);
      this.p.xp = num(this.p.xp,0) + exp;
      this.msg(`EXP ${exp} を得た`);
      while(num(this.p.xp,0)>=this.needExp()){
        this.p.xp -= this.needExp();
        this.p.lv = num(this.p.lv,1) + 1;
        this.p.maxHp = num(this.p.maxHp,1) + 5;
        this.p.hp = num(this.p.maxHp,1);
        this.p.baseAtk = num(this.p.baseAtk,0) + 1;
        this.p.baseDef = num(this.p.baseDef,0) + 1;
        this.msg(`Lv${this.p.lv}！`);
        fxSpark();
      }
    }
    if(Math.random()<0.10){ const it=this.spawnRandomItem(m.x,m.y,this.floor); it.x=m.x; it.y=m.y; }
    this.mons=this.mons.filter(x=>x!==m);
  }

  tryMove(dx,dy){
    if(this.waitTarget){
      if(this.waitTarget.mode==='wand'){ this.castWand(this.waitTarget.item,dx,dy); }
      if(this.waitTarget.mode==='shoot'){ this.shootDir(dx,dy); }
      if(this.waitTarget.mode==='herbDecoy'){ this.castHerbDecoy(dx,dy); }
    }
    this.waitTarget=null;
    this.p.lastDir=[dx,dy];
    const nx=this.p.x+dx, ny=this.p.y+dy;
    if(this.isOut(nx,ny)) return;
    if(this.isWall(nx,ny)){ if(this.p.wep && this.p.wep.wallBreak){ this.map[ny][nx]='.'; this.msg("壁を砕いた"); } this.render(); return; }
    const m=this.monAt(nx,ny);
    if(m){ this.hit(this.p,m,0); }
    else{
      this.p._ox=this.p.x; this.p._oy=this.p.y;
      this.p.x=nx; this.p.y=ny;
      if(this.autoPickup){ this.doPickupHere(); }
      const tr=this.traps.find(t=>t.x===nx && t.y===ny);
      if(tr && !tr.seen){ tr.seen=true; if(tr.type==="arrow"){ this.msg("矢のワナ！"); this.hit({atk:10,hp:1,def:0}, this.p, 0); } }
      if(this.map[ny][nx]==='>'){ this.msg("階段がある"); fxOmin(); }
      this.revealRoomAt(nx,ny);
      this.turnStep();
    }
    this.render();
  }

  doPickupHere(){
    const it=this.itemAt(this.p.x,this.p.y);
    if(!it) return;
    if(this.shopCells.has(`${it.x},${it.y}`) && it.price!=null){
      if(num(this.p.gold,0)>=num(it.price,0)){ this.p.gold=num(this.p.gold,0)-num(it.price,0); this.msg(`購入: ${it.name}`); fxSpark(); }
      else return;
    }
    if(this.inv.length>=this.baseInvMax()){ this.msg("これ以上持てない"); return; }
    if(it.type==='arrow'){
      if(!this.p.arrow){ this.p.arrow = {kind: it.kind, dmg: num(it.dmg,5)}; this.msg(`${it.name}を装填（自動）`); }
      else{ this.msg(`${it.name}を補充`); }
      this.p.ar = num(this.p.ar,0) + num(it.count,0);
      fxSpark();
    } else if(it.type==='gold'){
      this.p.gold = num(this.p.gold,0) + num(it.amount,0);
      this.msg(`${num(it.amount,0)}Gを拾った`);
      fxSpark();
    } else {
      this.inv.push(it);
      this.msg(`${it.name}を拾った`);
      fxSpark();
      if((it.type==='weapon' && num(it.atk,0)>=8) || (it.type==='armor' && num(it.def,0)>=7)){
        this.msg("強力な装備だ！"); this.flashInv(x=>x===it);
      }
      if(it.type==='scroll' && it.name.includes("脱出")) this.haveEscape=true;
    }
    this.items=this.items.filter(x=>x!==it);
  }

  descend(){ if(this.map[this.p.y][this.p.x]!=='>'){ this.msg("ここには階段がない"); return; } this.floor=Math.min(MAX_FLOOR, num(this.floor,1)+1); if(this.floor>this.bestFloor){ this.bestFloor=this.floor; localStorage.setItem('bestF',this.bestFloor); } this.gen(this.floor); }

  askShoot(){ if(!this.p.arrow || num(this.p.ar,0)<=0){ this.msg("矢がない"); return; } this.waitTarget={mode:'shoot'}; this.msg("撃つ方向を選んでください"); }
  shootDir(dx,dy){
    if(!this.p.arrow || num(this.p.ar,0)<=0){ this.msg("矢がない"); return; }
    let x=this.p.x, y=this.p.y, hit=null, last={x,y};
    const kind=this.p.arrow.kind;
    const step=(fx,fy,max=10,cb)=>{ for(let i=0;i<max;i++){ x+=fx; y+=fy; if(this.isOut(x,y)||this.isWall(x,y)) break; last={x,y}; if(cb && cb(x,y)===false) break; } };
    if(kind==="line"){ step(dx,dy,10,(xx,yy)=>{ const m=this.monAt(xx,yy); if(m){ this.hit(this.p,m,8); } return true; }); fxSlash(); }
    else if(kind==="pierce"){ step(dx,dy,10,(xx,yy)=>{ const m=this.monAt(xx,yy); if(m){ this.hit(this.p,m,num(this.p.arrow.dmg,5)); } return true; }); }
    else if(kind==="cone3"){ for(const [sx,sy] of [[dx,dy],[dx,dy-1],[dx,dy+1]]){ x=this.p.x; y=this.p.y; step(sx,sy,3,(xx,yy)=>{ const m=this.monAt(xx,yy); if(m){ this.hit(this.p,m,5); return false; } return true; }); } }
    else{
      for(let i=0;i<10;i++){ x+=dx; y+=dy; if(this.isOut(x,y)||this.isWall(x,y)) break; last={x,y}; const m=this.monAt(x,y); if(m){ hit=m; break; } }
    }
    this.p.ar=Math.max(0,num(this.p.ar,0)-1);
    if(hit){
      if(kind==="bomb"){ this.msg("爆発矢が炸裂！"); this.explode(hit.x,hit.y,2,8,true); fxSlash(); }
      else if(kind==="bomb3"){ this.msg("大爆発矢！"); this.explode(hit.x,hit.y,3,10,true); fxSlash(); }
      else if(kind==="sleep"){ hit.sleep=3; this.msg("眠らせた"); }
      else if(kind==="stop"){ hit.stop=3; this.msg("動けない！"); }
      else if(kind==="warp"){ const p=this.randomRoomCell(); if(p){ this.setMonPos(hit,p.x,p.y); this.msg("どこかへ飛ばした"); } }
      else if(kind==="ignite"){ this.hit(this.p,hit,9); }
      else if(kind==="slow"){ hit.slow=3; this.hit(this.p,hit,6); }
      else if(kind==="stun"){ hit.stun=1; this.hit(this.p,hit,8); }
      else { this.hit(this.p,hit,num(this.p.arrow.dmg,5)); }
    }
    this.turnStep(); this.render();
  }

  useItemMenu(idx){
    const it=this.inv[idx]; if(!it) return;
    if(this.waitId){ if(!it.ided){ it.ided=true; this.msg(`${it.name}を識別した！`);} else this.msg("既に識別済み"); this.waitId=false; this.render(); if($("#invOL").style.display==='flex'){ this.openInv(); } return; }
    if(it.type==='weapon'){ this.p.wep=it; this.msg(`${it.name}を装備した`); this.flashInv(x=>x===it); }
    else if(it.type==='armor'){ this.p.arm=it; this.msg(`${it.name}を装備した`); this.flashInv(x=>x===it); }
    else if(it.type==='herb'){
      if(it.name==="身代わり草"){ this.msg("身代わりにしたい方向を選んでください"); this.waitTarget={mode:'herbDecoy', idx}; return; }
      it.effect(this,this.p); this.consume(idx);
    }
    else if(it.type==='scroll'){ it.effect(this); this.consume(idx); }
    else if(it.type==='wand'){ this.waitTarget={mode:'wand', item:it}; this.msg("杖を振る方向を指定"); }
    else if(it.type==='pot'){ this.openPot(it); return; }
    else if(it.type==='potBomb'){ this.msg("壺は投げて使おう"); }
    else if(it.type==='arrow'){ 
      this.p.arrow={kind:it.kind,dmg:num(it.dmg,5)}; 
      this.p.ar=num(this.p.ar,0)+num(it.count,0); 
      this.consume(idx,false); 
      this.msg(`装填: ${it.name}（${this.p.ar}）`); 
    }

    this.turnStep(); this.render();
    if($("#invOL").style.display==='flex'){ this.openInv(); }
  }

  // 身代わり草：方向決定→最初の命中モンスターに適用
  castHerbDecoy(dx,dy){
    const idx = (this.waitTarget && this.waitTarget.idx!=null) ? this.waitTarget.idx : -1;
    let x=this.p.x,y=this.p.y, tgt=null;
    for(let i=0;i<10;i++){ x+=dx; y+=dy; if(this.isOut(x,y)||this.isWall(x,y)) break; const m=this.monAt(x,y); if(m){ tgt=m; break; } }
    if(!tgt){ this.msg("外れた"); return; }
    const T=rand(10,40); this.makeDecoy(tgt,T);
    if(idx>=0){ this.consume(idx,true); }
    this.turnStep(); this.render();
  }

  // デコイ化
  makeDecoy(m,T){
    m.decoy=true; m.decoyT=num(T,10);
    m.hostile=true; // 動く
    this.msgGreen(`${m.name}は身代わりになった（${m.decoyT}T）`);
  }

  throwItemMenu(idx){
    const it=this.inv[idx]; if(!it) return;
    const [dx,dy]=this.p.lastDir; if(dx===0&&dy===0){ this.msg("方向が定まっていない"); return; }
    let x=this.p.x, y=this.p.y, hit=null, last={x,y};
    for(let i=0;i<10;i++){ x+=dx; y+=dy; if(this.isOut(x,y)||this.isWall(x,y)) break; last={x,y}; const m=this.monAt(x,y); if(m){ hit=m; break; } }
    if(it.type==='herb'){
      if(it.name==="身代わり草" && hit){ const T=rand(10,40); this.makeDecoy(hit,T); this.consume(idx,true); this.turnStep(); this.render(); return; }
      if(hit){ it.effect(this,hit); } else { this.items.push({...it,x:last.x,y:last.y}); } this.consume(idx,true);
    }
    else if(it.type==='wand'){ if(hit){ this.hit(this.p,hit,2); } this.consume(idx,true); }
    else if(it.type==='potBomb'){ const cx=hit?hit.x:last.x, cy=hit?hit.y:last.y; this.msg("壺が爆ぜた！"); this.explode(cx,cy,3,12,true); this.consume(idx,true); fxSlash(); }
    else{ if(hit){ this.hit(this.p,hit,2); } else { this.items.push({...it,x:last.x,y:last.y}); } this.consume(idx,true); }
    this.turnStep(); this.render();
    if($("#invOL").style.display==='flex'){ this.openInv(); }
  }

  consume(idx,remove=true){ const it=this.inv[idx]; if(!it) return;
    if(it.type==='wand'){ it.uses=num(it.uses,0)-1; if(it.uses<=0){ this.inv.splice(idx,1); this.msg("杖は砕け散った"); } }
    else if(remove){ this.inv.splice(idx,1); }
  }

  explode(cx,cy,r,d,breakWall){
    for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++){
      if(this.isOut(x,y)) continue;
      if((x-cx)**2+(y-cy)**2<=r*r){
        if(breakWall && this.isWall(x,y)) this.map[y][x]='.';
        const m=this.monAt(x,y); if(m) this.hit(this.p,m,d);
      }
    }
  }
  vacuumSlash(){
    const rid=this.roomIdAt(this.p.x,this.p.y);
    if(rid>=0){ let hit=0; for(const m of this.mons.slice()){ if(this.roomIdAt(m.x,m.y)===rid){ this.hit(this.p,m,10); hit++; } } this.msg(`真空斬り！ ${hit}体にダメージ`); }
    else{ let hit=0; this.forEachAround(this.p.x,this.p.y,(x,y)=>{ const t=this.monAt(x,y); if(t){ this.hit(this.p,t,8); hit++; }}); this.msg(`真空斬り！（周囲${hit}）`); }
  }
  sleepAll(t){ for(const m of this.mons) m.sleep=num(t,0); }
  forEachAround(x,y,fn){ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ if(dx===0&&dy===0) continue; const nx=x+dx, ny=y+dy; if(this.isOut(nx,ny)) continue; fn(nx,ny);} }
  castWand(w,dx,dy){
    if(!w || w.type!=='wand'){ this.msg("振れない"); return; }
    let x=this.p.x, y=this.p.y, hit=null;
    for(let i=0;i<10;i++){ x+=dx; y+=dy; if(this.isOut(x,y)||this.isWall(x,y)) break; const m=this.monAt(x,y); if(m){ hit=m; break; } }
    w.cast(this, hit, dx, dy);
    const idx=this.inv.indexOf(w); if(idx>=0){ this.consume(idx,false); if(num(w.uses,0)<=0) this.inv.splice(idx,1); }
    this.turnStep(); this.render();
  }

  turnStep(){
    this.turn++;
    if(this.turn%5===0 && num(this.p.hp,0)<num(this.p.maxHp,1)) this.p.hp=num(this.p.hp,0)+1;
    if(this.p.arm && this.p.arm.regen && this.turn%4===0) this.p.hp=Math.min(num(this.p.maxHp,1),num(this.p.hp,0)+1);
    if(this.turn%NATURAL_SPAWN_CHECK===0 && this.mons.length<NATURAL_SPAWN_MIN){
      const p=this.freeIn(null,true); if(p){ const t=choice(MON_SPAWN_POOL.slice(0,5)); const lv=Math.max(1,Math.floor(num(this.floor,1)/1)); this.mons.push(scaleMon(t,p.x,p.y,lv)); this.msg("どこからか気配が…"); }
    }
    // デコイ寿命
    for(const m of this.mons){ if(m.decoy){ m.decoyT=num(m.decoyT,0)-1; if(m.decoyT<=0){ m.decoy=false; this.msgGreen(`${m.name}の身代わり効果が切れた`); } } }
    this.enemyPhase();
  }

  // 敵AI（デコイ優先／デコイはモンスターを狙う）
  enemyPhase(){
    // デコイを探索
    const decoys = this.mons.filter(m=>m.decoy);
    const findNearest = (sx,sy, filterFn) => {
      let best=null, bd=1e9;
      for(const m of this.mons){ if(!filterFn(m)) continue; const d=Math.abs(m.x-sx)+Math.abs(m.y-sy); if(d<bd){ bd=d; best=m; } }
      return best;
    };

    for(const m of this.mons.slice()){
      if(m.sleep && m.sleep>0){ m.sleep--; continue; }
      if(m.stun){ m.stun--; continue; }
      const slowStep = m.slow? (this.turn%2===0) : true;
      if(!slowStep) continue;
      if(m.stop){ m.stop--; continue; }

      if(Math.abs(m.x-this.p.x)<=1 && Math.abs(m.y-this.p.y)<=1 && !(m.x===this.p.x && m.y===this.p.y) && !m.decoy){
        this.hit(m,this.p,0); continue;
      }

      let target=null;
      if(m.decoy){
        // デコイは最も近い「自分以外のモンスター」を狙う
        target = findNearest(m.x,m.y, t=>t!==m );
      }else if(decoys.length){
        // 通常はデコイを最優先で狙う
        target = findNearest(m.x,m.y, t=>t.decoy );
      }else{
        // デコイがいない通常時
        target = this.p;
      }

      // 遠距離AI
      const inSame=(target!==this.p)? (this.roomIdAt(m.x,m.y)===this.roomIdAt(target.x,target.y)) : (this.roomIdAt(m.x,m.y)===this.roomIdAt(this.p.x,this.p.y));
      if(target===this.p){
        if( (m.x===this.p.x && Math.abs(m.y-this.p.y)<=10 && this.clearLine(m.x,m.y,this.p.x,this.p.y)) ||
            (m.y===this.p.y && Math.abs(m.x-this.p.x)<=10 && this.clearLine(m.x,m.y,this.p.x,this.p.y)) ){
							
					const dist = Math.max(Math.abs(this.p.x - m.x), Math.abs(this.p.y - m.y));
					if (m.ai === 'ranged' && dist >= 2 && dist <= 7 && this.hasLOS(m.x, m.y, this.p.x, this.p.y)) {
					  // 既存の与ダメ式・演出をそのまま維持（下は例）
					  this.msg(`${m.name}の遠距離攻撃！`);
					  const base = (m.name === 'ドラコ')
					    ? Math.max(5, 7 + Math.floor((this.floor - 5) * 0.6))
					    : 5;
					  this.hit(m, this.p, base);
					  return;
					}
        }
      }

      let step=null;
      if(target && target!==this.p){
        // ターゲットがモンスターの場合（= デコイ戦闘）
        const s=this.nextStep8(m.x,m.y,target.x,target.y);
        if(s) step=s;
      }else if(inSame){
        step=this.nextStep8(m.x,m.y,this.p.x,this.p.y);
      }else{
        const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        while(dirs.length){ const d=dirs.splice(rand(0,dirs.length-1),1)[0]; const nx=m.x+d[0], ny=m.y+d[1]; if(!this.isOut(nx,ny)&&!this.isWall(nx,ny)&&!this.monAt(nx,ny)) { step=[nx,ny]; break; } }
      }

      if(step){ const [nx,ny]=step;
        if(target && Math.abs(nx-target.x)<=1 && Math.abs(ny-target.y)<=1 && !(nx===target.x && ny===target.y)){
          // 一歩で殴れるなら位置はそのまま殴る
          this.hit(m, target===this.p ? this.p : target, 0);
        }else{
          if(!this.monAt(nx,ny)) { this.moveMonsterNoAnim(m,nx,ny); }
        }
      }

      if(m.spd===2){
        // 2倍速の追撃
        let t2 = (target && target!==this.p)? target : this.p;
        if(Math.abs(m.x-t2.x)<=1 && Math.abs(m.y-t2.y)<=1 && !(m.x===t2.x && m.y===t2.y)){ this.hit(m,t2,0); }
        else{ const s=this.nextStep8(m.x,m.y,t2.x,t2.y); if(s && !this.monAt(s[0],s[1])){ this.moveMonsterNoAnim(m,s[0],s[1]); } }
      }
    }
  }

  nextStep8(sx,sy,gx,gy){
    const vis=Array.from({length:this.h},()=>Array(this.w).fill(false));
    const q=[[sx,sy]]; vis[sy][sx]=true; const par={}; const key=(x,y)=>`${x},${y}`;
    const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    while(q.length){ const [x,y]=q.shift(); if(x===gx && y===gy) break;
      for(const d of dirs){ const nx=x+d[0], ny=y+d[1]; if(this.isOut(nx,ny)||vis[ny][nx]||this.isWall(nx,ny)) continue; vis[ny][nx]=true; par[key(nx,ny)]=[x,y]; q.push([nx,ny]); } }
    if(!vis[gy]||!vis[gy][gx]) return null;
    let cur=[gx,gy], prev=par[key(cur[0],cur[1])];
    while(prev && !(prev[0]===sx && prev[1]===sy)){ cur=prev; prev=par[key(cur[0],cur[1])]; }
    return cur;
  }
  clearLine(x1,y1,x2,y2){
    if(x1===x2){ const s=Math.min(y1,y2), e=Math.max(y1,y2); for(let y=s+1;y<e;y++) if(this.isWall(x1,y)) return false; return true; }
    if(y1===y2){ const s=Math.min(x1,x2), e=Math.max(x1,y2); for(let x=s+1;x<e;x++) if(this.isWall(x,y1)) return false; return true; }
    return false;
  }

  /* 所持品UI（整頓：重複タブ初期化対策） */
  openInv(){
    $("#invOL").style.display='flex';
    // ★ タブ置き場を必ず初期化
    const host=$("#invTabsHost"); host.innerHTML="";
    const list=$("#invList"); list.innerHTML="";

    const tbtn = $("#invOL .invSortToggle");
    if(tbtn){ tbtn.textContent = this.invTabbed ? "整頓：ON（解除）" : "整頓：OFF（有効）"; tbtn.onclick=()=>{ this.toggleInvTabbed(); }; }

    if(!this.invTabbed){
      if(!this.inv.length){ list.innerHTML='<div class="dim">（空）</div>'; return; }
      this.inv.forEach((it,i)=>{
        let nm=it.name; if((it.type==='weapon'||it.type==='armor') && it.plus) nm+=`+${num(it.plus,0)}`;
        if(it.type==='arrow') nm+=` x${num(it.count,0)}`;
        if( (it.type==='weapon' && this.p.wep===it) || (it.type==='armor' && this.p.arm===it) ) nm+=` (E)`;
        if( it.type==='arrow' && this.p.arrow && this.p.arrow.kind===it.kind ) nm+=` (E)`;
        const d=document.createElement('div'); d.className='item';
        d.innerHTML=`<div>${nm}</div><div class="dim">${itemDesc(it)}</div>`;
        d.onclick=()=>this.openItemMenu(i); list.appendChild(d);
      });
      return;
    }

    // ==== タブ表示 ====
    const tabs = document.createElement('div'); tabs.className='tabs';
    host.appendChild(tabs); // ← hostにのみ挿入（増殖防止）
    const catToItems = {}; TAB_ORDER.forEach(c=>catToItems[c]=[]);
    for(const it of this.inv){ catToItems[catOf(it)].push(it); }
    TAB_ORDER.forEach(c=>{
      const b=document.createElement('div'); b.className='tab'; b.dataset.cat=c;
      const cnt = catToItems[c].length;
      b.textContent = `${TAB_LABEL[c]}${cnt?`（${cnt}）`:''}`;
      b.onclick = ()=>{
        [...tabs.children].forEach(x=>x.classList.toggle('active', x===b));
        renderTab(c);
      };
      tabs.appendChild(b);
    });

    const firstCat = TAB_ORDER.find(c=>catToItems[c].length) || TAB_ORDER[0];
    [...tabs.children].forEach(x=>x.classList.toggle('active', x.dataset.cat===firstCat));

    const renderTab=(cat)=>{
      list.innerHTML="";
      const arr = catToItems[cat];
      if(!arr.length){ list.innerHTML='<div class="dim">（なし）</div>'; return; }
      const sorted = sortByCategory(cat, [...arr]);
      const grouped = groupDisplay(sorted);
      grouped.forEach(g=>{
        const it=g.item; let nm=it.name;
        if((it.type==='weapon'||it.type==='armor') && it.plus) nm+=`+${num(it.plus,0)}`;
        if(it.type==='arrow') nm+=` x${g.members.reduce((s,x)=>s+num(x.count,0),0)}`;
        if( (it.type==='weapon' && this.p.wep && g.members.includes(this.p.wep)) ||
            (it.type==='armor' && this.p.arm && g.members.includes(this.p.arm)) ||
            (it.type==='arrow' && this.p.arrow && this.p.arrow.kind===it.kind) ){
          nm+=" (E)";
        }
        if(g.count>1) nm+=`  ×${g.count}`;
        const d=document.createElement('div'); d.className='item';
        d.innerHTML=`<div>${nm}</div><div class="dim">${itemDesc(it)}</div>`;
        d.onclick=()=>{ const idx = this.inv.indexOf(g.members[0]); if(idx>=0){ this.openItemMenu(idx); } };
        list.appendChild(d);
      });
    };
    renderTab(firstCat);
  }
  closeInv(){ $("#invOL").style.display='none'; }
  flashInv(matchFn){
    if($("#invOL").style.display!=='flex') return;
    const list=$("#invList"); const nodes=[...list.children];
    nodes.forEach((nd,idx)=>{
      nd.classList.remove('flash'); void nd.offsetWidth;
      if(matchFn && matchFn(this.inv[idx])) nd.classList.add('flash');
    });
  }
  toggleInvTabbed(){
    this.invTabbed = !this.invTabbed;
    localStorage.setItem('invTabbed', this.invTabbed ? 'ON' : 'OFF'); // 保存
    if(!this.invTabbed){
      const catBins = {}; TAB_ORDER.forEach(c=>catBins[c]=[]);
      for(const it of this.inv){ catBins[catOf(it)].push(it); }
      let ordered=[];
      for(const c of TAB_ORDER){
        const sorted = sortByCategory(c, [...catBins[c]]);
        ordered = ordered.concat(sorted);
      }
      this.inv = ordered;
    }
    if($("#invOL").style.display==='flex') this.openInv();
  }

  openItemMenu(i){
    const it=this.inv[i]; if(!it) return;
    $("#menuTitle").textContent=`『${it.name}』`;
    $("#menuDesc").textContent=itemDesc(it);
    const box=$("#menuBtns"); box.innerHTML="";
    const range=$("#menuRange");
    if(it.aoe || it.pierce || (it.type==='arrow' && it.kind) || (it.type==='wand' && (it.name.includes("爆裂")||it.name.includes("稲妻")||it.name.includes("部屋全滅")))){
      range.style.display='block'; range.textContent=rangeAsciiFor(it);
    } else { range.style.display='none'; }
    const add=(label,fn)=>{ const b=document.createElement('div'); b.className='pill'; b.textContent=label; b.onclick=()=>{ $("#menuOL").style.display='none'; fn(); }; box.appendChild(b); };
    if(it.type==='weapon' || it.type==='armor'){ add('装備する', ()=>this.useItemMenu(i)); }
    else if(it.type==='arrow'){ add('装填する', ()=>this.useItemMenu(i)); }
    else if(it.type==='pot' || it.type==='potBomb'){ add('壺を開く/使う', ()=>this.useItemMenu(i)); }
    else { add('使う/振る', ()=>this.useItemMenu(i)); add('投げる', ()=>this.throwItemMenu(i)); }
    add('置く（足元に捨てる）', ()=>{ const t=this.itemAt(this.p.x,this.p.y); if(t){ this.msg("ここには置けない"); return;} const item=this.inv.splice(i,1)[0]; item.x=this.p.x; item.y=this.p.y; this.items.push(item); this.msg(`${item.name}を置いた`); this.render(); });
    add('キャンセル', ()=>{});
    $("#menuOL").style.display='flex';
  }

  openPot(pot){
    $("#potOL").style.display='flex';
    $("#potTitle").textContent=`${pot.name} [容量:${num(pot.cap,1)}]`;
    const add=$("#potAdd"), take=$("#potTake"); const inPot=pot.contents||[]; add.innerHTML=""; take.innerHTML="";
    this.inv.forEach((it,i)=>{ if(it===pot) return; const full=(inPot.length>=num(pot.cap,1)); const d=document.createElement('div'); d.className='item'; d.innerHTML=`<div>${it.name}${it.type==='arrow'?' x'+num(it.count,0):''}</div><div class="dim">${full?'（満杯）':'入れる'}</div>`; d.onclick=()=>{ if(full){ this.msg("もう入らない"); return; } (pot.contents||(pot.contents=[])).push(it); this.inv.splice(i,1); this.msg(`${it.name}をしまった`); this.openPot(pot); this.render(); }; add.appendChild(d); });
    if(!inPot.length){ take.innerHTML='<div class="dim">空です</div>'; } else inPot.forEach((it,i)=>{ const d=document.createElement('div'); d.className='item'; d.innerHTML=`<div>${it.name}${it.type==='arrow'?' x'+num(it.count,0):''}</div><div class="dim">取り出す</div>`; d.onclick=()=>{ if(this.inv.length>=this.baseInvMax()){ this.msg("持ち物がいっぱい"); return;} this.inv.push(it); inPot.splice(i,1); this.msg(`${it.name}を取り出した`); this.openPot(pot); this.render(); }; take.appendChild(d); });
  }

  saveLocal(){ localStorage.setItem('save3', this.getCode()); this.msg("セーブしました"); }
  getCode(){ return 'R3:'+btoa(encodeURIComponent(JSON.stringify({floor:num(this.floor,1), gold:num(this.p.gold,0)}))); }
  loadCode(code){ try{ if(!code.startsWith('R3:')) throw 0; const st=JSON.parse(decodeURIComponent(atob(code.slice(3)))); this.floor=num(st.floor,1)||1; this.p.gold=num(st.gold,0)||0; this.gen(this.floor); this.msg("ロードしました"); }catch(e){ alert("読み込みに失敗しました"); } }
  win(msg){ this.msg(msg||"クリア！"); this.gameEnd(true); }
  gameOver(){ this.msg(`あなたは倒れた… (到達:${num(this.floor,1)}F)`); this.gameEnd(false); }
  gameEnd(){
    const score=Math.floor(num(this.floor,1)*(this.calcPlayerAtk()+this.calcPlayerDef()+num(this.p.str,10) + (this.p.wep?num(this.p.wep.atk,0)+num(this.p.wep.plus,0):0) + (this.p.arm?num(this.p.arm.def,0)+num(this.p.arm.plus,0):0) + num(this.p.maxHp,1)/2)+num(this.p.gold,0)/10);
    if(num(this.floor,1)>this.bestFloor){ this.bestFloor=num(this.floor,1); localStorage.setItem('bestF',this.bestFloor); }
    if(score>this.bestScore){ this.bestScore=score; localStorage.setItem('bestScore',this.bestScore); }
    localStorage.removeItem('save3'); showTitle();
  }

  makeBigRoom(){
    const r={x:1,y:1,w:this.w-2,h:this.h-2,id:999};
    for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) this.map[y][x]='.';
    this.rooms=[r]; this.mhRoomIds.clear(); this.revealRoomAt(this.p.x,this.p.y,true); this.render();
  }

  renderFullMap(){
    let out="";
    for(let y=0;y<this.h;y++){
      for(let x=0;x<this.w;x++){
        if(!this.vis[y][x]){ out+="#"; continue; }
        const ch=this.map[y][x];
        if(this.p.x===x && this.p.y===y) out+='@';
        else if(this.monAt(x,y)) out+=this.monAt(x,y).ch;
        else if(this.itemAt(x,y)) out+=(this.itemAt(x,y).ch||'*');
        else out+=ch;
      } out+="\n";
    }
    $("#fullMap").textContent=out;
  }
}

// === LOS（壁越し不可：Bresenham の整数ライン走査） ===
Game.prototype.hasLOS = function(x0,y0,x1,y1){
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0, y = y0;

  while (true) {
    // 始点・終点は通過可。途中に壁があれば不可。
    if (!(x === x0 && y === y0) && !(x === x1 && y === y1)) {
      if (this.isWall(x, y)) return false;
    }
    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return true;
};




/*** 初期化/入力 ***/
window.addEventListener('DOMContentLoaded', ()=>{
  let g=null;
  setInterval(()=>{ if(g){ g.render(); }}, 1000); // 重なり点滅

  const updateTitle=()=>{ const bestF=localStorage.getItem('bestF')||0; const bestS=localStorage.getItem('bestScore')||0; $("#bestInfo").textContent=`過去の最高到達: ${bestF}階 / スコア: ${bestS}`; };
  const showTitle=()=>{ $("#game").style.display='none'; $("#title").style.display='flex'; updateTitle(); };
  window.showTitle=showTitle;

  function syncPickupBtn(){ $('#btnPickupMode').textContent = `自動拾い：${g && g.autoPickup ? 'ON' : 'OFF'}`; }

  function startNew(){ $("#title").style.display='none'; $("#game").style.display='block'; g=new Game(); syncPickupBtn(); g.gen(1); }
  function startLocal(){ const code=localStorage.getItem('save3'); if(!code){ alert("ローカルセーブがありません"); return; } $("#title").style.display='none'; $("#game").style.display='block'; g=new Game(); syncPickupBtn(); g.loadCode(code); }
  function startCode(){ const code=prompt("セーブコードを入力"); if(!code) return; $("#title").style.display='none'; $("#game").style.display='block'; g=new Game(); syncPickupBtn(); g.loadCode(code.trim()); }

  bindTap('#btnNew', startNew);
  bindTap('#btnLocal', startLocal);
  bindTap('#btnCode', startCode);
  bindTap('#btnTitle', ()=>{ if(confirm("本当にタイトルに戻りますか？")){ if(g) g.saveLocal(); showTitle(); }});
  bindTap('#btnPickupMode', ()=>{ if(!g) return; g.autoPickup=!g.autoPickup; localStorage.setItem('autoPickup', g.autoPickup?'ON':'OFF'); syncPickupBtn(); g.render(); });

  // 所持品
  bindTap('[data-act="inv"]', ()=>{ if(g) g.openInv(); });
  bindTap('#btnCloseInv', ()=>{ if(g) g.closeInv(); });
  bindTap('#btnCloseMenu', ()=>{ $("#menuOL").style.display='none'; });

  // 行動
  bindTap('[data-act="descend"]', ()=>{ if(g) g.descend(); });
  bindTap('[data-act="shoot"]',   ()=>{ if(g) g.askShoot(); });
  bindTap('[data-act="save"]',    ()=>{ if(g) g.saveLocal(); });
  bindTap('[data-act="code"]',    ()=>{ if(g) prompt("セーブコード", g.getCode());
  // ★ WAIT FIX: 待機アクション（タップで1T）
  bindTap('[data-act="wait"]', ()=>{ 
    if(!g) return;
    g.msg("待機");
    g.turnStep();
    g.render();
  });
 });

  // マップ
  bindTap('#btnMap', ()=>{ if(g){ g.renderFullMap(); $("#mapOL").style.display='flex'; }});
  bindTap('#btnCloseMap', ()=>{ $("#mapOL").style.display='none'; });
  bindTap('#btnCloseRange', ()=>{ $("#rangeOL").style.display='none'; });

  // 長押し移動（斜め対応）
  let activeHold=null, holdTimer=null, holdInterval=null;
  function startHold(dirFn, key){
    if(activeHold && activeHold!==key) return;
    activeHold=key;
    const step=()=>{ if(g) dirFn(); };
    step();
    holdTimer=setTimeout(()=>{ holdInterval=setInterval(step,100); },250);
  }
  function stopHold(key){
    if(activeHold!==key) return;
    activeHold=null;
    if(holdTimer){ clearTimeout(holdTimer); holdTimer=null; }
    if(holdInterval){ clearInterval(holdInterval); holdInterval=null; }
  }
  const dirMap={
    up:[0,-1],down:[0,1],left:[-1,0],right:[1,0],
    upleft:[-1,-1],upright:[1,-1],downleft:[-1,1],downright:[1,1]
  };
  document.querySelectorAll('[data-hold]').forEach(b=>{
    const k=b.getAttribute('data-hold'); const d=dirMap[k];
    const fn=()=>{ if(g) g.tryMove(d[0],d[1]); };
    b.addEventListener('touchstart',e=>{e.preventDefault(); startHold(fn,k);},{passive:false});
    b.addEventListener('mousedown',e=>{e.preventDefault(); startHold(fn,k);});
    ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>b.addEventListener(ev,()=>stopHold(k)));
  });

  // ★ WAIT FIX: 待機ボタンの長押しで連続待機
  const waitEl = document.querySelector('[data-act="wait"]');
  if(waitEl){
    const stepWait = ()=>{ if(g){ g.turnStep(); g.render(); } };
    waitEl.addEventListener('touchstart', e=>{ e.preventDefault(); startHold(stepWait, 'wait'); }, {passive:false});
    waitEl.addEventListener('mousedown',  e=>{ e.preventDefault(); startHold(stepWait, 'wait'); });
    ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>waitEl.addEventListener(ev,()=>stopHold('wait')));
  }


  // キー
  document.addEventListener('keydown', e=>{
    if(!g) return;
    const map={
      ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
      Home:[-1,-1], PageUp:[1,-1], End:[-1,1], PageDown:[1,1]
    };
    const m=map[e.key];
    if(m){ e.preventDefault(); g.tryMove(m[0],m[1]); }
    if(e.key==='m'||e.key==='M'){ e.preventDefault(); g.renderFullMap(); $("#mapOL").style.display='flex'; }
  });

  // タイトル初期表示
  showTitle();
});


Game.prototype.normalizeShopkeepers = function(){
  if(!this.mons) return;
  for(const m of this.mons){
    if(m && m.ai==='shop' && (m.hostile===undefined || m.hostile===null)){
      m.hostile = false; m.isShop = true;
    }
  }
};
