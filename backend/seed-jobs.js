import bcrypt from "bcrypt";
import { Op } from "sequelize";
import {
  Job,
  Organization,
  WorkingMode,
  Domain,
  JobHasDomain,
  JobRequiredLanguage,
  JobRequiredCertificate,
  Level,
  User,
  Language,
  Certification,
} from "./src/models/index.js";
import { sequelize } from "./src/config/database.js";

async function seedJobs() {
  try {
    console.log("🌱 Starting to seed job data...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✓ Database connected");

    // First, ensure we have required lookup data
    console.log("📋 Checking lookup tables...");

    // Create Organizations if they don't exist
    const organizations = await Organization.bulkCreate(
      [
        {
          name: "GlobalSpeak International",
          description:
            "Leading provider of interpretation and translation services across Asia Pacific",
          logo: "https://via.placeholder.com/100/0a65cc/ffffff?text=GS",
          website: "https://globalspeak.com",
          email: "hr@globalspeak.com",
          phone: "+84 28 1234 5678",
          address: "123 Nguyen Hue St, District 1",
          province: "Ho Chi Minh City",
          isActive: true,
        },
        {
          name: "MedLingua Healthcare Services",
          description:
            "Specialized medical interpretation and healthcare communications",
          logo: "https://via.placeholder.com/100/22c55e/ffffff?text=ML",
          website: "https://medlingua.vn",
          email: "careers@medlingua.vn",
          phone: "+84 24 9876 5432",
          address: "456 Ba Trieu St, Hai Ba Trung",
          province: "Hanoi",
          isActive: true,
        },
        {
          name: "JusticeWords Legal Services",
          description: "Certified court and legal interpretation services",
          logo: "https://via.placeholder.com/100/ef4444/ffffff?text=JW",
          website: "https://justicewords.vn",
          email: "legal@justicewords.vn",
          phone: "+84 236 789 0123",
          address: "789 Tran Phu St, Hai Chau",
          province: "Da Nang",
          isActive: true,
        },
        {
          name: "VirtualLink Remote Services",
          description: "Remote interpretation and virtual meeting solutions",
          logo: "https://via.placeholder.com/100/8b5cf6/ffffff?text=VL",
          website: "https://virtuallink.com",
          email: "remote@virtuallink.com",
          phone: "+84 90 1234 5678",
          address: "Remote Operations Center",
          province: "Remote",
          isActive: true,
        },
        {
          name: "VietnamTours & Travel",
          description: "Tourism and hospitality interpretation services",
          logo: "https://via.placeholder.com/100/f59e0b/ffffff?text=VT",
          website: "https://vietnamtours.vn",
          email: "tours@vietnamtours.vn",
          phone: "+84 28 5555 6666",
          address: "321 Le Loi St, District 1",
          province: "Ho Chi Minh City",
          isActive: true,
        },
        {
          name: "TechTrans Manufacturing",
          description:
            "Technical interpretation for manufacturing and engineering",
          logo: "https://via.placeholder.com/100/06b6d4/ffffff?text=TT",
          website: "https://techtrans.vn",
          email: "hr@techtrans.vn",
          phone: "+84 274 333 4444",
          address: "Industrial Zone 1, Thu Dau Mot",
          province: "Binh Duong",
          isActive: true,
        },
        {
          name: "EduBridge International",
          description:
            "Educational interpretation and student support services",
          logo: "https://via.placeholder.com/100/3b82f6/ffffff?text=EB",
          website: "https://edubridge.edu.vn",
          email: "campus@edubridge.edu.vn",
          phone: "+84 24 7777 8888",
          address: "Cau Giay Campus, Hanoi University District",
          province: "Hanoi",
          isActive: true,
        },
        {
          name: "SinoViet Business Partners",
          description: "China-Vietnam business facilitation and interpretation",
          logo: "https://via.placeholder.com/100/dc2626/ffffff?text=SV",
          website: "https://sinoviet.com.vn",
          email: "business@sinoviet.com.vn",
          phone: "+84 28 9999 0000",
          address: "Bitexco Tower, District 1",
          province: "Ho Chi Minh City",
          isActive: true,
        },
        {
          name: "K-Wave Media Entertainment",
          description: "Korean entertainment and media interpretation services",
          logo: "https://via.placeholder.com/100/ec4899/ffffff?text=KW",
          website: "https://kwavemedia.vn",
          email: "talent@kwavemedia.vn",
          phone: "+84 28 5678 9012",
          address: "Entertainment District, District 7",
          province: "Ho Chi Minh City",
          isActive: true,
        },
        {
          name: "PharmaGlobal Research",
          description:
            "Pharmaceutical research and clinical trial interpretation",
          logo: "https://via.placeholder.com/100/10b981/ffffff?text=PG",
          website: "https://pharmaglobal.com",
          email: "research@pharmaglobal.com",
          phone: "+84 90 3456 7890",
          address: "Research Park, District 9",
          province: "Ho Chi Minh City",
          isActive: true,
        },
      ],
      { ignoreDuplicates: true }
    );
    console.log(`✓ Created/verified ${organizations.length} organizations`);

    // Get working modes
    const workingModes = await WorkingMode.findAll();
    const onSiteMode = workingModes.find((m) => m.name === "On-site");
    const remoteMode = workingModes.find((m) => m.name === "Remote");
    const hybridMode = workingModes.find((m) => m.name === "Hybrid");

    // Get domains
    const domains = await Domain.findAll();
    const medicalDomain = domains.find((d) => d.name === "Medical");
    const legalDomain = domains.find((d) => d.name === "Legal");
    const businessDomain = domains.find((d) => d.name === "Business");
    const technicalDomain = domains.find((d) => d.name === "Technical");
    const educationDomain = domains.find((d) => d.name === "Education");
    const conferenceDomain = domains.find((d) => d.name === "Conference");

    // Get levels
    const levels = await Level.findAll();
    const b1Level = levels.find((l) => l.name === "B1");
    const b2Level = levels.find((l) => l.name === "B2");
    const c1Level = levels.find((l) => l.name === "C1");
    const c2Level = levels.find((l) => l.name === "C2");

    // Create a dummy user for language master data (if not exists)
    const [masterUser] = await User.findOrCreate({
      where: { email: "system@gbridge.com" },
      defaults: {
        fullName: "System Master Data",
        email: "system@gbridge.com",
        passwordHash: await bcrypt.hash("SystemOnly123!", 10),
        role: "admin",
        isActive: true,
        isVerified: true,
      },
    });

    // Create master language entries (for foreign key references)
    await Language.bulkCreate(
      [
        {
          userId: masterUser.id,
          name: "English",
          proficiencyLevel: "Native",
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "Vietnamese",
          proficiencyLevel: "Native",
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "Japanese",
          proficiencyLevel: "Native",
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "Korean",
          proficiencyLevel: "Native",
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "Chinese",
          proficiencyLevel: "Native",
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "French",
          proficiencyLevel: "Native",
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "German",
          proficiencyLevel: "Native",
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "Spanish",
          proficiencyLevel: "Native",
          isActive: true,
        },
      ],
      { ignoreDuplicates: true }
    );

    // Create master certification entries
    await Certification.bulkCreate(
      [
        {
          userId: masterUser.id,
          name: "IELTS",
          issuingOrganization: "British Council/IDP",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "TOEFL iBT",
          issuingOrganization: "ETS",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "TOEIC",
          issuingOrganization: "ETS",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "JLPT N1",
          issuingOrganization: "Japan Foundation",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "JLPT N2",
          issuingOrganization: "Japan Foundation",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "TOPIK I",
          issuingOrganization: "National Institute for International Education",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "TOPIK II",
          issuingOrganization: "National Institute for International Education",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "HSK 5",
          issuingOrganization: "Hanban",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "HSK 6",
          issuingOrganization: "Hanban",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "Court Interpreter Certification",
          issuingOrganization: "Judicial System",
          isVerified: true,
          isActive: true,
        },
        {
          userId: masterUser.id,
          name: "Medical Interpreter Certification",
          issuingOrganization: "Healthcare Certification Body",
          isVerified: true,
          isActive: true,
        },
      ],
      { ignoreDuplicates: true }
    );

    // Get language IDs
    const allLanguages = await Language.findAll({
      where: { userId: masterUser.id },
    });
    const getLanguageId = (name) =>
      allLanguages.find((l) => l.name === name)?.id;

    // Get certification IDs
    const allCertifications = await Certification.findAll({
      where: { userId: masterUser.id },
    });
    const getCertificationId = (name) =>
      allCertifications.find((c) => c.name === name)?.id;

    console.log("✓ Retrieved lookup data");

    // Delete old test jobs
    console.log("🗑️  Deleting old test jobs...");
    await Job.destroy({
      where: {
        title: {
          [Op.like]: "%Interpreter%",
        },
      },
    });
    console.log("✓ Old jobs deleted");

    // Get organization IDs
    const orgs = await Organization.findAll();
    const orgIds = orgs.map((o) => o.id);

    // Create jobs with realistic data
    const jobs = await Job.bulkCreate([
      {
        organizationId: orgIds[0], // GlobalSpeak
        workingModeId: onSiteMode.id,
        title: "Senior English-Vietnamese Conference Interpreter",
        province: "Ho Chi Minh City",
        commune: "District 1",
        address: "123 Nguyen Hue St, District 1, Ho Chi Minh City",
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        quantity: 2,
        descriptions:
          "We are seeking an experienced Senior English-Vietnamese Conference Interpreter to join our dynamic team. You will be responsible for providing high-quality simultaneous and consecutive interpretation services for international conferences, business meetings, and diplomatic events. The ideal candidate will have excellent command of both English and Vietnamese, with deep cultural understanding and professional presentation skills.",
        responsibility:
          "• Provide simultaneous and consecutive interpretation for conferences and meetings\n• Prepare terminology and research topics before events\n• Maintain confidentiality and neutrality\n• Collaborate with other interpreters in team settings\n• Ensure accurate and culturally appropriate communication",
        benefits:
          "• Competitive salary package ($2,500-3,500/month)\n• Health insurance and social benefits\n• Professional development opportunities\n• International conference exposure\n• Flexible working arrangements\n• Performance bonuses",
        minSalary: 2500.0,
        maxSalary: 3500.0,
        salaryType: "GROSS",
        contactEmail: "hr@globalspeak.com",
        contactPhone: "+84 28 1234 5678",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[1], // MedLingua
        workingModeId: hybridMode.id,
        title: "Medical Interpreter (Japanese-Vietnamese)",
        province: "Hanoi",
        commune: "Hai Ba Trung",
        address: "456 Ba Trieu St, Hai Ba Trung, Hanoi",
        expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        quantity: 3,
        descriptions:
          "Join our specialized medical interpretation team to bridge communication gaps between Japanese patients and Vietnamese healthcare providers. This role requires deep understanding of medical terminology in both languages and sensitivity to cultural differences in healthcare settings.",
        responsibility:
          "• Interpret for medical consultations and procedures\n• Translate medical documents and patient records\n• Accompany patients during hospital visits\n• Facilitate communication between doctors and patients\n• Maintain HIPAA compliance and patient confidentiality",
        benefits:
          "• Contract-based flexibility ($1,800-2,200/month)\n• Medical terminology training provided\n• Health insurance coverage\n• Professional development in healthcare\n• Hybrid work arrangement",
        minSalary: 1800.0,
        maxSalary: 2200.0,
        salaryType: "NET",
        contactEmail: "careers@medlingua.vn",
        contactPhone: "+84 24 9876 5432",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[2], // JusticeWords
        workingModeId: onSiteMode.id,
        title: "Certified Legal Court Interpreter",
        province: "Da Nang",
        commune: "Hai Chau",
        address: "789 Tran Phu St, Hai Chau, Da Nang",
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        quantity: 1,
        descriptions:
          "Provide certified interpretation services for court proceedings, legal depositions, and attorney-client consultations. This position requires precision, neutrality, and deep understanding of legal terminology and procedures. Must hold certified court interpreter credentials.",
        responsibility:
          "• Interpret for court proceedings and legal hearings\n• Provide sworn interpretation for depositions\n• Interpret attorney-client consultations\n• Translate legal documents accurately\n• Maintain strict confidentiality and neutrality",
        benefits:
          "• Daily rate compensation ($150-250/day)\n• Flexible scheduling\n• Legal training opportunities\n• Professional certification support\n• Continuing legal education credits",
        minSalary: 150.0,
        maxSalary: 250.0,
        salaryType: "NEGOTIABLE",
        contactEmail: "legal@justicewords.vn",
        contactPhone: "+84 236 789 0123",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[3], // VirtualLink
        workingModeId: remoteMode.id,
        title: "Remote Business Interpreter (English-Vietnamese)",
        province: "Remote",
        commune: "Remote",
        address: "Remote Position - Work from Anywhere",
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        quantity: 5,
        descriptions:
          "Join our remote interpretation team to facilitate international business communications. Work from anywhere while connecting global businesses through professional interpretation services via video conferencing platforms. Flexible schedule with opportunities to work with diverse industries.",
        responsibility:
          "• Provide remote interpretation for business meetings\n• Facilitate virtual negotiations and presentations\n• Interpret client calls and video conferences\n• Prepare meeting materials and terminology\n• Maintain professional home office setup",
        benefits:
          "• Remote work flexibility\n• Hourly rate compensation ($80-120/hour)\n• Technology allowance for equipment\n• International client exposure\n• Professional development budget\n• Performance incentives",
        minSalary: 80.0,
        maxSalary: 120.0,
        salaryType: "GROSS",
        contactEmail: "remote@virtuallink.com",
        contactPhone: "+84 90 1234 5678",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[4], // VietnamTours
        workingModeId: onSiteMode.id,
        title: "Tourism & Travel Guide Interpreter",
        province: "Ho Chi Minh City",
        commune: "District 1",
        address: "321 Le Loi St, District 1, Ho Chi Minh City",
        expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        quantity: 4,
        descriptions:
          "Enhance tourist experiences by providing interpretation and cultural guidance services. Perfect opportunity for those passionate about Vietnamese culture and hospitality industry. Work with international tourists from various countries and showcase Vietnam's rich heritage.",
        responsibility:
          "• Guide international tourists and provide interpretation\n• Share cultural insights and historical information\n• Coordinate with tour operators and hotels\n• Assist with travel arrangements and bookings\n• Handle emergency situations professionally",
        benefits:
          "• Seasonal employment ($1,200-1,800/month)\n• Tourism perks and travel opportunities\n• Cultural exchange experiences\n• Performance bonuses based on ratings\n• Language training support",
        minSalary: 1200.0,
        maxSalary: 1800.0,
        salaryType: "NET",
        contactEmail: "tours@vietnamtours.vn",
        contactPhone: "+84 28 5555 6666",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[5], // TechTrans
        workingModeId: hybridMode.id,
        title: "Technical Interpreter - Manufacturing Sector",
        province: "Binh Duong",
        commune: "Thu Dau Mot",
        address: "Industrial Zone 1, Thu Dau Mot, Binh Duong",
        expirationDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        quantity: 3,
        descriptions:
          "Join our technical interpretation team to support manufacturing operations and training programs. You'll work with international technical teams to ensure smooth knowledge transfer and operational excellence. Technical background or engineering knowledge is a plus.",
        responsibility:
          "• Interpret technical training sessions\n• Support equipment installation and commissioning\n• Translate technical documentation\n• Facilitate engineering meetings\n• Assist with quality control procedures",
        benefits:
          "• Manufacturing industry exposure ($2,000-2,800/month)\n• Technical skills training\n• Career advancement opportunities\n• Competitive benefits package\n• Hybrid work model",
        minSalary: 2000.0,
        maxSalary: 2800.0,
        salaryType: "GROSS",
        contactEmail: "hr@techtrans.vn",
        contactPhone: "+84 274 333 4444",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[6], // EduBridge
        workingModeId: onSiteMode.id,
        title: "Educational Campus Interpreter",
        province: "Hanoi",
        commune: "Cau Giay",
        address: "Cau Giay Campus, Hanoi University District",
        expirationDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        quantity: 2,
        descriptions:
          "Support international students' academic journey by providing interpretation services for lectures, orientation sessions, and campus activities. Perfect role for those passionate about education and cultural exchange in an academic environment.",
        responsibility:
          "• Interpret academic lectures and seminars\n• Support student orientation programs\n• Facilitate parent-teacher conferences\n• Translate academic materials\n• Assist with campus events and activities",
        benefits:
          "• Educational environment ($60-90/hour)\n• Student interaction opportunities\n• Flexible part-time hours\n• Professional growth in education sector\n• Campus facilities access",
        minSalary: 60.0,
        maxSalary: 90.0,
        salaryType: "NEGOTIABLE",
        contactEmail: "campus@edubridge.edu.vn",
        contactPhone: "+84 24 7777 8888",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[7], // SinoViet
        workingModeId: hybridMode.id,
        title: "Chinese-Vietnamese Business Interpreter",
        province: "Ho Chi Minh City",
        commune: "District 1",
        address: "Bitexco Tower, District 1, Ho Chi Minh City",
        expirationDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
        quantity: 2,
        descriptions:
          "Lead interpretation for high-level business negotiations between Chinese and Vietnamese companies. This role requires deep understanding of both business cultures and expertise in trade terminology. Work with executive-level clients on strategic partnerships.",
        responsibility:
          "• Interpret executive business meetings\n• Facilitate trade negotiations\n• Support investment discussions\n• Interpret at business conferences\n• Provide cultural consultation services",
        benefits:
          "• High-level business exposure ($2,800-3,500/month)\n• International networking opportunities\n• Premium compensation package\n• Career advancement to senior roles\n• Business travel opportunities",
        minSalary: 2800.0,
        maxSalary: 3500.0,
        salaryType: "GROSS",
        contactEmail: "business@sinoviet.com.vn",
        contactPhone: "+84 28 9999 0000",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[8], // K-Wave
        workingModeId: onSiteMode.id,
        title: "Korean Entertainment & Media Interpreter",
        province: "Ho Chi Minh City",
        commune: "District 7",
        address: "Entertainment District, District 7, Ho Chi Minh City",
        expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        quantity: 3,
        descriptions:
          "Be part of the Korean entertainment wave in Vietnam! Provide interpretation for K-pop events, drama productions, celebrity interviews, and cultural exchange programs between Korea and Vietnam. Perfect for Korean entertainment enthusiasts.",
        responsibility:
          "• Interpret for entertainment events and concerts\n• Support celebrity interviews and press conferences\n• Facilitate TV and drama production\n• Interpret fan meetings and events\n• Coordinate with Korean production teams",
        benefits:
          "• Entertainment industry access ($1,500-2,200/month)\n• Celebrity interaction opportunities\n• Cultural experiences and events\n• Media exposure and networking\n• Event tickets and perks",
        minSalary: 1500.0,
        maxSalary: 2200.0,
        salaryType: "NET",
        contactEmail: "talent@kwavemedia.vn",
        contactPhone: "+84 28 5678 9012",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[9], // PharmaGlobal
        workingModeId: remoteMode.id,
        title: "Pharmaceutical Research Interpreter",
        province: "Remote",
        commune: "Remote",
        address: "Remote Position - Global Operations",
        expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        quantity: 2,
        descriptions:
          "Provide highly specialized interpretation services for pharmaceutical research, clinical trials, and regulatory affairs. This role requires deep understanding of medical and pharmaceutical terminology with strict confidentiality requirements. Work with international research teams.",
        responsibility:
          "• Interpret clinical trial meetings\n• Support regulatory compliance discussions\n• Translate research documentation\n• Facilitate investigator meetings\n• Interpret ethical review board sessions",
        benefits:
          "• Premium compensation ($3,000-4,200/month)\n• Pharmaceutical research exposure\n• Professional development in medical field\n• Remote work flexibility\n• International collaboration opportunities",
        minSalary: 3000.0,
        maxSalary: 4200.0,
        salaryType: "GROSS",
        contactEmail: "research@pharmaglobal.com",
        contactPhone: "+84 90 3456 7890",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[0], // GlobalSpeak
        workingModeId: hybridMode.id,
        title: "Junior Business Interpreter (English-Vietnamese)",
        province: "Hanoi",
        commune: "Ba Dinh",
        address: "55 Nguyen Chi Thanh, Ba Dinh, Hanoi",
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        quantity: 3,
        descriptions:
          "Great opportunity for junior interpreters to start their career in business interpretation. Work with experienced mentors and gain exposure to various business sectors. Training and development provided.",
        responsibility:
          "• Assist senior interpreters in business meetings\n• Interpret routine business communications\n• Translate business documents\n• Participate in training programs\n• Build professional interpretation skills",
        benefits:
          "• Entry-level opportunity ($1,200-1,800/month)\n• Mentorship from senior interpreters\n• Professional training provided\n• Career growth path\n• Hybrid work flexibility",
        minSalary: 1200.0,
        maxSalary: 1800.0,
        salaryType: "NET",
        contactEmail: "hr@globalspeak.com",
        contactPhone: "+84 28 1234 5678",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[1], // MedLingua
        workingModeId: onSiteMode.id,
        title: "Medical Interpreter (English-Vietnamese) - Full-time",
        province: "Da Nang",
        commune: "Thanh Khe",
        address: "Hospital District, Thanh Khe, Da Nang",
        expirationDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        quantity: 2,
        descriptions:
          "Full-time medical interpreter position for healthcare facilities in Da Nang. Work with international patients and Vietnamese healthcare providers in hospital settings. Medical background or certification preferred.",
        responsibility:
          "• Provide on-site medical interpretation\n• Support emergency room communications\n• Interpret during medical procedures\n• Translate patient records and prescriptions\n• Maintain medical ethics and confidentiality",
        benefits:
          "• Full-time position ($2,200-3,000/month)\n• Health insurance and benefits\n• Medical terminology training\n• Stable healthcare environment\n• Professional development",
        minSalary: 2200.0,
        maxSalary: 3000.0,
        salaryType: "GROSS",
        contactEmail: "careers@medlingua.vn",
        contactPhone: "+84 24 9876 5432",
        statusOpenStop: "open",
      },
      {
        organizationId: orgIds[3], // VirtualLink
        workingModeId: remoteMode.id,
        title: "Freelance Interpreter - Multiple Languages",
        province: "Remote",
        commune: "Remote",
        address: "Work from Home",
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        quantity: 10,
        descriptions:
          "Join our network of freelance interpreters! Flexible schedule, work on projects that match your expertise and availability. Support for multiple language pairs including English, Japanese, Korean, Chinese, and more.",
        responsibility:
          "• Accept interpretation assignments based on availability\n• Provide professional remote interpretation\n• Meet quality standards and deadlines\n• Maintain professional communication\n• Build long-term client relationships",
        benefits:
          "• Maximum flexibility ($50-150/hour based on language)\n• Choose your own schedule\n• Work from anywhere\n• Diverse project types\n• Performance bonuses",
        minSalary: 50.0,
        maxSalary: 150.0,
        salaryType: "NEGOTIABLE",
        contactEmail: "remote@virtuallink.com",
        contactPhone: "+84 90 1234 5678",
        statusOpenStop: "open",
      },
    ]);

    console.log(`✓ Created ${jobs.length} jobs`);

    // Now add job domains
    console.log("📌 Adding job domains...");
    const jobDomains = [];

    // Job 1: Conference domain
    if (conferenceDomain) {
      jobDomains.push({ jobId: jobs[0].id, domainId: conferenceDomain.id });
      jobDomains.push({ jobId: jobs[0].id, domainId: businessDomain.id });
    }

    // Job 2: Medical domain
    if (medicalDomain) {
      jobDomains.push({ jobId: jobs[1].id, domainId: medicalDomain.id });
    }

    // Job 3: Legal domain
    if (legalDomain) {
      jobDomains.push({ jobId: jobs[2].id, domainId: legalDomain.id });
    }

    // Job 4: Business domain
    if (businessDomain) {
      jobDomains.push({ jobId: jobs[3].id, domainId: businessDomain.id });
    }

    // Job 5: Tourism/Business domains
    if (businessDomain) {
      jobDomains.push({ jobId: jobs[4].id, domainId: businessDomain.id });
    }

    // Job 6: Technical domain
    if (technicalDomain) {
      jobDomains.push({ jobId: jobs[5].id, domainId: technicalDomain.id });
    }

    // Job 7: Education domain
    if (educationDomain) {
      jobDomains.push({ jobId: jobs[6].id, domainId: educationDomain.id });
    }

    // Job 8: Business domain
    if (businessDomain) {
      jobDomains.push({ jobId: jobs[7].id, domainId: businessDomain.id });
    }

    // Job 9: Business/Entertainment
    if (businessDomain) {
      jobDomains.push({ jobId: jobs[8].id, domainId: businessDomain.id });
    }

    // Job 10: Medical/Technical
    if (medicalDomain && technicalDomain) {
      jobDomains.push({ jobId: jobs[9].id, domainId: medicalDomain.id });
      jobDomains.push({ jobId: jobs[9].id, domainId: technicalDomain.id });
    }

    // Job 11: Business domain
    if (businessDomain) {
      jobDomains.push({ jobId: jobs[10].id, domainId: businessDomain.id });
    }

    // Job 12: Medical domain
    if (medicalDomain) {
      jobDomains.push({ jobId: jobs[11].id, domainId: medicalDomain.id });
    }

    // Job 13: Multiple domains
    if (businessDomain && technicalDomain && educationDomain) {
      jobDomains.push({ jobId: jobs[12].id, domainId: businessDomain.id });
      jobDomains.push({ jobId: jobs[12].id, domainId: technicalDomain.id });
      jobDomains.push({ jobId: jobs[12].id, domainId: educationDomain.id });
    }

    await JobHasDomain.bulkCreate(jobDomains);
    console.log(`✓ Added ${jobDomains.length} job-domain relationships`);

    // Add required languages
    console.log("🌐 Adding required languages...");
    const jobLanguages = [
      // Job 1: English-Vietnamese
      {
        jobId: jobs[0].id,
        languageId: getLanguageId("English"),
        levelId: c1Level?.id || null,
      },
      {
        jobId: jobs[0].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 2: Japanese-Vietnamese
      {
        jobId: jobs[1].id,
        languageId: getLanguageId("Japanese"),
        levelId: b2Level?.id || null,
      },
      {
        jobId: jobs[1].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 3: English-Vietnamese
      {
        jobId: jobs[2].id,
        languageId: getLanguageId("English"),
        levelId: c1Level?.id || null,
      },
      {
        jobId: jobs[2].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 4: English-Vietnamese
      {
        jobId: jobs[3].id,
        languageId: getLanguageId("English"),
        levelId: b2Level?.id || null,
      },
      {
        jobId: jobs[3].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c1Level?.id || null,
      },

      // Job 5: English-Vietnamese
      {
        jobId: jobs[4].id,
        languageId: getLanguageId("English"),
        levelId: b1Level?.id || null,
      },
      {
        jobId: jobs[4].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 6: English-Vietnamese
      {
        jobId: jobs[5].id,
        languageId: getLanguageId("English"),
        levelId: b2Level?.id || null,
      },
      {
        jobId: jobs[5].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c1Level?.id || null,
      },

      // Job 7: English-Vietnamese
      {
        jobId: jobs[6].id,
        languageId: getLanguageId("English"),
        levelId: b2Level?.id || null,
      },
      {
        jobId: jobs[6].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 8: Chinese-Vietnamese
      {
        jobId: jobs[7].id,
        languageId: getLanguageId("Chinese"),
        levelId: c1Level?.id || null,
      },
      {
        jobId: jobs[7].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 9: Korean-Vietnamese
      {
        jobId: jobs[8].id,
        languageId: getLanguageId("Korean"),
        levelId: b2Level?.id || null,
      },
      {
        jobId: jobs[8].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c1Level?.id || null,
      },

      // Job 10: English-Vietnamese
      {
        jobId: jobs[9].id,
        languageId: getLanguageId("English"),
        levelId: c2Level?.id || null,
      },
      {
        jobId: jobs[9].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 11: English-Vietnamese
      {
        jobId: jobs[10].id,
        languageId: getLanguageId("English"),
        levelId: b1Level?.id || null,
      },
      {
        jobId: jobs[10].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c1Level?.id || null,
      },

      // Job 12: English-Vietnamese
      {
        jobId: jobs[11].id,
        languageId: getLanguageId("English"),
        levelId: b2Level?.id || null,
      },
      {
        jobId: jobs[11].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: c2Level?.id || null,
      },

      // Job 13: Multiple languages
      {
        jobId: jobs[12].id,
        languageId: getLanguageId("English"),
        levelId: b1Level?.id || null,
      },
      {
        jobId: jobs[12].id,
        languageId: getLanguageId("Vietnamese"),
        levelId: b2Level?.id || null,
      },
    ];

    await JobRequiredLanguage.bulkCreate(jobLanguages);
    console.log(`✓ Added ${jobLanguages.length} required languages`);

    // Add required certificates
    console.log("🎓 Adding required certificates...");
    const jobCertificates = [
      // Job 1: Conference
      {
        jobId: jobs[0].id,
        certificateId: getCertificationId("IELTS"),
        minAchievementDetail: "IELTS 7.0 or higher",
      },

      // Job 2: Medical
      {
        jobId: jobs[1].id,
        certificateId: getCertificationId("JLPT N2"),
        minAchievementDetail: "JLPT N2 Pass",
      },

      // Job 3: Legal
      {
        jobId: jobs[2].id,
        certificateId: getCertificationId("Court Interpreter Certification"),
        minAchievementDetail: "Certified Court Interpreter",
      },

      // Job 6: Technical
      {
        jobId: jobs[5].id,
        certificateId: getCertificationId("TOEIC"),
        minAchievementDetail: "TOEIC 750+",
      },

      // Job 7: Education
      {
        jobId: jobs[6].id,
        certificateId: getCertificationId("IELTS"),
        minAchievementDetail: "IELTS 6.5+",
      },

      // Job 8: Business Chinese
      {
        jobId: jobs[7].id,
        certificateId: getCertificationId("HSK 5"),
        minAchievementDetail: "HSK 5 Pass",
      },

      // Job 9: Korean
      {
        jobId: jobs[8].id,
        certificateId: getCertificationId("TOPIK II"),
        minAchievementDetail: "TOPIK II Level 4+",
      },

      // Job 10: Pharmaceutical
      {
        jobId: jobs[9].id,
        certificateId: getCertificationId("IELTS"),
        minAchievementDetail: "IELTS 8.0+",
      },

      // Job 12: Medical
      {
        jobId: jobs[11].id,
        certificateId: getCertificationId("Medical Interpreter Certification"),
        minAchievementDetail: "Certified Medical Interpreter",
      },
    ];

    await JobRequiredCertificate.bulkCreate(jobCertificates);
    console.log(`✓ Added ${jobCertificates.length} required certificates`);

    console.log("✅ Job seeding completed successfully!");
    console.log(`\nCreated:`);
    console.log(`  - ${organizations.length} organizations`);
    console.log(`  - ${jobs.length} jobs`);
    console.log(`  - ${jobDomains.length} job-domain relationships`);
    console.log(`  - ${jobLanguages.length} language requirements`);
    console.log(`  - ${jobCertificates.length} certificate requirements`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding jobs:", error);
    console.error(error.stack);
    process.exit(1);
  }
}

seedJobs();
