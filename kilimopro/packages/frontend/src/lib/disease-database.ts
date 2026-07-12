/**
 * KilimoPRO AgriVision — Localized Crop Disease Database
 *
 * Kenya-specific disease data sourced from:
 * - KEPHIS (Kenya Plant Health Inspectorate Service)
 * - KALRO (Kenya Agricultural & Livestock Research Organization)
 * - PlantVillage dataset (54,000+ expertly curated images)
 * - FAO East Africa crop guides
 *
 * Each disease entry includes:
 * - Visual symptoms (what the AI should look for in images/video)
 * - Localized treatment (chemicals available in Kenya, KES prices)
 * - KEPHIS-approved protocols
 * - Organic/IPM alternatives
 * - Swahili disease name + audio script for TTS
 */

export interface CropDisease {
  id: string;
  name: string;
  swahiliName: string;
  scientificName: string;
  crop: string;
  cropSwahili: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  prevalence: 'common' | 'occasional' | 'rare';
  regions: string[]; // Kenyan counties where most prevalent

  // Visual identification (for Gemini multimodal analysis)
  visualSymptoms: {
    leafColor: string[];      // e.g., ['brown spots', 'yellow halo']
    leafPattern: string;      // e.g., 'concentric rings', 'irregular lesions'
    location: string[];       // e.g., ['lower leaves', 'leaf margins']
    stage: string;            // growth stage when symptoms appear
    distinctiveFeature: string; // what makes this disease unique
  };

  // Treatment (KEPHIS-approved)
  treatment: {
    chemical: {
      product: string;
      activeIngredient: string;
      dosage: string;
      frequency: string;
      priceKES: number;
      availableAt: string; // where to buy
    }[];
    organic: {
      method: string;
      instructions: string;
    }[];
    cultural: string[]; // farm management practices
  };

  // Audio response script (for TTS in Swahili)
  audioScriptSwahili: string;
  audioScriptEnglish: string;

  // RAG context (for grounding Gemini's response)
  ragContext: string;
}

export const DISEASE_DATABASE: CropDisease[] = [
  {
    id: 'maize-fall-armyworm',
    name: 'Fall Armyworm',
    swahiliName: 'Kiwigwijwi wa Jeshi',
    scientificName: 'Spodoptera frugiperda',
    crop: 'Maize',
    cropSwahili: 'Mahindi',
    severity: 'critical',
    prevalence: 'common',
    regions: ['Trans Nzoia', 'Uasin Gishu', 'Nakuru', 'Bungoma', 'Kakamega', 'Bomet'],

    visualSymptoms: {
      leafColor: ['light green to transparent patches', 'ragged feeding holes', 'sawdust-like frass near whorl'],
      leafPattern: 'window pane feeding (eats leaf surface, leaves transparent patches)',
      location: ['whorl (growing point)', 'upper leaves'],
      stage: 'vegetative (2-8 weeks after planting)',
      distinctiveFeature: 'caterpillar with inverted Y mark on head, found inside whorl',
    },

    treatment: {
      chemical: [
        {
          product: 'Rocket',
          activeIngredient: 'Profenofos + Cypermethrin',
          dosage: '30ml per 20L water',
          frequency: 'Every 7 days, 2-3 applications',
          priceKES: 850,
          availableAt: 'Agrovet shops nationwide, Kenya Seed Company outlets',
        },
        {
          product: 'Match',
          activeIngredient: 'Emamectin benzoate',
          dosage: '20ml per 20L water',
          frequency: 'Every 7 days, apply early morning or late evening',
          priceKES: 1200,
          availableAt: 'All licensed agrovets',
        },
      ],
      organic: [
        {
          method: 'Push-pull technology',
          instructions: 'Plant desmodium between maize rows and Napier grass around the field. The desmodium repels armyworms (push) while Napier attracts them (pull) where they can be controlled.',
        },
        {
          method: 'Neem extract spray',
          instructions: 'Mix 5ml neem oil per liter of water with a few drops of soap. Spray into the whorl in early morning. Repeat every 5 days.',
        },
        {
          method: 'Wood ash',
          instructions: 'Put a pinch of wood ash directly into the maize whorl. This dehydrates young caterpillars.',
        },
      ],
      cultural: [
        'Plant early at the onset of rains to avoid peak pest pressure',
        'Scout fields every 3 days during vegetative stage',
        'Hand-pick and destroy caterpillars from whorls (effective for small farms)',
        'Intercrop with legumes (beans, desmodium) to reduce pest incidence',
      ],
    },

    audioScriptSwahili: 'Hujambo. Nimetambua Kiwigwijwi wa Jeshi kwenye mahindi yako. Huu ni mwadudu hatari sana. Njia ya kumsimamia: Weka Rangekiti thumni kwa kila lita ishirini za maji. Puliza asubuhi mapema au jioni kwenye kilele cha mmea. Rudia baada ya siku saba. Pia, unaweza kutumia majivu kwenye kilele cha mmea kama njia ya kiasili.',
    audioScriptEnglish: 'Hello. I have identified Fall Armyworm on your maize. This is a very dangerous pest. To control it: Mix 30ml of Rocket in 20 liters of water. Spray early morning or late evening into the plant whorl. Repeat after 7 days. You can also use wood ash in the whorl as an organic method.',

    ragContext: 'Fall Armyworm (Spodoptera frugiperda) is the #1 invasive pest threatening maize production in Kenya. First reported in 2017, it has since spread to all maize-growing regions. KEPHIS recommends integrated pest management combining chemical control (Emamectin benzoate or Profenofos) with push-pull technology. Early detection is critical — yield losses can reach 100% if uncontrolled during the whorl stage. The pest is most active during the vegetative stage (2-8 weeks after planting). Organic options include neem extract, wood ash application, and biological control with Cotesia wasps. Push-pull technology developed by ICIPE has shown 80%+ reduction in armyworm damage.',
  },

  {
    id: 'maize-mln',
    name: 'Maize Lethal Necrosis (MLN)',
    swahiliName: 'Magonjwa Makali ya Mahindi',
    scientificName: 'Maize chlorotic mottle virus + Sugarcane mosaic virus',
    crop: 'Maize',
    cropSwahili: 'Mahindi',
    severity: 'critical',
    prevalence: 'common',
    regions: ['Bomet', 'Narok', 'Kisii', 'Nyamira', 'Kericho', 'Trans Nzoia'],

    visualSymptoms: {
      leafColor: ['yellow mottling', 'necrotic streaks', 'leaf drying from tips'],
      leafPattern: 'chlorotic mottle pattern with necrotic streaks along veins',
      location: ['upper leaves', 'all leaves in severe cases'],
      stage: 'all growth stages, most severe at tasseling',
      distinctiveFeature: 'entire plant may die, leaves turn brown from top down',
    },

    treatment: {
      chemical: [
        {
          product: 'Imidacloprid (Confidor)',
          activeIngredient: 'Imidacloprid',
          dosage: '10ml per 20L water',
          frequency: 'Every 14 days to control thrips vectors',
          priceKES: 950,
          availableAt: 'Licensed agrovets',
        },
      ],
      organic: [
        {
          method: 'Rogue infected plants',
          instructions: 'Pull out and burn all infected plants immediately. Do NOT compost them. The virus spreads through insect vectors.',
        },
      ],
      cultural: [
        'Plant MLN-resistant varieties: H6213, H614, WE5101, WE5102',
        'Control thrips and aphids (virus vectors) with insecticides',
        'Practice crop rotation — do NOT plant maize after maize',
        'Remove volunteer maize plants that harbor the virus',
        'Plant at recommended spacing to reduce vector movement',
      ],
    },

    audioScriptSwahili: 'Samahani, nimegundua Magonjwa Makali ya Mahindi (MLN). Huu ugonjwa hauna tiba moja kwa moja. Njia pekee ni kutoa mimea yote iliyoathirika na kuiwasha. Panda aina za mahindi zinazostahimili ugonjwa huu kama H6213 au WE5101 msimu ujao.',
    audioScriptEnglish: 'Unfortunately, I have detected Maize Lethal Necrosis (MLN). This disease has no direct cure. The only solution is to remove and burn all infected plants. Plant MLN-resistant varieties like H6213 or WE5101 next season.',

    ragContext: 'Maize Lethal Necrosis (MLN) is caused by co-infection of Maize chlorotic mottle virus (MCMV) and Sugarcane mosaic virus (SCMV). First reported in Kenya in 2011, it causes up to 100% yield loss. KEPHIS and KALRO recommend planting resistant varieties (H6213, H614, WE5101), controlling insect vectors (thrips, aphids) with Imidacloprid, rogueing infected plants, and crop rotation. The disease is most prevalent in South Rift (Bomet, Narok) and Western Kenya. There is NO chemical cure — management is entirely preventive.',
  },

  {
    id: 'tomato-tuta-absoluta',
    name: 'Tuta Absoluta (Tomato Leaf Miner)',
    swahiliName: 'Mbudusi wa Nyanya',
    scientificName: 'Tuta absoluta',
    crop: 'Tomato',
    cropSwahili: 'Nyanya',
    severity: 'critical',
    prevalence: 'common',
    regions: ['Kajiado', 'Kirinyaga', 'Meru', 'Nyeri', 'Murang\'a', 'Loitoktok'],

    visualSymptoms: {
      leafColor: ['white to gray blotch-shaped mines', 'brown necrotic patches', 'rolled leaves'],
      leafPattern: 'irregular blotch mines between leaf veins (distinctive)',
      location: ['upper leaves first', 'spreads to entire plant'],
      stage: 'all stages, most damaging during flowering',
      distinctiveFeature: 'blotch mines (not linear mines) — distinctive for Tuta',
    },

    treatment: {
      chemical: [
        {
          product: 'Coragen',
          activeIngredient: 'Chlorantraniliprole',
          dosage: '15ml per 20L water',
          frequency: 'Every 10-14 days, max 3 applications per season',
          priceKES: 1800,
          availableAt: 'Agrovet shops, Amiran Kenya distributors',
        },
        {
          product: 'Tracer',
          activeIngredient: 'Spinosad',
          dosage: '20ml per 20L water',
          frequency: 'Every 7 days, rotate with Coragen to prevent resistance',
          priceKES: 2200,
          availableAt: 'Distributor agrovets, agrochemical shops',
        },
      ],
      organic: [
        {
          method: 'Pheromone traps',
          instructions: 'Install Tuta absoluta pheromone traps at 8 traps per acre. This monitors and mass-traps male moths, reducing reproduction.',
        },
        {
          method: 'Neem + soap spray',
          instructions: 'Mix 10ml neem oil + 1 teaspoon liquid soap per liter of water. Spray underside of leaves every 5 days.',
        },
      ],
      cultural: [
        'Rotate with non-solanaceous crops (onions, cereals, legumes) for 1-2 seasons',
        'Remove and destroy infected plant debris after harvest',
        'Use insect-proof netting in greenhouses (Tuta is tiny — mesh size < 0.5mm)',
        'Install pheromone traps early (at transplanting) for monitoring',
        'Avoid planting tomatoes next to infested fields',
      ],
    },

    audioScriptSwahili: 'Nimetambua Mbudusi wa Nyanya (Tuta Absoluta). Huu ni mwadudu hatari anayeathiri nyanya. Njia za kumsimamia: Tumia Coragen mililita kumi na tano kwa kila lita ishirini za maji. Puliza kila siku kumi na nne. Pia weka mitego ya feromoni nane kwa ekari moja. Badilisha mazao na vitunguu au mahindi msimu ujao.',
    audioScriptEnglish: 'I have identified Tuta Absoluta, the tomato leaf miner. This is a dangerous pest. Control methods: Use 15ml Coragen per 20 liters of water. Spray every 14 days. Also install 8 pheromone traps per acre. Rotate with onions or maize next season.',

    ragContext: 'Tuta absoluta is an invasive pest that arrived in Kenya around 2014 and has since devastated tomato production. It causes 50-100% yield loss if uncontrolled. KEPHIS recommends an integrated approach: Coragen (Chlorantraniliprole) for chemical control, pheromone traps for monitoring and mass trapping, and crop rotation. Resistance to many insecticides has been reported, so rotation of active ingredients is critical. The pest is most prevalent in Kajiado, Kirinyaga, and Loitoktok — Kenya\'s main tomato-growing areas. Organic farmers use neem extracts and biological control with predatory bugs (Nesidiocoris). The distinctive symptom is blotch-shaped mines (not linear mines), which differentiates Tuta from other leaf miners.',
  },

  {
    id: 'tomato-early-blight',
    name: 'Early Blight',
    swahiliName: 'Madoa ya Nyanya',
    scientificName: 'Alternaria solani',
    crop: 'Tomato',
    cropSwahili: 'Nyanya',
    severity: 'moderate',
    prevalence: 'common',
    regions: ['All tomato-growing regions'],

    visualSymptoms: {
      leafColor: ['dark brown spots with concentric rings (target-board pattern)', 'yellow halo around spots'],
      leafPattern: 'concentric rings within the lesion (distinctive target pattern)',
      location: ['older/lower leaves first', 'spreads upward'],
      stage: 'after fruit set, progresses through season',
      distinctiveFeature: 'concentric ring pattern — looks like a target board',
    },

    treatment: {
      chemical: [
        {
          product: 'Copper Oxychloride',
          activeIngredient: 'Copper oxychloride',
          dosage: '40g per 20L water',
          frequency: 'Every 7-10 days',
          priceKES: 350,
          availableAt: 'All agrovets',
        },
        {
          product: 'Ridomil Gold',
          activeIngredient: 'Metalaxyl + Mancozeb',
          dosage: '50g per 20L water',
          frequency: 'Every 7-10 days, rotate with copper',
          priceKES: 750,
          availableAt: 'Agrovet shops',
        },
      ],
      organic: [
        {
          method: 'Baking soda spray',
          instructions: 'Mix 1 tablespoon baking soda + 1 teaspoon cooking oil + 1 drop liquid soap per liter of water. Spray weekly.',
        },
        {
          method: 'Compost tea',
          instructions: 'Brew compost tea for 24 hours, strain, and spray on leaves. Beneficial microorganisms suppress the pathogen.',
        },
      ],
      cultural: [
        'Remove and destroy affected lower leaves',
        'Ensure 60cm × 60cm spacing for air circulation',
        'Stake plants to keep foliage off the ground',
        'Water at the base — avoid overhead irrigation',
        'Rotate with non-solanaceous crops for 2 years',
      ],
    },

    audioScriptSwahili: 'Nimetambua Madoa ya Nyanya (Early Blight). Huu ni ugonjwa wa kawaida wa fangasi. Njia za kumsimamia: Tumia Copper Oxychloride grama arobaini kwa kila lita ishirini za maji. Puliza kila siku saba hadi kumi. Ondoa majani yaliyoathirika. Hakikisha mmea una hewa ya kutosha.',
    audioScriptEnglish: 'I have identified Early Blight on your tomatoes. This is a common fungal disease. Control: Use 40g Copper Oxychloride per 20 liters of water. Spray every 7-10 days. Remove affected leaves. Ensure good air circulation between plants.',

    ragContext: 'Early Blight (Alternaria solani) is one of the most common tomato diseases in Kenya. It causes 20-40% yield loss. The distinctive symptom is concentric ring lesions (target-board pattern) on older leaves. KEPHIS recommends copper-based fungicides and cultural practices. The fungus survives in plant debris and soil, so rotation and sanitation are critical. Disease development is favored by warm temperatures (24-29°C) and high humidity. In Kenya, it is most severe during the rainy seasons. Resistant varieties include Kilele F1 and Assila F1.',
  },

  {
    id: 'coffee-coffee-berry-disease',
    name: 'Coffee Berry Disease (CBD)',
    swahiliName: 'Ugonjwa wa Beri ya Kahawa',
    scientificName: 'Colletotrichum kahawae',
    crop: 'Coffee',
    cropSwahili: 'Kahawa',
    severity: 'critical',
    prevalence: 'common',
    regions: ['Kiambu', 'Murang\'a', 'Nyeri', 'Kirinyaga', 'Meru', 'Embu', 'Tharaka-Nithi'],

    visualSymptoms: {
      leafColor: ['dark brown sunken lesions on green berries', 'pinkish spore masses on lesion surface'],
      leafPattern: 'sunken necrotic lesions on berries, not leaves',
      location: ['green berries (pinhead to mature stage)'],
      stage: 'flowering to berry maturity',
      distinctiveFeature: 'pink/salmon spore masses on berry lesions during wet weather',
    },

    treatment: {
      chemical: [
        {
          product: 'Copper Nordox',
          activeIngredient: 'Cuprous oxide',
          dosage: '50g per 20L water',
          frequency: 'Every 14 days during flowering and berry development',
          priceKES: 600,
          availableAt: 'Coffee Board of Kenya licensed agrovets',
        },
      ],
      organic: [
        {
          method: 'Pruning for airflow',
          instructions: 'Prune to open the canopy. Good air circulation reduces humidity and disease development. Remove suckers and lower branches.',
        },
      ],
      cultural: [
        'Plant CBD-resistant varieties: Ruiru 11, Batian, SL28 (partially resistant)',
        'Prune for good air circulation (critical)',
        'Remove and bury fallen berries (source of inoculum)',
        'Spray copper-based fungicides during flowering',
        'Avoid overhead irrigation',
        'Harvest all berries — do NOT leave any on the tree',
      ],
    },

    audioScriptSwahili: 'Nimetambua Ugonjwa wa Beri ya Kahawa (CBD). Huu ni ugonjwa hatari sana kwa kahawa. Njia za kudhibiti: Puliza Copper Nordox grama hamsini kwa kila lita ishirini za maji kila siku kumi na nne wakati wa kuchanua. Pia, punga miti kwa hewa nzuri. Ondoa beri zote zilizoanguka. Panda aina za Ruiru kumi na moja au Batian.',
    audioScriptEnglish: 'I have detected Coffee Berry Disease (CBD). This is a very dangerous disease for coffee. Control: Spray 50g Copper Nordox per 20 liters every 14 days during flowering. Also, prune trees for good air circulation. Remove all fallen berries. Plant Ruiru 11 or Batian varieties.',

    ragContext: 'Coffee Berry Disease (CBD), caused by Colletotrichum kahawae, is unique to Africa and is the most destructive coffee disease in Kenya. It can cause 50-80% crop loss. The fungus attacks green berries, causing them to fall prematurely. KEPHIS and Coffee Research Institute recommend copper-based fungicides during flowering, pruning for airflow, and planting resistant varieties (Ruiru 11, Batian). The disease is most severe during the long rains (March-May) when temperature is 18-22°C and humidity is high. CBD is endemic to Kenya\'s coffee regions — all coffee farmers in Central Kenya should implement preventive measures.',
  },

  {
    id: 'cassava-cmd',
    name: 'Cassava Mosaic Disease (CMD)',
    swahiliName: 'Ugonjwa wa Mkeka wa Muhogo',
    scientificName: 'African cassava mosaic virus',
    crop: 'Cassava',
    cropSwahili: 'Muhogo',
    severity: 'high',
    prevalence: 'common',
    regions: ['Western Kenya', 'Coast', 'Nyanza', 'parts of Eastern'],

    visualSymptoms: {
      leafColor: ['yellow-green mosaic pattern', 'leaf distortion', 'reduced leaf size'],
      leafPattern: 'mosaic/mottled pattern — alternating green and yellow patches',
      location: ['all leaves on infected plant'],
      stage: 'appears 2-6 weeks after planting cuttings',
      distinctiveFeature: 'mosaic pattern + twisted/distorted leaves (not just color change)',
    },

    treatment: {
      chemical: [
        {
          product: 'Imidacloprid (Confidor)',
          activeIngredient: 'Imidacloprid',
          dosage: '10ml per 20L water',
          frequency: 'Every 21 days to control whitefly vectors',
          priceKES: 950,
          availableAt: 'Agrovet shops',
        },
      ],
      organic: [
        {
          method: 'Use disease-free planting material',
          instructions: 'Only plant cuttings from certified disease-free mother plants. Inspect for mosaic symptoms before planting.',
        },
      ],
      cultural: [
        'Plant CMD-resistant varieties: MH97/2961, MM96/5280, MM96/1871',
        'Use certified disease-free cuttings (from KALRO or approved nurseries)',
        'Rogue (remove) infected plants within 2 months of planting',
        'Control whiteflies (virus vectors) with insecticides',
        'Avoid planting cassava near already-infected fields',
      ],
    },

    audioScriptSwahili: 'Nimetambua Ugonjwa wa Mkeka wa Muhogo (CMD). Huu ni ugonjwa wa virusi unaoenea kwa nzi weupe. Njia pekee ni kutoa mimea yote iliyoathirika. Panda aina stahimilivu kama MH97/2961 msimu ujao. Tumia miche iliyothibitishwa kuwa haina ugonjwa kutoka KALRO.',
    audioScriptEnglish: 'I have detected Cassava Mosaic Disease (CMD). This is a viral disease spread by whiteflies. The only solution is to remove all infected plants. Plant resistant varieties like MH97/2961 next season. Use certified disease-free cuttings from KALRO.',

    ragContext: 'Cassava Mosaic Disease (CMD) is the most important viral disease of cassava in Kenya. It causes 20-95% yield loss. The virus is spread by whiteflies (Bemisia tabaci) and through infected planting material. KALRO recommends resistant varieties (MH97/2961, MM96/5280), use of certified disease-free cuttings, and rogueing infected plants within 2 months of planting. The disease is most prevalent in Western Kenya, Coast, and Nyanza. There is NO cure for CMD — management is entirely preventive through resistant varieties and clean planting material.',
  },
];

// Helper: search diseases by crop
export function getDiseasesByCrop(crop: string): CropDisease[] {
  return DISEASE_DATABASE.filter(d => d.crop.toLowerCase() === crop.toLowerCase());
}

// Helper: get disease by ID
export function getDiseaseById(id: string): CropDisease | undefined {
  return DISEASE_DATABASE.find(d => d.id === id);
}

// Helper: get all unique crops
export function getAllCrops(): string[] {
  return [...new Set(DISEASE_DATABASE.map(d => d.crop))];
}
