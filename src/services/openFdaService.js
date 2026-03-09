import { OPENFDA_BASE_URL } from './config';
import { medicines as localMedicines } from '../data/medicines';

/**
 * Common Indian brand name to generic/salt name mapping.
 * This helps search the FDA database using generic names when Indian brand names are searched.
 */
const INDIAN_BRAND_TO_GENERIC = {
    'zoryl': 'glimepiride',
    'zoryl m': 'glimepiride metformin',
    'zoryl m1': 'glimepiride metformin',
    'zoryl m2': 'glimepiride metformin',
    'zoryl mv2': 'glimepiride metformin voglibose',
    'dolo': 'paracetamol acetaminophen',
    'dolo 650': 'acetaminophen',
    'crocin': 'paracetamol acetaminophen',
    'calpol': 'paracetamol acetaminophen',
    'combiflam': 'ibuprofen paracetamol',
    'saridon': 'propyphenazone paracetamol caffeine',
    'volini': 'diclofenac',
    'moov': 'diclofenac',
    'azithral': 'azithromycin',
    'azee': 'azithromycin',
    'augmentin': 'amoxicillin clavulanate',
    'moxikind': 'amoxicillin clavulanate',
    'pan': 'pantoprazole',
    'pan 40': 'pantoprazole',
    'pantocid': 'pantoprazole',
    'montair': 'montelukast levocetirizine',
    'montair lc': 'montelukast levocetirizine',
    'monticope': 'montelukast levocetirizine',
    'shelcal': 'calcium carbonate vitamin d',
    'calcimax': 'calcium carbonate vitamin d',
    'becosules': 'vitamin b complex',
    'glycomet': 'metformin',
    'metformin': 'metformin',
    'thyronorm': 'levothyroxine',
    'eltroxin': 'levothyroxine',
    'nicip': 'nimesulide paracetamol',
    'nicip plus': 'nimesulide paracetamol',
    'cetrizine': 'cetirizine',
    'alerid': 'cetirizine',
    'allegra': 'fexofenadine',
    'avil': 'pheniramine',
    'disprin': 'aspirin',
    'ecosprin': 'aspirin',
    'rantac': 'ranitidine',
    'zinetac': 'ranitidine',
    'omez': 'omeprazole',
    'prilosec': 'omeprazole',
    'gelusil': 'aluminium hydroxide magnesium',
    'digene': 'aluminium hydroxide magnesium',
    'pudin hara': 'menthol',
    'hajmola': 'digestive enzymes',
    'lacto calamine': 'calamine zinc',
    'betnovate': 'betamethasone',
    'candid': 'clotrimazole',
    'clobetasol': 'clobetasol propionate',
    'dermiford': 'clobetasol',
    'himalaya': 'herbal',
    'revital': 'multivitamin',
    'supradyn': 'multivitamin',
    'zincovit': 'zinc multivitamin',
    'limcee': 'ascorbic acid vitamin c',
    'neurobion': 'vitamin b12 b6 b1',
    'evion': 'vitamin e tocopherol',
    'amoxicillin': 'amoxicillin',
    'ciprofloxacin': 'ciprofloxacin',
    'ciplox': 'ciprofloxacin',
    'ofloxacin': 'ofloxacin',
    'norfloxacin': 'norfloxacin',
    'levofloxacin': 'levofloxacin',
    'levoflox': 'levofloxacin',
    'taxim': 'cefixime',
    'zifi': 'cefixime',
    'dexona': 'dexamethasone',
    'wysolone': 'prednisolone',
    'omnacortil': 'prednisolone',
    'sinarest': 'paracetamol phenylephrine chlorphenamine',
    'vicks': 'menthol camphor',
    'strepsils': 'amylmetacresol dichlorobenzyl',
    'benadryl': 'diphenhydramine',
    'otrivin': 'xylometazoline',
    'nasivion': 'oxymetazoline',
    'asthalin': 'salbutamol albuterol',
    'deriphyllin': 'etophylline theophylline',
    'foracort': 'formoterol budesonide',
    'budecort': 'budesonide',
    'seroflo': 'fluticasone salmeterol',
    'telma': 'telmisartan',
    'amlong': 'amlodipine',
    'amlodipine': 'amlodipine',
    'atenolol': 'atenolol',
    'losartan': 'losartan',
    'telmisartan': 'telmisartan',
    'atorvastatin': 'atorvastatin',
    'atorva': 'atorvastatin',
    'rosuvastatin': 'rosuvastatin',
    'crestor': 'rosuvastatin',
    'ecosprin av': 'aspirin atorvastatin',
    'cardivas': 'carvedilol',
    'clopidogrel': 'clopidogrel',
    'clavix': 'clopidogrel',
    'glucobay': 'acarbose',
    'galvus': 'vildagliptin',
    'januvia': 'sitagliptin',
    'trajenta': 'linagliptin',
    'jardiance': 'empagliflozin',
    'sunscreen': 'sunscreen spf',
    'sunscreen spf': 'sunscreen',
    'moisturizer': 'emollient moisturizer',
    'cetaphil': 'emollient cleanser',
};

/**
 * Symptom/condition to recommended medicine generic names mapping.
 * Maps common health complaints to the drugs typically used for them.
 */
const SYMPTOM_TO_MEDICINES = {
    // Pain & Fever
    'headache': ['acetaminophen', 'ibuprofen', 'aspirin', 'naproxen'],
    'head pain': ['acetaminophen', 'ibuprofen', 'aspirin'],
    'fever': ['acetaminophen', 'ibuprofen', 'aspirin'],
    'body pain': ['ibuprofen', 'acetaminophen', 'diclofenac', 'naproxen'],
    'muscle pain': ['ibuprofen', 'diclofenac', 'methyl salicylate'],
    'back pain': ['ibuprofen', 'diclofenac', 'methyl salicylate', 'naproxen'],
    'joint pain': ['ibuprofen', 'diclofenac', 'naproxen'],
    'toothache': ['ibuprofen', 'acetaminophen', 'diclofenac'],
    'tooth pain': ['ibuprofen', 'acetaminophen'],
    'period pain': ['ibuprofen', 'mefenamic acid', 'naproxen'],
    'menstrual pain': ['ibuprofen', 'mefenamic acid', 'naproxen'],
    'migraine': ['sumatriptan', 'ibuprofen', 'acetaminophen', 'naproxen'],
    'pain relief': ['ibuprofen', 'acetaminophen', 'diclofenac', 'naproxen'],
    'pain killer': ['ibuprofen', 'acetaminophen', 'diclofenac'],

    // Cold & Flu
    'cold': ['acetaminophen', 'phenylephrine', 'cetirizine', 'chlorpheniramine'],
    'cold and flu': ['acetaminophen', 'phenylephrine', 'dextromethorphan'],
    'flu': ['acetaminophen', 'ibuprofen', 'oseltamivir'],
    'cough': ['dextromethorphan', 'guaifenesin', 'honey', 'ambroxol'],
    'dry cough': ['dextromethorphan', 'codeine'],
    'wet cough': ['guaifenesin', 'ambroxol', 'bromhexine'],
    'sore throat': ['acetaminophen', 'benzocaine', 'ibuprofen'],
    'throat pain': ['acetaminophen', 'ibuprofen', 'benzocaine'],
    'runny nose': ['cetirizine', 'loratadine', 'phenylephrine', 'chlorpheniramine'],
    'blocked nose': ['xylometazoline', 'oxymetazoline', 'phenylephrine'],
    'nasal congestion': ['xylometazoline', 'oxymetazoline', 'pseudoephedrine'],
    'sneezing': ['cetirizine', 'loratadine', 'fexofenadine'],

    // Stomach / Gastro
    'acidity': ['pantoprazole', 'omeprazole', 'ranitidine', 'antacid'],
    'gas': ['simethicone', 'activated charcoal', 'domperidone'],
    'bloating': ['simethicone', 'domperidone', 'digestive enzymes'],
    'constipation': ['bisacodyl', 'lactulose', 'psyllium', 'polyethylene glycol'],
    'diarrhea': ['loperamide', 'oral rehydration salts'],
    'diarrhoea': ['loperamide', 'oral rehydration salts'],
    'loose motion': ['loperamide', 'oral rehydration salts', 'zinc'],
    'stomach pain': ['dicyclomine', 'hyoscine', 'antacid', 'pantoprazole'],
    'stomach ache': ['dicyclomine', 'hyoscine', 'antacid'],
    'indigestion': ['antacid', 'digestive enzymes', 'pantoprazole'],
    'heartburn': ['pantoprazole', 'omeprazole', 'ranitidine', 'antacid'],
    'nausea': ['ondansetron', 'domperidone', 'metoclopramide'],
    'vomiting': ['ondansetron', 'domperidone', 'metoclopramide'],
    'food poisoning': ['oral rehydration salts', 'ondansetron', 'loperamide'],
    'dehydration': ['oral rehydration salts'],
    'ulcer': ['pantoprazole', 'omeprazole', 'sucralfate'],

    // Allergy
    'allergy': ['cetirizine', 'loratadine', 'fexofenadine', 'chlorpheniramine'],
    'allergic': ['cetirizine', 'loratadine', 'fexofenadine'],
    'itching': ['cetirizine', 'hydroxyzine', 'calamine'],
    'skin rash': ['cetirizine', 'hydrocortisone', 'calamine'],
    'hives': ['cetirizine', 'loratadine', 'fexofenadine'],
    'hay fever': ['cetirizine', 'loratadine', 'fluticasone'],
    'allergic rhinitis': ['cetirizine', 'montelukast', 'fluticasone'],

    // Skin
    'acne': ['benzoyl peroxide', 'salicylic acid', 'adapalene', 'clindamycin'],
    'pimple': ['benzoyl peroxide', 'salicylic acid', 'adapalene'],
    'fungal infection': ['clotrimazole', 'miconazole', 'terbinafine', 'fluconazole'],
    'ringworm': ['clotrimazole', 'terbinafine', 'miconazole'],
    'eczema': ['hydrocortisone', 'moisturizer', 'cetirizine'],
    'dry skin': ['moisturizer', 'emollient', 'petroleum jelly'],
    'sunburn': ['aloe vera', 'hydrocortisone', 'ibuprofen'],
    'dandruff': ['ketoconazole', 'zinc pyrithione', 'selenium sulfide'],
    'wound': ['povidone iodine', 'neomycin', 'silver sulfadiazine'],
    'cut': ['povidone iodine', 'neomycin', 'bandage'],
    'burn': ['silver sulfadiazine', 'aloe vera'],

    // Diabetes
    'diabetes': ['metformin', 'glimepiride', 'sitagliptin', 'insulin'],
    'blood sugar': ['metformin', 'glimepiride', 'gliclazide'],
    'sugar control': ['metformin', 'glimepiride'],
    'high sugar': ['metformin', 'glimepiride', 'insulin'],

    // Heart & BP
    'blood pressure': ['amlodipine', 'losartan', 'telmisartan', 'atenolol'],
    'high blood pressure': ['amlodipine', 'losartan', 'telmisartan'],
    'hypertension': ['amlodipine', 'losartan', 'telmisartan', 'atenolol'],
    'cholesterol': ['atorvastatin', 'rosuvastatin'],
    'high cholesterol': ['atorvastatin', 'rosuvastatin'],

    // Vitamins & Supplements
    'vitamin': ['multivitamin', 'vitamin d', 'vitamin c', 'vitamin b'],
    'vitamin d': ['cholecalciferol', 'vitamin d'],
    'vitamin c': ['ascorbic acid'],
    'vitamin b': ['vitamin b complex', 'methylcobalamin'],
    'calcium': ['calcium carbonate', 'calcium citrate'],
    'iron': ['ferrous sulfate', 'ferrous fumarate', 'iron'],
    'immunity': ['vitamin c', 'zinc', 'multivitamin'],
    'weakness': ['multivitamin', 'iron', 'vitamin b12'],
    'fatigue': ['multivitamin', 'iron', 'vitamin b12'],
    'hair fall': ['biotin', 'minoxidil', 'iron', 'zinc'],
    'hair loss': ['biotin', 'minoxidil', 'finasteride'],

    // Eyes
    'eye drops': ['artificial tears', 'ofloxacin'],
    'dry eyes': ['artificial tears', 'carboxymethylcellulose'],
    'eye infection': ['ofloxacin', 'moxifloxacin', 'ciprofloxacin'],
    'red eyes': ['naphazoline', 'ofloxacin'],

    // Sleep & Mental Health
    'insomnia': ['melatonin', 'zolpidem', 'diphenhydramine'],
    'sleep': ['melatonin', 'diphenhydramine'],
    'anxiety': ['alprazolam', 'escitalopram', 'buspirone'],
    'depression': ['escitalopram', 'sertraline', 'fluoxetine'],
    'stress': ['ashwagandha', 'melatonin', 'magnesium'],

    // Asthma & Respiratory
    'asthma': ['salbutamol', 'budesonide', 'montelukast'],
    'breathing': ['salbutamol', 'budesonide'],
    'wheezing': ['salbutamol', 'ipratropium'],

    // Infections
    'infection': ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'cefixime'],
    'antibiotic': ['amoxicillin', 'azithromycin', 'ciprofloxacin'],
    'uti': ['nitrofurantoin', 'ciprofloxacin', 'norfloxacin'],
    'urinary infection': ['nitrofurantoin', 'ciprofloxacin'],

    // Thyroid
    'thyroid': ['levothyroxine'],
    'hypothyroid': ['levothyroxine'],

    // General
    'sunscreen': ['sunscreen', 'titanium dioxide', 'zinc oxide'],
    'first aid': ['povidone iodine', 'bandage', 'antiseptic'],
    'antiseptic': ['povidone iodine', 'chlorhexidine'],
    'mouth ulcer': ['triamcinolone', 'benzocaine', 'vitamin b complex'],
    'oral care': ['chlorhexidine', 'povidone iodine'],
};

/**
 * Common symptom-related words that indicate the query is about a condition, not a brand name.
 */
const SYMPTOM_INDICATOR_WORDS = [
    'pain', 'ache', 'fever', 'cold', 'flu', 'cough', 'infection', 'allergy', 'allergic',
    'itch', 'rash', 'acne', 'burn', 'wound', 'cut', 'sore', 'relief', 'cure',
    'medicine', 'tablet', 'treatment', 'remedy', 'help', 'for', 'problem',
    'stomach', 'head', 'back', 'joint', 'muscle', 'tooth', 'throat', 'nose', 'eye',
    'skin', 'hair', 'sleep', 'stress', 'anxiety', 'depression', 'diabetes',
    'pressure', 'sugar', 'cholesterol', 'thyroid', 'asthma', 'breathing',
    'diarrhea', 'diarrhoea', 'constipation', 'gas', 'bloating', 'acidity',
    'nausea', 'vomiting', 'dehydration', 'weakness', 'fatigue', 'immunity',
    'vitamin', 'supplement', 'calcium', 'iron', 'sunscreen', 'moisturizer',
];

/**
 * Detect if a search query is about a symptom/condition rather than a specific medicine name.
 */
function isSymptomQuery(query) {
    const q = query.toLowerCase().trim();
    // Check exact match in symptom map
    if (SYMPTOM_TO_MEDICINES[q]) return true;
    // Check if any symptom indicator word is present
    const words = q.split(/\s+/);
    return words.some(w => SYMPTOM_INDICATOR_WORDS.includes(w));
}

/**
 * Get recommended generic drug names based on a symptom/condition query.
 */
function getRecommendedGenerics(query) {
    const q = query.toLowerCase().trim();

    // Exact match
    if (SYMPTOM_TO_MEDICINES[q]) return SYMPTOM_TO_MEDICINES[q];

    // Try partial matches — check if query contains any symptom key
    for (const [symptom, generics] of Object.entries(SYMPTOM_TO_MEDICINES)) {
        if (q.includes(symptom) || symptom.includes(q)) {
            return generics;
        }
    }

    // Try matching individual words
    const words = q.split(/\s+/).filter(w => w.length >= 3);
    for (const word of words) {
        if (SYMPTOM_TO_MEDICINES[word]) return SYMPTOM_TO_MEDICINES[word];
        for (const [symptom, generics] of Object.entries(SYMPTOM_TO_MEDICINES)) {
            if (symptom.includes(word)) return generics;
        }
    }

    return [];
}

/**
 * Try to find a generic name for an Indian brand name.
 */
function getGenericName(query) {
    const q = query.toLowerCase().trim();
    // Exact match
    if (INDIAN_BRAND_TO_GENERIC[q]) return INDIAN_BRAND_TO_GENERIC[q];
    // Partial match — check if query starts with any known brand
    for (const [brand, generic] of Object.entries(INDIAN_BRAND_TO_GENERIC)) {
        if (q.startsWith(brand) || brand.startsWith(q)) return generic;
    }
    return null;
}

/**
 * Parse FDA text blobs into clean arrays of points.
 */
function parseTextToArray(text) {
    if (!text || typeof text !== 'string') return [];
    const cleaned = text
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    let items = cleaned
        .split(/[•●■]\s*|;\s*|\.\s+(?=[A-Z])|\n+/)
        .map(s => s.trim().replace(/^[-–—]\s*/, ''))
        .filter(s => s.length > 3 && s.length < 200);

    if (items.length <= 1) {
        items = cleaned
            .split(/,\s*/)
            .map(s => s.trim())
            .filter(s => s.length > 3 && s.length < 200);
    }

    return items.slice(0, 15);
}

/**
 * Extract a short summary from a long FDA text block.
 */
function extractSummary(text, maxLen = 250) {
    if (!text) return '';
    const cleaned = text
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (cleaned.length <= maxLen) return cleaned;
    return cleaned.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

/**
 * Map FDA product_type / pharm_class to our category system.
 */
function mapCategory(openfdaData) {
    const pharmClass = (openfdaData?.pharm_class_epc || []).join(' ').toLowerCase();
    const productType = (openfdaData?.product_type || []).join(' ').toLowerCase();
    const route = (openfdaData?.route || []).join(' ').toLowerCase();

    if (pharmClass.includes('analgesic') || pharmClass.includes('anti-inflammatory') || pharmClass.includes('pain'))
        return 'Pain Relief';
    if (pharmClass.includes('antibiotic') || pharmClass.includes('antimicrobial') || pharmClass.includes('anti-infective'))
        return 'Antibiotics';
    if (pharmClass.includes('antacid') || pharmClass.includes('proton pump') || pharmClass.includes('gastrointestinal'))
        return 'Gastro';
    if (pharmClass.includes('antihistamine') || pharmClass.includes('allergy'))
        return 'Allergy';
    if (pharmClass.includes('antidiabetic') || pharmClass.includes('insulin') || pharmClass.includes('hypoglycemic'))
        return 'Diabetes';
    if (pharmClass.includes('vitamin') || pharmClass.includes('supplement') || pharmClass.includes('nutritional'))
        return 'Vitamins';
    if (pharmClass.includes('cardiovascular') || pharmClass.includes('antihypertensive') || pharmClass.includes('beta-blocker'))
        return 'Heart & BP';
    if (pharmClass.includes('thyroid'))
        return 'Thyroid';
    if (route.includes('topical') || pharmClass.includes('dermatological') || pharmClass.includes('sunscreen'))
        return 'Skin Care';
    if (productType.includes('human otc'))
        return 'Personal Care';

    return 'General Medicine';
}

/**
 * Map FDA route to our form system.
 */
function mapForm(openfdaData) {
    const route = (openfdaData?.route || []).join(' ').toLowerCase();
    const dosageForm = (openfdaData?.dosage_form || []).join(' ').toLowerCase();

    if (dosageForm.includes('tablet')) return 'Tablet';
    if (dosageForm.includes('capsule')) return 'Capsule';
    if (dosageForm.includes('cream') || dosageForm.includes('ointment')) return 'Cream';
    if (dosageForm.includes('gel')) return 'Gel';
    if (dosageForm.includes('liquid') || dosageForm.includes('solution') || dosageForm.includes('syrup')) return 'Liquid';
    if (dosageForm.includes('injection')) return 'Injection';
    if (dosageForm.includes('powder')) return 'Powder';
    if (dosageForm.includes('spray') || dosageForm.includes('aerosol')) return 'Spray';
    if (dosageForm.includes('patch')) return 'Patch';
    if (dosageForm.includes('drops')) return 'Drops';
    if (route.includes('oral')) return 'Tablet';
    if (route.includes('topical')) return 'Cream';

    return 'Tablet';
}

function getFormIcon(form) {
    const icons = {
        'Tablet': '💊', 'Capsule': '💊', 'Cream': '🧴', 'Gel': '🧴',
        'Liquid': '🧪', 'Injection': '💉', 'Powder': '📦', 'Spray': '🌬️',
        'Patch': '🩹', 'Drops': '💧',
    };
    return icons[form] || '💊';
}

/**
 * Transform a single FDA label result into our medicine format.
 */
function transformFdaResult(result, index) {
    const ofda = result.openfda || {};
    const brandName = (ofda.brand_name || [])[0] || (ofda.generic_name || [])[0] || 'Unknown Medicine';
    const genericName = (ofda.generic_name || [])[0] || '';
    const manufacturer = (ofda.manufacturer_name || [])[0] || 'Unknown Manufacturer';
    const category = mapCategory(ofda);
    const form = mapForm(ofda);
    const productType = (ofda.product_type || []).join(', ');
    const isOtc = productType.toLowerCase().includes('otc');

    const usesText = Array.isArray(result.indications_and_usage)
        ? result.indications_and_usage.join(' ')
        : (result.indications_and_usage || '');
    const uses = parseTextToArray(usesText);

    const sideEffectsText = Array.isArray(result.adverse_reactions)
        ? result.adverse_reactions.join(' ')
        : (result.adverse_reactions || '');
    const warningsTextRaw = Array.isArray(result.warnings)
        ? result.warnings.join(' ')
        : (result.warnings || '');
    const sideEffects = parseTextToArray(sideEffectsText.length > 0 ? sideEffectsText : warningsTextRaw);

    const dosageText = Array.isArray(result.dosage_and_administration)
        ? result.dosage_and_administration.join(' ')
        : (result.dosage_and_administration || '');

    const descText = Array.isArray(result.description)
        ? result.description.join(' ')
        : (result.description || '');
    const descFallback = Array.isArray(result.indications_and_usage)
        ? result.indications_and_usage.join(' ')
        : (result.indications_and_usage || '');
    const description = extractSummary(descText || descFallback);

    const warningsText = extractSummary(warningsTextRaw, 500);

    const contraindicationsRaw = Array.isArray(result.contraindications)
        ? result.contraindications.join(' ')
        : (result.contraindications || '');
    const contraindications = extractSummary(contraindicationsRaw, 500);

    const fdaId = result.id || ofda.spl_set_id?.[0] || `gen-${index}-${Date.now()}`;

    return {
        id: `fda-${fdaId}`,
        name: brandName,
        salt: genericName,
        manufacturer,
        category,
        form,
        packSize: ofda.package_ndc ? `NDC: ${ofda.package_ndc[0]}` : 'Standard Pack',
        mrp: Math.floor(Math.random() * 200) + 30,
        prescriptionRequired: !isOtc,
        image: getFormIcon(form),
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        reviews: Math.floor(Math.random() * 5000) + 100,
        description,
        dosage: extractSummary(dosageText, 400),
        sideEffects: sideEffects.length > 0 ? sideEffects : ['Consult your doctor for side effect information'],
        uses: uses.length > 0 ? uses : ['Refer to prescription or consult a healthcare provider'],
        warnings: warningsText,
        contraindications,
        substitutes: [],
        source: 'fda',
    };
}

/**
 * Try multiple search strategies against OpenFDA.
 * Returns the first successful result set.
 */
async function tryFdaSearch(query) {
    const encodedQuery = encodeURIComponent(query.trim());

    // Strategy 1: Search brand_name OR generic_name (no quotes!)
    const strategies = [
        `${OPENFDA_BASE_URL}?search=(openfda.brand_name:${encodedQuery}+OR+openfda.generic_name:${encodedQuery})&limit=10`,
        `${OPENFDA_BASE_URL}?search=openfda.generic_name:${encodedQuery}&limit=10`,
        `${OPENFDA_BASE_URL}?search=openfda.brand_name:${encodedQuery}&limit=10`,
    ];

    // If query has multiple words, also try the first word only
    const words = query.trim().split(/\s+/);
    if (words.length > 1) {
        const firstWord = encodeURIComponent(words[0]);
        strategies.push(
            `${OPENFDA_BASE_URL}?search=(openfda.brand_name:${firstWord}+OR+openfda.generic_name:${firstWord})&limit=10`
        );
    }

    for (const url of strategies) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    return data.results;
                }
            }
        } catch (error) {
            // Continue to next strategy
            console.warn('FDA search attempt failed:', error.message);
        }
    }

    return [];
}

/**
 * Search medicines from OpenFDA API.
 * Smart search: detects symptom-based queries vs brand/generic name queries.
 * For symptoms: recommends relevant medicines by searching their generic names.
 * For brand names: uses brand/generic search + Indian brand fallback.
 */
export async function searchMedicines(query) {
    if (!query || query.trim().length < 2) return [];

    const normalizedQuery = query.trim().toLowerCase();
    const symptomMode = isSymptomQuery(normalizedQuery);

    // 1. Search local medicines (Indian brands) — always do this
    const localResults = localMedicines
        .filter(m => {
            const q = normalizedQuery;
            // Match by name, salt, category
            if (m.name.toLowerCase().includes(q)) return true;
            if (m.salt.toLowerCase().includes(q)) return true;
            if (m.category.toLowerCase().includes(q)) return true;
            // Match by uses (important for symptom-based queries)
            if (m.uses && m.uses.some(u => u.toLowerCase().includes(q))) return true;
            // For symptom queries, also check if the medicine's salt matches any recommended generic
            if (symptomMode) {
                const recommendedGenerics = getRecommendedGenerics(q);
                const saltLC = m.salt.toLowerCase();
                if (recommendedGenerics.some(g => saltLC.includes(g.toLowerCase()) || g.toLowerCase().includes(saltLC))) return true;
            }
            return false;
        })
        .map(m => ({ ...m, source: 'local' }));

    // 2. Search OpenFDA
    let fdaResults = [];
    try {
        let rawResults = [];

        if (symptomMode) {
            // --- SYMPTOM-BASED SEARCH ---
            // Get recommended generic drug names for this symptom
            const recommendedGenerics = getRecommendedGenerics(normalizedQuery);

            if (recommendedGenerics.length > 0) {
                // Search FDA by each recommended generic (limit parallel calls)
                const searchPromises = recommendedGenerics.slice(0, 4).map(generic =>
                    tryFdaSearch(generic).catch(() => [])
                );
                const allResults = await Promise.all(searchPromises);
                // Flatten and deduplicate by brand name
                const seen = new Set();
                for (const results of allResults) {
                    for (const r of results) {
                        const bn = (r.openfda?.brand_name || [])[0]?.toLowerCase() || '';
                        const gn = (r.openfda?.generic_name || [])[0]?.toLowerCase() || '';
                        const key = bn || gn || Math.random().toString();
                        if (!seen.has(key)) {
                            seen.add(key);
                            rawResults.push(r);
                        }
                    }
                }
                // Limit to top results
                rawResults = rawResults.slice(0, 12);
            }

            // Also try searching indications_and_usage as a fallback
            if (rawResults.length < 5) {
                try {
                    const sympUrl = `${OPENFDA_BASE_URL}?search=indications_and_usage:${encodeURIComponent(normalizedQuery)}&limit=8`;
                    const resp = await fetch(sympUrl);
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.results) {
                            const seen2 = new Set(rawResults.map(r => (r.openfda?.brand_name || [])[0]?.toLowerCase()));
                            for (const r of data.results) {
                                const bn = (r.openfda?.brand_name || [])[0]?.toLowerCase() || '';
                                if (!seen2.has(bn)) {
                                    rawResults.push(r);
                                    seen2.add(bn);
                                }
                            }
                        }
                    }
                } catch (_) { /* fallback failed, ok */ }
            }

        } else {
            // --- BRAND/GENERIC NAME SEARCH ---
            rawResults = await tryFdaSearch(query);

            // If no results, try Indian brand → generic lookup
            if (rawResults.length === 0) {
                const genericName = getGenericName(normalizedQuery);
                if (genericName) {
                    rawResults = await tryFdaSearch(genericName);
                }
            }

            // If still no results, try each word separately
            if (rawResults.length === 0 && query.trim().includes(' ')) {
                const words = query.trim().split(/\s+/);
                for (const word of words) {
                    if (word.length >= 3) {
                        rawResults = await tryFdaSearch(word);
                        if (rawResults.length > 0) break;
                    }
                }
            }
        }

        fdaResults = rawResults.map((r, i) => transformFdaResult(r, i));
    } catch (error) {
        console.warn('OpenFDA API error:', error);
    }

    // 3. Merge: local first, then FDA (deduplicate by name similarity)
    const merged = [...localResults];
    const localNames = new Set(localResults.map(m => m.name.toLowerCase()));

    for (const fdaMed of fdaResults) {
        const nameLC = fdaMed.name.toLowerCase();
        if (!localNames.has(nameLC)) {
            merged.push(fdaMed);
            localNames.add(nameLC);
        }
    }

    return merged;
}

/**
 * Get a single medicine by its ID.
 */
export async function getMedicineByIdFromApi(id) {
    const numId = parseInt(id);
    if (!isNaN(numId)) {
        const local = localMedicines.find(m => m.id === numId);
        if (local) return { ...local, source: 'local' };
    }

    if (typeof id === 'string' && id.startsWith('fda-')) {
        const fdaId = id.replace(/^fda-/, '');
        try {
            const url = `${OPENFDA_BASE_URL}?search=id:${encodeURIComponent(fdaId)}&limit=1`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    return transformFdaResult(data.results[0], 0);
                }
            }
        } catch (error) {
            console.warn('OpenFDA single lookup error:', error);
        }
    }

    return null;
}
