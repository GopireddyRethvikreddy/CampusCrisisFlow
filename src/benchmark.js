function randomBlockedSet(graph,p){
const s=new Set();graph.edges.forEach(e=>{if(Math.random()<p)s.add(e.id)});return s;
}
function totalPopulation(graph,scale=1){
return Object.values(graph.nodes).filter(n=>n.type==="building").reduce((s,n)=>s+Math.round(n.population*scale),0)
}
function benchmarkTrials(trials,hazardProb,popScale){
const rows=[];const graph=cloneGraphData();
const buildings=Object.keys(graph.nodes).filter(n=>graph.nodes[n].type==="building");
const exits=Object.keys(graph.nodes).filter(n=>graph.nodes[n].type==="exit");
for(let k=0;k<trials;k++){
 const blocked=randomBlockedSet(graph,hazardProb);
 const s=buildings[Math.floor(Math.random()*buildings.length)];
 const t=exits[Math.floor(Math.random()*exits.length)];
 const people=Math.max(1,Math.round(graph.nodes[s].population*popScale));
 let t0=performance.now();const d=dijkstra(graph,s,t,blocked);let td=performance.now()-t0;
 t0=performance.now();const a=aStar(graph,s,t,blocked);let ta=performance.now()-t0;
 t0=performance.now();const c=congestionOptimize(graph,blocked,300,false,"balanced");let tc=performance.now()-t0;
 const dtime=evacuationTime(d.distance,people,pathCapacity(graph,d.path));
 const atime=evacuationTime(a.distance,people,pathCapacity(graph,a.path));
 const bu=maxUtilization(graph,c.loads,blocked).max;
 rows.push({dFound:Number.isFinite(d.distance),aFound:Number.isFinite(a.distance),dtime,atime,crisisAssigned:c.total,crisisUtil:bu,td,ta,tc});
}
function avg(key,filter=x=>true){const a=rows.filter(filter).map(r=>r[key]).filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:Infinity}
return{
trials,rows,
dijkstra:{routeRate:avg("dFound"),avgTime:avg("dtime"),runtimeMs:avg("td")},
astar:{routeRate:avg("aFound"),avgTime:avg("atime"),runtimeMs:avg("ta")},
crisis:{avgAssigned:avg("crisisAssigned"),avgMaxUtil:avg("crisisUtil"),runtimeMs:avg("tc")}
};
}
