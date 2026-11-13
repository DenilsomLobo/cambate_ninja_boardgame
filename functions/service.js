import {createGame,prepare,move,view} from './shared/engine.js';
import {other} from './shared/config.js';
export function participant(room,uid){const color=Object.keys(room.players).find(c=>room.players[c]===uid);if(!color)throw Error('Você não participa desta sala.');return color;}
export function transition(room,uid,action,data,now=Date.now()){
 const color=participant(room,uid),s=room.state;room.presence[uid]=now;
 if(action==='ready'){if(!room.players.red)throw Error('Aguarde o segundo jogador.');prepare(s,color,data.positions);}
 else if(action==='move'){if(data.revision!==s.revision)throw Error('Tabuleiro desatualizado. Aguarde a sincronização.');move(s,color,data.id,data.x,data.y,now);}
 else if(action==='resign'){if(s.phase!=='playing')throw Error('A partida não está em andamento.');s.winner=other(color);s.phase='finished';s.revision++;}
 else if(action==='rematch'){if(s.phase!=='finished')throw Error('Termine a partida antes de pedir revanche.');room.rematch[color]=true;if(room.rematch.blue&&room.rematch.red){room.state=createGame();room.rematch={blue:false,red:false};room.round++;}}
 else if(action!=='heartbeat')throw Error('Operação desconhecida.');return room;
}
export function projections(room,now=Date.now()){return Object.fromEntries(Object.entries(room.players).filter(([,uid])=>uid).map(([color,uid])=>{const s=view(room.state,color,now),event=s.event;delete s.event;return [uid,{...s,battleId:event?`${room.round}-${event.id}`:null,connected:!!room.players[other(color)]&&now-(room.presence[room.players[other(color)]]||0)<45000,opponentJoined:!!room.players[other(color)],rematch:room.rematch}];}));}
