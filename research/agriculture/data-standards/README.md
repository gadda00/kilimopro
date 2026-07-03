# Agricultural Data Standards Research

**Status:** In Progress
**Priority:** High
**Author:** KilimoPRO Research Team
**Date:** 2026-07-03
**Related:** [Architecture Decisions](../README.md), [Data Sources](../../data-sources/README.md)

---

## 🎯 **OVERVIEW**

This document explores **agricultural data standards** to ensure KilimoPRO's data models align with **international and Kenyan standards**, enabling:
- **Interoperability** with other agricultural systems
- **Data consistency** across the platform
- **Compliance** with government and international requirements
- **Quality** data for better decision-making

---

## 🔍 **RESEARCH QUESTIONS**

1. What are the **key agricultural data standards** we should follow?
2. How do **Kenyan agricultural data standards** differ from international ones?
3. What **data models** should we use for crops, soil, weather, markets?
4. How can we **map our data** to existing standards?
5. What **validation rules** should we implement?

---

## 🌍 **KEY STANDARDS IDENTIFIED**

### **1. FAO Standards (Food and Agriculture Organization)**

#### **AGROVOC**
- **Purpose:** Agricultural thesaurus for indexing and retrieving data
- **Website:** [http://aims.fao.org/agrovoc](http://aims.fao.org/agrovoc)
- **Coverage:** 40,000+ concepts in 40+ languages
- **Relevance:** ✅ **HIGH** - For crop, pest, disease classification

**Key Concepts for KilimoPRO:**
```
Crops:
- Maize (Ze mays)
- Tomato (Solanum lycopersicum)
- Potato (Solanum tuberosum)
- Cassava (Manihot esculenta)
- Beans (Phaseolus vulgaris)

Pests & Diseases:
- Fall Armyworm (Spodoptera frugiperda)
- Maize Lethal Necrosis (MLN)
- Tomato Early Blight (Alternaria solani)

Soil Types:
- Sandy
- Clay
- Loam
- Peat

Climate:
- Tropical
- Subtropical
- Arid
- Semi-arid
```

**Implementation:**
- Use AGROVOC concepts for crop/pest/disease classification
- Map our internal IDs to AGROVOC URIs
- Add AGROVOC as a controlled vocabulary

#### **FAOSTAT**
- **Purpose:** Global agricultural statistics database
- **Website:** [http://www.fao.org/faostat/](http://www.fao.org/faostat/)
- **Coverage:** 200+ countries, 50+ years of data
- **Relevance:** ✅ **HIGH** - For market data, production statistics

**Key Data Elements:**
```
Production:
- Crop
- Year
- Value (tonnes)
- Area (hectares)
- Yield (tonnes/ha)

Trade:
- Commodity
- Year
- Partner country
- Trade flow (Import/Export)
- Quantity
- Value (USD)

Prices:
- Commodity
- Market
- Year/Month
- Price (local currency)
- Unit (kg, tonne, etc.)
```

**Implementation:**
- Align our market data model with FAOSTAT
- Use FAOSTAT commodity codes
- Add FAOSTAT as a data source

#### **CountrySTAT**
- **Purpose:** National agricultural statistics framework
- **Website:** [http://www.fao.org/countrystat/](http://www.fao.org/countrystat/)
- **Relevance:** ✅ **MEDIUM** - For Kenyan data integration

**Implementation:**
- Review Kenya's CountrySTAT implementation
- Align with Kenyan data standards

### **2. ISO Standards (International Organization for Standardization)**

#### **ISO 11783 (Agricultural Mobile Machinery)**
- **Purpose:** Standard for agricultural machinery data
- **Relevance:** ⚠️ **LOW** - Not directly applicable to KilimoPRO

#### **ISO 15000 (Agricultural Data Interchange)**
- **Purpose:** Standard for agricultural data exchange
- **Relevance:** ✅ **MEDIUM** - For data interchange with other systems

**Key Concepts:**
- Standardized data formats
- Common data elements
- Interoperability guidelines

**Implementation:**
- Review ISO 15000 for data interchange patterns
- Consider for API design

### **3. Kenyan Standards**

#### **NASIP 2026-2030 Data Requirements**
- **Purpose:** National Agricultural Sector Investment Plan data needs
- **Document:** [NASIP 2026-2030](https://www.kilimo.go.ke/)
- **Relevance:** ✅ **HIGH** - Must align with government requirements

**Key Data Requirements:**
```
Farmer Data:
- Farmer ID (National Farmer Registry)
- Location (County, Sub-County, Ward, Village)
- Farm size (hectares)
- Crops grown
- Livestock owned
- Inputs used

Production Data:
- Crop
- Variety
- Area planted (hectares)
- Expected yield (tonnes/ha)
- Actual yield (tonnes/ha)
- Harvest date

Market Data:
- Commodity
- Market
- Price (KES)
- Quantity
- Date
```

**Implementation:**
- Align our farmer profile with NASIP requirements
- Use NASIP data elements for production data
- Ensure compatibility with National Farmer Registry

#### **KALRO Data Standards**
- **Purpose:** Kenya Agricultural and Livestock Research Organization standards
- **Website:** [https://www.kalro.org/](https://www.kalro.org/)
- **Relevance:** ✅ **HIGH** - For crop calendars, soil data, weather

**Key Data Elements:**
```
Crop Calendars:
- Crop
- Variety
- County
- Planting dates
- Harvest dates
- Growth stages

Soil Data:
- Soil type
- Soil pH
- Organic carbon (%)
- Nitrogen (ppm)
- Phosphorus (ppm)
- Potassium (ppm)

Weather Data:
- Temperature (°C)
- Rainfall (mm)
- Humidity (%)
- Wind speed (km/h)
- Solar radiation (MJ/m²)
```

**Implementation:**
- Use KALRO crop calendars for advisory
- Align soil data with KALRO standards
- Use KALRO weather data formats

#### **KilimoSTAT**
- **Purpose:** Kenya's agricultural statistics platform
- **Website:** [https://statistics.kilimo.go.ke/](https://statistics.kilimo.go.ke/)
- **Relevance:** ✅ **HIGH** - Primary data source for Kenyan agriculture

**Key Data Elements:**
```
Production:
- Crop
- County
- Year
- Area (hectares)
- Production (tonnes)
- Yield (tonnes/ha)

Livestock:
- Type
- County
- Year
- Population
- Production (tonnes/head)

Markets:
- Market
- Commodity
- Date
- Price (KES)
- Quantity (kg/tonne)
```

**Implementation:**
- Use KilimoSTAT as primary data source
- Align our data model with KilimoSTAT
- Add KilimoSTAT API integration

---

## 📊 **DATA MODEL ALIGNMENT**

### **Current KilimoPRO Models vs Standards**

#### **1. Crop Model**

**Current:**
```typescript
// packages/backend/libs/shared-types/src/disease.ts
enum CropType {
  MAIZE = 'maize',
  TOMATO = 'tomato',
  POTATO = 'potato',
  // ...
}
```

**Proposed (Aligned with AGROVOC):**
```typescript
// Aligned with AGROVOC and FAOSTAT
interface Crop {
  id: string;                    // Internal ID
  agrovocUri: string;           // AGROVOC URI (e.g., "http://aims.fao.org/aos/agrovoc/c_4756")
  faostatCode: string;          // FAOSTAT code (e.g., "56")
  scientificName: string;       // e.g., "Zea mays"
  commonName: string;           // e.g., "Maize"
  localNames: {                 // Local names in different languages
    en: string;                 // English
    sw: string;                 // Swahili
    // ... other languages
  };
  cropType: 'cereal' | 'vegetable' | 'fruit' | 'root' | 'legume' | 'other';
  growthDuration: number;       // Days to maturity
  waterRequirement: number;     // mm/season
  temperatureRange: {           // Optimal temperature range
    min: number;                // °C
    max: number;                // °C
  };
  rainfallRequirement: {        // Optimal rainfall
    min: number;                // mm/season
    max: number;                // mm/season
  };
  soilRequirement: string[];    // e.g., ["loam", "clay"]
  phRange: {                   // Optimal pH range
    min: number;
    max: number;
  };
  isPerennial: boolean;         // Perennial or annual
  // ...
}
```

**Benefits:**
- ✅ Interoperability with FAO systems
- ✅ Better crop classification
- ✅ Support for multiple languages
- ✅ Rich crop data for better recommendations

#### **2. Location Model**

**Current:**
```typescript
// packages/backend/libs/shared-types/src/common.ts
interface Location {
  latitude: number;
  longitude: number;
  county?: string;
  subCounty?: string;
  ward?: string;
  country?: string;
}
```

**Proposed (Aligned with NASIP and Kenyan Standards):**
```typescript
interface Location {
  // Coordinates
  latitude: number;
  longitude: number;
  elevation?: number;           // Meters above sea level
  
  // Kenyan Administrative Divisions (NASIP)
  country: string;             // Default: "Kenya"
  county: string;              // Required for Kenya
  subCounty: string;          // Required for Kenya
  ward: string;                // Required for Kenya
  village?: string;            // Optional
  
  // Agro-Ecological Zone (KALRO)
  agroEcologicalZone?: string; // e.g., "LM1", "LM2", "HM1"
  
  // Soil Information (KALRO)
  soilType?: string;           // e.g., "Sandy", "Clay", "Loam"
  soilPH?: number;             // 0-14
  
  // Climate Information
  climateZone?: string;        // e.g., "Tropical", "Arid", "Semi-Arid"
  
  // Geohash for spatial queries
  geohash?: string;
  
  // Timezone
  timezone?: string;           // e.g., "Africa/Nairobi"
}
```

**Benefits:**
- ✅ Aligns with NASIP requirements
- ✅ Supports Kenyan administrative divisions
- ✅ Rich location data for better recommendations
- ✅ Spatial query support

#### **3. Market Price Model**

**Current:**
```typescript
// packages/backend/libs/shared-types/src/market.ts
interface MarketPrice {
  id: string;
  marketId: string;
  marketName: string;
  commodity: string;
  category: CommodityCategory;
  unit: CommodityUnit;
  price: number;
  currency: string;
  // ...
}
```

**Proposed (Aligned with FAOSTAT and KilimoSTAT):**
```typescript
interface MarketPrice {
  id: string;
  
  // Market Information
  marketId: string;
  marketName: string;
  marketType: 'wholesale' | 'retail' | 'farmers_market' | 'cooperative' | 'online';
  marketLocation: Location;
  
  // Commodity Information (Aligned with FAOSTAT)
  commodityId: string;          // Internal ID
  commodity: string;           // Common name
  faostatCode?: string;        // FAOSTAT commodity code
  commodityCategory: CommodityCategory;
  variety?: string;            // e.g., "Pishori" for rice
  grade?: string;              // e.g., "Grade 1", "Grade 2"
  
  // Price Information
  price: number;               // Price per unit
  unit: CommodityUnit;         // kg, tonne, bag, etc.
  currency: string;            // Default: "KES"
  priceType: 'average' | 'min' | 'max' | 'median';
  
  // Quantity Information
  quantity?: number;           // Quantity available
  quantityUnit?: CommodityUnit;
  
  // Source Information
  source: string;              // e.g., "KilimoSTAT", "AIRC", "Farmer Report"
  reportedBy?: string;         // User ID or system
  verified: boolean;            // Whether price is verified
  verificationMethod?: string; // e.g., "Phone Call", "Market Visit"
  
  // Temporal Information
  reportedAt: Date;            // When price was reported
  effectiveDate: Date;         // When price is effective
  
  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
}
```

**Benefits:**
- ✅ Aligns with FAOSTAT and KilimoSTAT
- ✅ Rich commodity information
- ✅ Better price tracking
- ✅ Support for verification

#### **4. Weather Model**

**Current:**
```typescript
// packages/backend/libs/shared-types/src/weather.ts
interface WeatherForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  rainfall: number;
  rainfallProbability: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  source: WeatherSource;
  location: Coordinates;
}
```

**Proposed (Aligned with KALRO and WMO Standards):**
```typescript
interface WeatherForecast {
  // Temporal Information
  date: string;                // ISO 8601 date
  time?: string;               // ISO 8601 time (for hourly forecasts)
  timestamp: string;           // Full ISO 8601 timestamp
  
  // Temperature (WMO Standard: °C)
  temperature: number;         // Current temperature
  tempMin: number;             // Minimum temperature
  tempMax: number;             // Maximum temperature
  tempFeelsLike?: number;     // Feels-like temperature
  
  // Precipitation (WMO Standard: mm)
  rainfall: number;            // Total rainfall
  rainfallProbability: number; // 0-1
  rainfallIntensity?: number;  // mm/hour
  snowfall?: number;           // mm (for highland areas)
  
  // Humidity (WMO Standard: %)
  humidity: number;            // Relative humidity (%)
  dewPoint?: number;           // Dew point temperature (°C)
  
  // Wind (WMO Standard: m/s or km/h)
  windSpeed: number;           // km/h
  windDirection: number;       // Degrees (0-360)
  windGust?: number;           // km/h
  
  // Pressure (WMO Standard: hPa)
  pressure?: number;            // Atmospheric pressure
  
  // Cloud Cover (WMO Standard: octas or %)
  cloudCover: number;          // %
  cloudType?: string;          // e.g., "Cumulus", "Stratus"
  
  // Solar Radiation (WMO Standard: W/m² or MJ/m²)
  solarRadiation?: number;    // W/m²
  uvIndex?: number;            // UV index (0-11+)
  
  // Weather Conditions (WMO Weather Codes)
  weatherCode?: number;        // WMO weather code
  weatherDescription: string;  // e.g., "Clear", "Rain", "Cloudy"
  weatherIcon?: string;        // Icon code
  
  // Agricultural-Specific
  evapotranspiration?: number; // ET0 (mm/day)
  soilMoisture?: number;       // %
  growingDegreeDays?: number;   // GDD
  
  // Source Information
  source: WeatherSource;        // KAOP, OpenWeatherMap, CHIRPS, etc.
  sourceStation?: string;      // Weather station ID
  sourceConfidence?: number;   // 0-1
  
  // Location Information
  location: Coordinates;
  elevation?: number;          // Meters above sea level
  
  // Metadata
  cached?: boolean;
  cachedAt?: string;
}
```

**Benefits:**
- ✅ Aligns with WMO (World Meteorological Organization) standards
- ✅ Aligns with KALRO weather data
- ✅ Rich weather data for agricultural decisions
- ✅ Support for agricultural-specific metrics

---

## 🎯 **RECOMMENDATIONS**

### **1. Immediate Actions (Week 2)**

#### **A. Update Data Models**
- [ ] **High Priority:** Update Crop model to align with AGROVOC
- [ ] **High Priority:** Update Location model to align with NASIP
- [ ] **Medium Priority:** Update MarketPrice model to align with FAOSTAT
- [ ] **Medium Priority:** Update WeatherForecast model to align with WMO

#### **B. Add Standard Mappings**
- [ ] Create mapping tables between internal IDs and standard codes
- [ ] Add AGROVOC URI mapping for crops
- [ ] Add FAOSTAT code mapping for commodities
- [ ] Add NASIP code mapping for locations

#### **C. Add Validation**
- [ ] Validate crop names against AGROVOC
- [ ] Validate commodity names against FAOSTAT
- [ ] Validate location codes against NASIP
- [ ] Validate weather data against WMO standards

### **2. Medium-Term Actions (Week 3-4)**

#### **A. Data Integration**
- [ ] Integrate with KilimoSTAT API
- [ ] Integrate with FAOSTAT API
- [ ] Integrate with AGROVOC API
- [ ] Add data transformation layers

#### **B. Data Quality**
- [ ] Add data validation rules
- [ ] Add data cleaning pipelines
- [ ] Add data quality metrics
- [ ] Add data lineage tracking

#### **C. Standard Compliance**
- [ ] Add compliance checks
- [ ] Add compliance reporting
- [ ] Add compliance documentation

### **3. Long-Term Actions (Week 5+)**

#### **A. Advanced Integration**
- [ ] Implement real-time data synchronization
- [ ] Add data versioning
- [ ] Add data provenance tracking
- [ ] Add data access controls

#### **B. Standard Contributions**
- [ ] Contribute to AGROVOC
- [ ] Contribute to FAOSTAT
- [ ] Contribute to NASIP data standards
- [ ] Publish our data models as open standards

---

## 🔧 **IMPLEMENTATION PLAN**

### **Phase 1: Model Updates (Week 2, Day 1-2)**

#### **Day 1: Crop and Location Models**
```bash
# Files to update:
packages/backend/libs/shared-types/src/disease.ts
packages/backend/libs/shared-types/src/common.ts

# Tasks:
1. Update CropType enum to Crop interface
2. Add AGROVOC and FAOSTAT mappings
3. Update Location interface
4. Add NASIP mappings
5. Update all references to use new models
```

#### **Day 2: Market and Weather Models**
```bash
# Files to update:
packages/backend/libs/shared-types/src/market.ts
packages/backend/libs/shared-types/src/weather.ts

# Tasks:
1. Update MarketPrice interface
2. Add FAOSTAT mappings
3. Update WeatherForecast interface
4. Add WMO mappings
5. Update all references to use new models
```

### **Phase 2: Validation and Integration (Week 2, Day 3-5)**

#### **Day 3: Validation Layer**
```bash
# New file: packages/backend/libs/shared-types/src/validation.ts

# Tasks:
1. Create validation functions for each model
2. Add AGROVOC validation
3. Add FAOSTAT validation
4. Add NASIP validation
5. Add WMO validation
```

#### **Day 4: Data Mappings**
```bash
# New file: packages/backend/libs/shared-types/src/mappings.ts

# Tasks:
1. Create crop mapping table
2. Create commodity mapping table
3. Create location mapping table
4. Create weather code mapping table
```

#### **Day 5: Integration Testing**
```bash
# Tasks:
1. Test all model updates
2. Test all validation functions
3. Test all data mappings
4. Fix any issues
5. Update documentation
```

---

## 📚 **REFERENCES**

### **FAO Standards**
- [AGROVOC](http://aims.fao.org/agrovoc) - Agricultural thesaurus
- [FAOSTAT](http://www.fao.org/faostat/) - Global agricultural statistics
- [CountrySTAT](http://www.fao.org/countrystat/) - National agricultural statistics
- [FAO Data Standards](http://www.fao.org/statistics/en/) - Data standards and methodologies

### **ISO Standards**
- [ISO 11783](https://www.iso.org/standard/50681.html) - Agricultural mobile machinery
- [ISO 15000](https://www.iso.org/standard/32807.html) - Agricultural data interchange

### **Kenyan Standards**
- [NASIP 2026-2030](https://www.kilimo.go.ke/) - National Agricultural Sector Investment Plan
- [KALRO](https://www.kalro.org/) - Kenya Agricultural and Livestock Research Organization
- [KilimoSTAT](https://statistics.kilimo.go.ke/) - Kenya's agricultural statistics platform

### **WMO Standards**
- [WMO Weather Codes](https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO49-VOL-A1/HTM/LIST.HTM) - Weather condition codes
- [WMO Data Standards](https://public.wmo.int/en/resources/library/wmo-no-8-guide-to-meteorological-instruments-and-methods) - Meteorological data standards

---

## 📊 **BENEFITS OF ALIGNMENT**

### **1. Interoperability**
- ✅ **Seamless integration** with FAO systems
- ✅ **Easy data exchange** with other agricultural platforms
- ✅ **Compatibility** with government systems (NASIP, KilimoSTAT)
- ✅ **Standard APIs** for third-party integrations

### **2. Data Quality**
- ✅ **Consistent data** across the platform
- ✅ **Validated data** against standards
- ✅ **Reliable data** for decision-making
- ✅ **Comparable data** with other sources

### **3. Compliance**
- ✅ **Meet government requirements** (NASIP)
- ✅ **Meet international standards** (FAO, ISO, WMO)
- ✅ **Avoid data silos** and vendor lock-in
- ✅ **Future-proof** data models

### **4. User Experience**
- ✅ **Better recommendations** based on standardized data
- ✅ **More accurate analytics** with consistent data
- ✅ **Easier data entry** with controlled vocabularies
- ✅ **Multi-language support** with standardized names

---

## 🎯 **NEXT STEPS**

### **For Week 2:**
1. [ ] **Review** this research document
2. [ ] **Approve** the recommended data model changes
3. [ ] **Prioritize** which models to update first
4. [ ] **Provide feedback** on any concerns

### **For Implementation:**
1. [ ] Update data models in `shared-types`
2. [ ] Add validation functions
3. [ ] Add data mappings
4. [ ] Update all services to use new models
5. [ ] Test and validate changes

### **For Research:**
1. [ ] Continue researching other standards
2. [ ] Document findings in this repository
3. [ ] Update implementation based on research

---

## 💬 **QUESTIONS FOR FEEDBACK**

1. **Data Model Alignment:**
   - Are the proposed data model changes acceptable?
   - Any concerns about complexity?
   - Any specific fields you want to add/remove?

2. **Standard Priorities:**
   - Which standards are most important to align with?
   - FAO, ISO, Kenyan, or WMO?
   - Any other standards we should consider?

3. **Implementation Timeline:**
   - Should we implement all changes in Week 2?
   - Or phase them in over multiple weeks?
   - Any dependencies we should be aware of?

4. **Validation Requirements:**
   - How strict should validation be?
   - Should we reject invalid data or just warn?
   - Any specific validation rules?

5. **Integration Approach:**
   - Should we integrate with standard APIs (FAOSTAT, AGROVOC)?
   - Or just align our data models?
   - Any specific integration requirements?

---

## ✅ **APPROVAL**

**Status:** ⏳ **Awaiting Review**

**Approved By:** _______________________
**Date:** _______________
**Version:** 1.0

**Changes:**
- [ ] Approve as-is
- [ ] Approve with modifications
- [ ] Reject

**Modifications Needed:**
1. _______________________________
2. _______________________________
3. _______________________________

---

*Document created: 2026-07-03*
*Last updated: 2026-07-03*
*Next review: After feedback*
