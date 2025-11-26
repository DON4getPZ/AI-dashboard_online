import os
import json
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / 'data'

print("📦 Starting standalone dashboard generation...")

# ========================================
# Step 1: Read all JSON files
# ========================================
print("\n📄 Reading JSON files...")
json_files = {}

json_paths = [
    'statistics/statistics.json',
    'meta/latest.json',
    'forecast/segment_stats.json',
    'forecast/insights.json',
    'funnel/insights.json',
    'type/insights.json'
]

for json_path in json_paths:
    full_path = DATA_DIR / json_path
    if full_path.exists():
        with open(full_path, 'r', encoding='utf-8') as f:
            json_files[json_path] = json.load(f)
        print(f"  ✓ {json_path}")
    else:
        print(f"  ✗ {json_path} (not found)")

# ========================================
# Step 2: Read all CSV files
# ========================================
print("\n📊 Reading CSV files...")
csv_files = {}

csv_paths = [
    'forecast/predictions.csv',
    'forecast/predictions_daily.csv',
    'forecast/predictions_detailed.csv',
    'forecast/predictions_weekly.csv',
    'forecast/predictions_monthly.csv',
    'forecast/segment_brand.csv',
    'forecast/segment_channel.csv',
    'forecast/segment_product.csv',
    'forecast/segment_promotion.csv',
    'statistics/daily_statistics.csv',
    'funnel/daily_funnel.csv',
    'funnel/weekly_funnel.csv',
    'funnel/channel_funnel.csv',
    'funnel/campaign_funnel.csv',
    'funnel/new_vs_returning.csv',
    'funnel/channel_engagement.csv',
    'funnel/new_vs_returning_conversion.csv',
    'type/merged_data.csv',
    'type/dimension_type1_campaign_adset.csv',
    'type/dimension_type2_adset_age_gender.csv',
    'type/dimension_type3_adset_age.csv',
    'type/dimension_type4_adset_gender.csv',
    'type/dimension_type5_adset_device.csv',
    'type/dimension_type6_adset_platform.csv',
    'type/dimension_type7_adset_deviceplatform.csv',
    'creative/2025-11.csv',
    'creative/Meta-이미지-URL_url.csv',
    'GA4/2025-11.csv'
]

# Add monthly raw CSV files
for month in range(1, 12):
    csv_paths.append(f'raw/2025-{month:02d}.csv')

for csv_path in csv_paths:
    full_path = DATA_DIR / csv_path
    if full_path.exists():
        with open(full_path, 'r', encoding='utf-8') as f:
            csv_files[csv_path] = f.read()
        print(f"  ✓ {csv_path}")
    else:
        print(f"  ✗ {csv_path} (not found, skipping)")

# ========================================
# Step 3: Create embedded CSS and JavaScript
# ========================================
print("\n🎨 Creating embedded resources...")

embedded_css = '''
<style id="embedded-mode-css">
    /* Hide sidebar when embedded in iframe */
    .sidebar { display: none !important; }
    .main-content { margin-left: 0 !important; }
    .app-wrapper > aside { display: none !important; }
    body { overflow: auto !important; }
</style>
'''

# Create comprehensive data injection script with proper escaping
embedded_js_template = '''
<script id="embedded-data-script">
// ========================================
// Embedded Data
// ========================================
window.__EMBEDDED_JSON__ = __JSON_DATA__;
window.__EMBEDDED_CSV__ = __CSV_DATA__;

console.log('[Embedded Data] Loaded JSON files:', Object.keys(window.__EMBEDDED_JSON__).length);
console.log('[Embedded Data] Loaded CSV files:', Object.keys(window.__EMBEDDED_CSV__).length);
console.log('[Embedded Data] JSON keys:', Object.keys(window.__EMBEDDED_JSON__));
console.log('[Embedded Data] CSV keys:', Object.keys(window.__EMBEDDED_CSV__));

// ========================================
// Fetch Override - Enhanced Version
// ========================================
(function() {
    const originalFetch = window.fetch;

    // Helper function to clean and normalize URLs
    function cleanUrl(urlStr) {
        return urlStr
            .replace(/^\\.\\.?[\\/\\\\]/, '')  // Remove ./ or ../
            .replace(/^data[\\/\\\\]/, '')     // Remove data/ prefix
            .replace(/^[\\/\\\\]/, '')          // Remove leading / or \\
            .replace(/\\\\/g, '/')              // Normalize backslashes to forward slashes
            .replace(/\\/\\//g, '/');           // Normalize double slashes
    }

    // Helper function to try matching
    function tryMatch(cleanedUrl, dataObject, dataType) {
        // Try exact match
        if (dataObject[cleanedUrl]) {
            console.log(`[Fetch Override] ✓ Exact match (${dataType}):`, cleanedUrl);
            return cleanedUrl;
        }

        // Try fuzzy matching
        const fileName = cleanedUrl.split('/').pop();
        for (const key of Object.keys(dataObject)) {
            const keyFileName = key.split('/').pop();

            // Match by filename
            if (fileName === keyFileName) {
                console.log(`[Fetch Override] ✓ Filename match (${dataType}):`, key, 'for', cleanedUrl);
                return key;
            }

            // Match if cleanedUrl is contained in key
            if (key.includes(cleanedUrl)) {
                console.log(`[Fetch Override] ✓ Contains match (${dataType}):`, key, 'for', cleanedUrl);
                return key;
            }

            // Match if key is contained in cleanedUrl
            if (cleanedUrl.includes(key)) {
                console.log(`[Fetch Override] ✓ Reverse contains match (${dataType}):`, key, 'for', cleanedUrl);
                return key;
            }
        }

        return null;
    }

    window.fetch = function(url, options) {
        const urlStr = typeof url === 'string' ? url : (url.url || url.href || String(url));

        console.log('[Fetch Override] Request:', urlStr);

        const cleanedUrl = cleanUrl(urlStr);
        console.log('[Fetch Override] Cleaned URL:', cleanedUrl);

        // Try JSON match
        const jsonKey = tryMatch(cleanedUrl, window.__EMBEDDED_JSON__, 'JSON');
        if (jsonKey) {
            return Promise.resolve(new Response(
                JSON.stringify(window.__EMBEDDED_JSON__[jsonKey]),
                {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            ));
        }

        // Try CSV match
        const csvKey = tryMatch(cleanedUrl, window.__EMBEDDED_CSV__, 'CSV');
        if (csvKey) {
            return Promise.resolve(new Response(
                window.__EMBEDDED_CSV__[csvKey],
                {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'text/csv',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            ));
        }

        // No match found
        console.warn('[Fetch Override] ✗ No embedded data found for:', urlStr);
        console.warn('[Fetch Override] ✗ Cleaned URL:', cleanedUrl);
        console.warn('[Fetch Override] ✗ Will use original fetch (may fail)');

        // Return original fetch
        return originalFetch.apply(this, arguments);
    };

    console.log('[Embedded Data] ✓ Fetch override installed successfully');
})();
</script>
'''

# Replace placeholders with actual data
embedded_js = embedded_js_template.replace(
    '__JSON_DATA__',
    json.dumps(json_files, ensure_ascii=False, indent=2)
).replace(
    '__CSV_DATA__',
    json.dumps(csv_files, ensure_ascii=False)
)

# ========================================
# Step 4: Read and modify HTML files
# ========================================
print("\n📝 Reading HTML files...")

html_files = {
    'main': 'marketing_dashboard_v3.html',
    'creative': 'creative_analysis.html',
    'timeseries': 'timeseries_analysis.html',
    'funnel': 'funnel_dashboard.html',
    'type': 'type_dashboard.html'
}

modified_html = {}

for key, filename in html_files.items():
    html_path = DATA_DIR / filename
    if html_path.exists():
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Inject CSS and JavaScript before </head>
        if '</head>' in html_content:
            html_content = html_content.replace('</head>', f'{embedded_css}{embedded_js}</head>')

        modified_html[key] = html_content
        print(f"  ✓ {filename} ({len(html_content):,} bytes)")
    else:
        print(f"  ✗ {filename} (not found)")

# ========================================
# Step 5: Write separate standalone HTML files
# ========================================
print("\n📝 Writing standalone HTML files...")

# Mapping of keys to output filenames
output_files = {
    'main': 'marketing_dashboard_v3_standalone.html',
    'creative': 'creative_analysis_standalone.html',
    'timeseries': 'timeseries_analysis_standalone.html',
    'funnel': 'funnel_dashboard_standalone.html',
    'type': 'type_dashboard_standalone.html'
}

# Write each modified HTML as a separate standalone file
for key, output_filename in output_files.items():
    if key in modified_html:
        output_path = DATA_DIR / output_filename
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(modified_html[key])

        file_size = len(modified_html[key])
        print(f"  ✓ {output_filename}")
        print(f"    📦 Size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
    else:
        print(f"  ✗ {output_filename} (source HTML not found)")

print(f"\n✅ All standalone HTML files generated successfully!")
print(f"\n📊 Embedded Data Summary:")
print(f"  - JSON files: {len(json_files)}")
print(f"  - CSV files: {len(csv_files)}")
print(f"  - HTML pages: {len(modified_html)}")
print(f"\n🎉 Done! Each HTML file is now fully standalone and can be opened independently in your browser.")
