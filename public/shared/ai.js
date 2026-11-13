import {moves,at,combat} from './engine.js';
// Input is exclusively the same restricted view a human receives.
export function chooseMove(state,color,difficulty='medium',memory={},rng=Math.random){
 const options=moves(state,color);let best=null,score=-Infinity;
 for(const m of options){const p=state.pieces.find(p=>p.id===m.id),target=at(state,m.x,m.y);let n=rng()*(difficulty==='easy'?20:2);
 if(difficulty!=='easy'){
 n+=(color==='red'?m.y-p.y:p.y-m.y)*.6;if(target){const known=memory[target.id];n+=known?(combat(p,known)==='attacker'?12:combat(p,known)==='both'?1:-12):3-p.strength*.22;}
 if(p.kind==='genin')n+=.4;if(p.kind==='chunin'&&!target)n-=.25;
 if(difficulty==='hard'){const scroll=state.pieces.find(q=>q.color===color&&q.kind==='scroll');if(scroll)n-=Math.max(0,3-(Math.abs(m.x-scroll.x)+Math.abs(m.y-scroll.y)))*.15;for(const enemy of state.pieces.filter(q=>q.color!==color)){const known=memory[enemy.id];if(known&&Math.abs(m.x-enemy.x)+Math.abs(m.y-enemy.y)===1&&known.strength>p.strength)n-=3;}}
 }if(n>score){score=n;best=m;}}
 return best;
}
