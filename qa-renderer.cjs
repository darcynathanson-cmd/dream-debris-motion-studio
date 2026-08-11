const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync(__dirname+'/index.html','utf8');
const slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const stale=[...source.matchAll(/scenes\[(\d+)\]/g)].map(m=>+m[1]).filter(i=>i>=5);
if(stale.length)throw new Error(`Stale scene indexes: ${stale.join(', ')}`);

const layout={Math,console,TAU:Math.PI*2,settings:{fieldMode:'editorial',motionIdea:'crop'},MOTION_IDEAS:['crop','touch','residue','veil'],OBJECT_NAMES:['Orb','Aura','Nautilus','Wave','Ripples','Cloud','Flower','Daisy','Fern','Eucalyptus','Grass','Butterfly','Moth','Cairn','Moon','Ring','Arch','Droplet','Pine'],
  SHAPE_GROUNDS:['#030D1C','#13294B','#400640','#003A37','#3E0F00','#0B2C62','#0A1A34'],SHAPE_TINTS:['#F1EBE1','#37B8C0','#C26767','#A174B7','#DDB06D','#E3D5C5','#FEB930','#C8B09F'],
  TALL_SHAPES:new Set(['Flower','Daisy','Fern','Eucalyptus','Grass','Arch','Pine']),WIDE_SHAPES:new Set(['Wave','Ripples','Cloud','Butterfly','Moth']),
  scenes:Array.from({length:5},(_,i)=>({object:['Aura','Fern','Nautilus','Moth','Arch'][i]})),filmTintStory:['#F1EBE1','#37B8C0','#C26767','#A174B7','#DDB06D'],filmGroundStory:['#030D1C','#13294B','#400640','#003A37','#3E0F00']};
layout.OBJECT_MOTION_AFFINITY={Orb:['residue','touch'],Aura:['residue','veil'],Nautilus:['residue','crop'],Wave:['veil','crop'],Ripples:['veil','residue'],Cloud:['veil','crop'],Flower:['crop','veil'],Daisy:['crop','touch'],Fern:['veil','crop'],Eucalyptus:['veil','crop'],Grass:['veil','touch'],Butterfly:['touch','residue'],Moth:['touch','residue'],Cairn:['touch','crop'],Moon:['residue','touch'],Ring:['residue','touch'],Arch:['crop','veil'],Droplet:['crop','touch'],Pine:['crop','veil']};
layout.CURATED_RELATIONSHIPS=[['Fern','Ring','Cloud'],['Moth','Nautilus','Moon'],['Arch','Moon','Cloud'],['Droplet','Ripples','Aura'],['Pine','Ring','Cloud'],['Flower','Grass','Orb'],['Eucalyptus','Moon','Ripples'],['Butterfly','Aura','Cloud'],['Cairn','Grass','Moon'],['Daisy','Nautilus','Wave'],['Wave','Orb','Cloud'],['Ripples','Arch','Droplet'],['Aura','Moth','Fern'],['Nautilus','Grass','Moon'],['Ring','Flower','Cloud'],['Cloud','Pine','Aura']];
layout.CURATED_CONSTELLATIONS=[['Fern','Ring','Cloud','Orb','Grass'],['Moth','Nautilus','Moon','Aura','Cloud'],['Arch','Moon','Cloud','Grass','Orb'],['Droplet','Ripples','Aura','Ring','Cloud'],['Pine','Ring','Cloud','Moon','Grass'],['Flower','Grass','Orb','Aura','Ripples'],['Eucalyptus','Moon','Ripples','Cloud','Ring'],['Butterfly','Aura','Cloud','Fern','Moon'],['Cairn','Grass','Moon','Cloud','Orb'],['Daisy','Nautilus','Wave','Ring','Cloud'],['Wave','Orb','Cloud','Droplet','Moon'],['Ripples','Arch','Droplet','Aura','Grass']];
layout.ECHO_HEROES=['Aura','Nautilus','Moon','Ring','Butterfly','Moth','Orb'];
layout.seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
vm.createContext(layout);vm.runInContext(slice('function shuffledCopy','const settings ='),layout);
const expected={editorial:[3,3],motif:[2,2],echo:[1,1],scatter:[4,5]};let layoutSamples=0;
for(const mode of Object.keys(expected)){
  let previous=[],previousTints=[],previousSignature='';
  for(let i=0;i<80;i++){
    const items=layout.createDreamFieldLayout(mode,previous,previousTints),signature=items.map(item=>`${item.object}:${item.tint}`).join('|');
    if(items.length<expected[mode][0]||items.length>expected[mode][1])throw new Error(`${mode}: wrong item count`);
    if(new Set(items.map(item=>item.object)).size!==items.length)throw new Error(`${mode}: duplicate object`);
    if(items.some(item=>![item.x,item.y,item.w,item.h,item.rot,item.phase].every(Number.isFinite)||item.w<=0||item.h<=0))throw new Error(`${mode}: invalid geometry`);
    if(signature===previousSignature)throw new Error(`${mode}: repeated shuffle`);
    const centers=items.map(item=>({x:item.x+item.w*.5,y:item.y+item.h*.5}));
    if(mode==='editorial'){
      if((centers[0].x-.5)*(centers[1].x-.5)>=0||(centers[0].y-.5)*(centers[1].y-.5)>=0)throw new Error('editorial: hero and counterform lost their diagonal opposition');
      if(items[0].x>0&&items[0].x+items[0].w<1)throw new Error('editorial: hero is not purposefully cropped');
    }
    if(mode==='motif'){
      const midpoint={x:(centers[0].x+centers[1].x)/2,y:(centers[0].y+centers[1].y)/2};
      if(Math.abs(midpoint.x-.5)>.06||Math.abs(midpoint.y-.5)>.06)throw new Error('motif: pair is not centered');
    }
    if(mode==='scatter'){
      const spanX=Math.max(...centers.map(point=>point.x))-Math.min(...centers.map(point=>point.x));
      const spanY=Math.max(...centers.map(point=>point.y))-Math.min(...centers.map(point=>point.y));
      if(spanX<.44||spanY<.44)throw new Error('scatter: constellation lacks a resolved diagonal span');
    }
    if(mode==='echo'&&(Math.abs(centers[0].x-.5)>.03||Math.abs(centers[0].y-.5)>.03))throw new Error('echo: hero is not radially centered');
    previous=items.map(item=>item.object);previousTints=items.map(item=>item.tint);previousSignature=signature;layoutSamples++;
  }
}
const seenMotionIdeas=new Set();
for(let i=0;i<80;i++){
  const previous=layout.settings.motionIdea,next=layout.nextMotionIdea('editorial',previous);
  if(next===previous)throw new Error('Motion idea repeated immediately');
  layout.settings.motionIdea=next;seenMotionIdeas.add(next);
}
if(seenMotionIdeas.has('residue')||seenMotionIdeas.size!==layout.MOTION_IDEAS.length-1)throw new Error('Everyday modes should cover non-Echo motion only');
if(layout.nextMotionIdea('echo',null,'Aura')!=='residue')throw new Error('Echo mode lost its dedicated residue motion');
for(const object of layout.OBJECT_NAMES){
  const idea=layout.nextMotionIdea('editorial',null,object);
  if(!layout.OBJECT_MOTION_AFFINITY[object].includes(idea))throw new Error(`${object}: incompatible motion idea`);
}
let previousStory=[];
const storyObjects=['Aura','Fern','Nautilus','Moth','Arch'];
for(let i=0;i<100;i++){
  const story=layout.createMotionStory(storyObjects,previousStory);
  if(story.length!==5||story.some(idea=>!layout.MOTION_IDEAS.includes(idea)))throw new Error('Invalid film motion story');
  if(story.some((idea,index)=>!layout.OBJECT_MOTION_AFFINITY[storyObjects[index]].includes(idea)))throw new Error('Film motion did not match its shape');
  if(story.filter(idea=>idea==='residue').length>1)throw new Error('Film used Echo more than once');
  if(new Set(story).size<2)throw new Error('Film motion story lacks variation');
  previousStory=story;
}

function mockCanvas(){
  let depth=0,gradients=0;
  const finite=(name,args)=>args.forEach(v=>{if(typeof v==='number'&&!Number.isFinite(v))throw new Error(`${name}: non-finite value`);});
  const target={canvas:{width:1080,height:1350},globalAlpha:1,globalCompositeOperation:'source-over'};
  target.save=()=>{depth++};target.restore=()=>{if(--depth<0)throw new Error('Unbalanced restore')};
  target.beginPath=target.fill=()=>{};
  target.arc=(...args)=>{finite('arc',args);if(args[2]<0)throw new Error('Negative radius')};
  target.createRadialGradient=(...args)=>{finite('gradient',args);gradients++;return{addColorStop(offset){if(!Number.isFinite(offset)||offset<0||offset>1)throw new Error('Invalid stop')}}};
  return{target,depth:()=>depth,gradients:()=>gradients};
}

const c={Math,console,TAU:Math.PI*2,reduced:false,compositionGeneration:7,
  settings:{duration:22,motion:.46,fieldMode:'echo'},filmTintStory:['#F1EBE1','#37B8C0','#C26767','#A174B7','#DDB06D'],
  STUDY_MOTION_IDEAS:['residue','veil','veil','crop','residue','veil','crop','touch','touch','crop','touch','veil'],
  CAROUSEL_PAGES:Array.from({length:12},(_,renderIndex)=>({renderIndex})),
  scenes:Array.from({length:5},(_,i)=>({object:String(i),tint:'#ffffff',rot:0,motionIdea:['crop','veil','residue','touch','crop'][i]})),
  dreamFieldLayout:[{object:'Aura',x:-.08,y:.04,w:.68,h:.72,tint:'#F1EBE1',sceneIndex:0,rot:-4,phase:.27,strength:1,echoAngle:-1.9}],calls:[]};
c.STUDY_COLORWAYS=[
  {name:'Plum dusk',grounds:['#240022','#400640'],tints:['#C26767','#C8B09F','#F1EBE1']},
  {name:'Deep blue',grounds:['#030D1C','#13294B'],tints:['#F1EBE1','#37B8C0','#DDB06D']},
  {name:'Tidal',grounds:['#003A37','#0B2C62'],tints:['#37B8C0','#F1EBE1','#A174B7']},
  {name:'Ember',grounds:['#3E0F00','#400640'],tints:['#C26767','#A174B7','#E3D5C5']},
  {name:'Midnight',grounds:['#030D1C','#0B2C62'],tints:['#FEB930','#A174B7','#37B8C0']},
  {name:'Nocturne',grounds:['#003A37','#030D1C'],tints:['#E3D5C5','#A174B7','#37B8C0']}
];
c.studyColorwaySelections=[0,5,2,3,0,1,4,2,3,5,4,1];
c.STUDY_VARIANTS=[
  [['Moth','Cloud','Nautilus'],['Butterfly','Aura','Moon'],['Moth','Ripples','Ring']],
  [['Fern','Eucalyptus'],['Eucalyptus','Fern'],['Pine','Grass']],
  [['Fern','Ripples','Cloud'],['Eucalyptus','Wave','Aura'],['Grass','Ripples','Cloud']],
  [['Daisy','Fern','Flower'],['Flower','Grass','Daisy'],['Daisy','Eucalyptus','Flower']],
  [['Nautilus'],['Ring'],['Aura']],
  [['Cloud','Aura'],['Ripples','Ring'],['Wave','Cloud']],
  [['Arch','Moon'],['Pine','Ring'],['Droplet','Aura']],
  [['Droplet','Wave'],['Moon','Ripples'],['Cairn','Cloud']],
  [['Cairn','Grass'],['Orb','Fern'],['Moon','Eucalyptus']],
  [['Pine','Ring'],['Arch','Moon'],['Eucalyptus','Aura']],
  [['Orb','Butterfly'],['Moon','Moth'],['Ring','Butterfly']],
  [['Arch'],['Pine'],['Eucalyptus']]
];
c.studyVariantSelections=c.STUDY_VARIANTS.map(()=>0);
c.clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));c.smooth=t=>{t=c.clamp(t);return t*t*(3-2*t)};
c.seeded=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
c.hexRgb=hex=>{const h=hex.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
c.rgbHex=rgb=>'#'+rgb.map(v=>Math.round(c.clamp(v,0,255)).toString(16).padStart(2,'0')).join('');c.lerp=(a,b,t)=>a+(b-a)*t;
c.mixColor=(a,b,t)=>{const A=c.hexRgb(a),B=c.hexRgb(b);return c.rgbHex(A.map((v,i)=>c.lerp(v,B[i],t)))};
c.rgba=(hex,a)=>{const[r,g,b]=c.hexRgb(hex);return`rgba(${r},${g},${b},${a})`};
c.drawMotifLayer=(target,scene,t,alpha,layer,box)=>{[t,alpha,box.x,box.y,box.w,box.h].forEach(v=>{if(!Number.isFinite(v))throw new Error('Invalid motif geometry')});if(!scene?.object||!scene?.tint)throw new Error('Incomplete scene');c.calls.push({layer,alpha})};
vm.createContext(c);vm.runInContext(slice('function authoredMotionBox','function drawMotifLayer'),c);vm.runInContext(slice('function drawDreamDust','function renderCarousel'),c);
for(const idea of ['crop','touch','residue','veil']){
  const start=c.authoredMotionBox({canvas:{width:1080,height:1350}},{x:100,y:180,w:620,h:760,clip:false},idea,0,0,.88);
  const end=c.authoredMotionBox({canvas:{width:1080,height:1350}},{x:100,y:180,w:620,h:760,clip:false},idea,c.settings.duration,0,.88);
  for(const key of ['x','y','w','h'])if(!Number.isFinite(start[key])||Math.abs(start[key]-end[key])>1e-8)throw new Error(`${idea}: motion loop does not close`);
}
let samples=0,gradients=0;
for(const layer of ['composite','far','middle','near'])for(const t of [19.5,21,23,25.5]){const m=mockCanvas();c.drawEchoField(m.target,t,1,0,layer);if(m.depth())throw new Error('Canvas state leaked');gradients+=m.gradients();samples++}
if(!c.calls.length)throw new Error('Echo drew no motifs');const moving=c.calls.length;
c.settings.fieldMode='editorial';
c.dreamFieldLayout=[
  {object:'Aura',x:-.20,y:.02,w:.82,h:.76,tint:'#F1EBE1',sceneIndex:0,rot:-4,phase:.12,strength:1},
  {object:'Fern',x:.48,y:.36,w:.42,h:.58,tint:'#37B8C0',sceneIndex:1,rot:7,phase:.30,strength:.68},
  {object:'Moth',x:.16,y:.72,w:.24,h:.18,tint:'#C26767',sceneIndex:3,rot:5,phase:.42,strength:.4}
];
const ideaDraws={};
for(const idea of ['crop','touch','residue','veil']){
  c.settings.motionIdea=idea;c.calls.length=0;
  for(const layer of ['composite','far','middle','near'])for(const t of [19.6,22.4,25.8]){const sample=mockCanvas();c.drawDreamField(sample.target,t,1,0,layer);if(sample.depth())throw new Error(`${idea}: canvas state leaked`)}
  if(!c.calls.length)throw new Error(`${idea}: no motif draws`);ideaDraws[idea]=c.calls.length;
}
c.drawBackground=()=>{};c.drawGrain=()=>{};vm.runInContext(slice('function renderCarousel','function renderShapePortrait'),c);
const studyDraws={};
const studyHeroes=['Moth','Fern','Fern','Daisy','Nautilus','Cloud','Arch','Droplet','Cairn','Pine','Orb','Arch'];
for(let page=0;page<12;page++){
  if(!layout.OBJECT_MOTION_AFFINITY[studyHeroes[page]].includes(c.STUDY_MOTION_IDEAS[page]))throw new Error(`Study ${page+1}: motion does not fit ${studyHeroes[page]}`);
  for(const variant of c.STUDY_VARIANTS[page])if(!layout.OBJECT_MOTION_AFFINITY[variant[0]].includes(c.STUDY_MOTION_IDEAS[page]))throw new Error(`Study ${page+1}: motion does not fit variant hero ${variant[0]}`);
  c.calls.length=0;c.drawMotifLayer=(target,scene,t,alpha,layer,box)=>{[t,alpha,box.x,box.y,box.w,box.h].forEach(v=>{if(!Number.isFinite(v))throw new Error(`Study ${page+1}: invalid geometry`)});if(scene.motionIdea&&scene.motionIdea!==c.STUDY_MOTION_IDEAS[page])throw new Error(`Study ${page+1}: wrong motion idea`);c.calls.push({layer,alpha,motionIdea:scene.motionIdea})};
  c.renderCarousel(mockCanvas().target,page,2.4);if(!c.calls.length)throw new Error(`Study ${page+1}: no motif draws`);if(!c.calls.some(call=>call.motionIdea===c.STUDY_MOTION_IDEAS[page]))throw new Error(`Study ${page+1}: missing hero motion`);studyDraws[page+1]=c.calls.length;
}

const cleanNumber=value=>Math.round(value*1e8)/1e8;
const trace=[];
const installTrace=()=>{
  trace.length=0;
  c.drawBackground=(target,ground,bloom,alpha)=>trace.push({type:'background',ground,bloom:cleanNumber(bloom),alpha:cleanNumber(alpha)});
  c.drawGrain=()=>{};c.drawDreamDust=()=>{};
  c.drawMotifLayer=(target,scene,t,alpha,layer,box)=>trace.push({
    type:'motif',object:scene.object,tint:scene.tint,layer,alpha:cleanNumber(alpha),time:cleanNumber(((t%c.settings.duration)+c.settings.duration)%c.settings.duration),
    box:['x','y','w','h'].map(key=>cleanNumber(box[key])),rot:cleanNumber(scene.rot||0),motionIdea:scene.motionIdea||null,motionAmount:cleanNumber(scene.motionAmount??1)
  });
};
const capture=render=>{installTrace();render();return JSON.stringify(trace)};
let studyLoopCases=0;
for(let page=0;page<12;page++)for(let variant=0;variant<c.STUDY_VARIANTS[page].length;variant++)for(let colorway=0;colorway<c.STUDY_COLORWAYS.length;colorway++){
  c.studyVariantSelections[page]=variant;c.studyColorwaySelections[page]=colorway;
  const start=capture(()=>c.renderCarousel(mockCanvas().target,page,0));
  const end=capture(()=>c.renderCarousel(mockCanvas().target,page,c.settings.duration));
  if(start!==end)throw new Error(`Study ${page+1}, variant ${variant+1}, colorway ${colorway+1}: loop seam`);
  studyLoopCases++;
}

c.OBJECT_NAMES=layout.OBJECT_NAMES;c.SHAPE_GROUNDS=layout.SHAPE_GROUNDS;c.SHAPE_TINTS=layout.SHAPE_TINTS;c.TALL_SHAPES=layout.TALL_SHAPES;c.WIDE_SHAPES=layout.WIDE_SHAPES;
c.placementDefault=()=>({x:0,y:0,scale:1,rotation:0});c.shapePlacements=c.OBJECT_NAMES.map(c.placementDefault);c.shapeColorwaySelections=c.OBJECT_NAMES.map((_,index)=>index%c.STUDY_COLORWAYS.length);
vm.runInContext(slice('function renderShapePortrait','function drawGrain'),c);
let shapeLoopCases=0;
for(let index=0;index<c.OBJECT_NAMES.length;index++)for(let colorway=0;colorway<c.STUDY_COLORWAYS.length;colorway++){
  c.shapeColorwaySelections[index]=colorway;
  const start=capture(()=>c.renderShapePortrait(mockCanvas().target,index,0));
  const end=capture(()=>c.renderShapePortrait(mockCanvas().target,index,c.settings.duration));
  if(start!==end)throw new Error(`Shape ${c.OBJECT_NAMES[index]}, colorway ${colorway+1}: loop seam`);
  shapeLoopCases++;
}

let fieldLoopCases=0;
for(const mode of ['editorial','motif','scatter','echo']){
  c.settings.fieldMode=mode;c.settings.motionIdea=mode==='echo'?'residue':'crop';c.dreamFieldLayout=layout.createDreamFieldLayout(mode);
  const start=capture(()=>c.drawDreamField(mockCanvas().target,0,1,0,'composite'));
  const end=capture(()=>c.drawDreamField(mockCanvas().target,c.settings.duration,1,0,'composite'));
  if(start!==end)throw new Error(`${mode}: closing composition loop seam`);
  fieldLoopCases++;
}

c.scenes=[
  {object:'Aura',ground:'#030D1C',tint:'#F1EBE1',rot:-4,motionIdea:'veil'},
  {object:'Fern',ground:'#13294B',tint:'#37B8C0',rot:7,motionIdea:'veil'},
  {object:'Nautilus',ground:'#400640',tint:'#F1EBE1',rot:-9,motionIdea:'residue'},
  {object:'Moth',ground:'#3E0F00',tint:'#C26767',rot:6,motionIdea:'touch'},
  {object:'Arch',ground:'#13294B',tint:'#37B8C0',rot:-5,motionIdea:'crop'}
];
c.dreamFieldGround='#030D1C';c.drawDreamField=()=>{};
vm.runInContext(slice('function scenePosition','function drawDreamDust'),c);
const filmStart=capture(()=>c.drawScenePair(mockCanvas().target,0,'composite'));
const filmEnd=capture(()=>c.drawScenePair(mockCanvas().target,c.settings.duration,'composite'));
if(filmStart!==filmEnd)throw new Error('Full Film: loop seam');
c.drawMotifLayer=(target,scene,t,alpha,layer,box)=>{[t,alpha,box.x,box.y,box.w,box.h].forEach(v=>{if(!Number.isFinite(v))throw new Error('Invalid motif geometry')});if(!scene?.object||!scene?.tint)throw new Error('Incomplete scene');c.calls.push({layer,alpha})};
c.settings.fieldMode='echo';
c.reduced=true;c.calls.length=0;const m=mockCanvas();c.drawEchoField(m.target,22,1,0,'composite');
if(c.calls.length!==3)throw new Error(`Reduced Echo drew ${c.calls.length} layers`);if(m.gradients())throw new Error('Reduced Echo drew dust');
if(!source.includes("far:{scale:1.52,blur:72")||!source.includes("middle:{scale:1,blur:30")||!source.includes("near:{scale:.72,blur:9")||!source.includes("target.globalAlpha=settings.grain"))throw new Error('Blur or grain treatment changed');
console.log(JSON.stringify({layoutSamples,motionIdeas:[...seenMotionIdeas],motionStories:100,samples,movingDraws:moving,ideaDraws,studyDraws,studyLoopCases,shapeLoopCases,fieldLoopCases,filmLoopCases:1,dustGradients:gradients,reducedDraws:c.calls.length,staleSceneIndexes:stale.length},null,2));
