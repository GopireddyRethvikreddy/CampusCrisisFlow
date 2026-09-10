const CAMPUS_GRAPH={
nodes:{
A:{name:"Engineering Block",type:"building",x:125,y:145,population:800},
B:{name:"Library",type:"building",x:385,y:100,population:500},
C:{name:"Admin Block",type:"building",x:650,y:155,population:450},
D:{name:"Hostel A",type:"building",x:155,y:380,population:700},
E:{name:"Student Center",type:"building",x:405,y:315,population:500},
F:{name:"Lab Complex",type:"building",x:655,y:385,population:400},
G:{name:"North Exit",type:"exit",x:385,y:25,exitCapacity:700},
H:{name:"East Exit",type:"exit",x:755,y:260,exitCapacity:500},
I:{name:"South Exit",type:"exit",x:405,y:480,exitCapacity:800},
J:{name:"West Exit",type:"exit",x:30,y:270,exitCapacity:650}
},
edges:[
{id:"AB",a:"A",b:"B",weight:140,capacity:450,accessible:true},
{id:"AC",a:"A",b:"C",weight:250,capacity:250,accessible:true},
{id:"AD",a:"A",b:"D",weight:180,capacity:500,accessible:false},
{id:"AJ",a:"A",b:"J",weight:120,capacity:600,accessible:true},
{id:"BG",a:"B",b:"G",weight:105,capacity:700,accessible:true},
{id:"BE",a:"B",b:"E",weight:180,capacity:500,accessible:true},
{id:"BC",a:"B",b:"C",weight:170,capacity:450,accessible:true},
{id:"CE",a:"C",b:"E",weight:190,capacity:400,accessible:false},
{id:"CH",a:"C",b:"H",weight:150,capacity:700,accessible:true},
{id:"DE",a:"D",b:"E",weight:230,capacity:500,accessible:true},
{id:"DJ",a:"D",b:"J",weight:170,capacity:650,accessible:true},
{id:"EI",a:"E",b:"I",weight:155,capacity:800,accessible:true},
{id:"EF",a:"E",b:"F",weight:210,capacity:400,accessible:false},
{id:"FH",a:"F",b:"H",weight:145,capacity:550,accessible:true},
{id:"FI",a:"F",b:"I",weight:180,capacity:650,accessible:true}
]};

function cloneGraphData(){
  return JSON.parse(JSON.stringify(CAMPUS_GRAPH));
}

function buildAdjacency(graph,blocked=new Set(),accessibility=false){
  const adj={};Object.keys(graph.nodes).forEach(n=>adj[n]=[]);
  graph.edges.forEach(e=>{
    if(blocked.has(e.id))return;
    if(accessibility && !e.accessible)return;
    adj[e.a].push({to:e.b,w:e.weight,id:e.id,capacity:e.capacity,accessible:e.accessible});
    adj[e.b].push({to:e.a,w:e.weight,id:e.id,capacity:e.capacity,accessible:e.accessible});
  });
  return adj;
}
