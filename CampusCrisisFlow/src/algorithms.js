class MinPriorityQueue{
constructor(){this.a=[]}
push(item,p){this.a.push({item,p});let i=this.a.length-1;while(i){let q=Math.floor((i-1)/2);if(this.a[q].p<=this.a[i].p)break;[this.a[q],this.a[i]]=[this.a[i],this.a[q]];i=q}}
pop(){if(!this.a.length)return null;const top=this.a[0],last=this.a.pop();if(this.a.length){this.a[0]=last;let i=0;while(true){let s=i,l=i*2+1,r=l+1;if(l<this.a.length&&this.a[l].p<this.a[s].p)s=l;if(r<this.a.length&&this.a[r].p<this.a[s].p)s=r;if(s===i)break;[this.a[i],this.a[s]]=[this.a[s],this.a[i]];i=s}}return top}
get size(){return this.a.length}
}

function reconstruct(prev,s,t){const p=[];let x=t;while(x!==undefined){p.push(x);if(x===s)break;x=prev[x]}return p[p.length-1]===s?p.reverse():null}

function pathEdges(graph,path){const out=[];if(!path)return out;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];const e=graph.edges.find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));if(e)out.push(e)}return out}

function dijkstra(graph,s,t,blocked=new Set(),penaltyFn=null,accessibility=false){
const adj=buildAdjacency(graph,blocked,accessibility),dist={},prev={},seen=new Set(),q=new MinPriorityQueue();
Object.keys(graph.nodes).forEach(n=>dist[n]=Infinity);dist[s]=0;q.push(s,0);let explored=0;
while(q.size){const n=q.pop().item;if(seen.has(n))continue;seen.add(n);explored++;if(n===t)break;
for(const e of adj[n]){const penalty=penaltyFn?penaltyFn(e):0;const nd=dist[n]+e.w+penalty;if(nd<dist[e.to]){dist[e.to]=nd;prev[e.to]=n;q.push(e.to,nd)}}}
const path=reconstruct(prev,s,t);return{path,distance:path?dist[t]:Infinity,explored}
}

function heuristic(graph,a,b){const x=graph.nodes[a],y=graph.nodes[b];return Math.hypot(x.x-y.x,x.y-y.y)}

function aStar(graph,s,t,blocked=new Set(),penaltyFn=null,accessibility=false){
const adj=buildAdjacency(graph,blocked,accessibility),g={},f={},prev={},closed=new Set(),q=new MinPriorityQueue();
Object.keys(graph.nodes).forEach(n=>{g[n]=Infinity;f[n]=Infinity});g[s]=0;f[s]=heuristic(graph,s,t);q.push(s,f[s]);let explored=0;
while(q.size){const n=q.pop().item;if(closed.has(n))continue;closed.add(n);explored++;if(n===t)break;
for(const e of adj[n]){const penalty=penaltyFn?penaltyFn(e):0;const ng=g[n]+e.w+penalty;if(ng<g[e.to]){g[e.to]=ng;f[e.to]=ng+heuristic(graph,e.to,t);prev[e.to]=n;q.push(e.to,f[e.to])}}}
const path=reconstruct(prev,s,t);return{path,distance:path?g[t]:Infinity,explored}
}

function pathCapacity(graph,path){const es=pathEdges(graph,path);return es.length?Math.min(...es.map(e=>e.capacity)):0}
function pathAccessibility(graph,path){return pathEdges(graph,path).every(e=>e.accessible)}
function maxUtilization(graph,loads,blocked){let max=0,id=null;graph.edges.forEach(e=>{if(blocked.has(e.id))return;const u=(loads[e.id]||0)/e.capacity;if(u>max){max=u;id=e.id}});return{max,id}}
function evacuationTime(distance,people,capacity){if(!Number.isFinite(distance))return Infinity;return distance/140+(people/Math.max(1,capacity))*60}

/* Edmonds-Karp on a directed capacity network.
   Corridor arcs are represented in both directions with the same directional capacity.
   Exit allocation is derived from net flow on exit -> SINK, fixing the accounting issue
   from the earlier prototype. */
function maxFlow(graph,blocked){
const N=Object.keys(graph.nodes),SRC="SOURCE",SNK="SINK",adj={};[...N,SRC,SNK].forEach(n=>adj[n]=new Set());
const cap={};[...N,SRC,SNK].forEach(n=>cap[n]={});
function add(u,v,c){if(cap[u][v]===undefined)cap[u][v]=0;cap[u][v]+=c;adj[u].add(v);adj[v].add(u);if(cap[v][u]===undefined)cap[v][u]=0}
graph.edges.forEach(e=>{if(blocked.has(e.id))return;add(e.a,e.b,e.capacity);add(e.b,e.a,e.capacity)});
N.forEach(n=>{const x=graph.nodes[n];if(x.type==="building")add(SRC,n,x.population);if(x.type==="exit")add(n,SNK,x.exitCapacity)});
const res={};Object.keys(cap).forEach(u=>{res[u]={};Object.keys(cap[u]).forEach(v=>res[u][v]=cap[u][v])});
let flow=0,aug=0;
while(true){
const parent={[SRC]:null},q=[SRC];
for(let i=0;i<q.length;i++){const u=q[i];for(const v of adj[u]){if(parent[v]===undefined&&(res[u][v]||0)>0){parent[v]=u;q.push(v);if(v===SNK)break}}if(parent[SNK]!==undefined)break}
if(parent[SNK]===undefined)break;
let delta=Infinity;for(let v=SNK;v!==SRC;v=parent[v])delta=Math.min(delta,res[parent[v]][v]);
for(let v=SNK;v!==SRC;v=parent[v]){const u=parent[v];res[u][v]-=delta;res[v][u]=(res[v][u]||0)+delta}
flow+=delta;aug++;
}
const exits=["G","H","I","J"],exitStats={};
for(const e of exits){const original=graph.nodes[e].exitCapacity;const remaining=res[e][SNK]||0;const used=Math.max(0,original-remaining);exitStats[e]={capacity:original,allocated:used,utilization:used/original}}
return{maxFlow:flow,augmentations:aug,exitStats};
}

/* Greedy congestion-aware redistribution.
   Buildings are assigned in descending population order. Each iteration selects
   the exit with the lowest effective path cost after congestion penalties,
   while respecting remaining exit and path bottleneck capacity. */
function congestionOptimize(graph,blocked,alpha=300,accessibility=false,mode="balanced"){
const buildings=Object.keys(graph.nodes).filter(n=>graph.nodes[n].type==="building");
const exits=Object.keys(graph.nodes).filter(n=>graph.nodes[n].type==="exit");
const remaining={};exits.forEach(e=>remaining[e]=graph.nodes[e].exitCapacity);
const loads={};graph.edges.forEach(e=>loads[e.id]=0);
const allocations=[];
const order=[...buildings].sort((a,b)=>graph.nodes[b].population-graph.nodes[a].population);
const effectivePenalty=e=>{const u=Math.min(.999,(loads[e.id]||0)/e.capacity);return alpha*u*u};

for(const b of order){
 let remainingPeople=graph.nodes[b].population;
 while(remainingPeople>0){
  const cand=[];
  for(const ex of exits){
   if(remaining[ex]<=0)continue;
   const r=dijkstra(graph,b,ex,blocked,effectivePenalty,accessibility);
   if(!r.path)continue;
   const cap=Math.min(pathCapacity(graph,r.path),remaining[ex]);
   if(cap<=0)continue;
   let fairnessPenalty=0;
   if(mode==="fairness")fairnessPenalty=80*(1-remaining[ex]/graph.nodes[ex].exitCapacity);
   const speedBonus=mode==="speed"?-30:0;
   const score=r.distance+fairnessPenalty+speedBonus;
   cand.push({ex,r,cap,score});
  }
  if(!cand.length)break;
  cand.sort((a,b)=>a.score-b.score);
  const choice=cand[0];
  const take=Math.min(remainingPeople,choice.cap);
  choice.r.path && pathEdges(graph,choice.r.path).forEach(e=>loads[e.id]+=take);
  remaining[choice.ex]-=take;remainingPeople-=take;
  allocations.push({building:b,exit:choice.ex,people:take,path:choice.r.path});
 }
 if(remainingPeople>0)allocations.push({building:b,exit:null,people:remainingPeople,path:null});
}
const byExit={};exits.forEach(e=>byExit[e]=0);let total=0;
allocations.forEach(a=>{if(a.exit){byExit[a.exit]+=a.people;total+=a.people}});
return{allocations,total,byExit,loads};
}

function fairnessSummary(graph,allocations){
const by={};allocations.filter(a=>a.exit).forEach(a=>{
 if(!by[a.building])by[a.building]=0;
});
allocations.filter(a=>a.exit).forEach(a=>{const tm=evacuationTime(a.path?pathEdges(graph,a.path).reduce((s,e)=>s+e.weight,0):Infinity,a.people,pathCapacity(graph,a.path));by[a.building]=Math.max(by[a.building]||0,tm)});
const vals=Object.values(by).filter(Number.isFinite);if(!vals.length)return{disparity:0,byBuilding:by};
return{disparity:Math.max(...vals)-Math.min(...vals),byBuilding:by};
}
