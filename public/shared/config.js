export const CLASSES = [
  ['hokage','Hokage',10,1,['Naruto'],'Naruto vence pela força. Cuidado com o ataque de Itachi.'],
  ['kage','Kage das Sombras',9,1,['Sasuke'],'Uma casa em qualquer direção ortogonal.'],
  ['conselheiro','Conselheiros',8,2,['Sakura','Shikamaru'],'Uma casa em qualquer direção ortogonal.'],
  ['sannin','Sannins Lendários',7,3,['Jiraiya','Tsunade','Orochimaru'],'Uma casa em qualquer direção ortogonal.'],
  ['anbu','ANBU',6,4,['ANBU'],'Uma casa em qualquer direção ortogonal.'],
  ['especial','Jounin de Elite',5,4,['Kakashi','Guy'],'Uma casa em qualquer direção ortogonal.'],
  ['jounin','Jōnin',4,4,['Jōnin'],'Uma casa em qualquer direção ortogonal.'],
  ['chunin','Chuunin',3,5,['Chuunin'],'Desativa armadilhas sem ser eliminado.'],
  ['genin','Genin',2,8,['Genin'],'Percorre uma linha livre. Só pode atacar a uma casa de distância.'],
  ['nukenin','Nukenin',1,1,['Itachi'],'Vence o Hokage apenas quando inicia o ataque.'],
  ['trap','Armadilha Explosiva',0,6,['Selo explosivo'],'Imóvel. Elimina o atacante e a si mesma, exceto contra Chuunin.'],
  ['scroll','Pergaminho Secreto',0,1,['Pergaminho'],'Imóvel. Sua captura decide a partida.']
].map(([id,label,strength,count,names,help])=>({id,label,strength,count,names,help}));
export const CLASS = Object.fromEntries(CLASSES.map(c=>[c.id,c]));
export const other = color => color==='blue'?'red':'blue';
export function army(color){let index=0;return CLASSES.flatMap(c=>Array.from({length:c.count},(_,i)=>({id:`${color}-${index++}`,color,kind:c.id,name:c.names[i%c.names.length],variant:i+1,strength:c.strength,x:i,y:color==='blue'?9:0})));}
