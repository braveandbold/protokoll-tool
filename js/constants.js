const SEV = {label:{1:'Sehr gering',2:'Gering',3:'Mittel',4:'Hoch',5:'Kritisch'},
  bg:{1:'#bbf7d0',2:'#d9f99d',3:'#fef08a',4:'#fed7aa',5:'#fecaca'},
  fg:{1:'#14532d',2:'#365314',3:'#713f12',4:'#7c2d12',5:'#7f1d1d'}};
const TYPES = ['Beobachtung','Problem','Zitat','Lob','Notiz'];
const T = {
  bg:   {Beobachtung:'#dbeafe',Problem:'#fee2e2',Zitat:'#ede9fe',Lob:'#dcfce7',Notiz:'#f3f4f6'},
  fg:   {Beobachtung:'#1e3a8a',Problem:'#7f1d1d',Zitat:'#3b1085',Lob:'#14532d',Notiz:'#374151'}
};

function lucideTypeIcon(type,size=14,strokeWidth=1.8){
  const common=`width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"`;
  const icons={
    Beobachtung:`<svg ${common}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,
    Problem:`<svg ${common}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    Zitat:`<svg ${common}><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0 0 2 4 4 0 0 0 4-4V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0 0 2 4 4 0 0 0 4-4V5a2 2 0 0 0-2-2z"/></svg>`,
    Lob:`<svg ${common}><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>`,
    Notiz:`<svg ${common}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
  };
  return icons[type]||'';
}

function typeIcon(type,size=14){
  return lucideTypeIcon(type,size,1.9);
}

function summaryTypeIcon(type,size=26){
  return lucideTypeIcon(type,size,1.8);
}

const AUDIT_COLOR='#86198f';
const AUDIT_BG='#fdf2f8';
const AUDIT_HEURISTIC_SETS={
  nielsen:{
    label:'Usability-Heuristiken (Nielsen)',
    criteria:[
      {id:'n1', label:'Sichtbarkeit des Systemstatus'},
      {id:'n2', label:'Übereinstimmung mit der realen Welt'},
      {id:'n3', label:'Nutzerkontrolle und Freiheit'},
      {id:'n4', label:'Konsistenz und Standards'},
      {id:'n5', label:'Fehlervermeidung'},
      {id:'n6', label:'Wiedererkennung statt Erinnerung'},
      {id:'n7', label:'Flexibilität und Effizienz'},
      {id:'n8', label:'Ästhetisches und minimalistisches Design'},
      {id:'n9', label:'Fehlerbehebung'},
      {id:'n10',label:'Hilfe und Dokumentation'},
    ]
  },
  iso9241:{
    label:'Interaktionsprinzipien (ISO 9241-110)',
    criteria:[
      {id:'i1', label:'Aufgabenangemessenheit'},
      {id:'i2', label:'Selbstbeschreibungsfähigkeit'},
      {id:'i3', label:'Erwartungskonformität'},
      {id:'i4', label:'Erlernbarkeit'},
      {id:'i5', label:'Steuerbarkeit'},
      {id:'i6', label:'Robustheit gegen Benutzungsfehler'},
      {id:'i7', label:'Benutzerbindung'},
    ]
  },
  iso9241_11:{
    label:'Gebrauchstauglichkeit (ISO 9241-11)',
    criteria:[
      {id:'u1', label:'Effektivität'},
      {id:'u2', label:'Effizienz'},
      {id:'u3', label:'Zufriedenstellung'},
    ]
  }
};
function getCriterionLabel(id){
  for(const k of Object.keys(AUDIT_HEURISTIC_SETS)){
    const c=AUDIT_HEURISTIC_SETS[k].criteria.find(x=>x.id===id);
    if(c)return c.label;
  }
  return id||'';
}
function parseAuditDate(d){
  if(!d)return{from:'',to:''};
  try{const p=JSON.parse(d);if(p&&p.from!==undefined)return p;}catch(e){}
  return{from:d,to:''};
}
function serializeAuditDate(from,to){
  if(!from&&!to)return'';
  if(!to)return from;
  return JSON.stringify({from,to});
}
function fmtAuditDate(d){
  const {from,to}=parseAuditDate(d);
  if(!from)return'';
  if(!to)return fmtDate(from);
  return`${fmtDate(from)} – ${fmtDate(to)}`;
}
function parseCriteria(s){
  if(!s)return[];
  try{const p=JSON.parse(s);if(Array.isArray(p))return p;}catch(e){}
  return[s];
}
function serializeCriteria(arr){return JSON.stringify(arr||[]);}

const CHAPTERS = [
  {id:1, label:'Vorab-Fragen'},
  {id:2, label:'Testszenario'},
  {id:3, label:'Vertiefungsfragen'},
  {id:4, label:'Abschlussbewertung'},
];
const CH_BG = {1:'#eeedfc',2:'#ccfbf1',3:'#e0f2fe',4:'#fdf2f8'};
const CH_FG = {1:'#3730a3',2:'#0d9488',3:'#0369a1',4:'#86198f'};

function editIcon(size=15){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
  </svg>`;
}

function trashIcon(size=15){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
    <path d="M3 6h18"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
  </svg>`;
}

function imageIcon(size=15){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
  </svg>`;
}

function excelIcon(size=15){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/>
    <path d="M8 13l4 5"/>
    <path d="M12 13l-4 5"/>
    <path d="M15 13h1"/>
    <path d="M15 18h1"/>
  </svg>`;
}

function pdfIcon(size=15){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <path d="M14 2v6h6"/>
    <path d="M7 17v-4h1.2a1.2 1.2 0 0 1 0 2.4H7"/>
    <path d="M12 17v-4h1a2 2 0 0 1 0 4h-1z"/>
    <path d="M17 17v-4h3"/>
    <path d="M17 15h2"/>
  </svg>`;
}
