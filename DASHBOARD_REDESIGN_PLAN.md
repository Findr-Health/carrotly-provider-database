# 🎨 Dashboard UI Redesign - Implementation Plan

## 📋 Changes Overview

### Current Dashboard Columns:
1. Provider ID ✅ Keep
2. Overall Score ❌ Change to "Financial Impact"
3. Priority ❌ Remove
4. Tier Scores ❌ Remove
5. Anomalies ❌ Change to show rule names
6. Claims ✅ Keep
7. Actions ✅ Keep

### New Dashboard Columns:
1. **Provider ID** - Keep as is
2. **Financial Impact** - Replace "Overall Score", show dollar amount
3. **Rules Triggered** - Replace "Anomalies", show actual rule names
4. **Claims** - Keep as is
5. **Actions** - Keep as is

### New Features:
- ✅ Filter by rules triggered
- ✅ Filter by financial impact (dollar range)
- ✅ Calculate financial impact per provider

---

## 🔧 Implementation Steps

### STEP 1: Calculate Financial Impact (Backend)
**File:** `src/app/api/upload/route.ts`

**What to add:** Calculate total billed amount for flagged claims per provider

```typescript
// Add to the detection results section (around line 150-200)

const leads = flaggedProviders.map(provider => {
  const providerClaims = parsedData.filter(c => c.provider_id === provider.provider_id);
  
  // NEW: Calculate financial impact
  // Sum of all billed amounts for this provider
  const totalBilled = providerClaims.reduce((sum, claim) => {
    const amount = parseFloat(claim.billed_amount || '0');
    return sum + amount;
  }, 0);
  
  // NEW: Calculate flagged financial impact
  // Get all flagged claim IDs from all metrics
  const allFlaggedClaimIds = new Set([
    ...(provider.tier1Metrics?.flatMap(m => m.flaggedClaimIds || []) || []),
    ...(provider.tier2Metrics?.flatMap(m => m.flaggedClaimIds || []) || []),
    ...(provider.tier3Metrics?.flatMap(m => m.flaggedClaimIds || []) || []),
    ...(provider.tier4Metrics?.flatMap(m => m.flaggedClaimIds || []) || [])
  ]);
  
  const flaggedBilled = providerClaims
    .filter(c => allFlaggedClaimIds.has(c.claim_id))
    .reduce((sum, claim) => sum + parseFloat(claim.billed_amount || '0'), 0);
  
  // NEW: Extract rule names that were triggered
  const rulesTriggered = [
    ...(provider.tier1Metrics?.map(m => m.metricName) || []),
    ...(provider.tier2Metrics?.map(m => m.metricName) || []),
    ...(provider.tier3Metrics?.map(m => m.metricName) || []),
    ...(provider.tier4Metrics?.map(m => m.metricName) || [])
  ].filter(Boolean);
  
  return {
    provider_id: provider.provider_id,
    overallScore: provider.overallScore,
    priority: provider.priority,
    claimCount: providerClaims.length,
    
    // NEW FIELDS:
    totalBilled: totalBilled,              // Total amount billed by provider
    flaggedAmount: flaggedBilled,          // Amount in flagged claims
    financialImpact: flaggedBilled,        // Use flagged amount as impact
    rulesTriggered: rulesTriggered,        // Array of rule names
    
    // Keep existing fields
    tier1Score: provider.tier1Score,
    tier2Score: provider.tier2Score,
    tier3Score: provider.tier3Score,
    tier4Score: provider.tier4Score,
    tier1Metrics: provider.tier1Metrics,
    tier2Metrics: provider.tier2Metrics,
    tier3Metrics: provider.tier3Metrics,
    tier4Metrics: provider.tier4Metrics,
  };
});
```

**Expected Output:**
```json
{
  "provider_id": "P91005",
  "overallScore": 73,
  "priority": "HIGH",
  "claimCount": 300,
  "totalBilled": 156789.50,
  "flaggedAmount": 45230.00,
  "financialImpact": 45230.00,
  "rulesTriggered": [
    "Round Number Clustering",
    "Benford's Law Violation",
    "Peer Outlier"
  ],
  "tier1Metrics": [...],
  ...
}
```

---

### STEP 2: Update TypeScript Types
**File:** `src/types/index.ts`

**Add to ProviderAnomalyResult interface:**

```typescript
export interface ProviderAnomalyResult {
  provider_id: string;
  overallScore: number;
  priority: 'HIGH' | 'MEDIUM' | 'WATCHLIST' | 'NONE';
  claimCount: number;
  
  // NEW FIELDS:
  totalBilled?: number;        // Total amount billed
  flaggedAmount?: number;      // Amount in flagged claims
  financialImpact?: number;    // Primary impact metric
  rulesTriggered?: string[];   // Array of rule names
  
  tier1Score: number;
  tier2Score: number;
  tier3Score: number;
  tier4Score: number;
  tier1Metrics?: TierMetric[];
  tier2Metrics?: TierMetric[];
  tier3Metrics?: TierMetric[];
  tier4Metrics?: TierMetric[];
}
```

---

### STEP 3: Update Dashboard UI
**File:** `src/app/page.tsx`

#### 3A. Add Filter State

```typescript
// Add to top of HomePage component (around line 20)
const [filterRules, setFilterRules] = useState<string[]>([]);
const [filterMinImpact, setFilterMinImpact] = useState<number>(0);
const [filterMaxImpact, setFilterMaxImpact] = useState<number>(Infinity);
```

#### 3B. Add Filtering Logic

```typescript
// Add after uploadedData state (around line 30)
const filteredLeads = useMemo(() => {
  if (!uploadedData?.leads) return [];
  
  return uploadedData.leads.filter(lead => {
    // Filter by rules
    if (filterRules.length > 0) {
      const hasMatchingRule = lead.rulesTriggered?.some(rule => 
        filterRules.includes(rule)
      );
      if (!hasMatchingRule) return false;
    }
    
    // Filter by financial impact
    const impact = lead.financialImpact || 0;
    if (impact < filterMinImpact || impact > filterMaxImpact) {
      return false;
    }
    
    return true;
  });
}, [uploadedData, filterRules, filterMinImpact, filterMaxImpact]);
```

#### 3C. Create Filter UI Component

```typescript
// Add before the results table (around line 150)
{uploadedData && (
  <div className="mb-6 bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Filters</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Filter by Rules */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Rules Triggered
        </label>
        <select
          multiple
          className="w-full border border-gray-300 rounded-md p-2 h-32"
          value={filterRules}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            setFilterRules(selected);
          }}
        >
          {/* Get unique rules from all leads */}
          {Array.from(new Set(
            uploadedData.leads.flatMap(lead => lead.rulesTriggered || [])
          )).sort().map(rule => (
            <option key={rule} value={rule}>
              {rule}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Hold Cmd/Ctrl to select multiple
        </p>
      </div>
      
      {/* Filter by Financial Impact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Financial Impact Range
        </label>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Minimum $</label>
            <input
              type="number"
              placeholder="Min amount"
              className="w-full border border-gray-300 rounded-md p-2"
              value={filterMinImpact || ''}
              onChange={(e) => setFilterMinImpact(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Maximum $</label>
            <input
              type="number"
              placeholder="Max amount"
              className="w-full border border-gray-300 rounded-md p-2"
              value={filterMaxImpact === Infinity ? '' : filterMaxImpact}
              onChange={(e) => setFilterMaxImpact(Number(e.target.value) || Infinity)}
            />
          </div>
        </div>
      </div>
    </div>
    
    {/* Active Filters Summary */}
    {(filterRules.length > 0 || filterMinImpact > 0 || filterMaxImpact < Infinity) && (
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Active filters:</span>
        {filterRules.map(rule => (
          <span key={rule} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {rule}
            <button
              onClick={() => setFilterRules(filterRules.filter(r => r !== rule))}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
        {filterMinImpact > 0 && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            Min: ${filterMinImpact.toLocaleString()}
          </span>
        )}
        {filterMaxImpact < Infinity && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            Max: ${filterMaxImpact.toLocaleString()}
          </span>
        )}
        <button
          onClick={() => {
            setFilterRules([]);
            setFilterMinImpact(0);
            setFilterMaxImpact(Infinity);
          }}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Clear all
        </button>
      </div>
    )}
    
    <div className="mt-3 text-sm text-gray-600">
      Showing {filteredLeads.length} of {uploadedData.leads.length} providers
    </div>
  </div>
)}
```

#### 3D. Update Table Headers

```typescript
// Replace the table headers (around line 200)
<thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Provider ID
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Financial Impact
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Rules Triggered
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Claims
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Actions
    </th>
  </tr>
</thead>
```

#### 3E. Update Table Body

```typescript
// Replace the table body (around line 220)
<tbody className="bg-white divide-y divide-gray-200">
  {filteredLeads.map((lead) => (
    <tr key={lead.provider_id} className="hover:bg-gray-50">
      {/* Provider ID */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          {lead.provider_id}
        </span>
      </td>
      
      {/* Financial Impact - NEW */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">
            ${(lead.financialImpact || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </span>
          {lead.totalBilled && (
            <span className="text-xs text-gray-500">
              {((lead.financialImpact || 0) / lead.totalBilled * 100).toFixed(1)}% of total
            </span>
          )}
        </div>
      </td>
      
      {/* Rules Triggered - NEW */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1 max-w-md">
          {lead.rulesTriggered && lead.rulesTriggered.length > 0 ? (
            lead.rulesTriggered.slice(0, 3).map((rule, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium"
                title={rule}
              >
                {rule.length > 25 ? rule.substring(0, 25) + '...' : rule}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No rules</span>
          )}
          {lead.rulesTriggered && lead.rulesTriggered.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{lead.rulesTriggered.length - 3} more
            </span>
          )}
        </div>
      </td>
      
      {/* Claims */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {lead.claimCount || 0}
        </span>
      </td>
      
      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => handleViewDetails(lead.provider_id)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details →
        </button>
      </td>
    </tr>
  ))}
</tbody>
```

---

### STEP 4: Update Summary Stats
**File:** `src/app/page.tsx`

Update the summary cards at the top to reflect financial impact:

```typescript
{/* Add new summary card for total financial impact */}
{uploadedData && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    {/* Existing cards... */}
    
    {/* NEW: Total Financial Impact Card */}
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total Financial Impact</p>
          <p className="text-3xl font-bold text-red-600">
            ${uploadedData.leads
              .reduce((sum, lead) => sum + (lead.financialImpact || 0), 0)
              .toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
          </p>
        </div>
        <DollarSign className="w-12 h-12 text-red-400" />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Across {uploadedData.leads.length} flagged providers
      </p>
    </div>
    
    {/* NEW: Average Impact Card */}
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Avg Impact per Provider</p>
          <p className="text-2xl font-bold text-orange-600">
            ${(uploadedData.leads
              .reduce((sum, lead) => sum + (lead.financialImpact || 0), 0) / 
              uploadedData.leads.length || 0)
              .toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
          </p>
        </div>
        <TrendingUp className="w-12 h-12 text-orange-400" />
      </div>
    </div>
  </div>
)}
```

---

### STEP 5: Add Sort Functionality (Bonus)

```typescript
// Add sort state
const [sortField, setSortField] = useState<'financialImpact' | 'claims' | 'rules'>('financialImpact');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

// Add sorting to filtered leads
const sortedLeads = useMemo(() => {
  return [...filteredLeads].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortField) {
      case 'financialImpact':
        aVal = a.financialImpact || 0;
        bVal = b.financialImpact || 0;
        break;
      case 'claims':
        aVal = a.claimCount || 0;
        bVal = b.claimCount || 0;
        break;
      case 'rules':
        aVal = a.rulesTriggered?.length || 0;
        bVal = b.rulesTriggered?.length || 0;
        break;
      default:
        return 0;
    }
    
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });
}, [filteredLeads, sortField, sortDirection]);

// Add clickable headers
<th 
  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
  onClick={() => {
    if (sortField === 'financialImpact') {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField('financialImpact');
      setSortDirection('desc');
    }
  }}
>
  Financial Impact {sortField === 'financialImpact' && (sortDirection === 'asc' ? '↑' : '↓')}
</th>
```

---

## 📊 Visual Before/After

### BEFORE:
```
┌──────────────┬──────────┬──────────┬────────────┬───────────┬────────┬─────────┐
│ Provider ID  │ Overall  │ Priority │ Tier       │ Anomalies │ Claims │ Actions │
│              │ Score    │          │ Scores     │           │        │         │
├──────────────┼──────────┼──────────┼────────────┼───────────┼────────┼─────────┤
│ COMBO-EXTREME│   73.0   │  HIGH    │ T1:2 T2:2  │ 4 patterns│  300   │ View    │
└──────────────┴──────────┴──────────┴────────────┴───────────┴────────┴─────────┘
```

### AFTER:
```
┌──────────────┬──────────────────┬─────────────────────────────────┬────────┬─────────┐
│ Provider ID  │ Financial Impact │ Rules Triggered                 │ Claims │ Actions │
├──────────────┼──────────────────┼─────────────────────────────────┼────────┼─────────┤
│ COMBO-EXTREME│   $45,230.00     │ [Round Number Clustering]       │  300   │ View    │
│              │   30.2% of total │ [Benford's Law Violation]       │        │         │
│              │                  │ [Peer Outlier] +1 more          │        │         │
└──────────────┴──────────────────┴─────────────────────────────────┴────────┴─────────┘
```

---

## 🧪 Testing Checklist

After implementation:

- [ ] Upload test file - verify financial impact calculates correctly
- [ ] Check that all rules are shown in the filter dropdown
- [ ] Test filtering by single rule - results update
- [ ] Test filtering by multiple rules - results update
- [ ] Test min financial impact filter - results update
- [ ] Test max financial impact filter - results update
- [ ] Test combined filters - results update
- [ ] Test "Clear all" button - filters reset
- [ ] Test sorting by financial impact - order changes
- [ ] Verify summary cards show correct totals
- [ ] Test with provider with no rules - displays "No rules"
- [ ] Test with provider with >3 rules - shows "+X more"
- [ ] Verify mobile responsive - table scrolls horizontally

---

## 📁 Files to Modify

1. **`src/app/api/upload/route.ts`** - Add financial impact calculation
2. **`src/types/index.ts`** - Add new fields to types
3. **`src/app/page.tsx`** - Update UI (filters, table, headers)

---

## ⏱️ Estimated Implementation Time

- **Step 1** (Backend): 20 minutes
- **Step 2** (Types): 5 minutes
- **Step 3** (UI): 45 minutes
- **Step 4** (Stats): 15 minutes
- **Step 5** (Sorting): 15 minutes
- **Testing**: 20 minutes

**Total: ~2 hours**

---

## 🚀 Deployment Steps

```bash
# 1. Make changes
# 2. Test locally
npm run dev

# 3. Commit
git add .
git commit -m "Redesign dashboard: financial impact & rule filtering"

# 4. Push
git push

# 5. Deploy
npx vercel --prod
```

---

## ❓ Open Questions

**Question 3:** You mentioned "3." but didn't complete it. What was the third requirement?

Possible options:
- Export filtered results to CSV?
- Add date range filtering?
- Show provider names instead of IDs?
- Add comparison to previous uploads?

Let me know and I'll add it to the plan!

---

Ready to implement? I can provide the complete code for any of these steps!
