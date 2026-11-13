import {CLASSES,CLASS,other} from './shared/config.js';
import {ARTE_PECAS,ARTE_PAINEL} from './arte-pecas.js';
import {createGame,prepare,validMove,move,view,at,shuffle} from './shared/engine.js';
import {chooseMove} from './shared/ai.js';
import {initScene,initMenuFx,snapshot,animateMoves,banner} from './fx.js';
const $=s=>document.querySelector(s);
let state,local,color='blue',mode='ai',selected=null,busy=false,online=null,battleTimer=null,aiTimer=null,seenEvent=null,aiMemory={},initial=[],dragged=null,lastPhase=null,lastTurn=null;
const glyphs={hokage:'火',kage:'影',conselheiro:'策',sannin:'三',anbu:'暗',especial:'雷',jounin:'上',chunin:'中',genin:'下',nukenin:'暁',trap:'爆',scroll:'巻'};
const span=(cls,text='')=>{const s=document.createElement('span');if(cls)s.className=cls;s.textContent=text;return s;};
// Nome curto da hierarquia exibido na faixa da peça.
const rankName={hokage:'Hokage',kage:'Kage',conselheiro:'Conselheiro',sannin:'Sannin',anbu:'ANBU',especial:'Jounin de Elite',jounin:'Jōnin',chunin:'Chuunin',genin:'Genin',nukenin:'Nukenin',trap:'Armadilha',scroll:'Pergaminho'};
const rankMark={trap:'✹',scroll:'★'};
// Chave da arte de cada peça: <hierarquia>_<número da peça> (ver arte-pecas.js).
const artKey=p=>`${p.kind}_${p.variant||1}`;
const tier=p=>['trap','scroll'].includes(p.kind)?'special':p.kind==='nukenin'?'rogue':p.strength>=9?'legend':p.strength>=6?'elite':'regular';
function message(text){$('#board-message').textContent=text;}
function showGame() {
 $('#menu-screen').hidden = true;
 $('#game-screen').hidden = false;
 $('#menu-button').hidden = false;
 $('#board-only').hidden = false;
 $('#resume').hidden = false;
 document.body.classList.replace('in-menu', 'in-game');
 window.scrollTo({top: 0});
}
function showMenu() {
 clearTimeout(aiTimer);
 $('#menu-screen').hidden = false;
 $('#game-screen').hidden = true;
 $('#menu-button').hidden = true;
 $('#board-only').hidden = true;
 setBoardOnly(false);
 $('#resume').hidden = !state;
 document.body.classList.replace('in-game', 'in-menu');
 window.scrollTo({top: 0});
}
// Peça laqueada: frente com emblema, força e nome; verso com o brasão da vila.
// Arte PNG opcional: cada arquivo é testado uma única vez. Sem arquivo, a peça usa o kanji.
const artStatus=new Map();let artRefresh=null;
function art(src){if(!src)return null;if(!artStatus.has(src)){artStatus.set(src,'loading');const img=document.createElement('img');
 img.onload=()=>{artStatus.set(src,'ok');clearTimeout(artRefresh);artRefresh=setTimeout(()=>{if(state&&!$('#game-screen').hidden)render();},60);};
 img.onerror=()=>artStatus.set(src,'missing');img.src=src;}return artStatus.get(src)==='ok'?src:null;}
function preloadArt(){for(const src of Object.values(ARTE_PECAS))art(src);}
function pieceNode(p,force=false){const el=document.createElement('div');const hidden=p.hidden&&!force;el.className=`piece ${p.color}${hidden?' back':` kind-${p.kind}`}`;if(p.id)el.dataset.id=p.id;
 const src=art(ARTE_PECAS[hidden?`verso_${p.color==='blue'?'azul':'vermelho'}`:artKey(p)]);if(src){const img=document.createElement('img');img.className='art';img.src=src;img.alt='';img.draggable=false;el.append(img);el.classList.add('has-art');}
 if(hidden)return el;
 el.dataset.tier=tier(p);const label=rankName[p.kind]||CLASS[p.kind]?.label||'';const name=span('name',label);name.style.setProperty('--chars',Math.max(6,label.length));
 el.append(span('rank',p.strength||rankMark[p.kind]||''),span('glyph',glyphs[p.kind]||'忍'),name);return el;}
function guide(kind){const c=CLASS[kind];if(!c)return;$('#guide-title').textContent=`${c.label} ${c.strength?'· '+c.strength:''}`;$('#guide-text').textContent=c.help;}
function coords(){const files=Array.from({length:10},(_,c)=>String.fromCharCode(65+(color==='blue'?c:9-c))),ranks=Array.from({length:10},(_,r)=>String(10-(color==='blue'?r:9-r)));
 for(const id of ['#files-top','#files-bottom'])$(id).replaceChildren(...files.map(t=>span('',t)));for(const id of ['#ranks-left','#ranks-right'])$(id).replaceChildren(...ranks.map(t=>span('',t)));}
function announce(){const turnKey=`${state.phase}:${state.turn}`;if(lastPhase&&lastPhase!==state.phase){if(state.phase==='playing')banner('Que comece o combate!','neutral',1900);if(state.phase==='finished')banner(state.winner===color?'Vitória!':'Derrota',state.winner===color?'win':'lose',2800);}
 else if(mode==='online'&&lastTurn&&lastTurn!==turnKey&&state.phase==='playing'&&state.turn===color)banner('Seu turno','mine',1200);lastPhase=state.phase;lastTurn=turnKey;}
function render(){if(!state)return;const board=$('#board');const before=snapshot(board);board.classList.toggle('red-perspective',color==='red');board.replaceChildren();const chosen=state.pieces.find(p=>p.id===selected);const setup=state.phase==='setup'&&!state.ready[color];const myTurn=state.phase==='playing'&&state.turn===color;const last=state.phase==='playing'||state.phase==='finished'?state.history.at(-1):null;
 board.classList.toggle('interactive',setup||myTurn);
 for(let row=0;row<10;row++)for(let col=0;col<10;col++){const x=color==='blue'?col:9-col,y=color==='blue'?row:9-row,p=at(state,x,y),cell=document.createElement('button');cell.type='button';cell.className='cell';cell.setAttribute('role','gridcell');const block=[4,5].includes(y)&&[2,3,6,7].includes(x);if(block)cell.classList.add('blocked');
 cell.setAttribute('aria-label',`${String.fromCharCode(65+x)}${10-y}${block?' · obstacle':p?` · ${p.hidden?'peça inimiga':CLASS[p.kind]?.label+' '+(p.strength||'especial')}`:' · vazia'}`);
 if(last){if(last.from.x===x&&last.from.y===y)cell.classList.add('last-from');if(last.to.x===x&&last.to.y===y)cell.classList.add('last-to');}
 if(p){cell.append(pieceNode(p));if(p.color===color&&!p.hidden){cell.classList.add('own');cell.title=`${CLASS[p.kind].label}${p.strength?` · força ${p.strength}`:''} · ${CLASS[p.kind].help}`;}if(p.id===selected)cell.classList.add('selected');if(setup&&p.color===color){cell.draggable=true;cell.addEventListener('dragstart',e=>{dragged=p.id;e.dataTransfer.setData('text/plain',p.id);e.dataTransfer.effectAllowed='move';});}}
 if(chosen&&myTurn&&validMove(state,chosen,x,y)){cell.classList.add('valid');if(p)cell.classList.add('attack');}
 cell.addEventListener('click',()=>clickCell(x,y));cell.addEventListener('dragover',e=>{if(setup&&p?.color===color)e.preventDefault();});cell.addEventListener('drop',e=>{e.preventDefault();if(setup&&dragged){selected=dragged;clickCell(x,y);dragged=null;}});board.append(cell);}
 animateMoves(board,before);coords();
 $('#blue-count').textContent=state.pieces.filter(p=>p.color===color).length;$('#red-count').textContent=state.phase==='setup'?40:state.pieces.filter(p=>p.color!==color).length;
 $('.plate.own').dataset.color=color;$('.plate.rival').dataset.color=other(color);
 $('#phase').textContent=state.phase==='setup'?(state.ready[color]?'Aguardando o adversário':'Organize seu exército'):state.phase==='finished'?(state.winner===color?'Missão cumprida. Você venceu!':'Sua vila foi derrotada.'):'A batalha pelo pergaminho';
 $('#turn').textContent=state.phase==='setup'?'PREPARAÇÃO':state.phase==='finished'?'FIM DA MISSÃO':state.turn===color?'SEU TURNO':'TURNO DO RIVAL';
 $('#turn').dataset.tone=state.phase==='setup'?'setup':state.phase==='finished'?(state.winner===color?'win':'lose'):myTurn?'mine':'rival';
 $('#ready').hidden=state.phase!=='setup';$('#ready').disabled=state.ready[color]||busy;$('#shuffle').hidden=!setup;$('#reset').hidden=!setup;$('#resign').hidden=state.phase!=='playing';$('#rematch').hidden=state.phase!=='finished';
 $('#opponent').textContent=mode==='ai'?`IA · ${$('#difficulty').selectedOptions[0].textContent.split(' · ')[0]}`:`SALA ${online?.code||''}`;
 $('#you').textContent=mode==='ai'?'Comandante':`Você · ${color==='blue'?'Azul':'Vermelho'}`;
 const roster=$('#roster');roster.replaceChildren();for(const c of CLASSES){const alive=state.pieces.filter(p=>p.color===color&&p.kind===c.id).length;const card=document.createElement('button');card.type='button';card.className='class-card';card.title=c.help;if(!alive)card.classList.add('lost');
  const mini=pieceNode({color,kind:c.id,strength:c.strength,name:c.label,variant:ARTE_PAINEL?.[c.id]||1});mini.classList.add('mini');const info=span('info');const title=document.createElement('h3');title.textContent=c.label;const pips=span('pips');for(let i=0;i<c.count;i++){const dot=document.createElement('i');if(i<alive)dot.className='on';pips.append(dot);}
  const remaining=document.createElement('small');remaining.textContent=`${alive}/${c.count} na sua vila`;info.append(title,pips,remaining);card.append(mini,info);card.addEventListener('click',()=>guide(c.id));roster.append(card);}
 $('#history').replaceChildren();for(const h of [...state.history].reverse()){const li=document.createElement('li');li.className=h.color===color?'mine':'rival';const square=p=>`${String.fromCharCode(65+p.x)}${10-p.y}`;li.textContent=`${h.color===color?'Sua vila':'Rival'}: ${square(h.from)} → ${square(h.to)}${h.battle?' · confronto · '+({attacker:'atacante venceu',defender:'defensor venceu',both:'ambas eliminadas'})[h.result]:''}`;$('#history').append(li);}
 if(state.phase==='finished')message(state.winner===color?'O pergaminho está seguro. Vitória!':'Fim da partida. Prepare uma nova estratégia.');
 announce();showBattle(state.event);
}
function showBattle(event){const box=$('#battle');if(event&&event.expiresAt>Date.now()&&box.dataset.event===String(event.id)&&!box.hidden)return;clearTimeout(battleTimer);if(!event||event.expiresAt<=Date.now()){box.hidden=true;delete box.dataset.event;return;}box.dataset.event=event.id;box.hidden=false;box.replaceChildren();const title=document.createElement('h2');title.textContent='Confronto!';const duel=document.createElement('div');duel.className='duel';const lost=event.result==='both'?[0,1]:event.result==='attacker'?[1]:[0];
 for(const [i,p]of [event.attacker,event.defender].entries()){if(i)duel.append(span('vs','VS'));const figure=document.createElement('div');figure.className=`duelist ${i?'defender':'attacker'}${lost.includes(i)?' lost':' won'}`;figure.append(pieceNode(p,true),span('role',`${i?'Defensor':'Atacante'} · ${p.color===color?'sua vila':'rival'}`));duel.append(figure);}
 const result=document.createElement('p');result.textContent=event.result==='both'?'As duas peças foram eliminadas.':`${CLASS[(event.result==='attacker'?event.attacker:event.defender).kind]?.label} venceu o confronto.`;box.append(title,duel,result);battleTimer=setTimeout(()=>{box.hidden=true;delete box.dataset.event;if(state?.event?.id===event.id)state.event=null;},Math.max(0,event.expiresAt-Date.now()));}
async function clickCell(x,y){if(busy||state.event?.expiresAt>Date.now())return;const p=at(state,x,y);if(state.phase==='setup'){if(state.ready[color])return;if(!p||p.color!==color)return;if(selected&&selected!==p.id){const first=state.pieces.find(q=>q.id===selected);[first.x,p.x]=[p.x,first.x];[first.y,p.y]=[p.y,first.y];selected=null;message('Formação atualizada.');}else selected=p.id;guide(p.kind);render();return;}
 if(state.phase!=='playing')return;if(p?.color===color){selected=p.id;guide(p.kind);render();return;}if(!selected||state.turn!==color)return;const piece=state.pieces.find(q=>q.id===selected);if(!validMove(state,piece,x,y)){message('Escolha uma casa iluminada.');return;}
 busy=true;try{if(mode==='ai'){move(local,color,selected,x,y);remember(local.event);state=view(local,color);selected=null;render();scheduleAI();}else{await online.action('move',{id:selected,x,y,revision:state.revision});selected=null;}}catch(e){message(e.message);}finally{busy=false;}}
function remember(event){if(event&&event.id!==seenEvent){for(const p of [event.attacker,event.defender])if(p.color==='blue')aiMemory[p.id]={...p};seenEvent=event.id;}}
function scheduleAI(){clearTimeout(aiTimer);if(mode!=='ai'||local.phase!=='playing'||local.turn!=='red')return;aiTimer=setTimeout(()=>{const aiView=view(local,'red');const m=chooseMove(aiView,'red',$('#difficulty').value,aiMemory);if(m){move(local,'red',m.id,m.x,m.y);remember(local.event);}state=view(local,color);message('Seu turno. Selecione uma peça.');render();},Math.max(650,(local.event?.expiresAt||0)-Date.now()+150));}
function startAI(){clearTimeout(aiTimer);online?.close();online=null;mode='ai';color='blue';lastPhase=null;lastTurn=null;local=createGame();state=view(local,color);initial=structuredClone(state.pieces.filter(p=>p.color===color));selected=null;aiMemory={};seenEvent=null;$('#connection').textContent='Modo local · adversário IA';$('#guide-title').textContent='Escolha sua formação';$('#guide-text').textContent='Clique em duas peças ou arraste para trocar suas posições. Quando terminar, confirme em Pronto para combater.';message('Troque duas peças para montar sua formação.');showGame();render();}
$('#new-ai').onclick=startAI;
$('#shuffle').onclick=()=>{if(state.phase!=='setup'||state.ready[color])return;const own=state.pieces.filter(p=>p.color===color),positions=shuffle(own.map(p=>({x:p.x,y:p.y})));own.forEach((p,i)=>Object.assign(p,positions[i]));selected=null;render();};
$('#reset').onclick=()=>{if(state.phase!=='setup'||state.ready[color])return;state.pieces=[...state.pieces.filter(p=>p.color!==color),...structuredClone(initial)];selected=null;render();};
$('#ready').onclick=async()=>{busy=true;try{const positions=state.pieces.filter(p=>p.color===color).map(({id,x,y})=>({id,x,y}));if(mode==='ai'){prepare(local,color,positions);prepare(local,'red',local.pieces.filter(p=>p.color==='red'));state=view(local,color);message('Sua missão começou. Azul joga primeiro.');}else await online.action('ready',{positions});selected=null;}catch(e){message(e.message);}finally{busy=false;render();}};
$('#resign').onclick=()=>{const dialog=document.createElement('dialog');dialog.innerHTML='<h2>Encerrar sua missão?</h2><p>Desistir concede a vitória ao adversário.</p><button id="cancel-resign">Continuar jogando</button> <button class="primary" id="confirm-resign">Desistir</button>';document.body.append(dialog);dialog.showModal();dialog.querySelector('#cancel-resign').onclick=()=>{dialog.close();dialog.remove();};dialog.querySelector('#confirm-resign').onclick=async()=>{dialog.close();dialog.remove();try{if(mode==='ai'){clearTimeout(aiTimer);local.winner='red';local.phase='finished';state=view(local,color);render();}else await online.action('resign');}catch(e){message(e.message);}};};
$('#rematch').onclick=async()=>{if(mode==='ai')startAI();else try{await online.action('rematch');message('Revanche solicitada. Aguardando o outro jogador.');}catch(e){message(e.message);}};
$('#rules').onclick=()=>$('#rules-dialog').showModal();$('#settings').onclick=()=>$('#settings-dialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#reduce-motion').onchange=e=>document.body.classList.toggle('reduced',e.target.checked);
$('#menu-button').onclick=showMenu;
$('#resume').onclick=()=>{showGame();render();scheduleAI();};
$('#fullscreen').onclick=async()=>{
 try {
  if(document.fullscreenElement) await document.exitFullscreen();
  else if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  else throw Error('Seu navegador não oferece tela cheia.');
 } catch(error) { if($('#game-screen').hidden) $('#room-info').textContent=error.message; else message(error.message); }
};
document.addEventListener('fullscreenchange',()=>{$('#fullscreen .label').textContent=document.fullscreenElement?'Sair da tela cheia':'Tela cheia';if(!document.fullscreenElement&&boardFull){boardFull=false;setBoardOnly(false);}});
// Apenas Tabuleiro: esconde a barra e os painéis e amplia o tabuleiro; entra em tela cheia quando o navegador permite.
let boardFull=false;
async function setBoardOnly(on){
 const was=document.body.classList.contains('board-only');if(was===on)return;
 document.body.classList.toggle('board-only',on);$('#board-exit').hidden=!on;$('#board-only').setAttribute('aria-pressed',String(on));window.scrollTo({top:0});
 if(on){if(!document.fullscreenElement&&document.documentElement.requestFullscreen){try{await document.documentElement.requestFullscreen();boardFull=true;}catch{}}}
 else if(boardFull){boardFull=false;if(document.fullscreenElement)try{await document.exitFullscreen();}catch{}}
}
$('#board-only').onclick=()=>setBoardOnly(true);
$('#board-exit').onclick=()=>setBoardOnly(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('board-only')&&!document.querySelector('dialog[open]'))setBoardOnly(false);});
$('#online').onclick=()=>{$('#lobby').hidden=!$('#lobby').hidden;$('#online').setAttribute('aria-expanded',String(!$('#lobby').hidden));};
async function connect(action, code) {
 const buttons = [$('#create'), $('#join')];
 buttons.forEach(button => button.disabled = true);
 $('#room-info').textContent = 'Conectando à sala…';
 try {
  const {connectOnline} = await import('./multiplayer.js');
  const client = await connectOnline();
  const result = await client.call(action, {code, public: $('#public-room').checked});
  clearTimeout(aiTimer);
  online?.close();
  mode = 'online';
  online = client;
  color = result.color;
  client.code = result.code;
  state = null;
  lastPhase = null;
  lastTurn = null;
  localStorage.setItem('ninja-room', result.code);
  $('#room-code').value = result.code;
  $('#room-info').textContent = `Sala ${result.code} · compartilhe este código.`;
  let entered = false;
  client.listen(result.code, color, next => {
   if (online !== client) return;
   const own = next.pieces.filter(piece => piece.color === color);
   const sameFormation = state?.phase === 'setup' && next.phase === 'setup'
    && !state.ready[color] && !next.ready[color]
    && initial.length === own.length && initial.every(piece => own.some(candidate => candidate.id === piece.id));
   if (sameFormation) {
    const positions = new Map(state.pieces.filter(piece => piece.color === color).map(piece => [piece.id, {x: piece.x, y: piece.y}]));
    next.pieces = next.pieces.map(piece => positions.has(piece.id) ? {...piece, ...positions.get(piece.id)} : piece);
   } else if (next.phase === 'setup') {
    initial = structuredClone(own);
   }
   state = next;
   if (!sameFormation) selected = null;
   if (!entered) {
    showGame();
    entered = true;
   }
   render();
   if (next.phase === 'finished') return;
   const text = !next.opponentJoined ? 'Compartilhe o código da sala. Aguardando o segundo jogador.'
    : next.connected === false ? 'Adversário desconectado. A partida será preservada.'
    : next.phase === 'setup' ? 'Organize sua vila e confirme em Pronto.'
    : next.turn === color ? 'Seu turno.' : 'Aguarde o rival.';
   message(text);
  }, status => { if (online === client) $('#connection').textContent = status; });
 } catch (error) {
  $('#room-info').textContent = error.message;
 } finally {
  buttons.forEach(button => button.disabled = false);
 }
}
$('#create').onclick=()=>connect('create');$('#join').onclick=()=>connect('join',$('#room-code').value.trim().toUpperCase());$('#refresh').onclick=async()=>{try{const {connectOnline}=await import('./multiplayer.js');const client=await connectOnline();const rooms=await client.call('list');$('#rooms').replaceChildren();for(const room of rooms){const b=document.createElement('button');b.textContent=`${room.code} · entrar`;b.onclick=()=>connect('join',room.code);$('#rooms').append(b);}if(!rooms.length)$('#rooms').textContent='Nenhuma sala pública disponível.';}catch(e){$('#room-info').textContent=e.message;}};
initScene();initMenuFx();preloadArt();
const saved=localStorage.getItem('ninja-room');if(saved){$('#room-code').value=saved;$('#room-info').textContent=`Última sala: ${saved}. Use Entrar para reconectar.`;}
