// VSK 3.0 - Extended Data Layer
// Load AFTER data.js
(function(){
const R=(min,max)=>+(min+Math.random()*(max-min)).toFixed(1);
const RI=(min,max)=>Math.floor(min+Math.random()*(max-min));

// ═══ Districts ═══
DB.districts=[
  {id:'DIST-01',n:'Ahmedabad',type:'plains',attR:87.2,tchAttR:92.1,ptr:13.2,infraSc:72,lepAvg:63.8,lepPart:88},
  {id:'DIST-02',n:'Rajkot',type:'plains',attR:84.5,tchAttR:90.3,ptr:11.8,infraSc:75,lepAvg:61.2,lepPart:85},
  {id:'DIST-03',n:'Kutch',type:'hilly',attR:71.3,tchAttR:78.2,ptr:22.4,infraSc:48,lepAvg:47.5,lepPart:62},
  {id:'DIST-04',n:'Dangs',type:'hilly',attR:68.1,tchAttR:74.6,ptr:28.1,infraSc:41,lepAvg:42.8,lepPart:58},
  {id:'DIST-05',n:'Narmada',type:'hilly',attR:72.8,tchAttR:80.1,ptr:19.6,infraSc:52,lepAvg:49.1,lepPart:65},
  {id:'DIST-06',n:'Surat',type:'plains',attR:89.1,tchAttR:93.5,ptr:10.2,infraSc:82,lepAvg:68.4,lepPart:91},
  {id:'DIST-07',n:'Vadodara',type:'plains',attR:86.4,tchAttR:91.8,ptr:12.1,infraSc:78,lepAvg:65.2,lepPart:87},
  {id:'DIST-08',n:'Panchmahal',type:'hilly',attR:74.2,tchAttR:81.3,ptr:18.9,infraSc:55,lepAvg:51.3,lepPart:70},
  {id:'DIST-09',n:'Sabarkantha',type:'hilly',attR:73.5,tchAttR:79.8,ptr:20.2,infraSc:50,lepAvg:48.7,lepPart:67},
  {id:'DIST-10',n:'Junagadh',type:'plains',attR:82.1,tchAttR:88.9,ptr:14.5,infraSc:70,lepAvg:59.6,lepPart:82},
  {id:'DIST-11',n:'Mehsana',type:'plains',attR:85.8,tchAttR:91.2,ptr:11.5,infraSc:76,lepAvg:64.1,lepPart:86},
  {id:'DIST-12',n:'Tapi',type:'hilly',attR:69.5,tchAttR:76.4,ptr:24.8,infraSc:44,lepAvg:44.2,lepPart:60}
];

// ═══ Infrastructure compliance by component ═══
DB.infraCompliance={
  state:{toilets:78.2,girlsToilets:74.6,water:82.1,electricity:88.4,ramps:52.3,cwsn:38.7,library:61.2,sciLab:42.8,ict:35.6,boundary:72.1},
  national:{toilets:82.5,girlsToilets:79.1,water:85.3,electricity:90.2,ramps:58.1,cwsn:44.2,library:65.8,sciLab:48.3,ict:41.2,boundary:76.4},
  byDistrict:{}
};
DB.districts.forEach(d=>{
  const f=d.type==='hilly'?0.75:1.05;
  DB.infraCompliance.byDistrict[d.id]={
    toilets:+(DB.infraCompliance.state.toilets*f*R(0.85,1.1)).toFixed(1),
    girlsToilets:+(DB.infraCompliance.state.girlsToilets*f*R(0.8,1.1)).toFixed(1),
    water:+(DB.infraCompliance.state.water*f*R(0.85,1.1)).toFixed(1),
    electricity:+(DB.infraCompliance.state.electricity*f*R(0.88,1.05)).toFixed(1),
    ramps:+(DB.infraCompliance.state.ramps*f*R(0.7,1.2)).toFixed(1),
    cwsn:+(DB.infraCompliance.state.cwsn*f*R(0.65,1.15)).toFixed(1)
  };
});

// ═══ LEP data by grade and subject ═══
DB.lepData={cycle:'Endline 2025-26',prevCycle:'Baseline 2025-26',
  byGradeSubject:[
    {gr:6,sub:'Language',curr:58.2,prev:48.1,part:4250,elig:4800},
    {gr:6,sub:'Mathematics',curr:52.4,prev:42.8,part:4180,elig:4800},
    {gr:6,sub:'Science',curr:55.1,prev:45.6,part:4200,elig:4800},
    {gr:7,sub:'Language',curr:61.3,prev:50.2,part:3980,elig:4500},
    {gr:7,sub:'Mathematics',curr:48.7,prev:39.1,part:3890,elig:4500},
    {gr:7,sub:'Science',curr:53.8,prev:44.2,part:3920,elig:4500},
    {gr:8,sub:'Language',curr:64.1,prev:53.8,part:3750,elig:4200},
    {gr:8,sub:'Mathematics',curr:45.2,prev:36.4,part:3680,elig:4200},
    {gr:8,sub:'Science',curr:51.6,prev:42.1,part:3710,elig:4200},
    {gr:9,sub:'Language',curr:59.8,prev:49.5,part:3200,elig:3800},
    {gr:9,sub:'Mathematics',curr:42.1,prev:33.8,part:3100,elig:3800},
    {gr:9,sub:'Science',curr:48.3,prev:39.7,part:3150,elig:3800},
    {gr:10,sub:'Language',curr:62.5,prev:52.1,part:2980,elig:3500},
    {gr:10,sub:'Mathematics',curr:44.8,prev:35.2,part:2900,elig:3500},
    {gr:10,sub:'Science',curr:50.2,prev:41.6,part:2920,elig:3500},
    {gr:11,sub:'English',curr:56.4,prev:46.8,part:1800,elig:2200},
    {gr:12,sub:'English',curr:58.9,prev:48.2,part:1650,elig:2000}
  ],
  bands:{below40:18,b40_60:32,b60_80:35,above80:15}
};

// ═══ Teacher vacancy data ═══
DB.teacherVacancy={
  bySubject:[
    {sub:'Mathematics',sanctioned:1240,filled:980,vacancy:260,rate:21.0},
    {sub:'Science',sanctioned:1180,filled:960,vacancy:220,rate:18.6},
    {sub:'English',sanctioned:1100,filled:920,vacancy:180,rate:16.4},
    {sub:'Social Studies',sanctioned:980,filled:870,vacancy:110,rate:11.2},
    {sub:'Hindi',sanctioned:750,filled:690,vacancy:60,rate:8.0},
    {sub:'Gujarati',sanctioned:850,filled:810,vacancy:40,rate:4.7}
  ],
  byGradeBand:[
    {band:'Primary (1-5)',sanctioned:2800,filled:2450,rate:12.5},
    {band:'Upper Primary (6-8)',sanctioned:2200,filled:1820,rate:17.3},
    {band:'Secondary (9-10)',sanctioned:1600,filled:1220,rate:23.8},
    {band:'Higher Sec (11-12)',sanctioned:800,filled:560,rate:30.0}
  ],
  zeroEnrollmentWithStaff:12,
  studentsWithZeroTeachers:8,
  singleTeacherSecondary:23
};

// ═══ Correlation data (scatter plot pairs) ═══
DB.correlations={
  infraVsAttendance:DB.districts.map(d=>({name:d.n,x:d.infraSc,y:d.attR,type:d.type})),
  ptrVsLep:DB.districts.map(d=>({name:d.n,x:d.ptr,y:d.lepAvg,type:d.type})),
  tchAttVsStudAtt:DB.districts.map(d=>({name:d.n,x:d.tchAttR,y:d.attR,type:d.type})),
  infraVsLep:DB.districts.map(d=>({name:d.n,x:d.infraSc,y:d.lepAvg,type:d.type}))
};

// ═══ Projection / modeling data ═══
DB.projections={
  vacancyFilled:{
    current:{attendance:79.2,lepAvg:54.6,ptr:16.8},
    projected:{attendance:86.5,lepAvg:62.1,ptr:11.2},
    description:'If all 870 teacher vacancies across hilly districts are filled'
  },
  schoolMerger:{
    zerSchools:12,surplusTeachers:34,
    annualSaving:'2.4 Cr',perSchoolCost:'20 Lakh',
    postMergerPTR:14.2,currentPTR:16.8
  }
};

// ═══ Data quality / submission metrics ═══
DB.dataQuality={
  overall:{total:1842,allFour:1284,pct:69.7},
  byStream:{
    attendance:{submitted:1680,total:1842,pct:91.2},
    infrastructure:{submitted:1590,total:1842,pct:86.3},
    lep:{submitted:1420,total:1842,pct:77.1},
    teacherRegistry:{submitted:1510,total:1842,pct:82.0}
  },
  anomalies:[
    {school:'GPS Khanpur',block:'Daskroi',issue:'100% attendance 30 consecutive days',severity:'critical'},
    {school:'GPS Viramgam',block:'Sanand',issue:'Enrollment=0 but 3 teachers active',severity:'critical'},
    {school:'GPS Dhrangadhra',block:'Kotda Sangani',issue:'Missing infra data for 2 years',severity:'warning'},
    {school:'GPS Mandvi',block:'Lodhika',issue:'LEP scores > 95% all subjects',severity:'warning'},
    {school:'GPS Rapar',block:'Kutch East',issue:'Teacher attendance but 0 student attendance',severity:'critical'},
    {school:'GPS Songadh',block:'Tapi',issue:'Duplicate student IDs detected (14)',severity:'critical'}
  ]
};

// ═══ Gender / social category gaps ═══
DB.equityData={
  gender:{
    boys:{attendance:82.4,lepAvg:54.8,enrollment:52.1},
    girls:{attendance:80.1,lepAvg:57.2,enrollment:47.9}
  },
  socialCategory:{
    General:{attendance:86.2,lepAvg:62.1,enrollment:28.4},
    OBC:{attendance:82.8,lepAvg:56.3,enrollment:38.2},
    SC:{attendance:76.4,lepAvg:48.7,enrollment:18.6},
    ST:{attendance:71.2,lepAvg:42.1,enrollment:14.8}
  },
  worstGapDistricts:[
    {n:'Dangs',genderGap:8.2,scstGap:18.4},
    {n:'Tapi',genderGap:6.8,scstGap:16.1},
    {n:'Narmada',genderGap:5.4,scstGap:14.8}
  ]
};

// ═══ Exam readiness (winter closing) ═══
DB.examReadiness={
  overall:72,
  components:[
    {name:'Student Attendance (Nov)',value:84.2,target:85,status:'warning'},
    {name:'Teacher Attendance (Nov)',value:91.3,target:90,status:'ok'},
    {name:'Syllabus Completion',value:78,target:85,status:'critical'},
    {name:'Question Papers Ready',value:100,target:100,status:'ok'},
    {name:'Seating Arrangements',value:65,target:100,status:'critical'},
    {name:'Infra Compliance',value:72,target:80,status:'warning'}
  ]
};

// ═══ Weekly attendance trend (4 weeks) ═══
DB.weeklyTrend=[
  {week:'W1 (Mar 10-14)',student:81.2,teacher:89.4},
  {week:'W2 (Mar 17-21)',student:83.1,teacher:90.8},
  {week:'W3 (Mar 24-28)',student:82.6,teacher:91.2},
  {week:'W4 (Mar 31-Apr 4)',student:84.8,teacher:92.1}
];

})();
