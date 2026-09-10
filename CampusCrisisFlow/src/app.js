const $=id=>document.getElementById(id);
let blocked=new Set(),active=false;

const source=$("source"),targetExit=$("targetExit");
Object.entries(CAMPUS_GRAPH.nodes).forEach(([id,n])=>{
 if(n.type==="building")source.add(new Option(`${id} — ${n.name}`,id));
 if(n.type==="exit")targetExit.add(new Option(`${id} — ${n.name}`,id));
});
source.value="A";targetExit.value="G";

$("congestionWeight").oninput=()=>{$("congestionValue").textContent=$("congestionWeight").value};

function status(text){$("statusBadge").textContent=text}
function scenario(text){$("scenarioText").textContent=text}

function render(routeIds=[],loads={}){
const box=$("map");box.innerHTML="";
const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("viewBox","0 0 790 515");svg.setAttribute("width","100%");svg.setAttribute("height","100%");
for(const e of CAMPUS_GRAPH.edges){
 const a=CAMPUS_GRAPH.nodes[e.a],b=CAMPUS_GRAPH.nodes[e.b];
 const line=document.createElementNS("http://www.w3.org/2000/svg","line");
 line.setAttribute("x1",a.x);line.setAttribute("y1",a.y);line.setAttribute("x2",b.x);line.setAttribute("y2",b.y);
 line.classList.add("edge");
 if(blocked.has(e.id))line.classList.add("blocked");
 if(routeIds.includes(e.id))line.classList.add("route");
 const util=(loads[e.id]||0)/e.capacity;
 if(!routeIds.includes(e.id)&&util>.75)line.classList.add("busy");
 svg.appendChild(line);
 const lab=document.createElementNS("http://www.w3.org/2000/svg","text");
 lab.setAttribute("x",(a.x+b.x)/2);lab.setAttribute("y",(a.y+b.y)/2-7);lab.classList.add("edge-label");
 lab.textContent=`${e.capacity}${loads[e.id] ? " · "+Math.round(util*100)+"%" : ""}`;svg.appendChild(lab);
}
for(const [id,n] of Object.entries(CAMPUS_GRAPH.nodes)){
 const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
 c.setAttribute("cx",n.x);c.setAttribute("cy",n.y);c.setAttribute("r",n.type==="exit"?14:18);
 c.classList.add("node",n.type);if(active&&id===source.value)c.classList.add("source");svg.appendChild(c);
 const t=document.createElementNS("http://www.w3.org/2000/svg","text");
 t.setAttribute("x",n.x);t.setAttribute("y",n.y+35);t.setAttribute("text-anchor","middle");t.classList.add("node-label");
 t.textContent=`${id} — ${n.name}`;svg.appendChild(t);
 const p=document.createElementNS("http://www.w3.org/2000/svg","text");
 p.setAttribute("x",n.x);p.setAttribute("y",n.y-25);p.setAttribute("text-anchor","middle");p.classList.add("small-label");
 p.textContent=n.type==="exit"?`cap ${n.exitCapacity}`:`${n.population} people`;svg.appendChild(p);
}
box.appendChild(svg);
}

function setMetrics(obj){
Object.entries(obj).forEach(([k,v])=>{if($(k))$(k).textContent=v});
}
function updateBars(byExit={},loads={}){
$("exitBars").innerHTML=Object.entries(byExit).map(([id,v])=>{
 const cap=CAMPUS_GRAPH.nodes[id].exitCapacity,p=Math.min(100,100*v/cap);
 return `<div class="bar-row"><span>${CAMPUS_GRAPH.nodes[id].name}</span><div class="bar"><i style="width:${p}%"></i></div><b>${Math.round(v)}/${cap}</b></div>`;
}).join("");
$("edgeBars").innerHTML=CAMPUS_GRAPH.edges.filter(e=>!blocked.has(e.id)).map(e=>{
 const p=Math.min(100,100*(loads[e.id]||0)/e.capacity);
 return `<div class="bar-row"><span>${e.id}</span><div class="bar"><i style="width:${p}%"></i></div><b>${Math.round(p)}%</b></div>`;
}).join("");
}
function updateGroups(allocations=[]){
const names={};
allocations.forEach(a=>{
 const b=CAMPUS_GRAPH.nodes[a.building].name;
 if(!names[b])names[b]={people:0};
 names[b].people+=a.exit?a.people:0;
});
$("groupTable").innerHTML=`<table><thead><tr><th>Building</th><th>Evacuated</th><th>Total</th><th>Status</th></tr></thead><tbody>${
Object.entries(CAMPUS_GRAPH.nodes).filter(([,n])=>n.type==="building").map(([id,n])=>{
 const done=names[n.name]?.people||0;
 return `<tr><td>${n.name}</td><td>${done}</td><td>${n.population}</td><td>${done===n.population?"✓":"Partial"}</td></tr>`;
}).join("")}</tbody></table>`;
}

function routeRun(name){
active=true;
const accessibility=$("wheelchair").checked;
const s=source.value,t=targetExit.value;
const penalty=e=>{const load=0;return load};
const r=name==="A*"?aStar(CAMPUS_GRAPH,s,t,blocked,penalty,accessibility):dijkstra(CAMPUS_GRAPH,s,t,blocked,penalty,accessibility);
const ids=r.path?pathEdges(CAMPUS_GRAPH,r.path).map(e=>e.id):[];
const people=Number($("people").value);
const time=evacuationTime(r.distance,people,pathCapacity(CAMPUS_GRAPH,r.path));
render(ids,{});
$("mAlgorithm").textContent=name;
$("mScope").textContent=r.path?`${Math.round(r.distance)} units`:"NO PATH";
$("mTime").textContent=Number.isFinite(time)?`${time.toFixed(1)} sec`:"∞";
$("mPeople").textContent=people;
$("mCongestion").textContent="—";
$("mFairness").textContent=accessibility?(r.path&&pathAccessibility(CAMPUS_GRAPH,r.path)?"ACCESSIBLE":"NO ACCESSIBLE PATH"):"—";
$("mStatus").textContent=r.path?"ROUTE FOUND":"BLOCKED";
$("result").innerHTML=r.path?`<strong>${s} → ${t}</strong><br>${r.path.map(x=>CAMPUS_GRAPH.nodes[x].name).join(" → ")}<br><span class="muted">Nodes explored: ${r.explored} · Path capacity: ${pathCapacity(CAMPUS_GRAPH,r.path)}</span>`:"No feasible route.";
scenario(`${name} route · ${blocked.size} blocked corridor(s)`);
status(r.path?"ROUTE FOUND":"NO ROUTE");
}

function flowRun(){
active=true;const r=maxFlow(CAMPUS_GRAPH,blocked);render([]);
const total=totalPopulation(CAMPUS_GRAPH,1);
$("mAlgorithm").textContent="Edmonds-Karp Max-Flow";
$("mScope").textContent="Network-wide";
$("mTime").textContent="Capacity limited";
$("mPeople").textContent=`${r.maxFlow}/${total}`;
$("mCongestion").textContent="—";
$("mFairness").textContent="—";
$("mStatus").textContent="FLOW OPTIMIZED";
$("result").innerHTML=`<strong>Maximum network flow: ${r.maxFlow} people</strong><br>Augmenting paths: ${r.augmentations}<br><br>${
Object.entries(r.exitStats).map(([id,x])=>`${CAMPUS_GRAPH.nodes[id].name}: <b>${x.allocated}</b> / ${x.capacity} (${(100*x.utilization).toFixed(1)}%)`).join("<br>")
}`;
updateBars(Object.fromEntries(Object.entries(r.exitStats).map(([id,x])=>[id,x.allocated])),{});
updateGroups([]);
scenario(blocked.size?`Max-flow after ${blocked.size} corridor failure(s)`:"Network-wide multi-exit flow");
status("MAX-FLOW COMPLETE");
}

function crisisRun(){
active=true;
const alpha=Number($("congestionWeight").value);
const accessibility=$("wheelchair").checked;
const mode=$("mode").value;
const r=congestionOptimize(CAMPUS_GRAPH,blocked,alpha,accessibility,mode);
const total=totalPopulation(CAMPUS_GRAPH,1);
const util=maxUtilization(CAMPUS_GRAPH,r.loads,blocked);
const fairness=fairnessSummary(CAMPUS_GRAPH,r.allocations);
render([],r.loads);
$("mAlgorithm").textContent="CrisisFlow";
$("mScope").textContent="Dynamic multi-exit";
$("mTime").textContent=`Max congestion ${(100*util.max).toFixed(1)}%`;
$("mPeople").textContent=`${r.total}/${total}`;
$("mCongestion").textContent=`${(100*util.max).toFixed(1)}%`;
$("mFairness").textContent=`Δ ${fairness.disparity.toFixed(1)} sec`;
$("mStatus").textContent=r.total===total?"ALL GROUPS ASSIGNED":"PARTIAL ASSIGNMENT";
const exits=["G","H","I","J"].map(id=>`${CAMPUS_GRAPH.nodes[id].name}: <b>${r.byExit[id]||0}</b> / ${CAMPUS_GRAPH.nodes[id].exitCapacity}`).join("<br>");
const sample=r.allocations.filter(a=>a.exit).slice(0,10).map(a=>`${CAMPUS_GRAPH.nodes[a.building].name} → ${CAMPUS_GRAPH.nodes[a.exit].name}: ${a.people}`).join("<br>");
$("result").innerHTML=`<strong>CrisisFlow assigned ${r.total} people</strong><br><br>${exits}<br><br><strong>Sample allocations</strong><br>${sample}<br><br><span class="muted">Most congested corridor: ${util.id||"—"}</span>`;
updateBars(r.byExit,r.loads);updateGroups(r.allocations);
scenario(`CrisisFlow · ${mode} · ${blocked.size} blocked corridor(s)`);
status("CRISISFLOW OPTIMIZED");
}

$("runDijkstra").onclick=()=>routeRun("Dijkstra");
$("runAStar").onclick=()=>routeRun("A*");
$("runMaxFlow").onclick=flowRun;
$("runCrisis").onclick=crisisRun;

$("triggerEmergency").onclick=()=>{active=true;scenario(`Emergency at ${CAMPUS_GRAPH.nodes[source.value].name}`);status("EMERGENCY ACTIVE");routeRun("Dijkstra")};

$("blockCorridor").onclick=()=>{
const sequence=["AB","BE","CE","EF","BC","AD"];const next=sequence.find(x=>!blocked.has(x));
if(next){blocked.add(next);scenario(`Hazard injected: corridor ${next} is blocked`);status("HAZARD DETECTED")}render([]);
if(active)crisisRun();
};

$("reset").onclick=()=>{
blocked=new Set();active=false;render([]);
["mAlgorithm","mScope","mTime","mPeople","mCongestion","mFairness"].forEach(id=>$(id).textContent="—");
$("mStatus").textContent="READY";$("result").textContent="Run an algorithm to see results.";
$("exitBars").innerHTML="";$("edgeBars").innerHTML="";$("groupTable").innerHTML="";
scenario("Normal campus state");status("SYSTEM READY");
};

document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
btn.classList.add("active");$(btn.dataset.tab).classList.add("active");
});

$("runBenchmark").onclick=()=>{
const trials=Number($("trials").value),hp=Number($("hazardProb").value),ps=Number($("popScale").value);
$("benchmarkStatus").textContent="Running benchmark…";
setTimeout(()=>{
const r=(trials,hp,ps);
$("benchmarkStatus").innerHTML=`Completed ${r.trials} trials. CrisisFlow assigned an average of <b>${r.crisis.avgAssigned.toFixed(0)}</b> people per trial.`;
$("benchmarkTable").innerHTML=`<table><thead><tr><th>Method</th><th>Route/assignment</th><th>Avg time</th><th>Runtime</th></tr></thead><tbody>
<tr><td>Dijkstra</td><td>${(100*r.dijkstra.routeRate).toFixed(1)}%</td><td>${Number.isFinite(r.dijkstra.avgTime)?r.dijkstra.avgTime.toFixed(1)+" s":"—"}</td><td>${r.dijkstra.runtimeMs.toFixed(3)} ms</td></tr>
<tr><td>A*</td><td>${(100*r.astar.routeRate).toFixed(1)}%</td><td>${Number.isFinite(r.astar.avgTime)?r.astar.avgTime.toFixed(1)+" s":"—"}</td><td>${r.astar.runtimeMs.toFixed(3)} ms</td></tr>
<tr><td>CrisisFlow</td><td>${r.crisis.avgAssigned.toFixed(0)} people</td><td>network</td><td>${r.crisis.runtimeMs.toFixed(3)} ms</td></tr>
</tbody></table>`;
drawBenchmark(r);
},20);
};
function drawBenchmark(r){
const c=$("benchmarkChart"),ctx=c.getContext("2d");ctx.clearRect(0,0,c.width,c.height);
const data=[r.dijkstra.runtimeMs,r.astar.runtimeMs,r.crisis.runtimeMs],labels=["Dijkstra","A*","CrisisFlow"];
const max=Math.max(...data,0.01),bw=120;
ctx.font="14px Segoe UI";ctx.fillStyle="#dce9f7";
labels.forEach((lab,i)=>{const x=80+i*210,h=(data[i]/max)*190;ctx.fillRect(x,235-h,bw,h);ctx.fillText(lab,x+20,260);ctx.fillText(data[i].toFixed(3)+" ms",x+5,220-h)});
ctx.fillText("Prototype runtime comparison",235,30);
}

render();
