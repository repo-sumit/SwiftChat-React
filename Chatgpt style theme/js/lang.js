// VSK 3.0 - Language Layer
// All translations, locale helpers, and language state.
// Depends on: nothing (loaded first after data.js)

const LANG = {
  welcome:     { en:'Welcome to VSK 3.0!', hi:'VSK 3.0 में आपका स्वागत है!', gu:'VSK 3.0 માં આપનું સ્વાગત છે!' },
  selectRole:  { en:'Select your role', hi:'अपनी भूमिका चुनें', gu:'તમારી ભૂમિકા પસંદ કરો' },
  chooseLang:  { en:'Choose your language', hi:'अपनी भाषा चुनें', gu:'તમારી ભાષા પસંદ કરો' },

  greetings: {
    teacher:   { en:'Namaste! How can I help you today?', hi:'नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूँ?', gu:'નમસ્તે! આજે હું તમારી કેવી રીતે મદદ કરી શકું?' },
    principal: { en:'Good morning! Your school dashboard is ready.', hi:'सुप्रभात! आपका स्कूल डैशबोर्ड तैयार है।', gu:'સુપ્રભાત! તમારું શાળા ડેશબોર્ડ તૈયાર છે।' },
    block:     { en:'Welcome! Your block overview is ready.', hi:'स्वागत है! आपका खंड अवलोकन तैयार है।', gu:'સ્વાગત છે! તમારો બ્લોક ઓવરવ્યૂ તૈયાર છે।' },
    district:  { en:'Welcome! Your district command center is ready.', hi:'स्वागत है! आपका जिला कमांड सेंटर तैयार है।', gu:'સ્વાગત છે! તમારું જિલ્લા કમાન્ડ સેન્ટર તૈયાર છે।' },
    state:     { en:'Welcome, Secretary. Your state command center is ready.', hi:'स्वागत है, सचिव जी। आपका राज्य कमांड सेंटर तैयार है।', gu:'સ્વાગત છે, સચિવ સાહેબ। તમારું રાજ્ય કમાન્ડ સેન્ટર તૈયાર છે।' }
  },

  done:        { en:'Your dashboard is ready.', hi:'आपका डैशबोर्ड तैयार है।', gu:'તમારું ડેશબોર્ડ તૈયાર છે।' },
  repDone:     { en:'Your report is ready. You can share or download it from the panel.', hi:'आपकी रिपोर्ट तैयार है। पैनल से शेयर या डाउनलोड करें।', gu:'તમારો રિપોર્ટ તૈયાર છે। પેનલમાંથી શેર અથવા ડાઉનલોડ કરો.' },
  next:        { en:'What would you like to do next?', hi:'अगला कार्य क्या करना है?', gu:'હવે શું કરવું છે?' },
  whichSub:    { en:'Which subject?', hi:'कौन सा विषय?', gu:'કયો વિષય?' },
  whichGr:     { en:'Which grade?', hi:'कौन सी कक्षा?', gu:'કયું ધોરણ?' },
  whichTopic:  { en:'What topic?', hi:'कौन सा टॉपिक?', gu:'કયો ટોપિક?' },
  soon:        { en:'This feature is coming soon.', hi:'यह सुविधा जल्द उपलब्ध होगी।', gu:'આ સુવિધા ટૂંક સમયમાં ઉપલબ્ધ થશે।' },
  back:        { en:'← Back to Menu', hi:'← मेनू पर वापस', gu:'← મેનૂ પર પાછા' },
  switchR:     { en:'← Switch Role', hi:'← भूमिका बदलें', gu:'← ભૂમિકા બદલો' },
  attDone:     { en:'Attendance has been recorded.', hi:'उपस्थिति दर्ज हो गई है।', gu:'હાજરી નોંધાઈ ગઈ છે।' },

  personas: {
    teacher:   { en:'Teacher', hi:'शिक्षक', gu:'શિક્ષક' },
    principal: { en:'School Principal', hi:'विद्यालय प्रधानाचार्य', gu:'શાળાના આચાર્ય' },
    block:     { en:'Block Education Officer', hi:'खंड शिक्षा अधिकारी', gu:'બ્લોક શિક્ષણ અધિકારી' },
    district:  { en:'District Education Officer', hi:'जिला शिक्षा अधिकारी', gu:'જિલ્લા શિક્ષણ અધિકારી' },
    state:     { en:'State Education Secretary', hi:'राज्य शिक्षा सचिव', gu:'રાજ્ય શિક્ષણ સચિવ' }
  },

  personaDescs: {
    teacher:   { en:'Attendance, lessons, assessments', hi:'उपस्थिति, पाठ, मूल्यांकन', gu:'હાજરી, પાઠ, મૂલ્યાંકન' },
    principal: { en:'School dashboard, compliance', hi:'स्कूल डैशबोर्ड, अनुपालन', gu:'શાળા ડેશબોર્ડ, અનુપાલન' },
    block:     { en:'Block monitoring, inspections', hi:'खंड निगरानी, निरीक्षण', gu:'બ્લોક મોનિટરિંગ, નિરીક્ષણ' },
    district:  { en:'Analytics, interventions', hi:'विश्लेषण, हस्तक्षेप', gu:'વિશ્લેષણ, હસ્તક્ષેપ' },
    state:     { en:'Statewide KPIs, policy', hi:'राज्यव्यापी KPI, नीति', gu:'રાજ્યવ્યાપી KPI, નીતિ' }
  }
};

// ─── Helper: get current language key ───
function lk() {
  return APP_STATE.lang || 'en';
}

// ─── Helper: translate an object ───
function t(obj) {
  if (!obj) return '';
  return obj[lk()] || obj.en || '';
}

// ─── Helper: get school name in current language ───
function schoolName(sid) {
  const s = DB.schools.find(x => x.id === sid);
  if (!s) return '';
  if (lk() === 'hi') return s.nh;
  if (lk() === 'gu') return s.ng;
  return s.n;
}
