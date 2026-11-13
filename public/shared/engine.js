import {army,CLASS,other} from './config.js';
export const blocked=(x,y)=>[4,5].includes(y)&&[2,3,6,7].includes(x);
export const at=(s,x,y)=>s.pieces.find(p=>p.x===x&&p.y===y);
export function shuffle(a,rng=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function layout(color,rng=Math.random){return shuffle(army(color),rng).map((p,i)=>({...p,id:crypto.randomUUID(),x:i%10,y:Math.floor(i/10)+(color==='blue'?6:0)}));}
export function createGame(){return {phase:'setup',pieces:[...layout('blue'),...layout('red')],ready:{blue:false,red:false},turn:'blue',winner:null,revision:0,event:null,history:[],repetition:{blue:null,red:null}};}
export function validateLayout(color,positions,template=army(color)){
 if(!Array.isArray(positions)||positions.length!==40)throw Error('Organize todas as 40 peças.');
 const ids=new Set(template.map(p=>p.id)),cells=new Set();
 for(const p of positions){if(!ids.delete(p.id)||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.x>9||p.y<(color==='blue'?6:0)||p.y>(color==='blue'?9:3)||cells.has(`${p.x},${p.y}`))throw Error('Formação inválida.');cells.add(`${p.x},${p.y}`);}
 return positions.map(p=>({...template.find(q=>q.id===p.id),x:p.x,y:p.y}));
}
export function prepare(s,color,positions){if(s.phase!=='setup'||s.ready[color])throw Error('Preparação encerrada.');s.pieces=[...s.pieces.filter(p=>p.color!==color),...validateLayout(color,positions,s.pieces.filter(p=>p.color===color))];s.ready[color]=true;if(s.ready.blue&&s.ready.red)s.phase='playing';s.revision++;return s;}
function repeats(s,p,x,y){const r=s.repetition?.[p.color];const edge=[`${p.x},${p.y}`,`${x},${y}`].sort().join('|');return r?.id===p.id&&r.edge===edge&&r.count>=6;}
export function validMove(s,p,x,y){
 if(!p||p.hidden||['trap','scroll'].includes(p.kind)||!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>9||y<0||y>9||blocked(x,y))return false;
 const dx=x-p.x,dy=y-p.y,d=Math.abs(dx)+Math.abs(dy);if(!d||(dx&&dy)||repeats(s,p,x,y))return false;
 const dest=at(s,x,y);if(dest?.color===p.color)return false;
 if(p.kind!=='genin'&&d!==1)return false;if(dest&&d>1)return false;
 const sx=Math.sign(dx),sy=Math.sign(dy);for(let i=1;i<d;i++)if(blocked(p.x+sx*i,p.y+sy*i)||at(s,p.x+sx*i,p.y+sy*i))return false;
 return true;
}
export function moves(s,color){return s.pieces.filter(p=>p.color===color).flatMap(p=>{const out=[];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])for(let d=1;d<=(p.kind==='genin'?9:1);d++){const x=p.x+dx*d,y=p.y+dy*d;if(validMove(s,p,x,y))out.push({id:p.id,x,y});if(x<0||x>9||y<0||y>9||blocked(x,y)||at(s,x,y))break;}return out;});}
export function combat(a,b){if(b.kind==='scroll')return 'attacker';if(b.kind==='trap')return a.kind==='chunin'?'attacker':'both';if(a.kind==='nukenin'&&b.kind==='hokage')return 'attacker';return a.strength===b.strength?'both':a.strength>b.strength?'attacker':'defender';}
export function move(s,color,id,x,y,now=Date.now()){
 if(s.phase!=='playing'||s.turn!==color)throw Error('Aguarde seu turno.');if(s.event&&s.event.expiresAt>now)throw Error('Aguarde o confronto.');
 const a=s.pieces.find(p=>p.id===id&&p.color===color);if(!validMove(s,a,x,y))throw Error('Movimento inválido.');
 const b=at(s,x,y),from={x:a.x,y:a.y},edge=[`${a.x},${a.y}`,`${x},${y}`].sort().join('|'),prev=s.repetition[color];
 s.repetition[color]={id,edge,count:prev?.id===id&&prev.edge===edge?prev.count+1:1};s.event=null;
 if(b){const result=combat(a,b);s.event={id:s.revision+1,attacker:{...a},defender:{...b},result,expiresAt:now+2600};s.pieces=s.pieces.filter(p=>!((result!=='defender'&&p.id===b.id)||(result!=='attacker'&&p.id===a.id)));if(result==='attacker'){a.x=x;a.y=y;}if(b.kind==='scroll')s.winner=color;}
 else {a.x=x;a.y=y;}
 s.history.push({color,from,to:{x,y},battle:!!b,result:s.event?.result||null});s.history=s.history.slice(-30);s.turn=other(color);s.revision++;
 if(!s.winner&&!moves(s,s.turn).length)s.winner=color;if(s.winner)s.phase='finished';return s;
}
// This is the only projection sent to a participant. No hidden class, art or strength.
export function view(s,color,now=Date.now()){return {...s,pieces:s.pieces.filter(p=>s.phase!=='setup'||p.color===color||s.ready[p.color]).map(p=>p.color===color?{...p}:{id:p.id.replace(/-(hokage|kage|conselheiro|sannin|anbu|especial|jounin|chunin|genin|nukenin|trap|scroll)-/, '-secret-'),color:p.color,x:p.x,y:p.y,hidden:true}),event:s.event?.expiresAt>now?structuredClone(s.event):null,repetition:{[color]:s.repetition[color]}};}
