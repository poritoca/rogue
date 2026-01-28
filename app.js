
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


// === Arrow helpers ===
function arrowDef(kind){
  return (typeof ARROWS!=='undefined' && ARROWS.find(a=>a.kind===kind)) || {name:`${kind}矢束`, type:'arrow', dmg:5, count:0, kind};
}
function findArrowStack(g, kind){
  return g.inv && g.inv.find && g.inv.find(x=>x && x.type==='arrow' && x.kind===kind) || null;
};
function handleArrowPickup(g, it){
  if(!it || it.type!=='arrow') return false;

  const kind = it.kind;
  const dmg  = (typeof num==='function') ? num(it.dmg,5) : (it.dmg||5);
  const cnt  = (typeof num==='function') ? num(it.count,0) : (it.count||0);

  const loadedKind = (g.p && g.p.arrow && g.p.arrow.kind) ? g.p.arrow.kind : null;

  // 同じ種類を「装填中」なら、所持本数(p.ar)へ補充
  if(loadedKind && loadedKind === kind){
    g.p.ar = (typeof num==='function' ? num(g.p.ar,0) : (g.p.ar||0)) + cnt;
    if(typeof g.msg==='function') g.msg(`${it.name}を補充${cnt?`（+${cnt}）`:''}`);
    if(typeof fxSpark==='function') fxSpark();
    g.items = g.items.filter(x=>x!==it);
    return true;
  }

  // それ以外（未装填／別種類）は所持品へ追加（同種はスタック）
  const stack = (typeof findArrowStack==='function') ? findArrowStack(g, kind) : null;
  if(stack){
    const prev = (typeof num==='function') ? num(stack.count,0) : (stack.count||0);
    stack.count = prev + cnt;
    // 念のため威力・名前を補正
    stack.dmg = (typeof num==='function') ? Math.max(num(stack.dmg,0), dmg) : Math.max(stack.dmg||0, dmg);
    if(!stack.name) stack.name = it.name;
    if(typeof g.msg==='function') g.msg(`${it.name}を拾った（所持品の同種に+${cnt}）`);
    if(typeof fxSpark==='function') fxSpark();
    g.items = g.items.filter(x=>x!==it);
    return true;
  }

  if(g.inv.length>=g.baseInvMax()){
    if(typeof g.msg==='function') g.msg("これ以上持てない");
    return true; // ここで床から消さない（true返しの仕様があるなら注意）
  }

  const picked = {name:it.name, type:'arrow', kind, dmg, count:cnt, ided:it.ided};
  g.inv.push(picked);
  if(typeof g.msg==='function') g.msg(`${it.name}を拾った（所持品へ）`);
  if(typeof fxSpark==='function') fxSpark();
  g.items = g.items.filter(x=>x!==it);
  return true;
};

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
function bindTap(sel, fn){
  let els = [];
  if(typeof sel === 'string'){
    els = Array.from(document.querySelectorAll(sel));
  }else if(sel instanceof Element){
    els = [sel];
  }else if(sel && typeof sel.length === 'number'){
    els = Array.from(sel);
  }
  els.forEach(el=>{
    const h=(e)=>{ e.preventDefault(); fn(e); };
    el.addEventListener('touchstart',h,{passive:false});
    el.addEventListener('click',h,{passive:false});
  });
}
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const choice=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function toast(m, cls=""){
  const layer=$("#toast"); const d=document.createElement('div');
  d.className='toast' + (cls?(' '+cls):''); d.textContent=m; layer.appendChild(d);

  // iPhoneの狭い画面でも詰まりにくいように、表示数を上限化（古いものから間引く）
  while(layer.children && layer.children.length>6){
    layer.removeChild(layer.firstChild);
  }

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

// ===== Town mode (町) =====
const DUNGEON_W = 56;
const DUNGEON_H = 30;
const TOWN_W = 160;
const TOWN_H = 80;

const LS_TOWN_HOLD = 'townHold_v1';
const LS_TOWN_STORAGE = 'townStorage_v1';
const LS_TOWN_LOSTFOUND = 'townLostFound_v1';
const LS_PUNYO_HS = 'punyopunyoHigh_v1';
const LS_GLOBAL_GOLD = 'townGlobalGold_v1';
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
  {name:"無敵草",type:"herb",effect:(g,t)=>{ if(t===g.p){ g.p.invincible=Math.max(0,num(g.p.invincible,0))+5; g.msg("しばらく無敵！"); fxSpark(); }}},
  {name:"復活草",type:"herb",revive:true,effect:()=>{}},
  // ★ 身代わり草：方向指定で当たったモンスターをデコイ化
  {name:"身代わり草",type:"herb",effect:(g)=>{ g.msg("身代わりにしたい方向を選んでください"); g.waitTarget={mode:'herbDecoy'}; }}
];

const SCROLLS=[
  {name:"識別の巻物",type:"scroll",effect:(g)=>{const u=g.inv.filter(it=>!it.ided); if(!u.length){g.msg("識別する物がない");return;} g.waitId=true; g.msg("識別するアイテムを選択");}},
  {name:"脱出の巻物",type:"scroll",effect:(g)=>{g.escapeToTitle("脱出成功！");}},
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
    this.w=DUNGEON_W; this.h=DUNGEON_H;
    this.map=[]; this.vis=[]; this.rooms=[]; this.nearStairs=new Set();
    this.items=[]; this.mons=[]; this.traps=[];
    this.turn=0; this.bestFloor=parseInt(localStorage.getItem('bestF')||'0',10);
    this.bestScore=parseInt(localStorage.getItem('bestScore')||'0',10);
    this.shopCells=new Set(); this.shopRooms=new Set(); this.shopExits=new Map(); this.thief=false; this.shopDialogState=null; this._resumeAfterShopDialog=null; this.mhRoomIds=new Set(); this.shopWall=new Set(); this.mhWall=new Set();
    this.autoPickup=localStorage.getItem('autoPickup')!=='OFF';
    this.invTabbed = (localStorage.getItem('invTabbed')==='ON');

    this.mode='dungeon';
    this.townStorage=[];
    this.townLostFound=[];
    this.townShopStock=[];
    this.townShopLastGen=0;
    this.loadTownPersistent();

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

  // ===== Town persistent / hold (localStorage) =====
  loadTownPersistent(){
    // townStorage / townLostFound は「シリアライズ済みアイテム配列」を保持する
    try{
      const a = JSON.parse(localStorage.getItem(LS_TOWN_STORAGE) || '[]');
      this.townStorage = Array.isArray(a) ? a : [];
    }catch(e){ this.townStorage=[]; }
    try{
      const a = JSON.parse(localStorage.getItem(LS_TOWN_LOSTFOUND) || '[]');
      this.townLostFound = Array.isArray(a) ? a : [];
    }catch(e){ this.townLostFound=[]; }
  }
  saveTownPersistent(){
    try{ localStorage.setItem(LS_TOWN_STORAGE, JSON.stringify(this.townStorage||[])); }catch(e){}
    try{ localStorage.setItem(LS_TOWN_LOSTFOUND, JSON.stringify(this.townLostFound||[])); }catch(e){}
  }

  // ===== Global gold wallet (for title minigames etc.) =====
  loadGlobalGold(){
    try{
      const v = parseInt(localStorage.getItem(LS_GLOBAL_GOLD)||'0',10);
      if(Number.isFinite(v) && v>=0) this.p.gold = Math.max(num(this.p.gold,0), v);
    }catch(e){}
  }
  saveGlobalGold(){
    try{ localStorage.setItem(LS_GLOBAL_GOLD, String(Math.max(0, num(this.p.gold,0)))); }catch(e){}
  }
  awardGold(delta){
    const d=num(delta,0);
    if(!d) return;
    this.p.gold = Math.max(0, num(this.p.gold,0) + d);
    this.afterGoldChange();
  }
  afterGoldChange(){
    // タイトル/町/ミニゲームなど「ダンジョン外」でも反映されるように保存
    try{ this.saveHoldToTitle(); }catch(e){}
    try{ this.saveGlobalGold(); }catch(e){}
  }

  saveHoldToTitle(){
    // 脱出・町→タイトルなどで「所持品/お金/レベル等」を保持してタイトルへ戻すための保存
    const hold = {
      v: 1,
      t: Date.now(),
      p: {
        hp: num(this.p.hp,1), maxHp: num(this.p.maxHp,1),
        str: num(this.p.str,10),
        baseAtk: num(this.p.baseAtk,5),
        baseDef: num(this.p.baseDef,1),
        lv: num(this.p.lv,1),
        xp: num(this.p.xp,0),
        gold: num(this.p.gold,0),
        // 矢（装填状態）
        arrowKind: (this.p.arrow && this.p.arrow.kind) ? this.p.arrow.kind : null,
        ar: num(this.p.ar,0),
        // 装備（返還タグ等の状態も含める）
        wep: this.p.wep ? Game._serializeItem(this.p.wep) : null,
        arm: this.p.arm ? Game._serializeItem(this.p.arm) : null
      },
      inv: (this.inv||[]).map(it=>Game._serializeItem(it)).filter(Boolean)
    };
    try{ localStorage.setItem(LS_TOWN_HOLD, JSON.stringify(hold)); }catch(e){}
  }
  loadHoldFromTitle(){
    // タイトル保持状態があれば復元（無ければ何もしない）
    let hold=null;
    try{ hold = JSON.parse(localStorage.getItem(LS_TOWN_HOLD) || 'null'); }catch(e){ hold=null; }
    if(!hold || !hold.p) return;

    // player core
    this.p.hp = num(hold.p.hp, this.p.hp);
    this.p.maxHp = num(hold.p.maxHp, this.p.maxHp);
    this.p.str = num(hold.p.str, this.p.str);
    this.p.baseAtk = num(hold.p.baseAtk, this.p.baseAtk);
    this.p.baseDef = num(hold.p.baseDef, this.p.baseDef);
    this.p.lv = num(hold.p.lv, this.p.lv);
    this.p.xp = num(hold.p.xp, this.p.xp);
    this.p.gold = num(hold.p.gold, this.p.gold);

    // equip
    this.p.wep = hold.p.wep ? Game._deserializeItem(hold.p.wep) : null;
    this.p.arm = hold.p.arm ? Game._deserializeItem(hold.p.arm) : null;

    // arrows loaded
    const ak = hold.p.arrowKind || null;
    this.p.arrow = ak ? clone(arrowDef(ak)) : null;
    this.p.ar = num(hold.p.ar, 0);

    // inventory
    this.inv = Array.isArray(hold.inv) ? hold.inv.map(o=>Game._deserializeItem(o)).filter(Boolean) : [];
  }

  // ---- item serialization helpers (functions cannot be JSON'd) ----
  static _serializeItem(it){
    if(!it || typeof it !== 'object') return null;
    const o = { type: it.type, name: it.name };
    if(it.type==='weapon'){
      o.plus = num(it.plus,0); o.ided = !!it.ided; o.returnTag = !!it.returnTag;
      o.atk = num(it.atk,0);
    }else if(it.type==='armor'){
      o.plus = num(it.plus,0); o.ided = !!it.ided; o.returnTag = !!it.returnTag;
      o.def = num(it.def,0);
    }else if(it.type==='wand'){
      o.uses = num(it.uses,0); o.ided = !!it.ided;
    }else if(it.type==='arrow'){
      o.kind = it.kind || 'normal';
      o.count = num(it.count,0);
      o.dmg = num(it.dmg,0);
      o.ided = !!it.ided;
    }else if(it.type==='pot' || it.type==='potBomb'){
      o.cap = num(it.cap,0);
      if(Array.isArray(it.contents)) o.contents = it.contents.map(x=>Game._serializeItem(x)).filter(Boolean);
    }else if(it.type==='gold'){
      o.amt = num(it.amt,0);
    }else{
      o.ided = !!it.ided;
    }
    return o;
  }
  static _deserializeItem(o){
    if(!o || typeof o !== 'object') return null;
    const t = Game._templateItem(o.type, o.name, o.kind);
    if(!t) return null;
    if(o.type==='weapon'){
      t.plus = num(o.plus,0);
      t.ided = !!o.ided;
      t.returnTag = !!o.returnTag;
      if('atk' in o) t.atk = num(o.atk, t.atk);
    }else if(o.type==='armor'){
      t.plus = num(o.plus,0);
      t.ided = !!o.ided;
      t.returnTag = !!o.returnTag;
      if('def' in o) t.def = num(o.def, t.def);
    }else if(o.type==='wand'){
      t.uses = num(o.uses, t.uses);
      t.ided = !!o.ided;
    }else if(o.type==='arrow'){
      t.kind = o.kind || t.kind || 'normal';
      t.count = num(o.count, t.count);
      t.dmg = num(o.dmg, t.dmg);
      t.ided = !!o.ided;
    }else if(o.type==='pot' || o.type==='potBomb'){
      t.cap = num(o.cap, t.cap);
      if(Array.isArray(o.contents)) t.contents = o.contents.map(x=>Game._deserializeItem(x)).filter(Boolean);
    }else if(o.type==='gold'){
      t.amt = num(o.amt, t.amt);
    }else{
      t.ided = !!o.ided;
    }
    return t;
  }
  static _templateItem(type, name, kind){
    try{
      if(type==='weapon'){
        const base = WEAPONS.find(x=>x.name===name) || {name:name||'武器', atk:2};
        return Object.assign({type:'weapon', plus:0, ided:false, returnTag:false}, clone(base), {type:'weapon'});
      }
      if(type==='armor'){
        const base = ARMORS.find(x=>x.name===name) || {name:name||'盾', def:1};
        return Object.assign({type:'armor', plus:0, ided:false, returnTag:false}, clone(base), {type:'armor'});
      }
      if(type==='herb'){
        const base = HERBS.find(x=>x.name===name) || {name:name||'草', type:'herb', effect:()=>{}};
        return clone(base);
      }
      if(type==='scroll'){
        const base = SCROLLS.find(x=>x.name===name) || {name:name||'巻物', type:'scroll', effect:()=>{}};
        return clone(base);
      }
      if(type==='wand'){
        const base = WANDS.find(x=>x.name===name) || {name:name||'杖', type:'wand', uses:0, cast:()=>{}};
        return clone(base);
      }
      if(type==='arrow'){
        if(kind){
          const base = ARROWS.find(x=>x.kind===kind) || ARROWS.find(x=>x.name===name) || {name:(name||'矢束'), type:'arrow', kind:kind, count:0, dmg:5};
          return Object.assign({}, clone(base), {type:'arrow', kind:(base.kind||kind)});
        }
        const base = ARROWS.find(x=>x.name===name) || {name:(name||'矢束'), type:'arrow', kind:'normal', count:0, dmg:5};
        return Object.assign({}, clone(base), {type:'arrow', kind:(base.kind||'normal')});
      }
      if(type==='pot' || type==='potBomb'){
        const base = POTS.find(x=>x.name===name) || {name:name||'壺', type:type, cap:1};
        return Object.assign({}, clone(base), {type:type});
      }
      if(type==='gold'){
        return {name:'ゴールド', type:'gold', amt:0};
      }
      return {name:name||'?', type:type||'misc'};
    }catch(e){
      return null;
    }
  }
  // ラッパ（Game内から呼べるように）
  fxSlash(){ fxSlash(); } fxSpark(){ fxSpark(); } fxOmin(){ fxOmin(); }

  msg(s){ toast(s); }
  msgGreen(s){ toast(s,"toast-green"); }

  // ===== 攻撃FX（誰→誰を視覚化） =====
  cellAt(ax, ay){
    const vx = ax - this.offX;
    const vy = ay - this.offY;
    if(vx<0 || vy<0 || vx>=this.viewW || vy>=this.viewH) return null;
    const idx = vy*this.viewW + vx;
    return (this._cellEls && this._cellEls[idx]) ? this._cellEls[idx] : null;
  }

  enqueueAttackFx(src, dst, msgText, linePts){
    if(!this.fxQueue) this.fxQueue=[];
    if(!this._fxSeen) this._fxSeen=new Set();

    const sx=src?src.x:null, sy=src?src.y:null, dx=dst?dst.x:null, dy=dst?dst.y:null;
    const sig = `${this.turn}|${sx},${sy}->${dx},${dy}|${msgText||''}`;
    // 同一ターン内の完全重複を除外（2巡バグ対策）
    if(this._fxSeen.has(sig)) return;
    this._fxSeen.add(sig);

    this.fxQueue.push({src,dst,msgText,linePts});
  }

  playFxQueue(){
    if(this.fxBusy) return;
    if(!this.fxQueue || !this.fxQueue.length) return;
    this.fxBusy=true;

    const dur=320, gap=240;

    const step=()=>{
      if(!this.fxQueue.length){
        this.fxBusy=false;
        // ターンが進んだら重複除外セットをクリア（溜まり続けないように）
        if(this._fxSeen && this._fxSeen.size>300) this._fxSeen.clear();
        return;
      }
      const ev=this.fxQueue.shift();
      // 表示する直前に最新のセル参照を確保
      if(!this._cellEls || !this._cellEls.length) this.render();

      const srcEl = ev.src ? this.cellAt(ev.src.x, ev.src.y) : null;
      const dstEl = ev.dst ? this.cellAt(ev.dst.x, ev.dst.y) : null;
      const lineEls = [];
      if(ev.linePts && ev.linePts.length){
        for(const p of ev.linePts){
          const e=this.cellAt(p.x,p.y);
          if(e) lineEls.push(e);
        }
      }

      if(srcEl) srcEl.classList.add('fx-src');
      if(dstEl) dstEl.classList.add('fx-dst');
      lineEls.forEach(e=>e.classList.add('fx-line'));

      if(ev.msgText) toast(ev.msgText, 'toast-dmg');

      setTimeout(()=>{
        if(srcEl) srcEl.classList.remove('fx-src');
        if(dstEl) dstEl.classList.remove('fx-dst');
        lineEls.forEach(e=>e.classList.remove('fx-line'));
        setTimeout(step, gap);
      }, dur);
    };

    step();
  }

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
    this.rooms=[]; this.items=[]; this.mons=[]; this.traps=[]; this.shopCells.clear(); this.mhRoomIds.clear(); this.nearStairs.clear(); this.shopCells.clear(); this.shopRooms.clear(); this.shopExits.clear(); this.shopWall.clear(); this.mhWall.clear();

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

    // --- ショップ生成：1フロアあたり「だいたい2つ」 ---
    const startRoomId = this.roomIdAt(this.p.x,this.p.y);
    const eligibleShopRooms = this.rooms.filter(r=>{
      if(r.id===startRoomId) return false;
      return (r.w>=6 && r.h>=6);
    });
    for(let i=eligibleShopRooms.length-1;i>0;i--){
      const j=rand(0,i);
      const tmp=eligibleShopRooms[i]; eligibleShopRooms[i]=eligibleShopRooms[j]; eligibleShopRooms[j]=tmp;
    }
    const targetShopCount = Math.min(2, eligibleShopRooms.length);
    const shopRoomIds = new Set(eligibleShopRooms.slice(0,targetShopCount).map(r=>r.id));
    this.shopRooms.clear(); for(const id of shopRoomIds){ this.shopRooms.add(id); }

    for(const r of this.rooms){
      const isStart=(r.id===startRoomId);
      const isShop = shopRoomIds.has(r.id);
      let isMH=(Math.random()<0.08 && !isStart && r.w>=20 && r.h>=20);
      if(!isShop && !isMH && Math.random()<0.03 && r.w>=24 && r.h>=24) isMH=true;
      if(isShop) isMH=false;
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

  // ===== Town generation =====
  setWorldSize(kind){
    if(kind==='town'){ this.w=TOWN_W; this.h=TOWN_H; }
    else{ this.w=DUNGEON_W; this.h=DUNGEON_H; }
    this.viewW=VIEW_W; this.viewH=VIEW_H;
  }

  genTown(){
    this.mode='town';
    this.setWorldSize('town');
    this.map=Array.from({length:this.h},()=>Array(this.w).fill('.'));
    this.vis=Array.from({length:this.h},()=>Array(this.w).fill(true));
    this.rooms=[]; this.items=[]; this.mons=[]; this.traps=[];
    this.shopCells.clear(); this.mhRoomIds.clear(); this.nearStairs.clear();
    this.shopRooms.clear(); this.shopExits.clear(); this.shopWall.clear(); this.mhWall.clear();
    // grass base, roads
    const midX=Math.floor(this.w/2), midY=Math.floor(this.h/2);
    const roadW=3;
    for(let y=0;y<this.h;y++){
      for(let dx=-roadW;dx<=roadW;dx++){
        const x=midX+dx;
        if(x>=0 && x<this.w) this.map[y][x]='=';
      }
    }
    for(let x=0;x<this.w;x++){
      for(let dy=-roadW;dy<=roadW;dy++){
        const y=midY+dy;
        if(y>=0 && y<this.h) this.map[y][x]='=';
      }
    }
    // flowers / trees
    for(let i=0;i<2200;i++){
      const x=rand(1,this.w-2), y=rand(1,this.h-2);
      if(this.map[y][x]!=='.') continue;
      const r=Math.random();
      if(r<0.55) this.map[y][x]='f';
      else if(r<0.85) this.map[y][x]='T';
      else this.map[y][x]='~';
    }

    // buildings (letters on the road)
    const placeSign=(x,y,ch)=>{
      for(let yy=y-1;yy<=y+1;yy++) for(let xx=x-2;xx<=x+2;xx++){
        if(this.isOut(xx,yy)) continue;
        this.map[yy][xx]='=';
      }
      if(!this.isOut(x,y)) this.map[y][x]=ch;
    };
    // 施設は「最初に見つけやすい」ように中央付近へ配置（巨大マップでも迷わない）
    const fx = 12;
    const fy = 6;
    const bShop   = {x:midX-fx, y:midY-fy, ch:'S'}; // shop
    const bStore  = {x:midX-fx, y:midY+fy, ch:'B'}; // bank/storage
    const bTagger = {x:midX+fx, y:midY-fy, ch:'G'}; // tagger
    const bCasino = {x:midX+fx, y:midY+fy, ch:'C'}; // casino
    for(const b of [bShop,bStore,bTagger,bCasino]) placeSign(b.x,b.y,b.ch);

    // multiple exits
    const exits=[
      {x:2,y:2},{x:this.w-3,y:2},{x:2,y:this.h-3},{x:this.w-3,y:this.h-3},
      {x:midX,y:2},{x:midX,y:this.h-3},{x:2,y:midY},{x:this.w-3,y:midY}
    ];
    for(const e of exits){
      this.map[e.y][e.x]='>';
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        const nx=e.x+dx, ny=e.y+dy;
        if(!this.isOut(nx,ny)) this.map[ny][nx]='=';
      }
    }

    // player start
    this.p.x=midX; this.p.y=midY; this.p._ox=this.p.x; this.p._oy=this.p.y;

    // NPCs
    // 建物のすぐ近くにNPCを置く（プレイヤー開始位置から徒歩数歩）
    const npcs=[
      {name:'商人',ch:'M',x:bShop.x,   y:bShop.y+2,   role:'shop'},
      {name:'預かり屋',ch:'K',x:bStore.x,  y:bStore.y+2,  role:'storage'},
      {name:'タグ職人',ch:'F',x:bTagger.x, y:bTagger.y+2, role:'tagger'},
      {name:'カジノ係',ch:'Z',x:bCasino.x, y:bCasino.y+2, role:'casino'},
    ];
    for(const n of npcs){
      this.mons.push({name:n.name,ch:n.ch,x:n.x,y:n.y,hp:9999,atk:0,def:0,xp:0,ai:'town',role:n.role});
    }

    this.msg("町に到着した。十字路周辺に施設があります（話すで利用）。端に出るか『出る』で町を出られます。");
    this.render();
  }

  startDungeonFromTown(){
    this.mode='dungeon';
    this.setWorldSize('dungeon');
    this.floor=1;
    this.gen(1);
  }

  townTalk(){
    // adjacent NPC
    const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    let npc=null;
    for(const d of dirs){
      const m=this.monAt(this.p.x+d[0], this.p.y+d[1]);
      if(m && m.ai==='town'){ npc=m; break; }
    }
    if(!npc){
      this.msg("近くに話せる相手がいない");
      return;
    }
    this.openTownNpcMenu(npc);
  }


  // タイトル/町から確認できる共通ミニゲームハブ
  openMiniGameHub(opts={}){
    // opts.fromTitle: タイトルから開いた場合（説明を少し変える余地）
    const npc = { role:'casino', name:'カジノ係' };
    this.openTownNpcMenu(npc);
  }

  openTownNpcMenu(npc){
    const close=()=>{ const ol=$("#townOL"); if(ol) ol.style.display='none'; };
    const set=(title,desc)=>{ $("#townTitle").textContent=title||'町'; $("#townDesc").textContent=desc||''; };
    const clear=()=>{ $("#townTabs").innerHTML=''; $("#townList").innerHTML=''; $("#townActions").innerHTML=''; };
    const addAction=(label,fn)=>{ const b=document.createElement('div'); b.className='pill'; b.textContent=label; b.onclick=()=>fn(); $("#townActions").appendChild(b); };
    const addTab=(label,fn)=>{ const b=document.createElement('div'); b.className='pill'; b.textContent=label; b.onclick=()=>fn(); $("#townTabs").appendChild(b); };
    const show=()=>{ $("#townOL").style.display='flex'; };

    clear();
    if(npc.role==='shop'){
      set("商人","売買できます（品揃えは入るたびに少し変化）");
      const ensureStock=()=>{
        const now=Date.now();
        if(!this.townShopStock || !this.townShopStock.length || (now-this.townShopLastGen)>60*1000){
          this.townShopLastGen=now;
          const stock=[];
          const pool=[...HERBS.map(x=>({...x})), ...SCROLLS.map(x=>({...x})), ...WANDS.map(x=>({...x})), ...ARROWS.map(x=>({...x})), ...WEAPONS.map(x=>({...x, type:'weapon'})), ...ARMORS.map(x=>({...x, type:'armor'}))];
          for(let i=0;i<10;i++){
            const it=clone(choice(pool));
            it.type = it.type || (it.atk!=null?'weapon':(it.def!=null?'armor':it.type));
            it.ided = true;
            it.price = Math.max(10, Math.floor(priceOf(it)* (0.8 + Math.random()*0.6)));
            stock.push(it);
          }
          this.townShopStock=stock;
        }
      };
      const renderBuy=()=>{
        ensureStock();
        $("#townList").innerHTML='';
        for(const it of this.townShopStock){
          const d=document.createElement('div'); d.className='item';
          d.innerHTML=`<div>${it.name}${it.type==='arrow'?' x'+num(it.count,0):''}</div><div class="dim">${num(it.price,0)}G</div>`;
          d.onclick=()=>{
            if(this.inv.length>=this.baseInvMax()){ this.msg("持ち物がいっぱい"); return; }
            const cost=num(it.price,0);
            if(num(this.p.gold,0)<cost){ this.msg("お金が足りない"); return; }
            this.p.gold = num(this.p.gold,0)-cost;
      this.afterGoldChange();
            const bought=clone(it); delete bought.price;
            try{ bought.ch=itemChar(bought); }catch(e){}
            this.inv.push(bought);
            this.msg(`${bought.name}を買った`);
            this.render();
          };
          $("#townList").appendChild(d);
        }
        $("#townActions").innerHTML='';
        addAction("閉じる", ()=>{ close(); this.render(); });
      };
      const renderSell=()=>{
        $("#townList").innerHTML='';
        const sellables=this.inv.filter(it=>it.type!=='gold');
        if(!sellables.length){
          $("#townList").innerHTML='<div class="dim">売れるものがない</div>';
        }else{
          sellables.forEach((it,idx)=>{
            const price=Math.max(1, Math.floor(priceOf(it)*0.5));
            const d=document.createElement('div'); d.className='item';
            d.innerHTML=`<div>${it.name}${it.type==='arrow'?' x'+num(it.count,0):''}</div><div class="dim">売値 ${price}G</div>`;
            d.onclick=()=>{
              // equipped check
              if(this.p.wep===it || this.p.arm===it || this.p.arrow===it){ this.msg("装備中は売れない"); return; }
              this.inv.splice(this.inv.indexOf(it),1);
              this.p.gold = num(this.p.gold,0)+price;
      this.afterGoldChange();
              this.msg(`${it.name}を売った`);
              renderSell(); this.render();
            };
            $("#townList").appendChild(d);
          });
        }
        $("#townActions").innerHTML='';
        addAction("閉じる", ()=>{ close(); this.render(); });
      };

      addTab("買う", renderBuy);
      addTab("売る", renderSell);
      addTab("品揃え更新", ()=>{ this.townShopLastGen=0; renderBuy(); });
      renderBuy();
      show();
      return;
    }

    if(npc.role==='storage'){
      set("預かり屋","アイテムを預けたり引き取れます（預けた物は新規開始でも残ります）");
      let multi=false;
      let selected=new Set();
      const refresh=()=>{
        $("#townActions").innerHTML='';
        addAction(multi?"複数選択:ON":"複数選択:OFF", ()=>{ multi=!multi; selected.clear(); refresh(); render(); });
        addAction("閉じる", ()=>{ this.saveTownPersistent(); close(); this.render(); });
      };
      const render=()=>{
        $("#townList").innerHTML='';
        const modeLabel=$("#townTabs").querySelector('.pill.active')?.textContent||"";
      };
      const renderDeposit=()=>{
        $("#townTabs").querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
        const tabs=$("#townTabs").children; if(tabs[0]) tabs[0].classList.add('active');
        $("#townList").innerHTML='';
        if(!this.inv.length){
          $("#townList").innerHTML='<div class="dim">持ち物がない</div>';
        }else{
          this.inv.forEach((it)=>{
            const d=document.createElement('div'); d.className='item';
            const on=selected.has(it);
            d.innerHTML=`<div>${multi? (on?'☑ ':'☐ '):''}${it.name}${it.type==='arrow'?' x'+num(it.count,0):''}</div><div class="dim">${multi?'タップで選択':'預ける'}</div>`;
            d.onclick=()=>{
              if(multi){ if(on) selected.delete(it); else selected.add(it); renderDeposit(); return; }
              if(this.p.wep===it || this.p.arm===it || this.p.arrow===it){ this.msg("装備中は預けられない"); return; }
              const ser=Game._serializeItem(it);
              this.townStorage.push(ser);
              this.inv.splice(this.inv.indexOf(it),1);
              this.msg(`${it.name}を預けた`);
              renderDeposit(); this.render();
            };
            $("#townList").appendChild(d);
          });
        }
        $("#townActions").innerHTML='';
        addAction(multi?"選択を預ける":"", ()=>{});
        if(multi){
          addAction("選択を預ける", ()=>{
            const arr=[...selected];
            if(!arr.length){ this.msg("選択なし"); return; }
            for(const it of arr){
              if(this.p.wep===it || this.p.arm===it || this.p.arrow===it) continue;
              this.townStorage.push(Game._serializeItem(it));
              this.inv.splice(this.inv.indexOf(it),1);
            }
            selected.clear();
            this.msg("まとめて預けた");
            renderDeposit(); this.render();
          });
        }
        refresh();
      };
      const renderWithdraw=()=>{
        $("#townTabs").querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
        const tabs=$("#townTabs").children; if(tabs[1]) tabs[1].classList.add('active');
        $("#townList").innerHTML='';
        if(!this.townStorage.length){
          $("#townList").innerHTML='<div class="dim">預かりは空です</div>';
        }else{
          this.townStorage.forEach((o,idx)=>{
            const it=Game._restoreItem(o);
            const on=selected.has(idx);
            const d=document.createElement('div'); d.className='item';
            d.innerHTML=`<div>${multi?(on?'☑ ':'☐ '):''}${it?it.name:(o.name||'?')}${it&&it.type==='arrow'?' x'+num(it.count,0):''}</div><div class="dim">${multi?'タップで選択':'引き取る'}</div>`;
            d.onclick=()=>{
              if(multi){ if(on) selected.delete(idx); else selected.add(idx); renderWithdraw(); return; }
              if(this.inv.length>=this.baseInvMax()){ this.msg("持ち物がいっぱい"); return; }
              const got=Game._restoreItem(o);
              if(got){ this.inv.push(got); this.msg(`${got.name}を引き取った`); }
              this.townStorage.splice(idx,1);
              renderWithdraw(); this.render();
            };
            $("#townList").appendChild(d);
          });
        }
        $("#townActions").innerHTML='';
        if(multi){
          addAction("選択を引き取る", ()=>{
            const ids=[...selected].sort((a,b)=>b-a);
            if(!ids.length){ this.msg("選択なし"); return; }
            for(const idx of ids){
              if(this.inv.length>=this.baseInvMax()) break;
              const o=this.townStorage[idx];
              const got=Game._restoreItem(o);
              if(got) this.inv.push(got);
              this.townStorage.splice(idx,1);
            }
            selected.clear();
            this.msg("まとめて引き取った");
            renderWithdraw(); this.render();
          });
        }
        refresh();
      };
      const renderLost=()=>{
        $("#townTabs").querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
        const tabs=$("#townTabs").children; if(tabs[2]) tabs[2].classList.add('active');
        $("#townList").innerHTML='';
        if(!this.townLostFound.length){
          $("#townList").innerHTML='<div class="dim">返還品はありません</div>';
        }else{
          this.townLostFound.forEach((o,idx)=>{
            const it=Game._restoreItem(o);
            const d=document.createElement('div'); d.className='item';
            d.innerHTML=`<div>${it?it.name:(o.name||'?')}</div><div class="dim">受け取る</div>`;
            d.onclick=()=>{
              if(this.inv.length>=this.baseInvMax()){ this.msg("持ち物がいっぱい"); return; }
              const got=Game._restoreItem(o);
              if(got){ this.inv.push(got); this.msg(`${got.name}が返ってきた`); }
              this.townLostFound.splice(idx,1);
              this.saveTownPersistent();
              renderLost(); this.render();
            };
            $("#townList").appendChild(d);
          });
        }
        $("#townActions").innerHTML='';
        refresh();
      };

      addTab("預ける", renderDeposit);
      addTab("引き取る", renderWithdraw);
      addTab("返還品", renderLost);
      renderDeposit();
      refresh();
      show();
      return;
    }

    if(npc.role==='tagger'){
      set("タグ職人","装備に『返還タグ』を付けられます（死亡時に町へ戻り、タグは消えます）");
      const FEE=200;
      $("#townTabs").innerHTML='';
      $("#townList").innerHTML='';
      const addEquip=(label,it)=>{
        const d=document.createElement('div'); d.className='item';
        if(!it){
          d.innerHTML=`<div>${label}: なし</div><div class="dim"></div>`;
          $("#townList").appendChild(d); return;
        }
        const tagged=!!it.returnTag;
        d.innerHTML=`<div>${label}: ${it.name}${tagged?' [タグ済]':''}</div><div class="dim">${tagged?'付与済':'付ける '+FEE+'G'}</div>`;
        d.onclick=()=>{
          if(tagged){ this.msg("すでに付与済"); return; }
          if(num(this.p.gold,0)<FEE){ this.msg("お金が足りない"); return; }
          this.p.gold=num(this.p.gold,0)-FEE;
      this.afterGoldChange();
          it.returnTag=true;
          this.msg(`${it.name}にタグを付けた`);
          this.render();
          this.openTownNpcMenu(npc);
        };
        $("#townList").appendChild(d);
      };
      addEquip("武器", this.p.wep);
      addEquip("盾", this.p.arm);
      $("#townActions").innerHTML='';
      addAction("閉じる", ()=>{ close(); this.render(); });
      show();
      return;
    }

    if(npc.role==='casino'){
      set("カジノ","ゴールドで遊べます（0Gでも一部は練習できます）");
      $("#townTabs").innerHTML='';
      $("#townList").innerHTML='';
      const addGame=(name,desc,fn)=>{
        const d=document.createElement('div'); d.className='item';
        d.innerHTML=`<div>${name}</div><div class="dim">${desc}</div>`;
        d.onclick=()=>fn();
        $("#townList").appendChild(d);
      };
      addGame("HiGH&LOW","ゴールドで勝負（0Gでもプレイ可。報酬は賭け金×倍率）", ()=>{ this.openHighLow(); });
      addGame("10秒ストップ","10秒に近づけるだけ（無料）。途中で見えなくなるモードあり", ()=>{ this.openStop10(); });
      addGame("マインスイーパー","ゴールドで勝負（0GでもOK：賭け金10G扱い）。サイズ/爆弾数で難易度変化（賭け金×倍率）", ()=>{ this.openMinesweeperSetup(); });
      addGame("反射神経","合図が出た瞬間に止める（0GでもOK：賭け金10G扱い）。速いほど倍率UP", ()=>{ this.openReaction(); });
      addGame("ぷんよぷんよ","連鎖でスコア増。ゴールド獲得＆ハイスコア保存", ()=>{ this.openPunyopunyoSetup(); });
      $("#townActions").innerHTML='';
      addAction("閉じる", ()=>{ close(); this.render(); });
      show();
      return;
    }

    set(npc.name,"…");
    $("#townActions").innerHTML='';
    addAction("閉じる", ()=>{ close(); });
    show();
  }
openHighLow(){
  const ol = $("#townOL");
  $("#townTitle").textContent = "HiGH&LOW";
  $("#townDesc").textContent = "数字(1-6)が出ます。次が高いか低いか当ててください（引き分けは負け）。報酬は賭け金×倍率。";

  $("#townTabs").innerHTML = '';
  $("#townList").innerHTML = '';
  $("#townActions").innerHTML = '';

  const gold = num(this.p.gold, 0);
  const cur = rand(1, 6);

  // 連続で賭け金を回せる前提なので倍率は控えめ
  const mult = 1.30;

  // 0Gかつ賭け金0のときは「10G賭けた扱い」にする（初期資金づくり用）
  const ZERO_G_SPECIAL_BET = 10;

  const betOptionsBase = [1, 5, 10, 20, 50, 100, 200, 500, 1000];
  const betOptions = betOptionsBase.filter(v => v <= gold);

  // 前回の賭け金を保持（次回もそのまま賭けられる）
  let bet = (this._hlBet != null) ? this._hlBet : null;

  // 0Gのときは賭け金を強制的に特別扱いにする（賭け金選択UIは出さない）
  let isZeroSpecial = false;
  if(gold <= 0){
    if(bet == null || bet <= 0){
      bet = ZERO_G_SPECIAL_BET;
      this._hlBet = bet;
    }
    isZeroSpecial = true;
  }else{
    // ゴールドがあるときは所持金に合わせてクランプ
    if(bet != null) bet = Math.min(bet, gold);
  }

  const renderHeader = ()=>{
    const d = document.createElement('div');
    d.className = 'item';
    const betTxt = (bet==null) ? '未選択' : (bet + 'G' + (isZeroSpecial ? '（0G特別）' : ''));
    d.innerHTML = `<div>現在: ${cur}</div><div class="dim">所持金:${num(this.p.gold,0)}G　賭け金:${betTxt}　倍率:${mult.toFixed(2)}</div>`;
    $("#townList").appendChild(d);
  };

  const addBtn = (label, fn)=>{
    const b = document.createElement('div');
    b.className = 'btn';
    b.textContent = label;
    b.onclick = ()=>fn();
    $("#townActions").appendChild(b);
  };

  renderHeader();

  // 所持金がある場合は賭け金を選ぶ（0Gのときは自動で特別賭け金になる）
  if(gold > 0 && bet == null){
    const info = document.createElement('div');
    info.className = 'dim';
    info.style.marginTop = '6px';
    info.textContent = '賭け金を選んでください';
    $("#townList").appendChild(info);

    const row = document.createElement('div');
    row.className = 'row';
    row.style.marginTop = '8px';
    row.style.justifyContent = 'flex-start';
    row.style.gap = '8px';

    const addBet = (v)=>{
      const bb = document.createElement('div');
      bb.className = 'btn';
      bb.textContent = v + 'G';
      bb.onclick = ()=>{ this._hlBet = v; this.openHighLow(); };
      row.appendChild(bb);
    };

    betOptions.slice(0, 12).forEach(addBet);

    const allBtn = document.createElement('div');
    allBtn.className = 'btn';
    allBtn.textContent = '全額';
    allBtn.onclick = ()=>{ this._hlBet = gold; this.openHighLow(); };
    if(gold > 0) row.appendChild(allBtn);

    $("#townList").appendChild(row);

    addBtn('戻る', ()=>{ this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino')); });
    if(ol) ol.style.display = 'flex';
    return;
  }

  const play = (guess)=>{
    const g0 = num(this.p.gold, 0);

    // 実際に賭けに使う金額
    let effBet = bet;

    // 0G時は必ず「10G賭けた扱い」（このケースは所持金からは引かない）
    if(g0 <= 0){
      effBet = ZERO_G_SPECIAL_BET;
    }else{
      // ゴールドがある場合は賭け金が所持金を超えないように
      if(effBet > g0) effBet = g0;
      if(effBet <= 0){
        this.msg('賭け金を選んでください');
        this._hlBet = null;
        return this.openHighLow();
      }
      // 賭け金を先に支払う
      this.p.gold = g0 - effBet;
      this.afterGoldChange();
    }

    // 次回も同額で賭けられるよう保存
    this._hlBet = effBet;

    const nxt = rand(1, 6);
    const win = (guess === 'H') ? (nxt > cur) : (nxt < cur);

    if(win){
      const gain = Math.max(0, Math.floor(effBet * mult));
      this.p.gold = num(this.p.gold, 0) + gain;
      this.afterGoldChange();
      this.msg(`当たり！ ${nxt} -> +${gain}G（賭け金${effBet}G / 倍率${mult.toFixed(2)}）`);
    }else{
      this.msg(`外れ… ${nxt}`);
    }

    this.render();
    this.openHighLow();
  };

  addBtn('LOW', ()=>play('L'));
  addBtn('HIGH', ()=>play('H'));
  addBtn('賭け金変更', ()=>{ this._hlBet = null; this.openHighLow(); });
  addBtn('戻る', ()=>{ this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino')); });

  if(ol) ol.style.display = 'flex';
}
  openStop10(){
    const ol=$("#townOL");
    $("#townTitle").textContent="10秒ストップ";
    $("#townDesc").textContent="スタートして、10.0秒に近いところで止めてください（無料）。途中で見えなくなるモードもあります。";
    $("#townTabs").innerHTML='';
    $("#townList").innerHTML='';
    $("#townActions").innerHTML='';
    let blind = !!this._stop10Blind;

    const box=document.createElement('div');
    box.className='item';
    box.innerHTML=`
      <div id="stop10State">準備OK</div>
      <div class="dim">10.0秒±0.2でボーナス（ブラインド時は少し上乗せ）</div>
      <div class="dim" id="stop10Mode">モード: ${blind? '途中で見えなくなる' : '通常'}</div>
    `;
    $("#townList").appendChild(box);
    let t0=null, timer=null;
    let hideAt=null, hidden=false;
    const setState=(s)=>{ const el=document.getElementById('stop10State'); if(el) el.textContent=s; };
    const setMode=()=>{ const el=document.getElementById('stop10Mode'); if(el) el.textContent = 'モード: ' + (blind? '途中で見えなくなる' : '通常'); };
    const start=()=>{
      if(timer) return;
      t0=performance.now();
      hidden=false;
      // 途中で見えなくなる：1.2〜6.5秒のどこかで表示が消え、その後は「…」になる
      hideAt = blind ? (rand(120, 650) / 100) : null;
      timer=setInterval(()=>{
        const dt=(performance.now()-t0)/1000;
        if(blind && !hidden && hideAt!=null && dt>=hideAt){
          hidden=true;
        }
        if(blind && hidden){
          setState('…');
        }else{
          setState(dt.toFixed(2)+'秒');
        }
      },33);
    };
    const stop=()=>{
      if(!timer) return;
      clearInterval(timer); timer=null;
      const dt=(performance.now()-t0)/1000;
      const diff=Math.abs(dt-10);
      setState(dt.toFixed(2)+'秒（差 '+diff.toFixed(2)+'）');
      let reward=0;
      if(diff<=0.20) reward=rand(60,120);
      else if(diff<=0.50) reward=rand(20,60);
      else reward=rand(0,20);
      // ブラインドは少し上乗せ
      if(blind) reward = Math.floor(reward * 1.15);
      if(reward>0){
        this.p.gold = num(this.p.gold,0)+reward;
      this.afterGoldChange();
        this.msg(`報酬 +${reward}G`);
      }else{
        this.msg("参加賞");
      }
      this.render();
    };
    const addBtn=(label,fn)=>{ const b=document.createElement('div'); b.className='pill'; b.textContent=label; b.onclick=()=>fn(); $("#townActions").appendChild(b); return b; };
    addBtn("START", start);
    addBtn("STOP", stop);
    const blindBtn = addBtn(`ブラインド:${blind?'ON':'OFF'}`, ()=>{
      if(timer) return; // 計測中の切替は事故るので禁止
      blind = !blind;
      this._stop10Blind = blind;
      setMode();
      blindBtn.textContent = `ブラインド:${blind?'ON':'OFF'}`;
    });
    addBtn("もう一回", ()=>{ if(timer){ clearInterval(timer); timer=null; } this.openStop10(); });
    addBtn("戻る", ()=>{ if(timer){ clearInterval(timer); timer=null; } this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino')); });
    if(ol) ol.style.display='flex';
  }

  openReaction(){
    const ol = $("#townOL");
    $("#townTitle").textContent = "反射神経";
    $("#townDesc").textContent = "合図『NOW!』が出たらすぐ止めてください。速いほど倍率UP（0GでもOK：賭け金10G扱い）。";
    $("#townTabs").innerHTML='';
    $("#townList").innerHTML='';
    $("#townActions").innerHTML='';

    const gold = num(this.p.gold,0);
    const ZERO_G_SPECIAL_BET = 10;

    const betOptionsBase = [10, 20, 50, 100, 200, 500, 1000];
    const betOptions = betOptionsBase.filter(v => v <= gold);
    let bet = (this._rxBet != null) ? this._rxBet : null;

    // 0Gは自動で10G扱い
    let isZeroSpecial = false;
    if(gold <= 0){
      if(bet == null || bet <= 0) bet = ZERO_G_SPECIAL_BET;
      isZeroSpecial = true;
    }else{
      if(bet != null) bet = Math.min(bet, gold);
    }

    const stateBox = document.createElement('div');
    stateBox.className = 'item';
    stateBox.innerHTML = `<div id="rxState">準備OK</div><div class="dim" id="rxSub">賭け金:${bet}G${isZeroSpecial?'（0G特別）':''}</div>`;
    $("#townList").appendChild(stateBox);

    // 所持金があるのに賭け金未選択なら選択UI
    if(gold > 0 && (bet == null || bet <= 0)){
      const info = document.createElement('div');
      info.className = 'dim';
      info.style.marginTop = '6px';
      info.textContent = '賭け金を選んでください';
      $("#townList").appendChild(info);

      const row = document.createElement('div');
      row.className = 'row';
      row.style.marginTop = '8px';
      row.style.justifyContent = 'flex-start';
      row.style.gap = '8px';
      const addBet = (v)=>{
        const bb = document.createElement('div');
        bb.className = 'btn';
        bb.textContent = v + 'G';
        bb.onclick = ()=>{ this._rxBet = v; this.openReaction(); };
        row.appendChild(bb);
      };
      betOptions.slice(0, 12).forEach(addBet);
      const allBtn = document.createElement('div');
      allBtn.className = 'btn';
      allBtn.textContent = '全額';
      allBtn.onclick = ()=>{ this._rxBet = gold; this.openReaction(); };
      row.appendChild(allBtn);
      $("#townList").appendChild(row);

      const back = document.createElement('div');
      back.className = 'btn';
      back.textContent = '戻る';
      back.onclick = ()=>{ this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino')); };
      $("#townActions").appendChild(back);
      if(ol) ol.style.display='flex';
      return;
    }

    const setState = (s)=>{ const el=document.getElementById('rxState'); if(el) el.textContent=s; };
    const setSub = (s)=>{ const el=document.getElementById('rxSub'); if(el) el.textContent=s; };

    let waiting = false;
    let armed = false;
    let tNow = 0;
    let waitTimer = null;

    const start = ()=>{
      if(waiting || armed) return;

      const g0 = num(this.p.gold,0);
      let effBet = bet;
      if(g0 <= 0){
        effBet = ZERO_G_SPECIAL_BET;
        isZeroSpecial = true;
      }else{
        effBet = Math.min(Math.max(1, effBet), g0);
        // 賭け金支払い
        this.p.gold = g0 - effBet;
      this.afterGoldChange();
      }
      this._rxBet = effBet;
      bet = effBet;
      this.render();

      setSub(`賭け金:${bet}G${isZeroSpecial?'（0G特別）':''} / 所持金:${num(this.p.gold,0)}G`);
      setState('待て…');
      waiting = true;
      armed = false;
      const delay = rand(120, 380) * 10; // 1200〜3800ms
      waitTimer = setTimeout(()=>{
        waiting = false;
        armed = true;
        tNow = performance.now();
        setState('NOW!');
      }, delay);
    };

    const stop = ()=>{
      if(waiting){
        // 早押し：負け（賭け金は戻らない）
        clearTimeout(waitTimer); waitTimer=null;
        waiting = false;
        armed = false;
        setState('早すぎ！');
        this.msg('フライング…');
        this.render();
        return;
      }
      if(!armed) return;
      armed = false;
      const rt = (performance.now() - tNow) / 1000;
      setState(`反応: ${rt.toFixed(3)}s`);

      // 速いほど倍率UP（極端に稼げすぎないように上限）
      let mult = 0.9;
      if(rt <= 0.20) mult = 1.85;
      else if(rt <= 0.28) mult = 1.55;
      else if(rt <= 0.38) mult = 1.30;
      else if(rt <= 0.55) mult = 1.10;
      else mult = 0.95;
      const gain = Math.max(0, Math.floor(bet * mult));
      this.p.gold = num(this.p.gold,0) + gain;
      this.afterGoldChange();
      this.afterGoldChange();
      this.msg(`報酬 +${gain}G（賭け金${bet}G / 倍率${mult.toFixed(2)}）`);
      this.render();
      setSub(`賭け金:${bet}G${isZeroSpecial?'（0G特別）':''} / 所持金:${num(this.p.gold,0)}G`);
    };

    const addBtn=(label,fn)=>{ const b=document.createElement('div'); b.className='pill'; b.textContent=label; b.onclick=()=>fn(); $("#townActions").appendChild(b); return b; };
    addBtn('START', start);
    addBtn('STOP', stop);
    addBtn('もう一回', ()=>{ if(waitTimer){ clearTimeout(waitTimer); waitTimer=null; } waiting=false; armed=false; this.openReaction(); });
    addBtn('賭け金変更', ()=>{ if(waitTimer){ clearTimeout(waitTimer); waitTimer=null; } waiting=false; armed=false; this._rxBet = null; this.openReaction(); });
    addBtn('戻る', ()=>{ if(waitTimer){ clearTimeout(waitTimer); waitTimer=null; } waiting=false; armed=false; this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino')); });

    if(ol) ol.style.display='flex';
  }




  // ===== MiniGame: ぷんよぷんよ（ぷよぷよ風） =====
  getPunyopunyoHighScore(){
    try{ return num(JSON.parse(localStorage.getItem(LS_PUNYO_HS)||'0'),0); }catch(e){ return 0; }
  }
  setPunyopunyoHighScore(v){
    try{ localStorage.setItem(LS_PUNYO_HS, JSON.stringify(num(v,0))); }catch(e){}
  }

  // セットアップ（賭け金選択）

  // セットアップ（賭け金選択）
  openPunyopunyoSetup(){
    const close = ()=>{ const ol=$("#townOL"); if(ol) ol.style.display='none'; };
    const show  = ()=>{ const ol=$("#townOL"); if(ol) ol.style.display='flex'; };
    const set   = (title,sub)=>{
      const t=$("#townTitle"); if(t) t.textContent=title;
      const s=$("#townSub")||$("#townDesc"); if(s) s.textContent=sub||'';
    };

    // タイトルから直接ミニゲームを開いている場合など、保持/財布を読み込む
    try{ if(this.loadHoldFromTitle) this.loadHoldFromTitle(); }catch(e){}
    try{ if(this.loadGlobalGold) this.loadGlobalGold(); }catch(e){}

    const gold = num(this.p.gold,0);
    const hs = this.getPunyopunyoHighScore();
    const lastBet = num(this._ppBet, 0);

    set("ぷんよぷんよ","連鎖でスコアUP。報酬は賭け金×実力倍率");

    const tabs=$("#townTabs"); if(tabs) tabs.innerHTML='';
    const list=$("#townList");
    if(list){
      list.innerHTML = `
        <div class="ppSetup">
          <div class="ppRow"><div>所持金</div><div><b id="ppGoldDisp">${gold}</b>G</div></div>
          <div class="ppRow"><div>ハイスコア</div><div><b>${hs}</b></div></div>
          <div class="ppRow"><div>賭け金</div><div id="ppBetLine"></div></div>
          <div class="dim" style="margin-top:8px; line-height:1.35">
            ※0Gでも遊べます（賭け金10G扱い）。勝てばそのまま次の賭け金にできます。
          </div>

          <div style="margin-top:10px; display:flex; justify-content:center; gap:10px; flex-wrap:wrap">
            <div class="btn" id="ppStartBtn">START</div>
          </div>
        </div>
      `;
    }

    const betLine = $("#ppBetLine");
    const betOptionsBase = [10,20,50,100,200,500,1000,2000,5000,10000];
    let betOptions = betOptionsBase.filter(v=>v<=gold);
    if(gold<=0) betOptions = [0];
    if(gold>0 && lastBet>0 && !betOptions.includes(lastBet) && lastBet<=gold) betOptions.unshift(lastBet);

    const mkBtn = (v,label)=>{
      const b=document.createElement('div');
      b.className='btn';
      b.textContent=label || (v===0?'10G扱い':(' '+v+'G '));
      bindTap(b, ()=>{
        this._ppBet = v;
        renderBet();
      });
      return b;
    };

    const renderBet = ()=>{
      if(!betLine) return;
      betLine.innerHTML='';
      const cur = (gold<=0) ? 0 : (num(this._ppBet,0) || Math.min( (lastBet>0 && lastBet<=gold)?lastBet:10, gold));
      if(gold>0 && !this._ppBet) this._ppBet = cur;
      if(gold<=0) this._ppBet = 0;

      for(const v of betOptions){
        const b=mkBtn(v);
        if(v===num(this._ppBet,0)) b.classList.add('sel');
        betLine.appendChild(b);
      }
      if(gold>0){
        const allBtn = mkBtn(-1, '全額');
        if(num(this._ppBet,0)===-1) allBtn.classList.add('sel');
        betLine.appendChild(allBtn);
        // mkBtn の bindTap は -1 でOK（renderBetに戻る）
      }
    };
    renderBet();

    // START（iPhoneで押せない/無反応に見える時があるため、リスト内にも配置して確実に拾う）
    const doStart = ()=>{
      try{
      // 最新の財布を反映（タイトル放置→別ミニゲームなどのズレ対策）
      try{ if(this.loadGlobalGold) this.loadGlobalGold(); }catch(e){}
      const goldNow = num(this.p.gold,0);

      const betRaw = num(this._ppBet,0);
      let bet = betRaw;

      if(goldNow<=0){
        bet = 0; // 10G扱い
      }else{
        if(betRaw===-1) bet = goldNow;
        bet = Math.max(0, Math.min(bet, goldNow));
        if(bet===0) bet = Math.min(10, goldNow);
      }
      this.startPunyopunyo({bet});
          }catch(err){
        console.error(err && err.stack ? err.stack : err);
        try{ this.msg("START失敗: "+(err && err.message ? err.message : String(err))); }catch(e){}
      }
    };

    // リスト内 START ボタン
    const ppStartBtn = $("#ppStartBtn");
    if(ppStartBtn){
      bindTap(ppStartBtn, ()=>doStart());
      ppStartBtn.addEventListener('click', (e)=>{ e.preventDefault(); doStart(); });
    }

    const actions=$("#townActions");
    if(actions) actions.innerHTML='';
    const addBtn=(label,fn)=>{
      const b=document.createElement('div');
      b.className='btn';
      b.textContent=label;
      bindTap(b, ()=>fn());
      if(actions) actions.appendChild(b);
      return b;
    };

    addBtn("戻る", ()=>{
      // 町のカジノ一覧に戻す（タイトルから来た場合でも同じUI）
      this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino') || {role:'casino',name:'カジノ係'});
    });

    addBtn("閉じる", ()=>{
      close();
      this.render();
    });

    show();
  }

  // 報酬倍率（HiGH&LOWより良く）
  ppCalcMultiplier(score){
    // だいたい 1.2〜3.0 の範囲（上限）
    const m = 1.20 + Math.min(1.80, score/6000);
    return Math.max(1.20, Math.min(3.00, m));
  }

  startPunyopunyo(cfg){
    const betReq = num(cfg?.bet,0);
    const goldNow = num(this.p.gold,0);

    // 実際に賭けに使う金額（0G時は 10G扱い）
    let effBet = betReq;
    let betStore = betReq;

    if(goldNow<=0){
      // 0Gなら、賭け金未指定/0 は 10G扱い（差し引きはしない）
      if(betReq<=0){
        effBet = 10;
        betStore = 0; // UI上は「10G扱い」
      }else{
        effBet = Math.max(0, betReq);
        betStore = Math.max(0, betReq);
      }
      this._ppBet = 0;
    }else{
      if(betReq===-1) effBet = goldNow; // 全額
      effBet = Math.max(0, Math.min(effBet, goldNow));
      if(effBet===0) effBet = Math.min(10, goldNow);
      betStore = effBet;

      // 差し引き（開始時に支払う）
      this.p.gold = goldNow - effBet;
      this.afterGoldChange();
      this._ppBet = betStore;
    }

    const bet = betStore;
    const nextSpec = this.ppGenPieceSpec();
    this._pp = {
      w:6, h:12,
      board: Array.from({length:12}, ()=>Array(6).fill(null)),
      cur:null,
      next: nextSpec.previewColors,
      nextSpec: nextSpec,
      fallMs: 320, // そこそこ早め
      soft:false,
      score:0,
      chain:0,
      resolving:false,
      over:false,
      bet,
      effBet,
      paid:false, // 精算済
      lastTs:0,
      acc:0,
      anim:null,
      animResolve:null,
      fx:{particles:[], chainBanner:null, flash:0, shake:0},
    };
    this.spawnPunyopunyo();
    this.openPunyopunyoPlay();
  }

  ppRandColor(){
    // 見分けやすい 5 色
    const cs=[0,1,2,3,4];
    return cs[rand(0, cs.length-1)];
  }


  // ぷんよぷんよ：次ピース仕様（2個落下に加えて、たまに3-6ブロックの大ピース）
  ppGenPieceSpec(){
    const r = Math.random();
    let n = 2;
    if(r < 0.20) n = 3;
    else if(r < 0.29) n = 4;
    else if(r < 0.297) n = 5;
    else if(r < 0.300) n = 6;

    if(n === 2){
      const a = this.ppRandColor();
      const b = this.ppRandColor();
      const blocks = [
        {dx:0, dy:0, c:a, pivot:true},
        {dx:0, dy:-1, c:b, pivot:false},
      ];
      return { n, blocks, previewColors:[a,b] };
    }

    const blocks = this.ppGenRandomClusterBlocks(n);
    const previewColors = [
      blocks[0]?.c ?? this.ppRandColor(),
      blocks[1]?.c ?? blocks[0]?.c ?? this.ppRandColor(),
    ];
    return { n, blocks, previewColors };
  }

  // ランダム生成：連結したブロックの集合を作る（固定パターン非依存）
  ppGenRandomClusterBlocks(n){
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const maxSpan = (n<=4) ? 3 : 4;
    const tries = 80;

    const makeOnce = ()=>{
      const set = new Set(["0,0"]);
      const cells = [{dx:0, dy:0}];

      const bounds = ()=>{
        let minX=999, maxX=-999, minY=999, maxY=-999;
        for(const c of cells){
          minX = Math.min(minX, c.dx); maxX = Math.max(maxX, c.dx);
          minY = Math.min(minY, c.dy); maxY = Math.max(maxY, c.dy);
        }
        return {w:(maxX-minX+1), h:(maxY-minY+1)};
      };

      while(cells.length < n){
        const base = cells[rand(0, cells.length-1)];
        const d = dirs[rand(0, dirs.length-1)];
        const nx = base.dx + d[0];
        const ny = base.dy + d[1];
        const key = nx + "," + ny;
        if(set.has(key)) continue;

        cells.push({dx:nx, dy:ny});
        const b = bounds();
        if(b.w > maxSpan || b.h > maxSpan){
          cells.pop();
          continue;
        }
        set.add(key);
      }
      return cells;
    };

    let cells = null;
    for(let t=0;t<tries;t++){
      const cand = makeOnce();
      if(cand && cand.length === n){ cells = cand; break; }
    }
    if(!cells){
      cells = Array.from({length:n}, (_,i)=>({dx:0, dy:-i}));
    }

    const baseColor = this.ppRandColor();
    const blocks = cells.map((c, i)=>{
      let col = baseColor;
      if(i>0 && Math.random() > 0.70){
        let alt = this.ppRandColor();
        let guard=10;
        while(alt===baseColor && guard-- > 0) alt = this.ppRandColor();
        col = alt;
      }
      return {dx:c.dx, dy:c.dy, c:col, pivot:(c.dx===0 && c.dy===0)};
    });

    blocks.sort((a,b)=> (b.pivot?1:0) - (a.pivot?1:0));
    if(!blocks[0].pivot) blocks[0].pivot = true;

    return blocks;
  }

  ppRotVec(dx,dy,o){
    const r = ((o%4)+4)%4;
    if(r===0) return {x:dx, y:dy};
    if(r===1) return {x:-dy, y:dx};
    if(r===2) return {x:-dx, y:-dy};
    return {x:dy, y:-dx};
  }


  ppCellsOfCur(cur){
    const x=cur.x, y=cur.y;
    const o=((cur.o%4)+4)%4;

    if(cur.blocks && Array.isArray(cur.blocks)){
      const out=[];
      for(const b of cur.blocks){
        const v = this.ppRotVec(b.dx, b.dy, o);
        out.push({x:x+v.x, y:y+v.y, c:b.c, pivot:!!b.pivot});
      }
      return out;
    }

    let dx=0, dy=-1;
    if(o===0){ dx=0; dy=-1; }
    if(o===1){ dx=1; dy=0; }
    if(o===2){ dx=0; dy=1; }
    if(o===3){ dx=-1; dy=0; }
    return [
      {x:x, y:y, c:cur.a, pivot:true},
      {x:x+dx, y:y+dy, c:cur.b, pivot:false},
    ];
  }

  ppIsInside(x,y){
    const pp=this._pp;
    return x>=0 && x<pp.w && y<pp.h; // y can be negative while falling
  }

  // ぷんよぷんよ：盤面外アクセス防止（大ピース＋連鎖重力の安全策）
  ppSanitizeBoard(){
    const pp=this._pp;
    if(!pp || !pp.board) return;
    // 行数補正
    if(!Array.isArray(pp.board) || pp.board.length !== pp.h){
      const old = Array.isArray(pp.board) ? pp.board : [];
      pp.board = Array.from({length:pp.h}, (_,y)=> Array.isArray(old[y]) ? old[y].slice(0,pp.w) : Array(pp.w).fill(null));
    }
    for(let y=0;y<pp.h;y++){
      if(!Array.isArray(pp.board[y])) pp.board[y] = Array(pp.w).fill(null);
      if(pp.board[y].length !== pp.w){
        pp.board[y] = (pp.board[y]||[]).slice(0,pp.w);
        while(pp.board[y].length < pp.w) pp.board[y].push(null);
      }
      for(let x=0;x<pp.w;x++){
        if(pp.board[y][x] === undefined) pp.board[y][x] = null;
      }
    }
  }

  ppWriteCell(x,y,c){
    const pp=this._pp;
    if(!pp) return false;
    if(x<0 || x>=pp.w || y<0 || y>=pp.h){
      // ここに来るのは基本的にバグ/境界ケース。強制終了ではなくゲーム終了扱いにして落ちないようにする。
      pp.over = true;
      try{ this.msg('ぷんよぷんよ：盤面外への落下を検出したため終了しました。'); }catch(e){}
      try{ this.ppFinish(); }catch(e){}
      return false;
    }
    if(!pp.board || !pp.board[y]) this.ppSanitizeBoard();
    pp.board[y][x] = c;
    return true;
  }


  ppBlockedAt(x,y){
    const pp=this._pp;
    if(x<0 || x>=pp.w) return true;
    if(y>=pp.h) return true;
    if(y<0) return false;
    return pp.board[y][x]!=null;
  }

  ppCanPlace(cur){
    const pp=this._pp;
    for(const p of this.ppCellsOfCur(cur)){
      if(this.ppBlockedAt(p.x,p.y)) return false;
    }
    return true;
  }

  spawnPunyopunyo(){
    const pp=this._pp;
    const spec = pp.nextSpec || this.ppGenPieceSpec();
    pp.nextSpec = this.ppGenPieceSpec();
    pp.next = pp.nextSpec.previewColors;

    const blocks = spec.blocks || [];
    let minX=999, maxX=-999, minY=999, maxY=-999;
    for(const b of blocks){
      minX=Math.min(minX, b.dx); maxX=Math.max(maxX, b.dx);
      minY=Math.min(minY, b.dy); maxY=Math.max(maxY, b.dy);
    }
    if(!isFinite(minX)){ minX=0; maxX=0; minY=0; maxY=0; }

    const minSpawnX = -minX;
    const maxSpawnX = (pp.w-1) - maxX;

    let sx = Math.floor(pp.w/2);
    sx = clamp(sx, minSpawnX, maxSpawnX);
    sx = clamp(sx + rand(-1,1), minSpawnX, maxSpawnX);

    const sy = -minY;

    const cur={x:sx, y:sy, o:0, blocks: blocks};
    if(!this.ppCanPlace(cur)){
      pp.over=true;
      this.ppFinish();
      return;
    }
    pp.cur=cur;
  }

  openPunyopunyoPlay(){
    const pp=this._pp;
    if(!pp) return;

    const close = ()=>{ const ol=$("#townOL"); if(ol) ol.style.display='none'; };
    const show = ()=>{ const ol=$("#townOL"); if(ol) ol.style.display='flex'; };
    const set = (title,sub)=>{ const t=$("#townTitle"); if(t) t.textContent=title; const s=$("#townSub")||$("#townDesc"); if(s) s.textContent=sub||''; };

    const gold = num(this.p.gold,0);
    const betRaw = num(pp.bet,0);
    const betDisp = (betRaw===0) ? 10 : betRaw;

    set("ぷんよぷんよ", `SCORE ${pp.score} / 連鎖 ${pp.chain} / 賭け金 ${betDisp}G`);

    $("#townTabs").innerHTML='';
    $("#townList").innerHTML = `
      <div class="ppWrap">
        <div class="ppHud" id="ppHud">
          <div class="ppHudRow">
            <div>Score: <b id="ppScore">${pp.score}</b></div>
            <div>Chain: <b id="ppChain">${pp.chain}</b></div>
          </div>
          <div class="ppHudRow dim">
            <div>High: <b id="ppHigh">${this.getPunyopunyoHighScore()}</b></div>
            <div>Gold: <b id="ppGold">${gold}</b>G</div>
          </div>
          <div class="ppHudRow dim">
            <div>Next: <span class="ppNextDot ppC${pp.next[0]}"></span><span class="ppNextDot ppC${pp.next[1]}"></span></div>
            <div id="ppStatus"></div>
          </div>
        </div>
        <canvas id="ppCanvas" class="ppCanvas"></canvas>
      </div>
    `;

    // controls（iPhoneで押しやすい大きさ＆間隔にする）
    const actions=$("#townActions");
    if(actions) actions.innerHTML='';

    const ctrl=document.createElement('div');
    ctrl.className='ppCtrlWrap';
    if(actions) actions.appendChild(ctrl);

    // 1行目：左右＆ソフトドロップ
    const row1=document.createElement('div'); row1.className='ppCtrlRow';
    ctrl.appendChild(row1);
    const mkRow=(row,label,fn,cls='')=>{
      const b=document.createElement('div');
      b.className=('ppBtn '+cls).trim();
      b.textContent=label;
      bindTap(b, ()=>fn());
      row.appendChild(b);
      return b;
    };
    mkRow(row1,'←', ()=>this.ppMove(-1),'ppWide');
    const downBtn=document.createElement('div');
    downBtn.className='ppBtn ppWide';
    downBtn.textContent='↓(長押し)';
    downBtn.addEventListener('pointerdown', (e)=>{ e.preventDefault(); this.ppSoft(true); }, {passive:false});
    downBtn.addEventListener('pointerup',   (e)=>{ e.preventDefault(); this.ppSoft(false); }, {passive:false});
    downBtn.addEventListener('pointercancel',(e)=>{ e.preventDefault(); this.ppSoft(false); }, {passive:false});
    row1.appendChild(downBtn);
    mkRow(row1,'→', ()=>this.ppMove(1),'ppWide');

    // 2行目：回転＆ハードドロップ
    const row2=document.createElement('div'); row2.className='ppCtrlRow';
    ctrl.appendChild(row2);
    mkRow(row2,'⟲', ()=>this.ppRotate(-1),'ppWide');
    mkRow(row2,'DROP', ()=>this.ppHardDrop(),'ppWide');
    mkRow(row2,'⟳', ()=>this.ppRotate(1),'ppWide');

    // 3行目：終了系（誤タップ防止で幅広）
    const row3=document.createElement('div'); row3.className='ppCtrlRow';
    ctrl.appendChild(row3);
    mkRow(row3,'やめる', ()=>{ this.ppFinish(true); },'ppWide');
    mkRow(row3,'戻る', ()=>{ this.ppFinish(true); this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino') || {role:'casino',name:'カジノ係'}); },'ppWide');

    // resize canvas
    this.ppResizeCanvas();

    // start loop
    pp.lastTs = 0;
    const loop = (ts)=>{
      if(!this._pp || this._pp!==pp) return;
      if(pp.over) return; // stop
      this.ppStep(ts);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    show();
    this.ppDraw();
  }

  ppResizeCanvas(){
    const pp=this._pp; if(!pp) return;
    const cv=$("#ppCanvas"); if(!cv) return;
    // iPhone Safari で盤面が大きすぎると、オーバーレイがスクロールして
    // ドラッグでズレたり誤タップが起きやすい。
    // → 盤面サイズを「画面幅だけでなく高さ」も見て控えめに決める。
    const pad = 24;
    const modalMaxW = Math.min(window.innerWidth, 420);
    const wAvail = modalMaxW - pad*2;
    const hAvail = Math.max(220, Math.floor(window.innerHeight * 0.42));
    const cellByW = Math.floor(wAvail / pp.w);
    const cellByH = Math.floor(hAvail / pp.h);
    const cell = Math.max(14, Math.min(30, Math.min(cellByW, cellByH)));
    pp.cell = cell;
    const cssW = cell*pp.w;
    const cssH = cell*pp.h;
    const dpr = window.devicePixelRatio || 1;
    cv.style.width = cssW+'px';
    cv.style.height = cssH+'px';
    cv.width = Math.floor(cssW*dpr);
    cv.height = Math.floor(cssH*dpr);
    pp.dpr = dpr;
  }


  ppStep(ts){
    const pp=this._pp; if(!pp || pp.over) return;

    if(!pp.lastTs) pp.lastTs = ts;
    const dt = ts - pp.lastTs;
    pp.lastTs = ts;

    this.ppFxStep(dt);

    if(pp.anim){
      this.ppAnimStep(dt);
      this.ppDraw();
      return;
    }

    if(pp.resolving) { this.ppDraw(); return; }

    pp.acc += dt;
    const fall = pp.soft ? 55 : pp.fallMs;
    while(pp.acc >= fall){
      pp.acc -= fall;
      if(!this.ppMoveDown()){
        this.ppLock();
        return;
      }
    }
    this.ppDraw();
  }

  ppFxStep(dt){
    const pp=this._pp; if(!pp) return;
    const fx=pp.fx || (pp.fx={particles:[], chainBanner:null, flash:0, shake:0});

    if(fx.flash>0) fx.flash = Math.max(0, fx.flash - dt/260);
    if(fx.shake>0) fx.shake = Math.max(0, fx.shake - dt/220);

    if(fx.chainBanner){
      fx.chainBanner.t += dt;
      if(fx.chainBanner.t > fx.chainBanner.dur){
        fx.chainBanner = null;
      }
    }

    if(fx.particles && fx.particles.length){
      for(const p of fx.particles){
        p.t += dt;
        const k = p.t / p.dur;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.g * dt;
        p.a = Math.max(0, 1 - k);
      }
      fx.particles = fx.particles.filter(p=>p.t < p.dur && p.a>0.01);
    }
  }

  ppTriggerClearFx(cells, chain){
    const pp=this._pp; if(!pp) return;
    const fx=pp.fx || (pp.fx={particles:[], chainBanner:null, flash:0, shake:0});
    const cell=pp.cell||32;

    fx.flash = Math.min(1, fx.flash + 0.35 + 0.12*Math.min(6, chain));
    fx.shake = Math.min(1, fx.shake + 0.25 + 0.10*Math.min(6, chain));

    if(chain>=2){
      fx.chainBanner = { chain, t:0, dur: 900 };
    }

    const baseN = Math.min(10, 4 + Math.floor(cells.length/3));
    for(const c of cells){
      const cx = (c.x + 0.5) * cell;
      const cy = (c.y + 0.5) * cell;
      const n = baseN + (chain>=2 ? 4 : 0);
      for(let i=0;i<n;i++){
        const ang = Math.random()*Math.PI*2;
        const sp = (0.08 + Math.random()*0.22) * (1 + 0.25*Math.min(6,chain));
        fx.particles.push({
          x:cx, y:cy,
          vx:Math.cos(ang)*sp,
          vy:Math.sin(ang)*sp - 0.05,
          g:0.00045,
          r:2 + Math.random()*4,
          c:c.c,
          t:0,
          dur: 520 + Math.random()*320,
          a:1
        });
      }
    }
  }

  ppAnimStep(dt){
    const pp=this._pp; if(!pp || !pp.anim) return;
    const a=pp.anim;
    a.t += dt;
    if(a.t >= a.dur){
      if(a.type==='gravity'){
        pp.board = a.boardTo;
        this.ppSanitizeBoard();
      }
      pp.anim = null;
      if(pp.animResolve){
        const r = pp.animResolve; pp.animResolve=null;
        try{ r(); }catch(e){}
      }
    }
  }


  ppAnimateGravity(){
    const pp=this._pp; if(!pp) return Promise.resolve();
    // gravity animation: avoid overlap by drawing a "base board" where moved cells are cleared
    const from = pp.board.map(row=>row.slice());

    const to = Array.from({length:pp.h}, ()=>Array(pp.w).fill(null));
    const base = from.map(row=>row.slice());
    let moved = [];

    for(let x=0;x<pp.w;x++){
      let write=pp.h-1;
      for(let y=pp.h-1;y>=0;y--){
        const v = from[y][x];
        if(v==null) continue;
        to[write][x] = v;
        if(write!==y){
          moved.push({x, y0:y, y1:write, c:v});
          // clear original so we don't draw duplicate while animating
          base[y][x] = null;
        }
        write--;
      }
    }

    // no movement -> just apply board and continue
    if(!moved.length){
      pp.board = to;
      this.ppSanitizeBoard();
      return Promise.resolve();
    }

    // during animation, keep board as "base" (holes at origins) and draw moved pieces interpolated
    pp.board = base;
    this.ppSanitizeBoard();

    return new Promise((resolve)=>{
      pp.anim = {
        type:'gravity',
        t:0,
        dur: Math.max(140, Math.min(420, 140 + moved.length*10)),
        moved,
        boardTo: to
      };
      pp.animResolve = resolve;
    });
  }


  ppMove(dx){
    const pp=this._pp; if(!pp || pp.over || pp.resolving) return;
    const cur={...pp.cur, x:pp.cur.x+dx};
    if(this.ppCanPlace(cur)){
      pp.cur=cur;
      this.ppDraw();
    }
  }

  ppRotate(dir){
    const pp=this._pp; if(!pp || pp.over || pp.resolving) return;
    let o = pp.cur.o + (dir<0?-1:1);
    const cand={...pp.cur, o};
    if(this.ppCanPlace(cand)){
      pp.cur=cand; this.ppDraw(); return;
    }
    // wall kick small
    const cand2={...cand, x:cand.x+1};
    if(this.ppCanPlace(cand2)){ pp.cur=cand2; this.ppDraw(); return; }
    const cand3={...cand, x:cand.x-1};
    if(this.ppCanPlace(cand3)){ pp.cur=cand3; this.ppDraw(); return; }
  }

  ppSoft(on){
    const pp=this._pp; if(!pp || pp.over) return;
    pp.soft = !!on;
  }

  ppHardDrop(){
    const pp=this._pp; if(!pp || pp.over || pp.resolving) return;
    while(this.ppMoveDown()){}
    this.ppLock();
  }

  ppMoveDown(){
    const pp=this._pp;
    const cand={...pp.cur, y:pp.cur.y+1};
    if(this.ppCanPlace(cand)){ pp.cur=cand; return true; }
    return false;
  }

  ppLock(){
    const pp=this._pp; if(!pp || pp.over) return;
    const cells=this.ppCellsOfCur(pp.cur);
    for(const p of cells){
      if(p.y<0){ pp.over=true; this.ppFinish(); return; }
      // 安全策：盤面外へ書き込もうとしたら落とさずに終了扱い
      if(!this.ppWriteCell(p.x, p.y, p.c)) return;
    }
    this.ppSanitizeBoard();
    pp.cur=null;
    pp.resolving=true;
    pp.chain=0;
    this.ppResolveAsync();
  }



  async ppResolveAsync(){
    const pp=this._pp; if(!pp) return;
    const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
    try{
      while(true){
        await this.ppAnimateGravity();

        const cleared = this.ppClearGroups();
        if(cleared.count<=0) break;

        pp.chain += 1;

        // FX：連鎖バナー（派手表示）
        this.ppFxChain(pp.chain);

        // score
        const add = this.ppScoreAdd(cleared.count, pp.chain);
        pp.score = num(pp.score,0) + add;

        // clear cells
        for(const c of cleared.cells){
          if(c.y>=0 && c.y<pp.h && c.x>=0 && c.x<pp.w){
            pp.board[c.y][c.x] = null;
          }
        }
        this.ppSanitizeBoard();

        // FX：消去パーティクル（派手）
        this.ppFxBurst(cleared.cells);

        // small pause
        $("#ppScore") && ($("#ppScore").textContent = pp.score);
        $("#ppChain") && ($("#ppChain").textContent = pp.chain);
        $("#ppHigh") && ($("#ppHigh").textContent = this.getPunyopunyoHighScore());

        this.ppDraw();
        await sleep(90);
      }
    }catch(e){
      // if resolve crashes, avoid freeze (pp.resolving stuck) and keep game recoverable
      try{
        const msg = (e && (e.stack||e.message)) ? (e.stack||e.message) : String(e);
        console.error("ppResolveAsync error:", msg);
      }catch(_){}
    }finally{
      pp.resolving=false;
    }

    // spawn next if still playable
    if(pp.over) return;
    if(!pp.cur){
      this.spawnPunyopunyo();
    }
    this.ppDraw();
  }


  ppApplyGravity(){
    const pp=this._pp;
    for(let x=0;x<pp.w;x++){
      let write=pp.h-1;
      for(let y=pp.h-1;y>=0;y--){
        const v=pp.board[y][x];
        if(v!=null){
          if(write!==y){
            pp.board[write][x]=v;
            pp.board[y][x]=null;
          }
          write--;
        }
      }
    }
  }

  ppClearGroups(){
    const pp=this._pp;
    const vis=Array.from({length:pp.h}, ()=>Array(pp.w).fill(false));
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    let toClear=[];
    for(let y=0;y<pp.h;y++){
      for(let x=0;x<pp.w;x++){
        if(vis[y][x]) continue;
        const v=pp.board[y][x];
        if(v==null) continue;
        vis[y][x]=true;
        const comp=[[x,y]];
        const q=[[x,y]];
        while(q.length){
          const [cx,cy]=q.pop();
          for(const [dx,dy] of dirs){
            const nx=cx+dx, ny=cy+dy;
            if(nx<0||nx>=pp.w||ny<0||ny>=pp.h) continue;
            if(vis[ny][nx]) continue;
            if(pp.board[ny][nx]===v){
              vis[ny][nx]=true;
              q.push([nx,ny]);
              comp.push([nx,ny]);
            }
          }
        }
        if(comp.length>=4){
          toClear = toClear.concat(comp.map(p=>({x:p[0],y:p[1]})));
        }
      }
    }
    // clear
    for(const p of toClear){
      pp.board[p.y][p.x]=null;
    }
    return {count:toClear.length, cells:toClear};
  }

  ppScoreAdd(cleared, chain){
    const base = cleared * 10;
    // 連鎖が強いほど伸びが良い（やりすぎない範囲で）
    const mult = 1 + (chain-1)*0.75;
    const add = Math.floor(base * mult * chain);
    return Math.max(0, add);
  }

  ppFinish(forceQuit=false){
    const pp=this._pp; if(!pp) return;
    if(pp.paid) return;
    // 精算：forceQuit でもスコアに応じて支払う（途中終了もOK）
    const betRaw = num(pp.bet,0);
    const betDisp = (betRaw===0) ? 10 : betRaw;

    // ※賭け金の差し引きは startPunyopunyo() 開始時に実施済み
const mul = this.ppCalcMultiplier(pp.score);
    const reward = Math.floor((betDisp) * mul);
    this.p.gold = num(this.p.gold,0) + reward;
      this.afterGoldChange();

    // high score save
    const hs = this.getPunyopunyoHighScore();
    if(pp.score>hs){
      this.setPunyopunyoHighScore(pp.score);
    }

    pp.paid=true;
    pp.over=true;

    const hs2 = this.getPunyopunyoHighScore();
    const status = $("#ppStatus");
    if(status){
      status.innerHTML = `<span class="dim">倍率</span> <b>${mul.toFixed(2)}</b> / <span class="dim">報酬</span> <b>${reward}</b>G`;
    }
    $("#ppGold") && ($("#ppGold").textContent = num(this.p.gold,0));

    // show result and buttons
    { const s=$("#townSub")||$("#townDesc"); if(s) s.textContent = `SCORE ${pp.score} / HIGH ${hs2} / 報酬 ${reward}G`; }

    // replace actions with post buttons
    $("#townActions").innerHTML='';
    const addBtn=(label,fn)=>{
      const b=document.createElement('button');
      b.className='btn';
      b.textContent=label;
      b.onclick=()=>fn();
      $("#townActions").appendChild(b);
      return b;
    };

    addBtn('もう一回（同額）', ()=>{
      const goldNow = num(this.p.gold,0);
      let nextBet = betRaw;
      if(goldNow<=0) nextBet = 0;
      if(nextBet===-1) nextBet = goldNow;
      if(nextBet>goldNow && goldNow>0) nextBet = goldNow;
      this.startPunyopunyo({bet: nextBet});
    });
    addBtn('続ける（全額）', ()=>{
      const goldNow = num(this.p.gold,0);
      if(goldNow<=0){
        this.startPunyopunyo({bet:0});
      }else{
        this.startPunyopunyo({bet: goldNow});
      }
    });
    addBtn('賭け金変更', ()=>{ this._pp=null; this.openPunyopunyoSetup(); });
    addBtn('戻る', ()=>{ this._pp=null; this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino') || {role:'casino',name:'カジノ係'}); });
  }

  ppDraw(){
    const pp=this._pp; if(!pp) return;
    const cv=$("#ppCanvas"); if(!cv) return;
    const ctx=cv.getContext('2d');
    const dpr=pp.dpr||1;
    const cell=pp.cell||32;
    ctx.save();
    ctx.scale(dpr,dpr);

    const W=cell*pp.w, H=cell*pp.h;

    // screen shake
    const fx=pp.fx||{};
    if(fx.shake>0){
      const mag = (cell*0.10) * fx.shake;
      const sx = (Math.random()*2-1)*mag;
      const sy = (Math.random()*2-1)*mag;
      ctx.translate(sx,sy);
    }

    // background
    ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'rgba(20,24,32,0.72)');
    bg.addColorStop(1,'rgba(8,10,14,0.86)');
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,W,H);

    // grid subtle
    ctx.strokeStyle='rgba(120,227,255,0.06)';
    ctx.lineWidth=1;
    for(let x=0;x<=pp.w;x++){
      ctx.beginPath(); ctx.moveTo(x*cell+0.5,0); ctx.lineTo(x*cell+0.5,H); ctx.stroke();
    }
    for(let y=0;y<=pp.h;y++){
      ctx.beginPath(); ctx.moveTo(0,y*cell+0.5); ctx.lineTo(W,y*cell+0.5); ctx.stroke();
    }

    const palette=[
      ['rgba(255,90,120,1)','rgba(255,190,205,0.9)'],  // red/pink
      ['rgba(90,210,255,1)','rgba(190,245,255,0.9)'],  // cyan
      ['rgba(120,255,170,1)','rgba(210,255,235,0.9)'], // green
      ['rgba(255,220,110,1)','rgba(255,245,205,0.92)'],// yellow
      ['rgba(175,120,255,1)','rgba(230,210,255,0.92)'],// purple
    ];

    const drawP=(x,y,c,ghost=false)=>{
      const px=x*cell, py=y*cell;
      const r=cell*0.42;
      const cx=px+cell/2, cy=py+cell/2;
      const [base,hi]=palette[c%palette.length];
      const grad=ctx.createRadialGradient(cx-r*0.35, cy-r*0.35, r*0.15, cx, cy, r*1.15);
      grad.addColorStop(0, hi);
      grad.addColorStop(0.35, base);
      grad.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle=grad;
      ctx.globalAlpha = ghost?0.85:1.0;
      ctx.beginPath();
      ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.fill();
      // glossy highlight
      const g2=ctx.createRadialGradient(cx-r*0.35, cy-r*0.45, 0, cx-r*0.35, cy-r*0.45, r*0.95);
      g2.addColorStop(0,'rgba(255,255,255,0.65)');
      g2.addColorStop(0.35,'rgba(255,255,255,0.16)');
      g2.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g2;
      ctx.beginPath();
      ctx.arc(cx-r*0.15, cy-r*0.25, r*0.9, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha=1;
      // outline
      ctx.strokeStyle='rgba(0,0,0,0.35)';
      ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.stroke();
    };

    // draw settled
    if(pp.anim && pp.anim.type==='gravity'){
      const a=pp.anim;
      const t = clamp(a.t / a.dur, 0, 1);
      const boardStatic = (a.boardStatic && Array.isArray(a.boardStatic) && a.boardStatic.length===pp.h) ? a.boardStatic : pp.board;
      for(let y=0;y<pp.h;y++){
        const row = boardStatic[y];
        if(!row) continue;
        for(let x=0;x<pp.w;x++){
          const v=row[x];
          if(v!=null) drawP(x,y,v);
        }
      }
      const movers = a.moved || a.items || [];
      for(const it of movers){
        if(!it) continue;
        const yy = it.y0 + (it.y1 - it.y0) * t;
        drawP(it.x, yy, it.c, true);
      }
    }else{
      for(let y=0;y<pp.h;y++){
        for(let x=0;x<pp.w;x++){
          const v=pp.board[y][x];
          if(v!=null) drawP(x,y,v);
        }
      }
    }
    // draw current (smooth falling)
    if(pp.cur){
      const fall = pp.soft ? 55 : pp.fallMs;
      const frac = fall>0 ? clamp(pp.acc / fall, 0, 0.95) : 0;
      for(const p of this.ppCellsOfCur(pp.cur)){
        const yy = p.y + frac;
        if(yy>=0) drawP(p.x, yy, p.c, true, true);
      }
    }

    
    // particles & chain banner & flash overlay
    if(fx && fx.particles && fx.particles.length){
      for(const p of fx.particles){
        const col = colors[p.c] || 'rgba(255,255,255,0.9)';
        ctx.globalAlpha = 0.85 * (p.a ?? 1);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if(fx && fx.chainBanner){
      const t = fx.chainBanner.t / fx.chainBanner.dur;
      const a = Math.max(0, 1 - t);
      const scale = 1.15 + 0.35*Math.sin(Math.min(1,t)*Math.PI);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(W/2, H*0.35);
      ctx.scale(scale, scale);
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.font = 'bold ' + Math.floor(cell*1.05) + 'px system-ui, -apple-system, sans-serif';
      ctx.shadowColor='rgba(0,0,0,0.55)';
      ctx.shadowBlur=18;
      ctx.fillStyle='rgba(255,255,255,0.95)';
      ctx.fillText(fx.chainBanner.chain + ' 連鎖!!', 0, 0);
      ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(64,200,255,0.75)';
      ctx.lineWidth=4;
      ctx.strokeText(fx.chainBanner.chain + ' 連鎖!!', 0, 0);
      ctx.restore();
    }

    if(fx && fx.flash>0){
      ctx.save();
      ctx.globalAlpha = 0.22 * fx.flash;
      const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.65);
      g.addColorStop(0,'rgba(255,255,255,0.75)');
      g.addColorStop(0.45,'rgba(255,255,255,0.22)');
      g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g;
      ctx.fillRect(0,0,W,H);
      ctx.restore();
    }

    ctx.restore();

    // hud update
    const s=$("#ppScore"); if(s) s.textContent = pp.score;
    const c=$("#ppChain"); if(c) c.textContent = pp.chain;
    const sub = $("#townSub")||$("#townDesc");
    if(sub){
      const gold2=num(this.p.gold,0);
      const betRaw=num(pp.bet,0);
      const betDisp=(gold2<=0 && betRaw===0)?10:betRaw;
      sub.textContent = `SCORE ${pp.score} / 連鎖 ${pp.chain} / 賭け金 ${betDisp}G`;
    }
  }


  d2Room(r){ const cx=r.x+~~(r.w/2), cy=r.y+~~(r.h/2); const dx=this.p.x-cx, dy=this.p.y-cy; return dx*dx+dy*dy; }


  msCalcMultiplier(w,h,bombs){
    const cells = w*h;
    const density = bombs / Math.max(1, cells);
    const ratio = bombs / Math.max(1, (cells - bombs));
    let mult = 1.55 + ratio * (cells/36) * 2.0;
    // densityが極端に低いと旨味が出ないので少し底上げ
    mult += Math.max(0, (density - 0.08)) * (cells/36) * 3.0;
    mult = Math.min(8.0, Math.max(1.55, mult));
    return mult;
  }

  openMinesweeperSetup(){
    const ol = $("#townOL");
    $("#townTitle").textContent = "マインスイーパー";
    $("#townDesc").textContent = "ゴールドで遊びます（0GでもOK：賭け金10G扱い）。サイズと爆弾数で難易度が変わり、クリア報酬は賭け金×倍率です。";
    $("#townTabs").innerHTML = '';
    $("#townList").innerHTML = '';
    $("#townActions").innerHTML = '';

    const gold = num(this.p.gold, 0);
    const ZERO_G_SPECIAL_BET = 10;

    if(!this._msSetup) this._msSetup = {};

    // 前回の賭け金を維持（0Gのときは「10G扱い」で開始できる）
    if(gold > 0){
      const prev = (this._msLastBet != null) ? this._msLastBet : gold;
      const cur = (this._msSetup.bet != null) ? num(this._msSetup.bet, prev) : prev;
      this._msSetup.bet = Math.min(Math.max(1, cur), gold);
    }else{
      // 0G時は賭け金選択を省略し、開始時に10G扱いにする（bet=0を特殊扱い）
      this._msSetup.bet = 0;
    }
    const sizes = [
      {w:6,h:6,label:'小(6×6)'},
      {w:8,h:8,label:'中(8×8)'},
      {w:10,h:10,label:'大(10×10)'},
      {w:12,h:12,label:'特大(12×12)'},
    ];

    const betBase = [10, 20, 50, 100, 200, 500, 1000];
    let betOpts = [];
    if(gold > 0){
      betOpts = betBase.filter(v=>v<=gold);
      if(!betOpts.length) betOpts = [Math.max(1, gold)];
    }

    const makeBombOpts = (w,h)=>{
      const cells = w*h;
      const a = Math.max(4, Math.floor(cells*0.12));
      const b = Math.max(6, Math.floor(cells*0.18));
      const c = Math.max(8, Math.floor(cells*0.25));
      // 一意にして昇順
      return [...new Set([a,b,c])].sort((x,y)=>x-y);
    };

    const render = ()=>{
      $("#townList").innerHTML = '';
      const head = document.createElement('div'); head.className='item';
      const bet = this._msSetup.bet || 0;
      const displayBet = (gold <= 0 && bet <= 0) ? ZERO_G_SPECIAL_BET : bet;
      const sz = sizes[this._msSetup.sizeIdx ?? -1];
      const bombs = this._msSetup.bombs || 0;
      let multTxt='-'; let payoutTxt='-';
      if(displayBet>0 && sz && bombs>0){
        const mult=this.msCalcMultiplier(sz.w,sz.h,bombs);
        multTxt = mult.toFixed(2);
        payoutTxt = Math.floor(displayBet*mult) + 'G';
      }
      head.innerHTML = `<div>設定</div><div class="dim">所持金:${gold}G　賭け金:${displayBet}G${(gold<=0 && bet<=0)?'（10G扱い）':''}　サイズ:${sz?sz.label:'未選択'}　爆弾:${bombs?bombs:'未選択'}　倍率:${multTxt}　予想報酬:${payoutTxt}</div>`;
      $("#townList").appendChild(head);

      const section = (title)=>{
        const t=document.createElement('div'); t.className='dim'; t.style.marginTop='10px'; t.textContent=title;
        $("#townList").appendChild(t);
      };
      const row = ()=>{ const r=document.createElement('div'); r.className='row'; r.style.justifyContent='flex-start'; r.style.gap='8px'; r.style.marginTop='6px'; return r; };
      const mkBtn=(label,selected,onClick)=>{
        const b=document.createElement('div'); b.className='btn'+(selected?' sel':''); b.textContent=label; b.onclick=()=>onClick(); return b;
      };

      if(gold <= 0){
        section('賭け金（0GでもOK）');
        const info = document.createElement('div'); info.className='item';
        info.innerHTML = `<div>所持金0でも遊べます</div><div class="dim">賭け金は自動で${ZERO_G_SPECIAL_BET}G扱い（勝つとゴールドが増え、次回はそのまま賭けられます）</div>`;
        $("#townList").appendChild(info);
      }else{
        section('賭け金（必須）');
        const r1=row();
        for(const v of betOpts){ r1.appendChild(mkBtn(v+'G', this._msSetup.bet===v, ()=>{ this._msSetup.bet=v; render(); })); }
        const allBtn = mkBtn('全額', this._msSetup.bet===gold, ()=>{ this._msSetup.bet=gold; render(); });
        r1.appendChild(allBtn);
        $("#townList").appendChild(r1);
      }

      section('サイズ');
      const r2=row();
      sizes.forEach((s,idx)=>{ r2.appendChild(mkBtn(s.label, this._msSetup.sizeIdx===idx, ()=>{ this._msSetup.sizeIdx=idx; this._msSetup.bombs=null; render(); })); });
      $("#townList").appendChild(r2);

      if(this._msSetup.sizeIdx!=null){
        const s=sizes[this._msSetup.sizeIdx];
        section('爆弾数（難易度）');
        const r3=row();
        const opts = makeBombOpts(s.w,s.h);
        for(const v of opts){ r3.appendChild(mkBtn(v+'個', this._msSetup.bombs===v, ()=>{ this._msSetup.bombs=v; render(); })); }
        $("#townList").appendChild(r3);
      }
    };

    render();

    const addBtn=(label,fn)=>{ const b=document.createElement('div'); b.className='btn'; b.textContent=label; b.onclick=()=>fn(); $("#townActions").appendChild(b); };
    addBtn('開始', ()=>{
      const goldNow = num(this.p.gold,0);
      const betRaw = num(this._msSetup.bet, 0);
      const szIdx = this._msSetup.sizeIdx;
      const bombs = this._msSetup.bombs || 0;

      const betSpecialOk = (goldNow <= 0 && betRaw <= 0);
      if((!betSpecialOk && !betRaw) || szIdx==null || !bombs){
        this.msg('賭け金・サイズ・爆弾数を選んでください');
        return;
      }
      const s = sizes[szIdx];
      // betRaw=0のときは startMinesweeper 側で「10G扱い」にする
      this.startMinesweeper({w:s.w,h:s.h,bombs,bet:betRaw});
    });
    addBtn('戻る', ()=>{ this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino')); });
    if(ol) ol.style.display='flex';
  }

  startMinesweeper(cfg){
    const w=cfg.w, h=cfg.h, bombs=cfg.bombs;
    const ZERO_G_SPECIAL_BET = 10;

    let bet = num(cfg.bet, 0);
    const gold = num(this.p.gold, 0);
    let usedSpecial = false;

    // 0Gかつ賭け金0（未選択）のときは「10G賭けた扱い」で開始できる
    if(gold <= 0 && bet <= 0){
      bet = ZERO_G_SPECIAL_BET;
      usedSpecial = true;
    }

    // それ以外は通常どおり賭け金必須
    if(!usedSpecial){
      if(bet <= 0){
        this.msg('賭け金を選んでください');
        return this.openMinesweeperSetup();
      }
      if(gold < bet){
        this.msg('所持金が足りません');
        return this.openMinesweeperSetup();
      }
      // 賭け金を先に支払う
      this.p.gold = gold - bet;
    this.afterGoldChange();
    }

    // 前回賭け金として保持（次回のデフォルトに使う）
    this._msLastBet = bet;
    const cells=w*h;
    // 盤面生成（爆弾配置は即時、初手爆弾は返金してやり直し）
    const board=Array.from({length:h},()=>Array(w).fill(0));
    const bombsSet=new Set();
    const key=(x,y)=>y*w+x;
    while(bombsSet.size < bombs){
      const x=rand(0,w-1), y=rand(0,h-1);
      const k=key(x,y);
      if(bombsSet.has(k)) continue;
      bombsSet.add(k);
    }
    for(const k of bombsSet){
      const x=k%w, y=Math.floor(k/w);
      board[y][x] = -1;
    }
    const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      if(board[y][x]===-1) continue;
      let c=0;
      for(const [dx,dy] of dirs){
        const nx=x+dx, ny=y+dy;
        if(nx<0||ny<0||nx>=w||ny>=h) continue;
        if(board[ny][nx]===-1) c++;
      }
      board[y][x]=c;
    }
    this._ms={ w,h,bombs,bet, board, revealed: Array.from({length:h},()=>Array(w).fill(false)), flags: Array.from({length:h},()=>Array(w).fill(false)), mode:'dig', first:true, over:false };
    this.openMinesweeperPlay();
  }

  openMinesweeperPlay(){
    const ol = $("#townOL");
    const ms = this._ms;
    if(!ms) return this.openMinesweeperSetup();
    $("#townTitle").textContent = "マインスイーパー";
    const mult = this.msCalcMultiplier(ms.w, ms.h, ms.bombs);
    $("#townDesc").textContent = `掘る/旗を切替できます。クリア報酬: 賭け金×倍率（倍率${mult.toFixed(2)}）`;
    $("#townTabs").innerHTML = '';
    $("#townList").innerHTML = '';
    $("#townActions").innerHTML = '';

    const head=document.createElement('div'); head.className='item';
    head.innerHTML = `<div>賭け金:${ms.bet}G　爆弾:${ms.bombs}　モード:${ms.mode==='dig'?'掘る':'旗'}　所持金:${num(this.p.gold,0)}G</div><div class="dim">初手爆弾は返金して仕切り直し</div>`;
    $("#townList").appendChild(head);

    const grid=document.createElement('div');
    grid.className='msGrid';
    grid.style.gridTemplateColumns = `repeat(${ms.w}, 32px)`;
    for(let y=0;y<ms.h;y++){
      for(let x=0;x<ms.w;x++){
        const cell=document.createElement('div');
        cell.className='msCell';
        const val=ms.board[y][x];
        const rev=ms.revealed[y][x];
        const fl=ms.flags[y][x];
        if(rev){
          cell.classList.add('revealed');
          if(val===-1){ cell.textContent='💣'; cell.classList.add('bomb'); }
          else if(val===0){ cell.textContent=''; }
          else { cell.textContent=String(val); cell.classList.add('n'+val); }
        }else{
          if(fl){ cell.textContent='⚑'; cell.classList.add('flag'); }
          else cell.textContent='';
        }
        cell.onclick = ()=>{
          if(ms.over) return;
          if(ms.mode==='flag'){ this.msToggleFlag(x,y); }
          else { this.msReveal(x,y); }
        };
        grid.appendChild(cell);
      }
    }
    $("#townList").appendChild(grid);

    const addBtn=(label,sel,fn)=>{ const b=document.createElement('div'); b.className='btn'+(sel?' sel':''); b.textContent=label; b.onclick=()=>fn(); $("#townActions").appendChild(b); };
    addBtn('掘る', ms.mode==='dig', ()=>{ ms.mode='dig'; this.openMinesweeperPlay(); });
    addBtn('旗', ms.mode==='flag', ()=>{ ms.mode='flag'; this.openMinesweeperPlay(); });
    addBtn('続ける（全額）', false, ()=>{
      // 勝ったゴールドをそのまま賭けられる（所持金0のときは10G扱い）
      const cfg={w:ms.w,h:ms.h,bombs:ms.bombs,bet:num(this.p.gold,0)};
      this._ms=null;
      this.startMinesweeper(cfg);
    });
    addBtn('もう一回（同額）', false, ()=>{
      // 同額で続行
      const cfg={w:ms.w,h:ms.h,bombs:ms.bombs,bet:ms.bet};
      this._ms=null;
      this.startMinesweeper(cfg);
    });
    addBtn('設定変更', false, ()=>{
      const cfg={w:ms.w,h:ms.h,bombs:ms.bombs,bet:ms.bet};
      this._ms=null;
      // セットアップに戻す（同値を残す）
      const szList=[{w:6,h:6},{w:8,h:8},{w:10,h:10},{w:12,h:12}];
      const szIdx=szList.findIndex(s=>s.w===cfg.w&&s.h===cfg.h);
      this._msSetup = { bet: Math.min(cfg.bet, Math.max(0, num(this.p.gold,0))), sizeIdx: szIdx, bombs: cfg.bombs };
      this.openMinesweeperSetup();
    });

addBtn('やめる', false, ()=>{ this._ms=null; this.openTownNpcMenu(this.mons.find(m=>m.ai==='town' && m.role==='casino')); });
    if(ol) ol.style.display='flex';
  }

  msToggleFlag(x,y){
    const ms=this._ms; if(!ms||ms.over) return;
    if(ms.revealed[y][x]) return;
    ms.flags[y][x] = !ms.flags[y][x];
    this.openMinesweeperPlay();
  }

  msReveal(x,y){
    const ms=this._ms; if(!ms||ms.over) return;
    if(ms.flags[y][x]) return;
    if(ms.revealed[y][x]) return;
    const val = ms.board[y][x];
    if(ms.first && val===-1){
      // 返金して仕切り直し（同条件で盤面だけ作り直す）
      this.p.gold = num(this.p.gold,0) + ms.bet;
      this.afterGoldChange();
      this.msg('初手が爆弾だったので返金して仕切り直し');
      const cfg={w:ms.w,h:ms.h,bombs:ms.bombs,bet:ms.bet};
      this._ms=null;
      return this.startMinesweeper(cfg);
    }
    ms.first=false;
    if(val===-1){
      ms.over=true;
      // 全表示
      for(let yy=0;yy<ms.h;yy++) for(let xx=0;xx<ms.w;xx++) ms.revealed[yy][xx]=true;
      this.msg('爆弾！ 失敗…');
      return this.openMinesweeperPlay();
    }
    const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    const q=[[x,y]];
    while(q.length){
      const [cx,cy]=q.pop();
      if(ms.revealed[cy][cx]) continue;
      if(ms.flags[cy][cx]) continue;
      ms.revealed[cy][cx]=true;
      if(ms.board[cy][cx]===0){
        for(const [dx,dy] of dirs){
          const nx=cx+dx, ny=cy+dy;
          if(nx<0||ny<0||nx>=ms.w||ny>=ms.h) continue;
          if(ms.revealed[ny][nx]) continue;
          if(ms.board[ny][nx]===-1) continue;
          q.push([nx,ny]);
        }
      }
    }
    // 勝利判定
    let revCount=0;
    for(let yy=0;yy<ms.h;yy++) for(let xx=0;xx<ms.w;xx++) if(ms.revealed[yy][xx]) revCount++;
    const cells=ms.w*ms.h;
    if(revCount >= (cells - ms.bombs)){
      ms.over=true;
      const mult=this.msCalcMultiplier(ms.w,ms.h,ms.bombs);
      const reward=Math.max(0, Math.floor(ms.bet*mult));
      this.p.gold = num(this.p.gold,0) + reward;
      this.afterGoldChange();
      // 全表示（爽快）
      for(let yy=0;yy<ms.h;yy++) for(let xx=0;xx<ms.w;xx++) ms.revealed[yy][xx]=true;
      this.msg(`クリア！ +${reward}G（倍率${mult.toFixed(2)}）`);
      return this.openMinesweeperPlay();
    }
    this.openMinesweeperPlay();
  }

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
    this.shopExits.set(r.id, this.calcShopOriginalExits(r));
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
  isInShop(x,y){
    const rid=this.roomIdAt(x,y);
    return (rid>=0 && this.shopRooms && this.shopRooms.has(rid));
  }
  shopRoomId(x,y){
    const rid=this.roomIdAt(x,y);
    return (rid>=0 && this.shopRooms && this.shopRooms.has(rid)) ? rid : -1;
  }
  isShopMerchOnFloor(it){
    if(!it) return false;
    const key=`${it.x},${it.y}`;
    return this.isInShop(it.x,it.y) && this.shopCells.has(key) && it.price!=null;
  }
  calcShopOriginalExits(r){
    const exits=new Set();
    // 生成時点の「元からある出入口」だけを記録（壁破壊などで増えた出口は含めない）
    for(let y=r.y;y<r.y+r.h;y++){
      for(let x=r.x;x<r.x+r.w;x++){
        const onEdge = (x===r.x || x===r.x+r.w-1 || y===r.y || y===r.y+r.h-1);
        if(!onEdge) continue;
        if(this.map[y][x]!=='.') continue;
        const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        for(const [dx,dy] of dirs){
          const nx=x+dx, ny=y+dy;
          if(this.isOut(nx,ny)) continue;
          const outside = !(nx>=r.x && nx<r.x+r.w && ny>=r.y && ny<r.y+r.h);
          if(!outside) continue;
          if(this.map[ny][nx]!=='.' && this.map[ny][nx]!=='>' ) continue;
          exits.add(`${x},${y}`);
        }
      }
    }
    return exits;
  }
  unpaidItemsForRoom(rid){
    return this.inv.filter(it=>it && it.unpaid && it.shopRid===rid);
  }
  hasUnpaidInInv(){
    return this.inv.some(it=>it && it.unpaid);
  }
  becomeThief(reason){
    if(this.thief) return;
    this.thief=true;
    this.msg(reason||"泥棒だ！");
    fxOmin();
    for(const m of this.mons){ if(m && m.isShop){ m.hostile=true; } }
  }
  checkThiefState(){
    if(this.thief) return;
    if(!this.hasUnpaidInInv()) return;
    if(!this.isInShop(this.p.x,this.p.y)){
      this.becomeThief("泥棒だ！店主が敵対した");
    }
  }
  clearThiefAndUnpaidOnDescend(){
    // 階段を降りたら「泥棒状態」「売り物タグ」を必ず解除し、持ち物は自分の物になる
    this.thief=false;
    for(const it of this.inv){
      if(it && it.unpaid){
        delete it.unpaid;
        delete it.shopRid;
        delete it.price;
      }
    }
  }
  onItemPlacedOnFloor(item,x,y){
    item.x=x; item.y=y;
    const rid=this.shopRoomId(x,y);
    const key=`${x},${y}`;
    if(rid>=0){
      // 店内の床に置かれた状態なら、会計も出ないし外に出ても敵対しない（売り物を戻した扱い）
      if(item.unpaid){ delete item.unpaid; }
      // もともと売り物だった品だけを「売り物床」として扱う（自分の私物を勝手に売り物化しない）
      if(item.shopRid!=null || item.price!=null){
        item.shopRid = rid;
        if(item.price==null) item.price = priceOf(item);
        this.shopCells.add(key);
      }
    }else{
      // 店外に置いたら、その座標は売り物床ではない
      this.shopCells.delete(key);
    }
  }
  openShopDialogPickup(it, after){
    this.shopDialogState={mode:'pickup', item:it, after};
    const title=$("#shopDialogTitle"); if(title) title.textContent="売り物";
    $("#shopDialogText").textContent=`${it.name}（${num(it.price,0)}G）を拾いますか？`;
    $("#shopBillList").innerHTML="";
    $("#shopMoney").textContent=`所持金: ${num(this.p.gold,0)}G`;
    $("#btnPay").textContent="拾う";
    $("#btnRefuse").textContent="拾わない";
    $("#shopDialog").style.display="flex";
  }
  openShopDialogCheckout(rid, dx, dy){
    const items=this.unpaidItemsForRoom(rid);
    const total=items.reduce((s,it)=>s+num(it.price,0),0);
    this.shopDialogState={mode:'checkout', rid, dx, dy, items, total};
    const title=$("#shopDialogTitle"); if(title) title.textContent="お会計";
    $("#shopDialogText").textContent=`未払い ${items.length}個 / 合計 ${total}G`;
    $("#shopBillList").innerHTML = items.map(it=>(
      `<div class="row" style="justify-content:space-between"><div>${it.name}</div><div class="dim">${num(it.price,0)}G</div></div>`
    )).join("");
    $("#shopMoney").textContent=`所持金: ${num(this.p.gold,0)}G`;
    $("#btnPay").textContent="支払う";
    $("#btnRefuse").textContent="支払わない";
    $("#shopDialog").style.display="flex";
  }
  closeShopDialog(){
    $("#shopDialog").style.display="none";
    this.shopDialogState=null;
  }
  onShopDialogPay(){
    const st=this.shopDialogState; if(!st) return;
    if(st.mode==='pickup'){
      const it=st.item;
      this.closeShopDialog();
      if(typeof st.after==='function') st.after(true, it);
      return;
    }
    if(st.mode==='checkout'){
      if(num(this.p.gold,0) < num(st.total,0)){
        this.msg("所持金が足りない");
        this.render();
        return;
      }
      this.p.gold = num(this.p.gold,0) - num(st.total,0);
      this.afterGoldChange();
      for(const it of st.items){
        delete it.unpaid; delete it.shopRid; delete it.price;
      }
      this.msg(`支払い完了（${st.total}G）`);
      const dx=st.dx, dy=st.dy;
      this.closeShopDialog();
      // そのまま移動を再実行（会計チェックはスキップ）
      this.tryMove(dx,dy,{skipShopCheckout:true});
      return;
    }
  }
  onShopDialogRefuse(){
    const st=this.shopDialogState; if(!st) return;
    if(st.mode==='pickup'){
      const it=st.item;
      this.closeShopDialog();
      if(typeof st.after==='function') st.after(false, it);
      return;
    }
    if(st.mode==='checkout'){
      this.msg("会計しないと持ち出せない");
      this.closeShopDialog();
      this.render();
      return;
    }
  }
  pickupShopMerch(it){
    if(!it) return false;
    if(this.inv.length>=this.baseInvMax()){ this.msg("これ以上持てない"); return false; }
    // 店の品は「自動装填/自動装備」しない（装備扱いになりやすいので）
    this.inv.push(it);
    it.unpaid=true;
    it.shopRid=this.shopRoomId(it.x,it.y);
    this.shopCells.delete(`${it.x},${it.y}`);
    this.items=this.items.filter(x=>x!==it);
    this.msg(`${it.name}を拾った（売り物）`);
    return true;
  }


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

    // マップは span(cell) で描画（1ch固定）→ FXもズレない
    let out="";
    for(let y=0;y<this.viewH;y++){
      for(let x=0;x<this.viewW;x++){
        out+=this.tileSpan(x+this.offX,y+this.offY);
      }
      out+='<br>';
    }
    const vp=$("#viewport");
    vp.innerHTML=out;

    // cell参照（FX用）
    this._cellEls = Array.from(vp.querySelectorAll('.cell'));

    // ステータスなど
    $("#chipBest").textContent=`Best ${this.bestFloor}F / Score ${this.bestScore}`;
    const eW=this.p.wep?`（E）`:""; const eA=this.p.arm?`（E）`:""; const eAr=this.p.arrow?`（E）`:"";
    $("#stats").textContent =
`Lv:${num(this.p.lv,1)}  HP:${num(this.p.hp,0)}/${num(this.p.maxHp,1)}  STR:${num(this.p.str,10)}  階:${num(this.floor,1)}  G:${num(this.p.gold,0)}${this.thief?'  【泥棒中】':''}
攻:${this.calcPlayerAtk()}  守:${this.calcPlayerDef()}
矢:${num(this.p.ar,0)}（${this.p.arrow?this.p.arrow.kind:'なし'}）
武:${this.p.wep?this.p.wep.name+(this.p.wep.plus?('+'+num(this.p.wep.plus,0)):''):'なし'}${this.p.wep?eW:''}
盾:${this.p.arm?this.p.arm.name+(this.p.arm.plus?('+'+num(this.p.arm.plus,0)):''):'なし'}${this.p.arm?eA:''}
矢装填:${this.p.arrow?this.p.arrow.kind:'なし'}${this.p.arrow?eAr:''}
自動拾い:${this.autoPickup?'ON':'OFF'}`;
    // Town: action labels
    const shootBtn=document.querySelector('[data-act="shoot"]');
    if(shootBtn) shootBtn.textContent = (this.mode==='town'?'話す':'撃つ');
    const descBtn=document.querySelector('[data-act="descend"]');
    if(descBtn) descBtn.textContent = (this.mode==='town'?'出る':'降りる');
    $("#lowHP").style.opacity = (num(this.p.hp,0)/Math.max(1,num(this.p.maxHp,1))<0.2)?1:0;

    // FXキューがあれば再生
    if(this.fxQueue && this.fxQueue.length && !this.fxBusy){
      this.playFxQueue();
    }
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

    // 店主は「攻撃されたら敵対」
    if(att===this.p && def && def.ai==='shop' && def.hostile===false){
      for(const m of this.mons){ if(m && m.ai==='shop') m.hostile=true; }
      this.msg("店主が怒った！");
    }

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

    const attIsPlayer = (att===this.p);
    const defIsPlayer = (def===this.p);
    const invActive = (defIsPlayer && num(this.p.invincible,0)>0);
    let invBlocked = false;
    if(invActive && dmg>0){
      invBlocked = true;
      dmg = 0;
    }

    let fxCombatMsgShown = false;

    const vp=$("#viewport"); vp.classList.remove('shake'); void vp.offsetWidth; vp.classList.add('shake');
    if(dmg>0) fxSlash();

    if(defIsPlayer && this.p.arm && !invBlocked){
      const a=this.p.arm;
      if(a.nullify && Math.random() < num(a.nullify,0)){ this.msg("攻撃を無効化した！"); dmg=0; }
      if(dmg>0 && a.reflect && Math.random() < num(a.reflect,0)){
        this.msg("攻撃を反射！");
        const ret = Math.max(1, dmg);
        if(att){ att.hp = Math.max(0, num(att.hp,1) - ret); if(att.hp<=0) this.kill(att,this.p); }
        dmg=0;
      }
    }

    // ===== 攻撃FX＆被ダメ/与ダメトースト（点滅と同期） =====
    try{
      const s = (att && typeof att.x==='number') ? {x:att.x,y:att.y} : null;
      const d = (def && typeof def.x==='number') ? {x:def.x,y:def.y} : null;
      let msgText = "";
      if(invBlocked){
        msgText = `無敵！`;
      }else if(dmg>0){
        if(defIsPlayer){
          const an = (att && att.name) ? att.name : "敵";
          const ach = (att && att.ch) ? att.ch : "?";
          msgText = `${an}(${ach}) から ${dmg} ダメージ！`;
        }else if(attIsPlayer){
          const dn = (def && def.name) ? def.name : "敵";
          const dch = (def && def.ch) ? def.ch : "?";
          msgText = `${dn}(${dch}) に ${dmg} ダメージ！`;
        }
      }
      fxCombatMsgShown = !!msgText;
      const linePts = [];
      if(s && d){
        const dist = Math.max(Math.abs(s.x-d.x), Math.abs(s.y-d.y));
        if(dist>1){
          // bresenham（端点除外）
          let x0=s.x,y0=s.y,x1=d.x,y1=d.y;
          let dx=Math.abs(x1-x0), sx=(x0<x1)?1:-1;
          let dy=-Math.abs(y1-y0), sy=(y0<y1)?1:-1;
          let err=dx+dy;
          while(!(x0===x1 && y0===y1)){
            const e2=2*err;
            if(e2>=dy){ err+=dy; x0+=sx; }
            if(e2<=dx){ err+=dx; y0+=sy; }
            if(!(x0===x1 && y0===y1)) linePts.push({x:x0,y:y0});
          }
        }
      }
      if(s && d && (dmg>0 || invBlocked)) this.enqueueAttackFx(s,d,msgText,linePts);
    }catch(e){}

    if(dmg<=0){ this.render(); return; }
    def.hp = Math.max(0, num(def.hp,1) - dmg);

    if(defIsPlayer){
      if(!fxCombatMsgShown) this.msg(`${dmg}のダメージ！`);
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
      if(!fxCombatMsgShown) this.msg(`${def.name}に${dmg}ダメージ`);
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

  tryMove(dx,dy,opts={}){
    if(this.shopDialogState){ return; }
    // 方向指定モード（射撃/杖/身代わり草）は「移動」と同居させない
    if(this.waitTarget){
      const wt=this.waitTarget;
      if(wt.mode==='wand'){
        // オーバーレイ方向選択中でも、D-pad/キー入力で方向指定できるように
        this.closeShootOL();
        this.castWand(wt.item,dx,dy);
      }
      else if(wt.mode==='shoot'){
        this.shootDir(dx,dy);
      }
      else if(wt.mode==='throw'){
        this.throwDir(dx,dy);
      }
      else if(wt.mode==='throwGold'){
        this.throwGoldDir(dx,dy);
      }
      else if(wt.mode==='herbDecoy'){
        this.castHerbDecoy(dx,dy);
      }
      return;
    }
    this.p.lastDir=[dx,dy];
    const nx=this.p.x+dx, ny=this.p.y+dy;
    // Town: allow leaving from map edges ("画面端から出られない"対策)
    if(this.isOut(nx,ny)){
      if(this.mode==='town'){
        // edge as an exit
        this.openTownExitMenu("町の外に出ますか？");
        this.render();
      }
      return;
    }

    // --- ショップ：元の出入口から「売り物」を持ち出すときだけ会計確認 ---
    if(!opts.skipShopCheckout){
      const curRid=this.shopRoomId(this.p.x,this.p.y);
      const nextRid=this.shopRoomId(nx,ny);
      if(curRid>=0 && nextRid!==curRid){
        const exits=this.shopExits.get(curRid);
        const isOrigExit = exits && exits.has(`${this.p.x},${this.p.y}`);
        if(isOrigExit){
          const unpaid=this.unpaidItemsForRoom(curRid);
          if(unpaid.length){
            this.openShopDialogCheckout(curRid, dx, dy);
            return;
          }
        }
      }
    }

    if(this.isWall(nx,ny)){ if(this.p.wep && this.p.wep.wallBreak){ this.map[ny][nx]='.'; this.msg("壁を砕いた"); } this.render(); return; }
    const m=this.monAt(nx,ny);
    if(m){
      // Town: bump into NPC = talk (no combat)
      if(this.mode==='town' && m.ai==='town'){
        this.openTownNpcMenu(m);
        this.render();
        return;
      }
      this.hit(this.p,m,0); this.turnStep(); this.render(); return;
    }
    else{
      this.p._ox=this.p.x; this.p._oy=this.p.y;
      this.p.x=nx; this.p.y=ny;
      const tr=this.traps.find(t=>t.x===nx && t.y===ny);
      if(tr && !tr.seen){ tr.seen=true; if(tr.type==="arrow"){ this.msg("矢のワナ！"); this.hit({atk:10,hp:1,def:0}, this.p, 0); } }
      if(this.map[ny][nx]==='>'){ this.msg("階段がある"); fxOmin(); }
      this.revealRoomAt(nx,ny);

      // --- ショップ：売り物の上に乗ったら拾う/拾わないを確認（このターンはここで一旦止める） ---
      const it=this.itemAt(this.p.x,this.p.y);
    // 店の売り物が店外にある状態で拾ったら、その瞬間から泥棒扱い（次の敵行動前に敵対）
    if(it && it.price!=null && it.shopRid!=null && !this.isInShop(it.x,it.y)){
      it.unpaid=true;
    }

      if(this.isShopMerchOnFloor(it)){
        this.openShopDialogPickup(it, (pick)=>{
          if(pick){ this.pickupShopMerch(it); }
          this.turnStep();
          this.render();
        });
        return;
      }

      if(this.autoPickup){ this.doPickupHere(); }
      this.turnStep();
    }
    this.render();
  }

  doPickupHere(){
    const it=this.itemAt(this.p.x,this.p.y);
    if(!it) return;
    if(this.shopCells.has(`${it.x},${it.y}`) && it.price!=null){
      if(num(this.p.gold,0)>=num(it.price,0)){ this.p.gold=num(this.p.gold,0)-num(it.price,0);
      this.afterGoldChange(); this.msg(`購入: ${it.name}`); fxSpark(); }
      else return;
    }

    // 矢：種類と本数の整合を保ち、別種類は所持品へ（同種はスタック）
    if(it.type==='arrow'){
      handleArrowPickup(this, it);
      return;
    }

    // 金
    if(it.type==='gold'){
      this.p.gold = num(this.p.gold,0) + num(it.amount,0);
      this.afterGoldChange();
      this.msg(`${num(it.amount,0)}Gを拾った`);
      fxSpark();
      this.items=this.items.filter(x=>x!==it);
      return;
    }

    // それ以外
    if(this.inv.length>=this.baseInvMax()){ this.msg("これ以上持てない"); return; }
    this.inv.push(it);
    this.msg(`${it.name}を拾った`);
    fxSpark();
    if((it.type==='weapon' && num(it.atk,0)>=8) || (it.type==='armor' && num(it.def,0)>=7)){
      this.msg("強力な装備だ！"); this.flashInv(x=>x===it);
    }
    if(it.type==='scroll' && it.name.includes("脱出")) this.haveEscape=true;
    this.items=this.items.filter(x=>x!==it);
  }

  descend(){
    if(this.mode==='town'){
      if(this.map[this.p.y][this.p.x]!=='>'){ this.msg("ここには出入口がない"); return; }
      this.openTownExitMenu("どこへ行きますか？");
      return;
    }
    if(this.map[this.p.y][this.p.x]!=='>'){ this.msg("ここには階段がない"); return; }
    this.floor=Math.min(MAX_FLOOR, num(this.floor,1)+1);
    if(this.floor>this.bestFloor){ this.bestFloor=this.floor; localStorage.setItem('bestF',this.bestFloor); }
    this.gen(this.floor);
  }

  askShoot(){
    if(this.mode==='town'){
      this.townTalk();
      return;
    }
    if(!this.p.arrow || num(this.p.ar,0)<=0){
      this.msg("矢がない");
      return;
    }
    // 方向をオーバーレイUIで選ぶ（移動入力と分離する）
    this.waitTarget = {mode:'shoot'};
    this.openShootOL("方向を選んで射撃");
    this.msg("撃つ方向を選んでください");
  }

  // Town: exit menu (shared by stairs and map edges)
  openTownExitMenu(descText){
    $("#townTabs").innerHTML='';
    $("#townList").innerHTML='';
    $("#townActions").innerHTML='';
    $("#townTitle").textContent="出入口";
    $("#townDesc").textContent=descText || "どこへ行きますか？";
    const addBtn=(label,fn)=>{
      const b=document.createElement('div');
      b.className='pill';
      b.textContent=label;
      b.onclick=()=>fn();
      $("#townActions").appendChild(b);
    };
    addBtn("ダンジョンへ", ()=>{ $("#townOL").style.display='none'; this.startDungeonFromTown(); });
    addBtn("タイトルへ戻る", ()=>{ $("#townOL").style.display='none'; this.saveHoldToTitle(); showTitle(); });
    addBtn("キャンセル", ()=>{ $("#townOL").style.display='none'; });
    $("#townOL").style.display='flex';
  }

  openShootOL(title){
    const ol = $("#shootOL");
    if(!ol) return;
    const t = $("#shootTitle");
    if(t && typeof title === 'string' && title.trim()) t.textContent = title;
    ol.style.display = "flex";
  }
  closeShootOL(){
    const ol = $("#shootOL");
    if(ol) ol.style.display = "none";
  }
  cancelTargeting(){
    // 射撃/投げ/杖の方向選択キャンセル
    if(this.waitTarget && ['shoot','throw','throwGold','wand'].includes(this.waitTarget.mode)){
      this.waitTarget = null;
      this.closeShootOL();
      this.msg("キャンセル");
      this.render();
    }
  }

  selectDirFromOL(dx,dy){
    if(!this.waitTarget) return;
    const m = this.waitTarget.mode;
    if(m==='shoot') return this.shootDir(dx,dy);
    if(m==='throw') return this.throwDir(dx,dy);
    if(m==='throwGold') return this.throwGoldDir(dx,dy);
    if(m==='wand'){
      this.closeShootOL();
      const w = this.waitTarget.item;
      this.waitTarget = null;
      this.castWand(w,dx,dy);
      return;
    }
    // herbDecoyなどは現状は移動入力で指定（必要なら後で拡張）
  }


  shootDir(dx,dy){
    if(!this.waitTarget || this.waitTarget.mode!=='shoot') return;
    this.closeShootOL();
    // 射撃だけ実行（移動しない）
    const hit = this.lineHit(this.p.x,this.p.y,dx,dy, this.p.arrow.range||8);
    if(hit){
      // 命中
      if(this.p.arrow.kind==="poison"){ hit.poison=3; this.hit(this.p,hit,3); }
      else if(this.p.arrow.kind==="sleep"){ hit.sleep=2; this.hit(this.p,hit,1); }
      else if(this.p.arrow.kind==="slow"){ hit.slow=3; this.hit(this.p,hit,1); }
      else if(this.p.arrow.kind==="stun"){ hit.stun=1; this.hit(this.p,hit,8); }
      else { this.hit(this.p,hit,num(this.p.arrow.dmg,5)); }
    }
    this.p.ar = Math.max(0, num(this.p.ar,0)-1);
    this.waitTarget=null;
    this.turnStep();
    this.render();
  }


  useItemMenu(idx){
    const it=this.inv[idx]; if(!it) return;
    if(this.waitId){ if(!it.ided){ it.ided=true; this.msg(`${it.name}を識別した！`);} else this.msg("既に識別済み"); this.waitId=false; this.render(); if($("#invOL").style.display==='flex'){ this.openInv(); } return; }

    // 店の品（売り物）を店内で使った時点で泥棒（装備もアウト）
    if(it.unpaid && this.isInShop(this.p.x,this.p.y)){
      this.becomeThief("店の品を店内で使用した");
    }

    if(it.type==='weapon'){ this.p.wep=it; this.msg(`${it.name}を装備した`); this.flashInv(x=>x===it); }
    else if(it.type==='armor'){ this.p.arm=it; this.msg(`${it.name}を装備した`); this.flashInv(x=>x===it); }
    else if(it.type==='herb'){
      if(it.name==="身代わり草"){ this.msg("身代わりにしたい方向を選んでください"); this.waitTarget={mode:'herbDecoy', idx}; return; }
      it.effect(this,this.p); this.consume(idx);
    }
    else if(it.type==='scroll'){ it.effect(this); this.consume(idx); }
    else if(it.type==='wand'){
      if(num(it.uses,0)<=0 || it.depleted){ this.msg("杖は力を失っている（投げると効果）"); return; }
      this.waitTarget={mode:'wand', item:it};
      this.openShootOL("方向を選んで杖を振る");
      this.msg("杖を振る方向を選んでください");
      return;
    }
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


  // === お金（G）投げ：金額ぶんの固定ダメージ ===
  openGoldMenu(){
    $("#menuTitle").textContent=`『お金』`;
    $("#menuDesc").textContent=`投げると投げた金額ぶんのダメージ（消費）`;
    const box=$("#menuBtns"); box.innerHTML="";
    const range=$("#menuRange"); if(range){ range.style.display='none'; }

    const add=(label,fn)=>{
      const b=document.createElement('div');
      b.className='pill'; b.textContent=label;
      b.onclick=()=>{ $("#menuOL").style.display='none'; fn(); };
      box.appendChild(b);
    };

    add('投げる', ()=>this.throwGoldMenu());
    add('キャンセル', ()=>{});
    $("#menuOL").style.display='flex';
  }

  throwGoldMenu(){
    const max = Math.max(0, num(this.p.gold,0));
    if(max<=0){ this.msg("お金がない"); return; }
    let amt = 0;
    try{
      const s = prompt(`投げる金額（1〜${max}）`, String(Math.min(50,max)));
      if(s==null) return;
      amt = Math.floor(Number(s));
    }catch(e){ amt = 0; }
    if(!isFinite(amt) || amt<=0){ this.msg("キャンセル"); return; }
    amt = Math.min(max, amt);

    this.waitTarget = {mode:'throwGold', amount: amt};
    this.openShootOL(`方向を選んでお金を投げる（${amt}G）`);
    this.msg("投げる方向を選んでください");
  }

  // 防御無視の固定ダメージ（主に投げ金用）
  rawDamage(att,def,dmg){
    const attIsPlayer = (att===this.p);
    const defIsPlayer = (def===this.p);
    const invActive = (defIsPlayer && num(this.p.invincible,0)>0);
    if(invActive && num(dmg,0)>0){
      try{ toast("無敵！","toast-dmg"); }catch(e){}
      this.render();
      return 0;
    }

    dmg = Math.floor(num(dmg,0));
    if(!isFinite(dmg) || dmg<=0){ this.render(); return 0; }

    const vp=$("#viewport"); vp.classList.remove('shake'); void vp.offsetWidth; vp.classList.add('shake');
    fxSlash();
    try{
      const dn = (def && def.name) ? def.name : "敵";
      const dch = (def && def.ch) ? def.ch : "?";
      toast(`${dn}(${dch}) に ${dmg} ダメージ！`,'toast-dmg');
    }catch(e){}

    def.hp = Math.max(0, num(def.hp,1) - dmg);

    if(defIsPlayer){
      if(num(this.p.hp,0)<=0){
        const idx=this.inv.findIndex(x=>x.type==="herb" && x.revive);
        if(idx>=0){
          this.inv.splice(idx,1);
          this.p.maxHp = Math.max(1, num(this.p.maxHp,1));
          this.p.hp = Math.max(1, Math.floor(num(this.p.maxHp,1)*0.7));
          this.msg("復活草が発動！");
          fxSpark();
          this.render();
          return dmg;
        }
        this.gameOver();
      }
    }else{
      if(def.hp<=0) this.kill(def, attIsPlayer ? this.p : att);
    }
    return dmg;
  }

  throwGoldDir(dx,dy){
    if(!this.waitTarget || this.waitTarget.mode!=='throwGold') return;
    const amt = Math.max(0, num(this.waitTarget.amount,0));
    this.closeShootOL();
    this.waitTarget = null;

    const have = Math.max(0, num(this.p.gold,0));
    if(have<=0 || amt<=0){ this.msg("お金がない"); return; }

    const spend = Math.min(have, amt);
    this.p.gold = have - spend;

    // 投げた方向を記憶（次の行動の既定方向）
    this.p.lastDir=[dx,dy];

    let x=this.p.x, y=this.p.y, hit=null, last={x,y};
    for(let i=0;i<10;i++){ x+=dx; y+=dy; if(this.isOut(x,y)||this.isWall(x,y)) break; last={x,y}; const m=this.monAt(x,y); if(m){ hit=m; break; } }

    if(hit){
      this.rawDamage(this.p, hit, spend);
    }else{
      // 外したら落ちる（拾える）
      this.items.push({name:"G",type:"gold",amount:spend,ch:"$",x:last.x,y:last.y});
      this.msg(`${spend}Gを投げ捨てた`);
    }

    this.turnStep(); this.render();
    if($("#invOL").style.display==='flex'){ this.openInv(); }
  }

  throwItemMenu(idx){
    const it=this.inv[idx]; if(!it) return;

    // 方向をオーバーレイUIで選ぶ（矢と同様）
    this.waitTarget = {mode:'throw', idx};
    this.openShootOL("方向を選んで投げる");
    this.msg("投げる方向を選んでください");
    return;
  }

  throwDir(dx,dy){
    if(!this.waitTarget || this.waitTarget.mode!=='throw') return;
    const idx = this.waitTarget.idx;
    const it = this.inv[idx];
    this.closeShootOL();
    this.waitTarget = null;

    if(!it){ this.msg("投げる物がない"); return; }

    // 投げた方向を記憶（次の行動の既定方向）
    this.p.lastDir=[dx,dy];

    let x=this.p.x, y=this.p.y, hit=null, last={x,y};
    for(let i=0;i<10;i++){ x+=dx; y+=dy; if(this.isOut(x,y)||this.isWall(x,y)) break; last={x,y}; const m=this.monAt(x,y); if(m){ hit=m; break; } }
    if(it.type==='herb'){
      if(it.name==="身代わり草" && hit){ const T=rand(10,40); this.makeDecoy(hit,T); this.consume(idx,true); this.turnStep(); this.render(); return; }
      if(hit){ it.effect(this,hit); } else { const dropped={...it}; this.onItemPlacedOnFloor(dropped,last.x,last.y); this.items.push(dropped); }
      this.consume(idx,true);
    }
    else if(it.type==='wand'){
      // 杖は「残り回数0でもOK」：投げたら効果発動（投擲で消費）
      if(typeof it.cast==='function'){ it.cast(this, hit, dx, dy); }
      else{ this.msg("何も起きなかった"); }
      this.inv.splice(idx,1);
    }
    else if(it.type==='weapon'){
      const wAtk = Math.max(0, num(it.atk,0) + num(it.plus,0));
      const base = Math.max(6, Math.floor(wAtk*3 + 4));
      if(hit){ this.hit({atk:0,x:this.p.x,y:this.p.y,name:"投擲"}, hit, base); }
      else { const dropped={...it}; this.onItemPlacedOnFloor(dropped,last.x,last.y); this.items.push(dropped); }
      this.inv.splice(idx,1);
    }
    else if(it.type==='armor'){
      const aDef = Math.max(0, num(it.def,0) + num(it.plus,0));
      const base = Math.max(5, Math.floor(aDef*2 + 3));
      if(hit){ this.hit({atk:0,x:this.p.x,y:this.p.y,name:"投擲"}, hit, base); }
      else { const dropped={...it}; this.onItemPlacedOnFloor(dropped,last.x,last.y); this.items.push(dropped); }
      this.inv.splice(idx,1);
    }
    else if(it.type==='potBomb'){
      const cx=hit?hit.x:last.x, cy=hit?hit.y:last.y;
      this.msg("壺が爆ぜた！");
      this.explode(cx,cy,3,12,true);
      this.consume(idx,true);
      fxSlash();
    }
    else{
      if(hit){ this.hit({atk:0,x:this.p.x,y:this.p.y,name:"投擲"}, hit,2); }
      else { const dropped={...it}; this.onItemPlacedOnFloor(dropped,last.x,last.y); this.items.push(dropped); }
      this.consume(idx,true);
    }
    this.turnStep(); this.render();
    if($("#invOL").style.display==='flex'){ this.openInv(); }
  }

  consume(idx,remove=true){ const it=this.inv[idx]; if(!it) return;
    if(it.type==='wand'){
      it.uses = Math.max(0, num(it.uses,0)-1);
      if(it.uses<=0){
        it.uses = 0;
        it.depleted = true;
        if(it.name && !it.name.includes('（空）')) it.name += '（空）';
        this.msg("杖の力が尽きた（投げると効果）");
      }
    }
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
    if(num(w.uses,0)<=0 || w.depleted){ this.msg("杖は力を失っている（投げると効果）"); return; }
    let x=this.p.x, y=this.p.y, hit=null;
    for(let i=0;i<10;i++){ x+=dx; y+=dy; if(this.isOut(x,y)||this.isWall(x,y)) break; const m=this.monAt(x,y); if(m){ hit=m; break; } }
    w.cast(this, hit, dx, dy);
    const idx=this.inv.indexOf(w);
    if(idx>=0){ this.consume(idx,false); }
    this.turnStep(); this.render();
    if($("#invOL").style.display==='flex'){ this.openInv(); }
  }

  turnStep(){
    if(this.mode==='town'){
      this.turn++;
      if(this.turn%5===0 && num(this.p.hp,0)<num(this.p.maxHp,1)) this.p.hp=num(this.p.hp,0)+1;
      if(this.p.arm && this.p.arm.regen && this.turn%4===0) this.p.hp=Math.min(num(this.p.maxHp,1),num(this.p.hp,0)+1);
      return;
    }
    this.turn++;
    this.checkThiefState();
    if(this.turn%5===0 && num(this.p.hp,0)<num(this.p.maxHp,1)) this.p.hp=num(this.p.hp,0)+1;
    if(this.p.arm && this.p.arm.regen && this.turn%4===0) this.p.hp=Math.min(num(this.p.maxHp,1),num(this.p.hp,0)+1);
    if(this.turn%NATURAL_SPAWN_CHECK===0 && this.mons.length<NATURAL_SPAWN_MIN){
      const p=this.freeIn(null,true); if(p){ const t=choice(MON_SPAWN_POOL.slice(0,5)); const lv=Math.max(1,Math.floor(num(this.floor,1)/1)); this.mons.push(scaleMon(t,p.x,p.y,lv)); this.msg("どこからか気配が…"); }
    }
    // デコイ寿命
    for(const m of this.mons){ if(m.decoy){ m.decoyT=num(m.decoyT,0)-1; if(m.decoyT<=0){ m.decoy=false; this.msgGreen(`${m.name}の身代わり効果が切れた`); } } }
    this.enemyPhase();
    // 無敵（ターン制）：敵フェーズ後に1減らす（使用直後から効く）
    if(num(this.p.invincible,0)>0){
      const before = num(this.p.invincible,0);
      this.p.invincible = Math.max(0, before-1);
      if(before>0 && this.p.invincible===0) this.msg("無敵が切れた");
    }
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

      // 店主は「攻撃されるまで非敵対」
      if(m.ai==='shop' && !m.hostile){ continue; }

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

      if(step){
        const [nx,ny]=step;
        // 1ターン1行動：ここでは「移動 or 攻撃」のどちらかだけにする
        // 既に隣接している場合の攻撃は、上の隣接判定（continue）で処理済み。
        // ここでは基本的に「移動」し、ターゲットのマスへは踏み込まない（踏み込みそうなら攻撃扱い）。
        if(target && nx===target.x && ny===target.y){
          // ターゲットの位置へ踏み込む＝攻撃扱い（同マス移動はしない）
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

    const addGoldLine = ()=>{
      const gAmt = Math.max(0, num(this.p.gold,0));
      if(gAmt<=0) return;
      const d=document.createElement('div'); d.className='item'; d.dataset.gold='1';
      d.innerHTML=`<div>お金 ${gAmt}G</div><div class="dim">投げると金額ぶんダメージ</div>`;
      d.onclick=()=>this.openGoldMenu();
      list.appendChild(d);
    };


    const tbtn = $("#invOL .invSortToggle");
    if(tbtn){ tbtn.textContent = this.invTabbed ? "整頓：ON（解除）" : "整頓：OFF（有効）"; tbtn.onclick=()=>{ this.toggleInvTabbed(); }; }

    if(!this.invTabbed){
      addGoldLine();
      if(!this.inv.length){
        if(!list.children.length) list.innerHTML='<div class="dim">（空）</div>';
        return;
      }
      this.inv.forEach((it,i)=>{
        let nm=it.name; if((it.type==='weapon'||it.type==='armor') && it.plus) nm+=`+${num(it.plus,0)}`;
        if(it.type==='arrow') nm+=` x${num(it.count,0)}`;
        if( (it.type==='weapon' && this.p.wep===it) || (it.type==='armor' && this.p.arm===it) ) nm+=` (E)`;
        if( it.type==='arrow' && this.p.arrow && this.p.arrow.kind===it.kind ) nm+=` (E)`;
        if(it.unpaid) nm+=` [売]`;
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
      addGoldLine();
      const arr = catToItems[cat];
      if(!arr.length){
        if(!list.children.length) list.innerHTML='<div class="dim">（なし）</div>';
        return;
      }
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
        if(g.members.some(x=>x && x.unpaid)) nm+=` [売]`;
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
    let invIdx=0;
    nodes.forEach((nd)=>{
      nd.classList.remove('flash'); void nd.offsetWidth;
      if(nd.dataset && nd.dataset.gold==='1') return;
      const it = this.inv[invIdx++];
      if(matchFn && it && matchFn(it)) nd.classList.add('flash');
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
    if(it.type==='weapon' || it.type==='armor'){ add('装備する', ()=>this.useItemMenu(i)); add('投げる', ()=>this.throwItemMenu(i)); }
    else if(it.type==='arrow'){ add('装填する', ()=>this.useItemMenu(i)); add('投げる', ()=>this.throwItemMenu(i)); }
    else if(it.type==='pot' || it.type==='potBomb'){ add('壺を開く/使う', ()=>this.useItemMenu(i)); add('投げる', ()=>this.throwItemMenu(i)); }
    else { add('使う/振る', ()=>this.useItemMenu(i)); add('投げる', ()=>this.throwItemMenu(i)); }
    add('置く（足元に捨てる）', ()=>{ const t=this.itemAt(this.p.x,this.p.y); if(t){ this.msg("ここには置けない"); return;} const item=this.inv.splice(i,1)[0]; this.onItemPlacedOnFloor(item,this.p.x,this.p.y); this.items.push(item); this.msg(`${item.name}を置いた`); this.render(); });
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
  escapeToTitle(reason){
    this.msg(reason||"脱出！");
    this.saveHoldToTitle();
    showTitle();
  }

  win(msg){ this.msg(msg||"クリア！"); this.gameEnd(true); }
  gameOver(){
    this.msg(`あなたは倒れた… (到達:${num(this.floor,1)}F)`);
    // 返還タグ：死亡時に町へ返還（タグは消える）
    const ret=[];
    const pullIfTagged=(it)=>{
      if(!it) return;
      if(it.returnTag){
        const ser=Game._serializeItem(it);
        if(ser) { ser.returnTag=false; ret.push(ser); }
        // inv/equipから除去
        if(this.p.wep===it) this.p.wep=null;
        if(this.p.arm===it) this.p.arm=null;
        if(this.p.arrow===it) this.p.arrow=null;
        const idx=this.inv.indexOf(it);
        if(idx>=0) this.inv.splice(idx,1);
      }
    };
    pullIfTagged(this.p.wep);
    pullIfTagged(this.p.arm);
    if(ret.length){
      this.townLostFound = (this.townLostFound||[]).concat(ret);
      this.saveTownPersistent();
      this.msgGreen("タグ装備が町へ返還された！");
    }
    this.gameEnd(false);
  }
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
  const showTitle=()=>{ try{ if(g && g.saveGlobalGold) g.saveGlobalGold(); }catch(e){} $("#game").style.display='none'; $("#title").style.display='flex'; updateTitle(); };
  window.showTitle=showTitle;

  function syncPickupBtn(){ $('#btnPickupMode').textContent = `自動拾い：${g && g.autoPickup ? 'ON' : 'OFF'}`; }

  function startNew(){
    // 脱出→タイトル状態の引き継ぎがある場合は警告（町の預かり/返還品は残る）
    try{
      const hasHold = !!localStorage.getItem(LS_TOWN_HOLD);
      if(hasHold){
        const ok = confirm("脱出で持ち帰った所持品/レベルを捨てて『新しく始める』？\n※町の預かり/返還品は残ります");
        if(!ok) return;
        localStorage.removeItem(LS_TOWN_HOLD);
      }
    }catch(e){}
    $("#title").style.display='none';
    $("#game").style.display='block';
    g=new Game();
    syncPickupBtn();
    try{ if(g.loadGlobalGold) g.loadGlobalGold(); }catch(e){}
    g.gen(1);
  }
  function startLocal(){
    const code=localStorage.getItem('save3');
    if(!code){ alert("ローカルセーブがありません"); return; }
    $("#title").style.display='none';
    $("#game").style.display='block';
    g=new Game();
    syncPickupBtn();
    g.loadCode(code);
  }

  function startTown(){
    $("#title").style.display='none';
    $("#game").style.display='block';
    g=new Game();
    syncPickupBtn();
    // 脱出で持ち帰った状態があれば読み込み
    g.loadHoldFromTitle();
    try{ if(g.loadGlobalGold) g.loadGlobalGold(); }catch(e){}
    g.genTown();
  }

  function startMiniGamesFromTitle(){
    // タイトルから直接ミニゲーム一覧を開く（町のカジノ一覧と同等）
    if(!g){
      g = new Game();
      syncPickupBtn();
    }
    // 脱出→タイトル保持があれば反映（所持金など）
    try{ if(g.loadHoldFromTitle) g.loadHoldFromTitle(); }catch(e){}
    // タイトル財布（ミニゲームで増えた所持金）も反映
    try{ if(g.loadGlobalGold) g.loadGlobalGold(); }catch(e){}
    // ミニゲーム一覧を表示（町のカジノと同じ）
    try{
      if(g.openMiniGameHub) g.openMiniGameHub({fromTitle:true});
      else g.openTownNpcMenu({role:'casino', name:'カジノ係'});
    }catch(e){
      console.error(e);
      alert('ミニゲームを開けませんでした。コンソールを確認してください。');
    }
  }


  function startCode(){ const code=prompt("セーブコードを入力"); if(!code) return; $("#title").style.display='none'; $("#game").style.display='block'; g=new Game(); syncPickupBtn(); g.loadCode(code.trim()); }

  bindTap('#btnNew', startNew);
  bindTap('#btnTown', startTown);
  bindTap('#btnMiniGames', startMiniGamesFromTitle);
  bindTap('#btnLocal', startLocal);

  // ショップダイアログ
  bindTap('#btnPay', ()=>{ if(g) g.onShopDialogPay(); });
  bindTap('#btnRefuse', ()=>{ if(g) g.onShopDialogRefuse(); });
  bindTap('#btnCode', startCode);
  bindTap('#btnTitle', ()=>{ if(confirm("本当にタイトルに戻りますか？")){ if(g) g.saveLocal(); showTitle(); }});
  bindTap('#btnPickupMode', ()=>{ if(!g) return; g.autoPickup=!g.autoPickup; localStorage.setItem('autoPickup', g.autoPickup?'ON':'OFF'); syncPickupBtn(); g.render(); });

  // 所持品
  bindTap('[data-act="inv"]', ()=>{ if(g) g.openInv(); });
  bindTap('#btnCloseInv', ()=>{ if(g) g.closeInv(); });
  bindTap('#btnCloseMenu', ()=>{ $("#menuOL").style.display='none'; });
  bindTap('#btnCloseTownOL', ()=>{ const ol=$("#townOL"); if(ol) ol.style.display='none'; });

  // 行動
  bindTap('[data-act="descend"]', ()=>{ if(g) g.descend(); });
  bindTap('[data-act="shoot"]',   ()=>{ if(g) g.askShoot(); });
  // 射撃/投げ/杖：方向選択オーバーレイ
  bindTap('#shootOL [data-dx]', (e)=>{
    if(!g) return;
    const b = e.currentTarget;
    const dx = parseInt(b.getAttribute('data-dx')||'0',10);
    const dy = parseInt(b.getAttribute('data-dy')||'0',10);
    g.selectDirFromOL(dx,dy);
  });
  bindTap('#shootCancel', ()=>{ if(g) g.cancelTargeting(); });

  bindTap('[data-act="save"]',    ()=>{ if(g) g.saveLocal(); });
  bindTap('[data-act="code"]', ()=>{ if(g) prompt("セーブコード", g.getCode()); });

  // ★ WAIT FIX: 待機アクション（タップで1T）
  bindTap('[data-act="wait"]', ()=>{
    if(!g) return;
    g.msg("待機");
    g.turnStep();
    g.render();
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


Game.prototype.tileSpan = function(x,y){
  const key = `${x},${y}`;
  const chWall = '#';
  const visible = !!(this.vis[y] && this.vis[y][x]);
  const data = `data-x="${x}" data-y="${y}"`;
  if(this.isOut(x,y)) return `<span class="cell" ${data}> </span>`;
  if(!visible) return `<span class="cell dimFog" ${data}>#</span>`;

  if(this.map[y][x] === chWall){
    const cls = this.shopWall.has(key) ? 'wall-shop' : (this.mhWall.has(key) ? 'wall-mh' : 'wall');
    return `<span class="cell ${cls}" ${data}>#</span>`;
  }
  const isPlayer = (this.p.x===x && this.p.y===y);
  const mon = this.monAt(x,y);
  const items = this.itemsAt(x,y);
  const stair = (this.map[y][x]==='>');

  if(isPlayer) return `<span class="cell player" ${data}>@</span>`;

  if(mon){
    const cls = (mon.ai==='town') ? 'mon-town' : ((mon.ai==='shop' && !mon.hostile)?'mon-shop':'mon-enemy');
    return `<span class="cell ${cls}" ${data}>${mon.ch}</span>`;
  }

  if(items.length){
    const it = items[0];
    const cls = (it.type==='gold' || it.ch==='$') ? 'map-gold' : 'map-item';
    return `<span class="cell ${cls}" ${data}>${it.ch || '*'}</span>`;
  }

  // Town tiles: render actual ground/building symbols
  if(this.mode==='town'){
    let cls='cell';
    const t=this.map[y][x];
    let ch=t;
    if(t==='>'){ cls+=' stair'; ch='>'; }
    else if(t==='.') cls+=' town-grass';
    else if(t==='=') cls+=' town-road';
    else if(t==='f'){ cls+=' town-flower'; ch='✿'; }
    else if(t==='T'){ cls+=' town-tree'; ch='♣'; }
    else if(t==='~'){ cls+=' town-water'; ch='≈'; }
    else if(['S','B','G','C'].includes(t)) cls+=' town-building';
    return `<span class="${cls}" ${data}>${ch}</span>`;
  }

  if(stair) return `<span class="cell stair" ${data}>></span>`;
  return `<span class="cell" ${data}>${this.nearStairs.has(key)?'·':'.'}</span>`;
};