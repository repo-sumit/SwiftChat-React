// ─────────────────────────────────────────────────────────────────────────────
// VSK 3.0 Mock Data — Gujarat Education
// ─────────────────────────────────────────────────────────────────────────────

export const SCHOOL_INFO = {
  name: 'Sardar Patel Prathmik Shala',
  udise: 'GJ24010012001',
  block: 'Mehsana',
  district: 'Mehsana',
  state: 'Gujarat',
  type: 'Government',
  medium: 'Gujarati',
  principal: 'Rakesh Joshi',
  totalStudents: 342,
  totalTeachers: 18,
}

// ── Demo Credentials ──────────────────────────────────────────────────────────
export const DEMO_SSO_USERS = [
  {
    stateId: 'TCH1001',
    password: 'Demo@123',
    name: 'Priya Mehta',
    role: 'teacher',
    badge: 'Teacher',
    org: 'GPS Mehsana',
    school: 'GPS Mehsana',
    district: 'Mehsana',
    initials: 'PM',
    color: '#3B82F6',
    emoji: '👩‍🏫',
  },
  {
    stateId: 'PRI2001',
    password: 'Demo@123',
    name: 'Rakesh Joshi',
    role: 'principal',
    badge: 'Principal',
    org: 'GPS Mehsana',
    school: 'GPS Mehsana',
    district: 'Mehsana',
    initials: 'RJ',
    color: '#7C3AED',
    emoji: '🏫',
  },
  {
    stateId: 'DEO3001',
    password: 'Demo@123',
    name: 'Amit Trivedi',
    role: 'deo',
    badge: 'DEO',
    org: 'Ahmedabad District',
    school: null,
    district: 'Ahmedabad',
    initials: 'AT',
    color: '#059669',
    emoji: '📊',
  },
  {
    stateId: 'SEC4001',
    password: 'Demo@123',
    name: 'Nidhi Shah',
    role: 'state_secretary',
    badge: 'State Secretary',
    org: 'State — Gujarat',
    school: null,
    district: null,
    initials: 'NS',
    color: '#DC2626',
    emoji: '🏛️',
  },
]

export const DEMO_PHONE_USER = {
  phone: '9876543210',
  otp: '1234',
  name: 'Meena Patel',
  role: 'parent',
  badge: 'Parent',
  org: 'Parent Portal',
  childName: 'Ravi Patel',
  childGrade: 'Class 8',
  initials: 'MP',
  color: '#F59E0B',
  emoji: '👪',
}

// ── Students ──────────────────────────────────────────────────────────────────
export const STUDENTS = {
  3: [
    { id: 'STU-30001', name: 'Aarav Shah',     gender: 'M', dob: '2016-04-10', guardian: 'Raju Shah',    phone: '9876500001' },
    { id: 'STU-30002', name: 'Diya Patel',     gender: 'F', dob: '2016-08-22', guardian: 'Kirti Patel',  phone: '9876500002' },
    { id: 'STU-30003', name: 'Kabir Mehta',    gender: 'M', dob: '2016-02-14', guardian: 'Sunil Mehta',  phone: '9876500003' },
    { id: 'STU-30004', name: 'Riya Joshi',     gender: 'F', dob: '2016-06-30', guardian: 'Asha Joshi',   phone: '9876500004' },
    { id: 'STU-30005', name: 'Om Trivedi',     gender: 'M', dob: '2016-11-05', guardian: 'Dilip Trivedi',phone: '9876500005' },
    { id: 'STU-30006', name: 'Ananya Pandya',  gender: 'F', dob: '2016-03-18', guardian: 'Meena Pandya', phone: '9876500006' },
  ],
  5: [
    { id: 'STU-50001', name: 'Veer Desai',     gender: 'M', dob: '2014-07-12', guardian: 'Ramesh Desai', phone: '9876500011' },
    { id: 'STU-50002', name: 'Ishita Patel',   gender: 'F', dob: '2014-09-25', guardian: 'Kavita Patel', phone: '9876500012' },
    { id: 'STU-50003', name: 'Dev Chauhan',    gender: 'M', dob: '2014-01-08', guardian: 'Bharat Chauhan',phone:'9876500013' },
    { id: 'STU-50004', name: 'Komal Rathod',   gender: 'F', dob: '2014-05-19', guardian: 'Leela Rathod', phone: '9876500014' },
    { id: 'STU-50005', name: 'Arjun Solanki',  gender: 'M', dob: '2014-12-30', guardian: 'Vijay Solanki',phone: '9876500015' },
    { id: 'STU-50006', name: 'Nisha Gohil',    gender: 'F', dob: '2014-04-02', guardian: 'Heena Gohil',  phone: '9876500016' },
  ],
  6: [
    { id: 'STU-60001', name: 'Harsh Parmar',   gender: 'M', dob: '2013-08-15', guardian: 'Dilip Parmar', phone: '9876500021' },
    { id: 'STU-60002', name: 'Tanvi Shah',     gender: 'F', dob: '2013-03-27', guardian: 'Hetal Shah',   phone: '9876500022' },
    { id: 'STU-60003', name: 'Pranav Jain',    gender: 'M', dob: '2013-11-11', guardian: 'Suresh Jain',  phone: '9876500023' },
    { id: 'STU-60004', name: 'Keya Thakor',    gender: 'F', dob: '2013-06-04', guardian: 'Gita Thakor',  phone: '9876500024' },
    { id: 'STU-60005', name: 'Jay Prajapati',  gender: 'M', dob: '2013-02-20', guardian: 'Mohan Prajapati',phone:'9876500025'},
    { id: 'STU-60006', name: 'Pooja Vasava',   gender: 'F', dob: '2013-09-08', guardian: 'Shanta Vasava',phone: '9876500026' },
  ],
  8: [
    { id: 'STU-80001', name: 'Ravi Patel',     gender: 'M', dob: '2011-05-14', guardian: 'Meena Patel',  phone: '9876543210', risk: 'high'   },
    { id: 'STU-80002', name: 'Komal Patel',    gender: 'F', dob: '2011-09-22', guardian: 'Jayesh Patel', phone: '9876500032', risk: 'medium' },
    { id: 'STU-80003', name: 'Ananya Pandya',  gender: 'F', dob: '2011-01-30', guardian: 'Meena Pandya', phone: '9876500033', risk: 'low'    },
    { id: 'STU-80004', name: 'Ravi Parmar',    gender: 'M', dob: '2011-07-04', guardian: 'Dilip Parmar', phone: '9876500034', risk: 'medium' },
    { id: 'STU-80005', name: 'Sneha Barot',    gender: 'F', dob: '2011-12-19', guardian: 'Rita Barot',   phone: '9876500035', risk: 'low'    },
    { id: 'STU-80006', name: 'Harsh Bhatt',    gender: 'M', dob: '2011-03-08', guardian: 'Kiran Bhatt',  phone: '9876500036', risk: 'high'   },
    { id: 'STU-80007', name: 'Krupa Mehta',    gender: 'F', dob: '2011-10-25', guardian: 'Nilam Mehta',  phone: '9876500037', risk: 'low'    },
    { id: 'STU-80008', name: 'Siddh Rao',      gender: 'M', dob: '2011-06-13', guardian: 'Prashant Rao', phone: '9876500038', risk: 'low'    },
    { id: 'STU-80009', name: 'Hetal Chauhan',  gender: 'F', dob: '2011-02-07', guardian: 'Bharat Chauhan',phone:'9876500039', risk: 'medium' },
    { id: 'STU-80010', name: 'Dhruv Vaghela',  gender: 'M', dob: '2011-08-31', guardian: 'Suresh Vaghela',phone:'9876500040', risk: 'high'  },
  ],
}

// ── Performance data ──────────────────────────────────────────────────────────
export const PERF_DATA = {
  3:  { math: 76, sci: 72, guj: 80, students: [ {name:'Aarav Shah',m:82,s:78,g:85,lvl:'Proficient'}, {name:'Diya Patel',m:90,s:88,g:92,lvl:'Advanced'}, {name:'Kabir Mehta',m:65,s:62,g:70,lvl:'Basic'}, {name:'Riya Joshi',m:78,s:75,g:82,lvl:'Proficient'}, {name:'Om Trivedi',m:60,s:58,g:65,lvl:'Basic'}, {name:'Ananya Pandya',m:85,s:80,g:88,lvl:'Advanced'} ] },
  5:  { math: 71, sci: 68, guj: 74, students: [ {name:'Veer Desai',m:75,s:72,g:78,lvl:'Proficient'}, {name:'Ishita Patel',m:88,s:85,g:90,lvl:'Advanced'}, {name:'Dev Chauhan',m:62,s:60,g:65,lvl:'Basic'}, {name:'Komal Rathod',m:70,s:68,g:72,lvl:'Proficient'}, {name:'Arjun Solanki',m:55,s:52,g:58,lvl:'Basic'}, {name:'Nisha Gohil',m:80,s:78,g:82,lvl:'Proficient'} ] },
  6:  { math: 68, sci: 65, guj: 72, students: [ {name:'Harsh Parmar',m:72,s:68,g:75,lvl:'Proficient'}, {name:'Tanvi Shah',m:85,s:82,g:88,lvl:'Advanced'}, {name:'Pranav Jain',m:60,s:58,g:62,lvl:'Basic'}, {name:'Keya Thakor',m:68,s:65,g:70,lvl:'Proficient'}, {name:'Jay Prajapati',m:52,s:50,g:55,lvl:'Basic'}, {name:'Pooja Vasava',m:78,s:75,g:80,lvl:'Proficient'} ] },
  8:  { math: 74, sci: 70, guj: 77, students: [ {name:'Ravi Patel',m:58,s:55,g:60,lvl:'Basic'}, {name:'Komal Patel',m:80,s:78,g:82,lvl:'Proficient'}, {name:'Ananya Pandya',m:92,s:90,g:94,lvl:'Advanced'}, {name:'Ravi Parmar',m:72,s:70,g:74,lvl:'Proficient'}, {name:'Sneha Barot',m:86,s:84,g:88,lvl:'Advanced'}, {name:'Harsh Bhatt',m:50,s:48,g:52,lvl:'Basic'}, {name:'Krupa Mehta',m:78,s:76,g:80,lvl:'Proficient'}, {name:'Siddh Rao',m:82,s:80,g:85,lvl:'Advanced'}, {name:'Hetal Chauhan',m:65,s:62,g:68,lvl:'Basic'}, {name:'Dhruv Vaghela',m:45,s:42,g:48,lvl:'Basic'} ] },
}

// ── Attendance (last 7 days) ──────────────────────────────────────────────────
export const ATTENDANCE_TREND = [82, 85, 88, 80, 86, 90, 88]
export const ATTENDANCE_DAYS  = ['M', 'T', 'W', 'T', 'F', 'S', 'T']

// ── Risk scores ───────────────────────────────────────────────────────────────
export const AT_RISK_STUDENTS = [
  { name: 'Ravi Patel',   grade: 8, attendance: 58, score: 58, risk: 'high',   reason: 'Chronic absence + low score', days: 12 },
  { name: 'Dhruv Vaghela',grade: 8, attendance: 62, score: 45, risk: 'high',   reason: 'Poor learning outcomes',      days: 9  },
  { name: 'Harsh Bhatt',  grade: 8, attendance: 65, score: 50, risk: 'high',   reason: 'Monday absence pattern',      days: 8  },
  { name: 'Komal Patel',  grade: 8, attendance: 72, score: 68, risk: 'medium', reason: 'Declining trend (last 4 wks)',days: 5  },
  { name: 'Hetal Chauhan',grade: 8, attendance: 70, score: 65, risk: 'medium', reason: 'Subject-specific gap (Maths)',days: 4  },
  { name: 'Jay Prajapati',grade: 6, attendance: 71, score: 52, risk: 'medium', reason: 'Low LO scores in XAMTA',      days: 4  },
]

// ── Scholarship data ──────────────────────────────────────────────────────────
export const SCHOLARSHIP_DATA = [
  { scheme: 'Namo Laxmi Yojana', color: '#8b5cf6', eligible: 28, applied: 22, approved: 18, pending: 3, rejected: 1 },
  { scheme: 'DBT Scholarship',   color: '#3d5afe', eligible: 45, applied: 40, approved: 35, pending: 4, rejected: 1 },
  { scheme: 'EWS Admission',     color: '#059669', eligible: 12, applied: 10, approved: 9,  pending: 1, rejected: 0 },
]

// ── Districts ─────────────────────────────────────────────────────────────────
export const DISTRICTS = [
  { name: 'Ahmedabad',    schools: 892, students: 128450, attendance: 87.2, riskStudents: 1842, scholarshipRate: 82.1 },
  { name: 'Surat',        schools: 654, students: 98320,  attendance: 85.8, riskStudents: 1540, scholarshipRate: 79.4 },
  { name: 'Vadodara',     schools: 578, students: 86740,  attendance: 83.4, riskStudents: 1320, scholarshipRate: 77.8 },
  { name: 'Mehsana',      schools: 342, students: 51230,  attendance: 88.6, riskStudents: 892,  scholarshipRate: 84.3 },
  { name: 'Rajkot',       schools: 498, students: 74560,  attendance: 82.1, riskStudents: 1240, scholarshipRate: 76.2 },
  { name: 'Bhavnagar',    schools: 389, students: 58420,  attendance: 81.5, riskStudents: 1120, scholarshipRate: 74.8 },
  { name: 'Gandhinagar',  schools: 256, students: 38640,  attendance: 90.2, riskStudents: 620,  scholarshipRate: 88.5 },
  { name: 'Anand',        schools: 312, students: 46890,  attendance: 86.4, riskStudents: 840,  scholarshipRate: 81.2 },
]

// ── State summary ─────────────────────────────────────────────────────────────
export const STATE_SUMMARY = {
  totalSchools: 33248,
  totalStudents: 8240000,
  totalTeachers: 280000,
  avgAttendance: 85.4,
  avgScore: 71.2,
  scholarshipRate: 79.8,
  riskStudents: 182400,
  districtCount: 33,
}

// ── Learning outcomes (LO) ────────────────────────────────────────────────────
export const LEARNING_OUTCOMES = {
  Math: [
    { lo: 'LO1', label: 'Number Sense',      grade3: 78, grade5: 72, grade8: 68 },
    { lo: 'LO2', label: 'Operations',        grade3: 82, grade5: 76, grade8: 74 },
    { lo: 'LO3', label: 'Fractions/Decimals',grade3: 65, grade5: 60, grade8: 72 },
    { lo: 'LO4', label: 'Geometry',          grade3: 70, grade5: 68, grade8: 65 },
    { lo: 'LO5', label: 'Problem Solving',   grade3: 60, grade5: 58, grade8: 70 },
  ],
  Science: [
    { lo: 'LO1', label: 'Living Things',     grade3: 82, grade5: 78, grade8: 72 },
    { lo: 'LO2', label: 'Matter & Energy',   grade3: 70, grade5: 66, grade8: 68 },
    { lo: 'LO3', label: 'Environment',       grade3: 76, grade5: 72, grade8: 65 },
    { lo: 'LO4', label: 'Scientific Method', grade3: 62, grade5: 60, grade8: 70 },
    { lo: 'LO5', label: 'Observation',       grade3: 80, grade5: 74, grade8: 68 },
  ],
}

// ── Namo Laxmi applications ───────────────────────────────────────────────────
export const NAMO_LAXMI_APPS = [
  { studentId: 'STU-80001', studentName: 'Ravi Patel',    status: 'pending',  appId: 'NL2025GJ0012', amount: 5000, reason: 'Aadhaar mismatch' },
  { studentId: 'STU-80002', studentName: 'Komal Patel',   status: 'approved', appId: 'NL2025GJ0018', amount: 5000, reason: null },
  { studentId: 'STU-80006', studentName: 'Harsh Bhatt',   status: 'rejected', appId: 'NL2025GJ0024', amount: 5000, reason: 'Bank account invalid' },
  { studentId: 'STU-80009', studentName: 'Hetal Chauhan', status: 'pending',  appId: 'NL2025GJ0031', amount: 5000, reason: 'Guardian details incomplete' },
]

// ── User profiles (matched to demo creds) ────────────────────────────────────
export const USER_PROFILES = {
  teacher: {
    name: 'Priya Mehta', stateId: 'TCH1001', role: 'teacher', badge: 'Teacher',
    org: 'GPS Mehsana', school: 'Sardar Patel Prathmik Shala',
    district: 'Mehsana', scope: 'School', employeeId: 'EMP-GJ-10042',
    phone: '9876541001', email: 'priya.mehta@vsk.gujarat.gov.in',
    dpdpaTier: 'Tier 2 — Staff', sessionTTL: '8 hrs', lastLogin: '08/04/2026, 9:14 AM',
    tokenOrigin: 'Gujarat SSO (OIDC)', initials: 'PM', color: '#3B82F6',
  },
  principal: {
    name: 'Rakesh Joshi', stateId: 'PRI2001', role: 'principal', badge: 'Principal',
    org: 'GPS Mehsana', school: 'Sardar Patel Prathmik Shala',
    district: 'Mehsana', scope: 'School', employeeId: 'EMP-GJ-20018',
    phone: '9876542001', email: 'rakesh.joshi@vsk.gujarat.gov.in',
    dpdpaTier: 'Tier 2 — Staff', sessionTTL: '8 hrs', lastLogin: '08/04/2026, 8:52 AM',
    tokenOrigin: 'Gujarat SSO (OIDC)', initials: 'RJ', color: '#7C3AED',
  },
  deo: {
    name: 'Amit Trivedi', stateId: 'DEO3001', role: 'deo', badge: 'DEO',
    org: 'Ahmedabad District Education Office', school: null,
    district: 'Ahmedabad', scope: 'District', employeeId: 'EMP-GJ-30009',
    phone: '9876543001', email: 'amit.trivedi@deo.gujarat.gov.in',
    dpdpaTier: 'Tier 3 — Official', sessionTTL: '12 hrs', lastLogin: '08/04/2026, 7:48 AM',
    tokenOrigin: 'Gujarat SSO (SAML)', initials: 'AT', color: '#059669',
  },
  state_secretary: {
    name: 'Nidhi Shah', stateId: 'SEC4001', role: 'state_secretary', badge: 'State Secretary',
    org: 'State Education Department, Gujarat', school: null,
    district: null, scope: 'State — Gujarat', employeeId: 'IAS-GJ-0042',
    phone: '9876544001', email: 'nidhi.shah@edu.gujarat.gov.in',
    dpdpaTier: 'Tier 4 — Executive', sessionTTL: '24 hrs', lastLogin: '08/04/2026, 6:30 AM',
    tokenOrigin: 'Gujarat SSO (SAML)', initials: 'NS', color: '#DC2626',
  },
  parent: {
    name: 'Meena Patel', stateId: null, role: 'parent', badge: 'Parent',
    org: 'Parent Portal', school: 'Sardar Patel Prathmik Shala',
    district: 'Mehsana', scope: 'Student', employeeId: null,
    phone: '9876543210', email: null,
    dpdpaTier: 'Tier 1 — Citizen', sessionTTL: '4 hrs', lastLogin: '08/04/2026, 10:05 AM',
    tokenOrigin: 'Phone OTP', initials: 'MP', color: '#F59E0B',
    childName: 'Ravi Patel', childGrade: 'Class 8',
  },
}
