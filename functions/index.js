import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {randomBytes} from 'node:crypto';
import {createGame} from './shared/engine.js';
import {participant,transition,projections} from './service.js';
initializeApp();const db=getFirestore();
function writeViews(tx,ref,room,now){for(const [uid,v]of Object.entries(projections(room,now)))tx.set(ref.collection('views').doc(uid),v);const event=room.state.event;if(event&&event.expiresAt>now)tx.set(ref.collection('battles').doc(`${room.round}-${event.id}`),{event,expiresAt:Timestamp.fromMillis(event.expiresAt)});}
export const game=onCall({region:'southamerica-east1',maxInstances:10},async request=>{
 if(!request.auth)throw new HttpsError('unauthenticated','Autentique sua sessão.');const uid=request.auth.uid,data=request.data||{},action=data.action,now=Date.now();
 try{
 if(action==='list'){const found=await db.collection('lobbies').where('open','==',true).limit(30).get();return found.docs.map(d=>d.data()).filter(r=>now-r.updatedAt<10*60*1000).map(r=>({code:r.code}));}
 if(action==='create'){const code=randomBytes(4).toString('hex').slice(0,6).toUpperCase(),ref=db.collection('rooms').doc(code);await db.runTransaction(async tx=>{const doc=await tx.get(ref);if(doc.exists)throw Error('Código ocupado. Tente novamente.');const room={players:{blue:uid,red:null},presence:{[uid]:now},state:createGame(),round:1,rematch:{blue:false,red:false},public:data.public===true};tx.create(ref,{players:room.players,createdAt:now});tx.create(ref.collection('private').doc('state'),room);writeViews(tx,ref,room,now);if(room.public)tx.set(db.collection('lobbies').doc(code),{code,open:true,updatedAt:now});});return {code,color:'blue'};}
 const code=typeof data.code==='string'?data.code.toUpperCase():'';if(!/^[A-F0-9]{6}$/.test(code))throw Error('Código de sala inválido.');const ref=db.collection('rooms').doc(code),secret=ref.collection('private').doc('state');
 return await db.runTransaction(async tx=>{const snap=await tx.get(secret);if(!snap.exists)throw Error('Sala não encontrada.');let room=snap.data(),color;
 if(action==='join'){color=Object.keys(room.players).find(c=>room.players[c]===uid);if(!color){if(room.players.red)throw Error('Sala cheia.');if(room.state.phase!=='setup')throw Error('Partida já iniciada.');room.players.red=uid;color='red';}room.presence[uid]=now;tx.set(ref,{players:room.players},{merge:true});if(room.public)tx.set(db.collection('lobbies').doc(code),{code,open:false,updatedAt:now});}
 else {color=participant(room,uid);room=transition(room,uid,action,data,now);}
 tx.set(secret,room);writeViews(tx,ref,room,now);return {code,color,connected:!!room.players[color==='blue'?'red':'blue']&&now-(room.presence[room.players[color==='blue'?'red':'blue']]||0)<45000};});
 }catch(e){if(e instanceof HttpsError)throw e;throw new HttpsError('failed-precondition',e.message||'Não foi possível executar a jogada.');}
});
