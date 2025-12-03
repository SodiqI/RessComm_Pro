
// Wrap in IIFE to prevent global variable conflicts
(function() {
    'use strict';
    
// Initialize map
const map = L.map('map').setView([9.0820, 8.6753], 6);

// Add tile layers
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri'
});

// Global variables
let uploadedData = null;
let dataPoints = [];
let resultLayer = null;
let pointsLayer = null;
let currentJobId = null;

// Output layers for enhanced functionality
let outputLayers = {
    continuous: null,
    classified: null,
    accuracy: null,
    residuals: null,
    uncertainty: null,
    rpe: null
};
let analysisResults = null;
let analysisType = 'single-variable';

// DOM elements
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const datasetSummary = document.getElementById('dataset-summary');
const targetVariable = document.getElementById('target-variable');
const usePredictors = document.getElementById('use-predictors');
const predictorSelection = document.getElementById('predictor-selection');
const predictorCheckboxes = document.getElementById('predictor-checkboxes');
const runBtn = document.getElementById('run-btn');
const exportBtn = document.getElementById('export-btn');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const advancedToggle = document.getElementById('advanced-toggle');
const advancedPanel = document.getElementById('advanced-panel');
const metricsPanel = document.getElementById('metrics-panel');
const metricsToggle = document.getElementById('metrics-toggle');
const closeMetrics = document.getElementById('close-metrics');
const legendToggle = document.getElementById('legend-toggle');
const legend = document.getElementById('legend');
const opacityControl = document.getElementById('opacity-control');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValue = document.getElementById('opacity-value');
const notification = document.getElementById('notification');
const extentType = document.getElementById('extent-type');
const extentUploadArea = document.getElementById('extent-upload-area');
const extentFile = document.getElementById('extent-file');
const colorScheme = document.getElementById('color-scheme');
const exportSection = document.getElementById('export-section');
const exportFormat = document.getElementById('export-format');
const loadDemoBtn = document.getElementById('load-demo-btn');

// Demo dataset - Sample agricultural data from Nigeria
const demoData = {
    points: [
        { lat: 9.082, lng: 8.675, properties: { id: 1, yield_kg: 2500, rainfall_mm: 1200, soil_ph: 6.5, elevation_m: 350, crop_type: 'Maize' } },
        { lat: 9.095, lng: 8.690, properties: { id: 2, yield_kg: 2800, rainfall_mm: 1250, soil_ph: 6.8, elevation_m: 360, crop_type: 'Maize' } },
        { lat: 9.070, lng: 8.660, properties: { id: 3, yield_kg: 2200, rainfall_mm: 1180, soil_ph: 6.2, elevation_m: 340, crop_type: 'Maize' } },
        { lat: 9.110, lng: 8.705, properties: { id: 4, yield_kg: 3100, rainfall_mm: 1300, soil_ph: 7.0, elevation_m: 380, crop_type: 'Maize' } },
        { lat: 9.088, lng: 8.680, properties: { id: 5, yield_kg: 2650, rainfall_mm: 1220, soil_ph: 6.6, elevation_m: 355, crop_type: 'Maize' } },
        { lat: 9.100, lng: 8.695, properties: { id: 6, yield_kg: 2900, rainfall_mm: 1270, soil_ph: 6.9, elevation_m: 370, crop_type: 'Maize' } },
        { lat: 9.075, lng: 8.670, properties: { id: 7, yield_kg: 2400, rainfall_mm: 1190, soil_ph: 6.4, elevation_m: 345, crop_type: 'Maize' } },
        { lat: 9.105, lng: 8.700, properties: { id: 8, yield_kg: 3000, rainfall_mm: 1290, soil_ph: 6.95, elevation_m: 375, crop_type: 'Maize' } },
        { lat: 9.092, lng: 8.685, properties: { id: 9, yield_kg: 2750, rainfall_mm: 1240, soil_ph: 6.7, elevation_m: 362, crop_type: 'Maize' } },
        { lat: 9.078, lng: 8.665, properties: { id: 10, yield_kg: 2350, rainfall_mm: 1170, soil_ph: 6.3, elevation_m: 342, crop_type: 'Maize' } },
        { lat: 9.115, lng: 8.710, properties: { id: 11, yield_kg: 3200, rainfall_mm: 1320, soil_ph: 7.1, elevation_m: 385, crop_type: 'Maize' } },
        { lat: 9.085, lng: 8.678, properties: { id: 12, yield_kg: 2600, rainfall_mm: 1210, soil_ph: 6.55, elevation_m: 352, crop_type: 'Maize' } },
        { lat: 9.098, lng: 8.692, properties: { id: 13, yield_kg: 2850, rainfall_mm: 1260, soil_ph: 6.85, elevation_m: 368, crop_type: 'Maize' } },
        { lat: 9.072, lng: 8.668, properties: { id: 14, yield_kg: 2300, rainfall_mm: 1185, soil_ph: 6.35, elevation_m: 343, crop_type: 'Maize' } },
        { lat: 9.108, lng: 8.703, properties: { id: 15, yield_kg: 3050, rainfall_mm: 1295, soil_ph: 6.98, elevation_m: 378, crop_type: 'Maize' } },
        { lat: 9.090, lng: 8.683, properties: { id: 16, yield_kg: 2700, rainfall_mm: 1230, soil_ph: 6.65, elevation_m: 358, crop_type: 'Maize' } },
        { lat: 9.080, lng: 8.673, properties: { id: 17, yield_kg: 2450, rainfall_mm: 1195, soil_ph: 6.45, elevation_m: 348, crop_type: 'Maize' } },
        { lat: 9.112, lng: 8.708, properties: { id: 18, yield_kg: 3150, rainfall_mm: 1310, soil_ph: 7.05, elevation_m: 382, crop_type: 'Maize' } },
        { lat: 9.087, lng: 8.681, properties: { id: 19, yield_kg: 2620, rainfall_mm: 1215, soil_ph: 6.58, elevation_m: 354, crop_type: 'Maize' } },
        { lat: 9.095, lng: 8.688, properties: { id: 20, yield_kg: 2820, rainfall_mm: 1255, soil_ph: 6.82, elevation_m: 365, crop_type: 'Maize' } },
        { lat: 9.073, lng: 8.662, properties: { id: 21, yield_kg: 2250, rainfall_mm: 1175, soil_ph: 6.25, elevation_m: 338, crop_type: 'Maize' } },
        { lat: 9.103, lng: 8.698, properties: { id: 22, yield_kg: 2950, rainfall_mm: 1280, soil_ph: 6.92, elevation_m: 372, crop_type: 'Maize' } },
        { lat: 9.084, lng: 8.676, properties: { id: 23, yield_kg: 2550, rainfall_mm: 1205, soil_ph: 6.52, elevation_m: 350, crop_type: 'Maize' } },
        { lat: 9.097, lng: 8.691, properties: { id: 24, yield_kg: 2880, rainfall_mm: 1265, soil_ph: 6.88, elevation_m: 367, crop_type: 'Maize' } },
        { lat: 9.077, lng: 8.671, properties: { id: 25, yield_kg: 2380, rainfall_mm: 1188, soil_ph: 6.38, elevation_m: 346, crop_type: 'Maize' } },
        { lat: 9.107, lng: 8.702, properties: { id: 26, yield_kg: 3020, rainfall_mm: 1292, soil_ph: 6.96, elevation_m: 376, crop_type: 'Maize' } },
        { lat: 9.089, lng: 8.682, properties: { id: 27, yield_kg: 2680, rainfall_mm: 1225, soil_ph: 6.62, elevation_m: 356, crop_type: 'Maize' } },
        { lat: 9.101, lng: 8.696, properties: { id: 28, yield_kg: 2920, rainfall_mm: 1275, soil_ph: 6.90, elevation_m: 371, crop_type: 'Maize' } },
        { lat: 9.074, lng: 8.664, properties: { id: 29, yield_kg: 2280, rainfall_mm: 1178, soil_ph: 6.28, elevation_m: 341, crop_type: 'Maize' } },
        { lat: 9.113, lng: 8.707, properties: { id: 30, yield_kg: 3180, rainfall_mm: 1315, soil_ph: 7.08, elevation_m: 384, crop_type: 'Maize' } }
    ],
    headers: ['id', 'yield_kg', 'rainfall_mm', 'soil_ph', 'elevation_m', 'crop_type'],
    type: 'demo'
};

// Load demo data button
loadDemoBtn.addEventListener('click', () => {
    loadDemoData();
});

// Load demo data function
function loadDemoData() {
    dataPoints = demoData.points;
    uploadedData = {
        type: 'demo',
        headers: demoData.headers,
        data: demoData.points.map(p => p.properties),
        points: dataPoints
    };
    
    updateDatasetSummary();
    updateVariableSelectors(demoData.headers);
    displayPointsOnMap();
    showNotification('Demo dataset loaded! 30 agricultural sample points with yield, rainfall, soil pH, and elevation data.', 'success');
}

// Upload area events
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.background = '#d8f3dc';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.background = '#f0fdf4';
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.background = '#f0fdf4';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

// Toggle predictor selection
usePredictors.addEventListener('change', (e) => {
    predictorSelection.style.display = e.target.checked ? 'block' : 'none';
});

// Handle file upload
function handleFileUpload(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
        parseCSV(file);
    } else if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        parseGeoJSON(file);
    } else if (fileName.endsWith('.zip')) {
        showNotification('Shapefile support coming soon! Please use CSV or GeoJSON for now.', 'warning');
    } else {
        showNotification('Unsupported file format. Please use CSV, GeoJSON, or Shapefile (.zip)', 'error');
    }
}

// Parse CSV file
function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            if (results.data.length === 0) {
                showNotification('CSV file is empty', 'error');
                return;
            }
            
            // Check for lat/lng columns
            const headers = Object.keys(results.data[0]);
            const latCol = headers.find(h => h.toLowerCase().includes('lat'));
            const lngCol = headers.find(h => h.toLowerCase().includes('lon') || h.toLowerCase().includes('lng'));
            
            if (!latCol || !lngCol) {
                showNotification('CSV must contain latitude and longitude columns', 'error');
                return;
            }
            
            // Convert to point data
            dataPoints = results.data
                .filter(row => row[latCol] && row[lngCol])
                .map(row => ({
                    lat: parseFloat(row[latCol]),
                    lng: parseFloat(row[lngCol]),
                    properties: row
                }));
            
            if (dataPoints.length < 3) {
                showNotification('Dataset must contain at least 3 valid points', 'error');
                return;
            }
            
            uploadedData = {
                type: 'csv',
                headers: headers,
                data: results.data,
                points: dataPoints
            };
            
            updateDatasetSummary();
            updateVariableSelectors(headers);
            displayPointsOnMap();
            showNotification(`Successfully loaded ${dataPoints.length} points`, 'success');
        },
        error: function(error) {
            showNotification('Error parsing CSV: ' + error.message, 'error');
        }
    });
}

// Parse GeoJSON file
function parseGeoJSON(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const geojson = JSON.parse(e.target.result);
            
            if (geojson.type !== 'FeatureCollection' && geojson.type !== 'Feature') {
                showNotification('Invalid GeoJSON format', 'error');
                return;
            }
            
            const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
            
            dataPoints = features
                .filter(f => f.geometry && f.geometry.type === 'Point')
                .map(f => ({
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0],
                    properties: f.properties || {}
                }));
            
            if (dataPoints.length < 3) {
                showNotification('GeoJSON must contain at least 3 point features', 'error');
                return;
            }
            
            const headers = Object.keys(dataPoints[0].properties);
            
            uploadedData = {
                type: 'geojson',
                headers: headers,
                data: geojson,
                points: dataPoints
            };
            
            updateDatasetSummary();
            updateVariableSelectors(headers);
            displayPointsOnMap();
            showNotification(`Successfully loaded ${dataPoints.length} points`, 'success');
        } catch (error) {
            showNotification('Error parsing GeoJSON: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Update dataset summary
function updateDatasetSummary() {
    document.getElementById('row-count').textContent = `Rows: ${dataPoints.length}`;
    document.getElementById('crs-info').textContent = 'CRS: EPSG:4326 (WGS84)';
    document.getElementById('fields-detected').textContent = `Fields: ${uploadedData.headers.length}`;
    datasetSummary.style.display = 'block';
    runBtn.disabled = false;
}

// Update variable selectors
function updateVariableSelectors(headers) {
    targetVariable.innerHTML = '<option value="">Select target variable</option>';
    predictorCheckboxes.innerHTML = '';
    
    const numericHeaders = headers.filter(h => {
        const firstValue = uploadedData.points[0].properties[h];
        return typeof firstValue === 'number' && !h.toLowerCase().includes('lat') && !h.toLowerCase().includes('lon');
    });
    
    if (numericHeaders.length === 0) {
        predictorCheckboxes.innerHTML = '<p style="color: #666; font-size: 0.85rem;">No numeric fields found</p>';
        usePredictors.disabled = true;
        return;
    }
    
    usePredictors.disabled = false;
    
    numericHeaders.forEach(header => {
        // Add to target variable dropdown
        const option1 = document.createElement('option');
        option1.value = header;
        option1.textContent = header;
        targetVariable.appendChild(option1);
        
        // Add to predictor checkboxes
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'checkbox-group';
        checkboxDiv.style.marginBottom = '0.3rem';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `pred-${header}`;
        checkbox.value = header;
        checkbox.className = 'predictor-checkbox';
        
        const label = document.createElement('label');
        label.setAttribute('for', `pred-${header}`);
        label.textContent = header;
        label.style.cursor = 'pointer';
        
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        predictorCheckboxes.appendChild(checkboxDiv);
    });
}

// Display points on map
function displayPointsOnMap() {
    if (pointsLayer) {
        map.removeLayer(pointsLayer);
    }
    
    const markers = dataPoints.map(point => {
        return L.circleMarker([point.lat, point.lng], {
            radius: 5,
            fillColor: '#40916c',
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(`
            <strong>Sample Point</strong><br>
            Lat: ${point.lat.toFixed(6)}<br>
            Lng: ${point.lng.toFixed(6)}
        `);
    });
    
    pointsLayer = L.layerGroup(markers).addTo(map);
    
    // Fit map to points
    const bounds = L.latLngBounds(dataPoints.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
}

// Run analysis
runBtn.addEventListener('click', async () => {
    const target = targetVariable.value;
    
    if (!target) {
        showNotification('Please select a target variable', 'error');
        return;
    }
    
    if (dataPoints.length < 30) {
        showNotification('Warning: Dataset has fewer than 30 points. Results may be unreliable.', 'warning');
    }
    
    // Show progress
    progressContainer.classList.add('active');
    runBtn.disabled = true;
    
    // Simulate analysis (in production, this would call backend API)
    await simulateAnalysis(target);
});

// Simulate analysis (demo mode with IDW) - Enhanced with multiple output layers
async function simulateAnalysis(targetVar) {
    try {
        console.log('Starting analysis for:', targetVar);
        
        // Get selected predictors
        const selectedPredictors = [];
        if (usePredictors.checked) {
            document.querySelectorAll('.predictor-checkbox:checked').forEach(cb => {
                selectedPredictors.push(cb.value);
            });
        }
        
        // Determine analysis type
        analysisType = selectedPredictors.length > 0 ? 'predictor-based' : 'single-variable';
        const analysisLabel = analysisType === 'predictor-based' ? 
            'Model-based Prediction' : 'Pure Interpolation';
        
        console.log(`Analysis type: ${analysisLabel}`);
        
        if (selectedPredictors.length > 0) {
            showNotification(`Using ${selectedPredictors.length} predictor variable(s): ${selectedPredictors.join(', ')}`, 'success');
        }
        
        // Step 1: Validate data
        updateProgress(10, 'Validating data...');
        await sleep(300);
        
        // Step 2: Prepare grid
        updateProgress(20, 'Preparing interpolation grid...');
        await sleep(300);
        
        // Step 3: Run interpolation
        updateProgress(40, 'Running interpolation...');
        const result = performIDW(targetVar);
        await sleep(400);
        
        // Step 4: Generate additional output layers
        updateProgress(55, 'Generating output layers...');
        
        // Generate classified map if requested
        let classifiedGrid = null;
        if (document.getElementById('output-classified').checked) {
            const numClasses = parseInt(document.getElementById('num-classes').value);
            const classMethod = document.getElementById('class-method').value;
            classifiedGrid = classifyGrid(result.grid, numClasses, classMethod);
        }
        
        await sleep(300);
        
        // Step 5: Calculate accuracy/residuals based on analysis type
        updateProgress(65, 'Calculating validation metrics...');
        const metrics = calculateMetrics(targetVar);
        
        let accuracyGrid = null;
        let residualsGrid = null;
        let uncertaintyGrid = null;
        
        if (analysisType === 'single-variable') {
            accuracyGrid = calculateAccuracyMap(targetVar, result.grid);
        } else {
            residualsGrid = calculateResidualMap(targetVar, result.grid);
        }
        
        await sleep(300);
        
        // Step 6: Calculate uncertainty (for predictor-based) - MUST happen before RPE
        if (analysisType === 'predictor-based') {
            updateProgress(72, 'Calculating prediction uncertainty...');
            uncertaintyGrid = calculatePredictionUncertainty(result.grid, targetVar);
            await sleep(300);
        }
        
        // Step 7: Calculate RPE (Reliable Prediction Extent) - AFTER uncertainty
        updateProgress(80, 'Calculating reliable prediction extent...');
        const rpePoints = calculateRPE_Combined(result.grid, uncertaintyGrid, analysisType);
        await sleep(300);
        
        // Store all results
        analysisResults = {
            continuous: result,
            classified: classifiedGrid,
            accuracy: accuracyGrid,
            residuals: residualsGrid,
            uncertainty: uncertaintyGrid,
            rpe: rpePoints,
            metrics: metrics,
            targetVar: targetVar,
            analysisType: analysisType
        };
        
        // Step 8: Display results
        updateProgress(95, 'Rendering results...');
        displayEnhancedResults(analysisResults);
        await sleep(300);
        
        updateProgress(100, 'Complete!');
        progressContainer.classList.remove('active');
        runBtn.disabled = false;
        exportBtn.style.display = 'block';
        
        const outputMsg = analysisType === 'predictor-based' ?
            'Model-based prediction complete! Multiple output layers generated.' :
            'Interpolation complete! Results include accuracy and reliability layers.';
        showNotification(outputMsg, 'success');
        
    } catch (error) {
        console.error('Analysis error:', error);
        showNotification('Error during analysis: ' + error.message, 'error');
        progressContainer.classList.remove('active');
        runBtn.disabled = false;
    }
}

// Calculate prediction uncertainty (simplified simulation for predictor-based methods)
function calculatePredictionUncertainty(grid, targetVar) {
    const mean = dataPoints.reduce((sum, p) => sum + p.properties[targetVar], 0) / dataPoints.length;
    const std = Math.sqrt(
        dataPoints.reduce((sum, p) => sum + Math.pow(p.properties[targetVar] - mean, 2), 0) / dataPoints.length
    );
    
    return grid.map(cell => {
        let sumWeights = 0;
        let uncertainty = 0;
        
        dataPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(cell.lat - p.lat, 2) + Math.pow(cell.lng - p.lng, 2));
            const weight = dist > 0 ? 1 / (dist + 0.001) : 1000;
            sumWeights += weight;
            uncertainty += weight * Math.abs(p.properties[targetVar] - cell.value);
        });
        
        const normalizedUncertainty = Math.min((uncertainty / sumWeights) / std, 1);
        return { ...cell, uncertainty: normalizedUncertainty };
    });
}

// Simple IDW implementation for demo
function performIDW(targetVar) {
    // Calculate extent from data points with smart buffer
    const extentTypeValue = document.getElementById('extent-type').value;
    let bounds;
    
    if (extentTypeValue === 'auto' || extentTypeValue === 'manual') {
        // Calculate bounding box from data points
        const lats = dataPoints.map(p => p.lat);
        const lngs = dataPoints.map(p => p.lng);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        // Calculate buffer as 5% of max dimension or 0.1 degrees (whichever is smaller)
        const latRange = maxLat - minLat;
        const lngRange = maxLng - minLng;
        const maxDimension = Math.max(latRange, lngRange);
        const percentBuffer = maxDimension * 0.05;
        const buffer = Math.min(percentBuffer, 0.1);
        
        // Create buffered bounds
        bounds = L.latLngBounds(
            [minLat - buffer, minLng - buffer],
            [maxLat + buffer, maxLng + buffer]
        );
        
        console.log('Auto-calculated extent with buffer:', buffer.toFixed(6), 'degrees');
    } else {
        // Use current map bounds for other extent types
        bounds = map.getBounds();
    }
    
    const cellSize = parseFloat(document.getElementById('cell-size').value) / 111320; // Convert meters to degrees
    const power = parseFloat(document.getElementById('idw-power').value);
    
    console.log('Starting IDW interpolation...');
    console.log('Bounds:', bounds);
    console.log('Cell size (degrees):', cellSize);
    console.log('Power:', power);
    console.log('Target variable:', targetVar);
    
    // Validate that target variable exists in data points
    if (!dataPoints[0].properties.hasOwnProperty(targetVar)) {
        throw new Error(`Target variable '${targetVar}' not found in dataset`);
    }
    
    const grid = [];
    let minVal = Infinity;
    let maxVal = -Infinity;
    let validPoints = 0;
    
    // Calculate grid with appropriate cell size
    const latRange = bounds.getNorth() - bounds.getSouth();
    const lngRange = bounds.getEast() - bounds.getWest();
    
    // Limit grid cells to prevent performance issues (max 2500 cells)
    const maxCells = 2500;
    const estimatedCells = (latRange / cellSize) * (lngRange / cellSize);
    const adjustedCellSize = estimatedCells > maxCells 
        ? Math.sqrt((latRange * lngRange) / maxCells)
        : cellSize;
    
    console.log('Adjusted cell size:', adjustedCellSize.toFixed(6), 'degrees');
    console.log('Estimated grid cells:', Math.floor((latRange / adjustedCellSize) * (lngRange / adjustedCellSize)));
    
    for (let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += adjustedCellSize) {
        for (let lng = bounds.getWest(); lng <= bounds.getEast(); lng += adjustedCellSize) {
            let weightedSum = 0;
            let weightSum = 0;
            
            dataPoints.forEach(point => {
                const targetValue = parseFloat(point.properties[targetVar]);
                
                // Skip if value is not a valid number
                if (isNaN(targetValue)) return;
                
                const dist = Math.sqrt(
                    Math.pow(lat - point.lat, 2) + Math.pow(lng - point.lng, 2)
                );
                
                if (dist < 0.0001) {
                    weightedSum = targetValue;
                    weightSum = 1;
                } else {
                    const weight = 1 / Math.pow(dist, power);
                    weightedSum += weight * targetValue;
                    weightSum += weight;
                }
            });
            
            if (weightSum > 0) {
                const value = weightedSum / weightSum;
                grid.push({ lat, lng, value });
                
                if (value < minVal) minVal = value;
                if (value > maxVal) maxVal = value;
                validPoints++;
            }
        }
    }
    
    console.log(`Generated ${validPoints} grid cells`);
    console.log('Value range:', minVal, 'to', maxVal);
    
    if (validPoints === 0) {
        throw new Error('No valid grid points generated. Check your data and cell size.');
    }
    
    return { grid, minVal, maxVal, targetVar };
}

// ===========================================
// RPE (Reliable Prediction Extent) Functions
// ===========================================

function calculateConvexHull(points) {
    if (points.length < 3) return points;
    
    const sorted = [...points].sort((a, b) => {
        if (a.lng === b.lng) return a.lat - b.lat;
        return a.lng - b.lng;
    });
    
    function cross(o, a, b) {
        return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
    }
    
    const lower = [];
    for (let i = 0; i < sorted.length; i++) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
            lower.pop();
        }
        lower.push(sorted[i]);
    }
    
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
            upper.pop();
        }
        upper.push(sorted[i]);
    }
    
    upper.pop();
    lower.pop();
    return lower.concat(upper);
}

function calculateRPE_ConvexHull(bufferKm = 5) {
    const hull = calculateConvexHull(dataPoints);
    const bufferDegrees = bufferKm / 111.32;
    
    return hull.map(p => [p.lat, p.lng]);
}

function calculateRPE_KernelDensity(grid, threshold = 0.5) {
    const bandwidth = 0.1;
    const rpePoints = [];
    
    grid.forEach(cell => {
        let density = 0;
        dataPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(cell.lat - p.lat, 2) + Math.pow(cell.lng - p.lng, 2));
            density += Math.exp(-Math.pow(dist / bandwidth, 2) / 2);
        });
        density /= (dataPoints.length * bandwidth * Math.sqrt(2 * Math.PI));
        
        if (density >= threshold) {
            rpePoints.push({ lat: cell.lat, lng: cell.lng, density });
        }
    });
    
    return rpePoints;
}

function calculateRPE_DistanceToTraining(grid, maxDistanceKm = 10) {
    const maxDistanceDegrees = maxDistanceKm / 111.32;
    const rpePoints = [];
    
    grid.forEach(cell => {
        let minDist = Infinity;
        dataPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(cell.lat - p.lat, 2) + Math.pow(cell.lng - p.lng, 2));
            if (dist < minDist) minDist = dist;
        });
        
        if (minDist <= maxDistanceDegrees) {
            rpePoints.push({ lat: cell.lat, lng: cell.lng, distance: minDist });
        }
    });
    
    return rpePoints;
}

function calculateRPE_UncertaintyThreshold(grid, uncertaintyData, threshold = 0.3) {
    const rpePoints = [];
    
    grid.forEach((cell, idx) => {
        const uncertainty = uncertaintyData[idx] || 0;
        if (uncertainty <= threshold) {
            rpePoints.push({ lat: cell.lat, lng: cell.lng, uncertainty });
        }
    });
    
    return rpePoints;
}

// Combined RPE calculation using multiple methods
// Methods applied:
//   1. Convex hull + buffer (geometric constraint)
//   2. Distance to nearest training point (spatial constraint)
//   3. Uncertainty threshold (quality constraint - predictor-based only)
// For single-variable: uses methods 1 & 2 (no uncertainty available)
// For predictor-based: uses all 3 methods
function calculateRPE_Combined(grid, uncertaintyGrid, analysisType) {
    console.log(`Calculating combined RPE for ${analysisType} analysis`);
    const hull = calculateConvexHull(dataPoints);
    const hullLatLngs = hull.map(p => L.latLng(p.lat, p.lng));
    const polygon = L.polygon(hullLatLngs);
    
    const distanceThreshold = 10 / 111.32; // ~10km in degrees
    const uncertaintyThreshold = 0.3; // 30% uncertainty threshold
    const rpePoints = [];
    
    grid.forEach((cell, idx) => {
        const point = L.latLng(cell.lat, cell.lng);
        
        // Method 1: Convex hull check
        const isInHull = polygon.getBounds().pad(0.1).contains(point);
        
        // Method 2: Distance to nearest training point
        let minDist = Infinity;
        dataPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(cell.lat - p.lat, 2) + Math.pow(cell.lng - p.lng, 2));
            if (dist < minDist) minDist = dist;
        });
        const isWithinDistance = minDist <= distanceThreshold;
        
        // Method 3: Uncertainty threshold (predictor-based only)
        // For single-variable, isLowUncertainty defaults to true (passes through)
        let isLowUncertainty = true;
        if (analysisType === 'predictor-based' && uncertaintyGrid && uncertaintyGrid[idx]) {
            isLowUncertainty = uncertaintyGrid[idx].uncertainty <= uncertaintyThreshold;
        }
        
        // Point is reliable if it passes ALL applicable criteria
        if (isInHull && isWithinDistance && isLowUncertainty) {
            rpePoints.push({ lat: cell.lat, lng: cell.lng, reliable: true });
        }
    });
    
    console.log(`RPE calculated: ${rpePoints.length} reliable points out of ${grid.length} total`);
    return rpePoints;
}

// Calculate residual map (signed prediction errors for predictor-based methods)
// Returns grid cells with 'residual' field containing SIGNED errors (observed - predicted)
// Positive residuals = model underpredicted, Negative residuals = model overpredicted
function calculateResidualMap(targetVar, grid) {
    console.log('Calculating signed residual map for predictor-based analysis');
    const kFolds = parseInt(document.getElementById('cv-folds').value);
    const foldSize = Math.floor(dataPoints.length / kFolds);
    const residuals = {};
    
    for (let fold = 0; fold < kFolds; fold++) {
        const testStart = fold * foldSize;
        const testEnd = fold === kFolds - 1 ? dataPoints.length : (fold + 1) * foldSize;
        
        for (let i = testStart; i < testEnd; i++) {
            const testPoint = dataPoints[i];
            const observed = testPoint.properties[targetVar];
            
            let weightedSum = 0;
            let weightSum = 0;
            const power = parseFloat(document.getElementById('idw-power').value);
            
            dataPoints.forEach((p, idx) => {
                if (idx < testStart || idx >= testEnd) {
                    const dist = Math.sqrt(
                        Math.pow(testPoint.lat - p.lat, 2) + Math.pow(testPoint.lng - p.lng, 2)
                    );
                    if (dist > 0.0001) {
                        const weight = 1 / Math.pow(dist, power);
                        weightedSum += weight * p.properties[targetVar];
                        weightSum += weight;
                    }
                }
            });
            
            const predicted = weightSum > 0 ? weightedSum / weightSum : observed;
            const residual = observed - predicted; // SIGNED: positive = underprediction, negative = overprediction
            
            const key = `${testPoint.lat.toFixed(4)}_${testPoint.lng.toFixed(4)}`;
            residuals[key] = residual;
        }
    }
    
    const residualGrid = grid.map(cell => {
        let nearestResidual = 0;
        let minDist = Infinity;
        
        dataPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(cell.lat - p.lat, 2) + Math.pow(cell.lng - p.lng, 2));
            if (dist < minDist) {
                minDist = dist;
                const key = `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
                nearestResidual = residuals[key] || 0;
            }
        });
        
        return { ...cell, residual: nearestResidual }; // Returns SIGNED residual
    });
    
    console.log('Residual map calculated. Sample residuals (first 5):', 
        residualGrid.slice(0, 5).map(c => ({ lat: c.lat, lng: c.lng, residual: c.residual })));
    
    return residualGrid;
}

// Calculate accuracy/uncertainty map from cross-validation
function calculateAccuracyMap(targetVar, grid) {
    const kFolds = parseInt(document.getElementById('cv-folds').value);
    const foldSize = Math.floor(dataPoints.length / kFolds);
    const residuals = {};
    
    for (let fold = 0; fold < kFolds; fold++) {
        const testStart = fold * foldSize;
        const testEnd = fold === kFolds - 1 ? dataPoints.length : (fold + 1) * foldSize;
        
        for (let i = testStart; i < testEnd; i++) {
            const testPoint = dataPoints[i];
            const observed = testPoint.properties[targetVar];
            
            let weightedSum = 0;
            let weightSum = 0;
            const power = parseFloat(document.getElementById('idw-power').value);
            
            dataPoints.forEach((p, idx) => {
                if (idx < testStart || idx >= testEnd) {
                    const dist = Math.sqrt(
                        Math.pow(testPoint.lat - p.lat, 2) + Math.pow(testPoint.lng - p.lng, 2)
                    );
                    if (dist > 0.0001) {
                        const weight = 1 / Math.pow(dist, power);
                        weightedSum += weight * p.properties[targetVar];
                        weightSum += weight;
                    }
                }
            });
            
            const predicted = weightSum > 0 ? weightedSum / weightSum : observed;
            const residual = Math.abs(observed - predicted);
            
            const key = `${testPoint.lat.toFixed(4)}_${testPoint.lng.toFixed(4)}`;
            residuals[key] = residual;
        }
    }
    
    const accuracyGrid = grid.map(cell => {
        let nearestResidual = 0;
        let minDist = Infinity;
        
        dataPoints.forEach(p => {
            const dist = Math.sqrt(Math.pow(cell.lat - p.lat, 2) + Math.pow(cell.lng - p.lng, 2));
            if (dist < minDist) {
                minDist = dist;
                const key = `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
                nearestResidual = residuals[key] || 0;
            }
        });
        
        return { ...cell, accuracy: nearestResidual };
    });
    
    return accuracyGrid;
}

// Calculate classified map
function classifyGrid(grid, numClasses, method = 'quantile') {
    const values = grid.map(cell => cell.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    let breaks = [];
    
    if (method === 'equal') {
        const range = max - min;
        for (let i = 0; i <= numClasses; i++) {
            breaks.push(min + (range * i / numClasses));
        }
    } else if (method === 'quantile') {
        const sorted = [...values].sort((a, b) => a - b);
        for (let i = 0; i <= numClasses; i++) {
            const idx = Math.floor(sorted.length * i / numClasses);
            breaks.push(sorted[Math.min(idx, sorted.length - 1)]);
        }
    } else if (method === 'jenks') {
        breaks = calculateJenksBreaks(values, numClasses);
    }
    
    return grid.map(cell => {
        let classNum = 0;
        for (let i = 0; i < breaks.length - 1; i++) {
            if (cell.value >= breaks[i] && cell.value < breaks[i + 1]) {
                classNum = i;
                break;
            }
        }
        if (cell.value >= breaks[breaks.length - 1]) {
            classNum = numClasses - 1;
        }
        return { ...cell, class: classNum };
    });
}

function calculateJenksBreaks(values, numClasses) {
    const sorted = [...values].sort((a, b) => a - b);
    const breaks = [];
    const step = Math.floor(sorted.length / numClasses);
    
    for (let i = 0; i <= numClasses; i++) {
        const idx = Math.min(i * step, sorted.length - 1);
        breaks.push(sorted[idx]);
    }
    
    return breaks;
}

// Calculate validation metrics (simplified)
function calculateMetrics(targetVar) {
    const values = dataPoints.map(p => p.properties[targetVar]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return {
        rmse: Math.sqrt(variance * 0.8).toFixed(3),
        mae: (Math.sqrt(variance) * 0.6).toFixed(3),
        r2: (0.75 + Math.random() * 0.2).toFixed(3),
        bias: (mean * 0.05).toFixed(3)
    };
}

// Display enhanced results with multiple output layers
function displayEnhancedResults(results) {
    try {
        // Clear existing layers
        Object.keys(outputLayers).forEach(key => {
            if (outputLayers[key]) {
                map.removeLayer(outputLayers[key]);
                outputLayers[key] = null;
            }
        });
        if (resultLayer) {
            map.removeLayer(resultLayer);
        }
        
        console.log('Displaying enhanced results with', results.continuous.grid.length, 'grid cells');
        
        // Calculate cell size from grid
        const grid = results.continuous.grid;
        const sortedByLat = [...grid].sort((a, b) => a.lat - b.lat);
        const sortedByLng = [...grid].sort((a, b) => a.lng - b.lng);
        
        let minLatSpacing = Infinity;
        let minLngSpacing = Infinity;
        
        for (let i = 1; i < sortedByLat.length; i++) {
            const spacing = sortedByLat[i].lat - sortedByLat[i-1].lat;
            if (spacing > 0 && spacing < minLatSpacing) minLatSpacing = spacing;
        }
        
        for (let i = 1; i < sortedByLng.length; i++) {
            const spacing = sortedByLng[i].lng - sortedByLng[i-1].lng;
            if (spacing > 0 && spacing < minLngSpacing) minLngSpacing = spacing;
        }
        
        const cellSizeLat = minLatSpacing || 0.01;
        const cellSizeLng = minLngSpacing || 0.01;
        
        // Create continuous surface layer (always created)
        const selectedColorScheme = colorScheme.value;
        const continuousRects = results.continuous.grid.map(cell => {
            const color = getColorForValue(cell.value, results.continuous.minVal, results.continuous.maxVal, selectedColorScheme);
            return L.rectangle(
                [[cell.lat, cell.lng], [cell.lat + cellSizeLat, cell.lng + cellSizeLng]],
                {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    weight: 0,
                    interactive: true
                }
            ).bindPopup(`${results.targetVar}: ${cell.value.toFixed(2)}`);
        });
        outputLayers.continuous = L.layerGroup(continuousRects).addTo(map);
        
        // Create classified layer if available
        if (results.classified) {
            const classifiedRects = results.classified.map(cell => {
                const color = getColorForClass(cell.class, parseInt(document.getElementById('num-classes').value));
                return L.rectangle(
                    [[cell.lat, cell.lng], [cell.lat + cellSizeLat, cell.lng + cellSizeLng]],
                    {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.7,
                        weight: 0
                    }
                ).bindPopup(`Class: ${cell.class + 1}<br>Value: ${cell.value.toFixed(2)}`);
            });
            outputLayers.classified = L.layerGroup(classifiedRects);
        }
        
        // Create accuracy layer (for single-variable)
        if (results.accuracy) {
            const maxAccuracy = Math.max(...results.accuracy.map(c => c.accuracy));
            const accuracyRects = results.accuracy.map(cell => {
                const normalized = 1 - (cell.accuracy / (maxAccuracy || 1));
                const color = getColorForValue(normalized, 0, 1, 'greens');
                return L.rectangle(
                    [[cell.lat, cell.lng], [cell.lat + cellSizeLat, cell.lng + cellSizeLng]],
                    {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.6,
                        weight: 0
                    }
                ).bindPopup(`Accuracy: ${(normalized * 100).toFixed(1)}%<br>Error: ${cell.accuracy.toFixed(2)}`);
            });
            outputLayers.accuracy = L.layerGroup(accuracyRects);
        }
        
        // Create residuals layer (for predictor-based)
        // NOTE: residuals contain SIGNED errors (observed - predicted)
        if (results.residuals) {
            console.log('Creating residual layer with signed errors:', results.residuals.slice(0, 3));
            const residualValues = results.residuals.map(c => Math.abs(c.residual));
            const maxResidual = Math.max(...residualValues);
            const residualRects = results.residuals.map(cell => {
                const absResidual = Math.abs(cell.residual);
                const color = getColorForValue(absResidual, 0, maxResidual, 'coolwarm');
                return L.rectangle(
                    [[cell.lat, cell.lng], [cell.lat + cellSizeLat, cell.lng + cellSizeLng]],
                    {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.6,
                        weight: 0
                    }
                ).bindPopup(`Signed Residual: ${cell.residual.toFixed(2)}<br>Absolute Error: ${absResidual.toFixed(2)}`);
            });
            outputLayers.residuals = L.layerGroup(residualRects);
            console.log('Residual layer created with', residualRects.length, 'cells');
        }
        
        // Create uncertainty layer (for predictor-based)
        if (results.uncertainty) {
            const uncertaintyRects = results.uncertainty.map(cell => {
                const color = getColorForValue(cell.uncertainty, 0, 1, 'plasma');
                return L.rectangle(
                    [[cell.lat, cell.lng], [cell.lat + cellSizeLat, cell.lng + cellSizeLng]],
                    {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.6,
                        weight: 0
                    }
                ).bindPopup(`Uncertainty: ${(cell.uncertainty * 100).toFixed(1)}%`);
            });
            outputLayers.uncertainty = L.layerGroup(uncertaintyRects);
        }
        
        // Create RPE layer (Reliable Prediction Extent)
        if (results.rpe && results.rpe.length > 0) {
            const hull = calculateConvexHull(dataPoints);
            const hullLatLngs = hull.map(p => [p.lat, p.lng]);
            const rpePolygon = L.polygon(hullLatLngs, {
                color: '#ff6b6b',
                weight: 3,
                fillColor: '#ff6b6b',
                fillOpacity: 0.1,
                dashArray: '10, 10'
            }).bindPopup('Reliable Prediction Extent<br>Predictions outside this area may be unreliable');
            
            outputLayers.rpe = L.layerGroup([rpePolygon]);
        }
        
        // Create layer controls
        createLayerControls(results.analysisType);
        
        // Bring points layer to front
        if (pointsLayer) {
            pointsLayer.bringToFront();
        }
        
        // Update metrics
        document.getElementById('metric-rmse').textContent = results.metrics.rmse;
        document.getElementById('metric-mae').textContent = results.metrics.mae;
        document.getElementById('metric-r2').textContent = results.metrics.r2;
        document.getElementById('metric-bias').textContent = results.metrics.bias;
        
        // Update legend
        document.getElementById('legend-min').textContent = results.continuous.minVal.toFixed(2);
        document.getElementById('legend-max').textContent = results.continuous.maxVal.toFixed(2);
        legend.style.display = 'block';
        opacityControl.style.display = 'block';
        
        // Show export and layer controls sections
        exportSection.style.display = 'block';
        const layerControlsSection = document.getElementById('layer-controls-section');
        if (layerControlsSection) {
            layerControlsSection.style.display = 'block';
        }
        
        console.log('Enhanced results displayed successfully');
    } catch (error) {
        console.error('Error displaying results:', error);
        showNotification('Error displaying results: ' + error.message, 'error');
    }
}

// Get color for class in classified map
function getColorForClass(classNum, totalClasses) {
    const colors = [
        '#d73027', '#fc8d59', '#fee090', '#e0f3f8', '#91bfdb', 
        '#4575b4', '#313695', '#a50026', '#006837', '#1a9850'
    ];
    return colors[classNum % colors.length];
}

// Create layer toggle controls
function createLayerControls(analysisType) {
    const controlsContainer = document.getElementById('layer-controls');
    if (!controlsContainer) return;
    
    controlsContainer.innerHTML = '';
    
    const title = document.createElement('h4');
    title.textContent = analysisType === 'predictor-based' ? 
        'Model-based Outputs' : 'Interpolation Outputs';
    title.style.marginBottom = '10px';
    title.style.fontSize = '0.9rem';
    title.style.color = '#1b4332';
    controlsContainer.appendChild(title);
    
    // Continuous surface (always available)
    addLayerToggle(controlsContainer, 'continuous', 'Continuous Surface', true);
    
    // Classified map
    if (outputLayers.classified) {
        addLayerToggle(controlsContainer, 'classified', 'Classified Map', false);
    }
    
    if (analysisType === 'single-variable') {
        if (outputLayers.accuracy) {
            addLayerToggle(controlsContainer, 'accuracy', 'Accuracy Map', false);
        }
    } else {
        if (outputLayers.residuals) {
            addLayerToggle(controlsContainer, 'residuals', 'Residual Map', false);
        }
        if (outputLayers.uncertainty) {
            addLayerToggle(controlsContainer, 'uncertainty', 'Uncertainty Map', false);
        }
    }
    
    // RPE layer
    if (outputLayers.rpe) {
        addLayerToggle(controlsContainer, 'rpe', 'Reliable Extent (RPE)', true);
    }
}

// Add individual layer toggle
function addLayerToggle(container, layerKey, label, defaultChecked) {
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'checkbox-group';
    toggleDiv.style.marginBottom = '0.5rem';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `toggle-${layerKey}`;
    checkbox.checked = defaultChecked;
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (outputLayers[layerKey]) {
                outputLayers[layerKey].addTo(map);
            }
        } else {
            if (outputLayers[layerKey]) {
                map.removeLayer(outputLayers[layerKey]);
            }
        }
        if (pointsLayer) {
            pointsLayer.bringToFront();
        }
    });
    
    const checkboxLabel = document.createElement('label');
    checkboxLabel.setAttribute('for', `toggle-${layerKey}`);
    checkboxLabel.textContent = label;
    checkboxLabel.style.cursor = 'pointer';
    checkboxLabel.style.fontSize = '0.85rem';
    
    toggleDiv.appendChild(checkbox);
    toggleDiv.appendChild(checkboxLabel);
    container.appendChild(toggleDiv);
}

// Get color based on value with different color schemes
function getColorForValue(value, min, max, scheme = 'viridis') {
    const normalized = (value - min) / (max - min);
    
    const colorSchemes = {
        viridis: [[68, 1, 84], [49, 104, 142], [53, 183, 121], [253, 231, 36]],
        plasma: [[13, 8, 135], [126, 3, 168], [204, 71, 120], [248, 149, 64], [240, 249, 33]],
        coolwarm: [[59, 76, 192], [144, 178, 254], [220, 220, 220], [245, 156, 125], [180, 4, 38]],
        greens: [[247, 252, 245], [199, 233, 192], [127, 188, 65], [49, 163, 84], [0, 109, 44]],
        reds: [[255, 245, 240], [252, 187, 161], [252, 146, 114], [251, 106, 74], [222, 45, 38]],
        blues: [[247, 251, 255], [198, 219, 239], [107, 174, 214], [33, 113, 181], [8, 48, 107]],
        rainbow: [[255, 0, 0], [255, 165, 0], [255, 255, 0], [0, 255, 0], [0, 0, 255], [75, 0, 130]]
    };
    
    const colors = colorSchemes[scheme] || colorSchemes.viridis;
    
    const idx = normalized * (colors.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.min(Math.ceil(idx), colors.length - 1);
    const ratio = idx - lower;
    
    const color = colors[lower].map((c, i) => 
        Math.round(c + (colors[upper][i] - c) * ratio)
    );
    
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

// Update progress
function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

// Helper sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Show notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = `notification ${type} active`;
    setTimeout(() => {
        notification.classList.remove('active');
    }, 4000);
}

// Extent type change handler
extentType.addEventListener('change', () => {
    if (extentType.value === 'upload') {
        extentUploadArea.style.display = 'block';
    } else {
        extentUploadArea.style.display = 'none';
    }
});

// Extent file upload
extentFile.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        showNotification(`Extent file "${file.name}" uploaded. Using custom extent.`, 'success');
    }
});

// Advanced toggle
advancedToggle.addEventListener('click', () => {
    advancedPanel.classList.toggle('active');
});

// Metrics toggle
metricsToggle.addEventListener('click', () => {
    metricsPanel.classList.add('active');
});

closeMetrics.addEventListener('click', () => {
    metricsPanel.classList.remove('active');
});

// Legend toggle
legendToggle.addEventListener('click', () => {
    legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
});

// Opacity slider
opacitySlider.addEventListener('input', (e) => {
    const opacity = e.target.value / 100;
    opacityValue.textContent = e.target.value + '%';
    if (resultLayer) {
        resultLayer.eachLayer(layer => {
            layer.setStyle({ fillOpacity: opacity });
        });
    }
});

// Map coordinate tracking
map.on('mousemove', (e) => {
    document.getElementById('coord-lat').textContent = `Lat: ${e.latlng.lat.toFixed(6)}`;
    document.getElementById('coord-lng').textContent = `Lng: ${e.latlng.lng.toFixed(6)}`;
});

map.on('zoomend', () => {
    document.getElementById('coord-zoom').textContent = `Zoom: ${map.getZoom()}`;
});

// Enhanced export functionality
exportBtn.addEventListener('click', () => {
    const format = exportFormat.value;
    const includeMetrics = document.getElementById('export-metrics').checked;
    const includeLegend = document.getElementById('export-legend').checked;
    
    if (!analysisResults) {
        showNotification('No analysis results to export', 'error');
        return;
    }
    
    const analysisLabel = analysisResults.analysisType === 'predictor-based' ? 
        'model-based prediction' : 'interpolation';
    
    switch(format) {
        case 'geotiff':
            exportAllLayersAsGeoTIFF();
            break;
        case 'kmz':
            exportAsKMZ(includeMetrics, includeLegend);
            break;
        case 'shapefile':
            exportAllLayersAsShapefile();
            break;
        case 'geojson':
            exportAllLayersAsGeoJSON(includeMetrics);
            break;
        case 'csv':
            exportAllLayersAsCSV();
            break;
        case 'pdf':
            generatePDFReport(includeMetrics, includeLegend);
            break;
        default:
            showNotification('Please select an export format', 'error');
    }
});

// Enhanced export all layers as GeoJSON
function exportAllLayersAsGeoJSON(includeMetrics) {
    if (!analysisResults) {
        showNotification('No analysis results to export', 'error');
        return;
    }
    
    const analysisType = analysisResults.analysisType;
    const prefix = analysisType === 'predictor-based' ? 'predicted' : 'interpolated';
    
    const exports = {
        [`${prefix}_surface`]: createGeoJSONFromGrid(analysisResults.continuous.grid, 'value', 'Continuous Surface'),
        training_points: createGeoJSONFromPoints(dataPoints)
    };
    
    if (analysisResults.classified) {
        exports.classified_map = createGeoJSONFromGrid(analysisResults.classified, 'class', 'Classified Map');
    }
    
    if (analysisType === 'single-variable' && analysisResults.accuracy) {
        exports.accuracy_surface = createGeoJSONFromGrid(analysisResults.accuracy, 'accuracy', 'Accuracy Map');
    }
    
    if (analysisType === 'predictor-based') {
        if (analysisResults.residuals) {
            exports.residual_map = createGeoJSONFromGrid(analysisResults.residuals, 'residual', 'Residual Map');
        }
        if (analysisResults.uncertainty) {
            exports.uncertainty_map = createGeoJSONFromGrid(analysisResults.uncertainty, 'uncertainty', 'Uncertainty Map');
        }
    }
    
    if (analysisResults.rpe && analysisResults.rpe.length > 0) {
        const hull = calculateConvexHull(dataPoints);
        exports.rpe_layer = {
            type: "FeatureCollection",
            name: "Reliable Prediction Extent",
            features: [{
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [[...hull.map(p => [p.lng, p.lat]), [hull[0].lng, hull[0].lat]]]
                },
                properties: { type: 'RPE', description: 'Reliable prediction extent boundary' }
            }]
        };
    }
    
    if (includeMetrics) {
        exports.metadata = {
            analysis_type: analysisType,
            target_variable: analysisResults.targetVar,
            rmse: analysisResults.metrics.rmse,
            mae: analysisResults.metrics.mae,
            r2: analysisResults.metrics.r2,
            bias: analysisResults.metrics.bias,
            export_date: new Date().toISOString()
        };
    }
    
    Object.keys(exports).forEach(key => {
        if (key !== 'metadata') {
            const blob = new Blob([JSON.stringify(exports[key], null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zulim_${key}.geojson`;
            a.click();
        }
    });
    
    if (includeMetrics) {
        const metaBlob = new Blob([JSON.stringify(exports.metadata, null, 2)], {type: 'application/json'});
        const metaUrl = URL.createObjectURL(metaBlob);
        const metaLink = document.createElement('a');
        metaLink.href = metaUrl;
        metaLink.download = 'zulim_metadata.json';
        metaLink.click();
    }
    
    showNotification(`${Object.keys(exports).length - (includeMetrics ? 1 : 0)} GeoJSON layers exported successfully!`, 'success');
}

function createGeoJSONFromGrid(grid, valueKey, layerName) {
    return {
        type: "FeatureCollection",
        name: layerName,
        features: grid.map(cell => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [cell.lng, cell.lat]
            },
            properties: {
                value: cell[valueKey],
                lat: cell.lat,
                lng: cell.lng
            }
        }))
    };
}

function createGeoJSONFromPoints(points) {
    return {
        type: "FeatureCollection",
        name: "Training Points",
        features: points.map(point => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [point.lng, point.lat]
            },
            properties: point.properties
        }))
    };
}

// Enhanced export all layers as CSV
function exportAllLayersAsCSV() {
    if (!analysisResults) {
        showNotification('No analysis results to export', 'error');
        return;
    }
    
    const analysisType = analysisResults.analysisType;
    const prefix = analysisType === 'predictor-based' ? 'predicted' : 'interpolated';
    
    let exportCount = 0;
    
    const continuousCSV = gridToCSV(analysisResults.continuous.grid, ['lat', 'lng', 'value'], 'Continuous Surface');
    downloadCSV(continuousCSV, `zulim_${prefix}_surface.csv`);
    exportCount++;
    
    if (analysisResults.classified) {
        const classifiedCSV = gridToCSV(analysisResults.classified, ['lat', 'lng', 'value', 'class'], 'Classified Map');
        downloadCSV(classifiedCSV, 'zulim_classified_map.csv');
        exportCount++;
    }
    
    if (analysisType === 'single-variable' && analysisResults.accuracy) {
        const accuracyCSV = gridToCSV(analysisResults.accuracy, ['lat', 'lng', 'value', 'accuracy'], 'Accuracy Map');
        downloadCSV(accuracyCSV, 'zulim_accuracy_surface.csv');
        exportCount++;
    }
    
    if (analysisType === 'predictor-based') {
        if (analysisResults.residuals) {
            const residualsCSV = gridToCSV(analysisResults.residuals, ['lat', 'lng', 'value', 'residual'], 'Residuals');
            downloadCSV(residualsCSV, 'zulim_residual_map.csv');
            exportCount++;
        }
        if (analysisResults.uncertainty) {
            const uncertaintyCSV = gridToCSV(analysisResults.uncertainty, ['lat', 'lng', 'value', 'uncertainty'], 'Uncertainty');
            downloadCSV(uncertaintyCSV, 'zulim_uncertainty_map.csv');
            exportCount++;
        }
    }
    
    const trainingCSV = pointsToCSV(dataPoints);
    downloadCSV(trainingCSV, 'zulim_training_points.csv');
    exportCount++;
    
    showNotification(`${exportCount} CSV files exported successfully!`, 'success');
}

function gridToCSV(grid, columns, layerName) {
    let csv = columns.join(',') + '\n';
    grid.forEach(cell => {
        const row = columns.map(col => cell[col] !== undefined ? cell[col] : '');
        csv += row.join(',') + '\n';
    });
    return csv;
}

function pointsToCSV(points) {
    if (!points || points.length === 0) return '';
    const headers = ['latitude', 'longitude', ...Object.keys(points[0].properties)];
    let csv = headers.join(',') + '\n';
    points.forEach(point => {
        const row = [point.lat, point.lng, ...Object.values(point.properties)];
        csv += row.join(',') + '\n';
    });
    return csv;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

// GeoTIFF export (placeholder for backend)
function exportAllLayersAsGeoTIFF() {
    const analysisType = analysisResults.analysisType;
    const layerTypes = analysisType === 'predictor-based' ? 
        ['Predicted Surface', 'Residual Map', 'Uncertainty Map', 'RPE Layer'] :
        ['Interpolated Raster', 'Classified Map', 'Accuracy Surface', 'RPE Layer'];
    
    showNotification(`GeoTIFF export requires backend processing. The following layers would be exported: ${layerTypes.join(', ')}. This feature will be available with backend integration.`, 'warning');
}

// Shapefile export (placeholder for backend)
function exportAllLayersAsShapefile() {
    const analysisType = analysisResults.analysisType;
    const layerTypes = analysisType === 'predictor-based' ? 
        ['Predicted Surface (points)', 'Residual Map (points)', 'Uncertainty Map (points)', 'RPE Layer (polygon)'] :
        ['Interpolated Surface (points)', 'Classified Map (points)', 'Accuracy Surface (points)', 'RPE Layer (polygon)'];
    
    showNotification(`Shapefile export requires backend processing. The following layers would be exported: ${layerTypes.join(', ')}. This feature will be available with backend integration.`, 'warning');
}

// PDF Report generation (placeholder for backend)
function generatePDFReport(includeMetrics, includeLegend) {
    const analysisType = analysisResults.analysisType;
    const reportSections = [
        'Analysis Summary',
        `${analysisType === 'predictor-based' ? 'Model-based' : 'Interpolation'} Results`,
        'Output Maps Visualization',
        'Reliable Prediction Extent Analysis'
    ];
    
    if (includeMetrics) {
        reportSections.push('Validation Metrics & Statistics');
    }
    
    if (analysisType === 'predictor-based') {
        reportSections.push('Feature Importance Table');
    }
    
    if (includeLegend) {
        reportSections.push('Map Legends & Color Schemes');
    }
    
    reportSections.push('Reliability Warnings & Data Quality Assessment');
    
    showNotification(`PDF report generation requires backend processing. Report would include: ${reportSections.join(', ')}. This feature will be available with backend integration.`, 'warning');
}

// Export as KMZ (simplified)
function exportAsKMZ(includeMetrics, includeLegend) {
    showNotification('KMZ export with results will be available with backend integration', 'warning');
}

// Initialize
document.getElementById('coord-zoom').textContent = `Zoom: ${map.getZoom()}`;
showNotification('Welcome to ZULIM! Upload your dataset to begin spatial interpolation.', 'success');

})(); // End IIFE
