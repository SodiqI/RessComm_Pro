// Initialize the map
const map = L.map('map').setView([0, 0], 2);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Global variables
let excelData = [];
let excelColumns = [];
let pointConfigs = [];
let plottedAreas = [];
let plotType = 'area';
let undoStack = [];
let redoStack = [];

// Geodesic area calculation function
function calculateGeodesicArea(latLngs) {
    if (latLngs.length < 3) return 0;

    const earthRadius = 6371000; // Earth's radius in meters
    let area = 0;

    for (let i = 0; i < latLngs.length; i++) {
        const j = (i + 1) % latLngs.length;
        const lat1 = latLngs[i].lat * Math.PI / 180;
        const lng1 = latLngs[i].lng * Math.PI / 180;
        const lat2 = latLngs[j].lat * Math.PI / 180;
        const lng2 = latLngs[j].lng * Math.PI / 180;

        area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs(area * earthRadius * earthRadius / 2);
    return area;
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Handle Excel file upload
function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            excelData = XLSX.utils.sheet_to_json(worksheet);

            // Get column names
            excelColumns = Object.keys(excelData[0] || {});

            document.getElementById('file-status').innerHTML = `
                <strong>File loaded successfully!</strong><br>
                Rows: ${excelData.length}<br>
                Columns: ${excelColumns.length}<br>
                Available columns: ${excelColumns.join(', ')}
            `;

            // Enable configuration panels
            document.getElementById('plot-config').classList.remove('disabled');
            document.getElementById('points-config').classList.remove('disabled');
            document.getElementById('plot-controls').classList.remove('disabled');

            // Initialize with first point configuration
            initializePoints();

        } catch (error) {
            alert('Error reading Excel file: ' + error.message);
            document.getElementById('file-status').textContent = 'Error loading file';
        }
    };
    reader.readAsArrayBuffer(file);
}

// Update plot type
function updatePlotType() {
    plotType = document.querySelector('input[name="plotType"]:checked').value;
    updatePointsInterface();
}

// Initialize points configuration
function initializePoints() {
    pointConfigs = [];
    addPoint();
    addPoint();
}

// Add a new point configuration
function addPoint() {
    const pointNumber = pointConfigs.length + 1;
    const pointConfig = {
        id: pointNumber,
        latColumn: '',
        lngColumn: ''
    };

    pointConfigs.push(pointConfig);
    updatePointsInterface();
}

// Remove the last point configuration
function removeLastPoint() {
    if (pointConfigs.length > 2) {
        pointConfigs.pop();
        updatePointsInterface();
    } else {
        alert('Minimum 2 points required');
    }
}

// Update the points interface
function updatePointsInterface() {
    const container = document.getElementById('points-container');
    container.innerHTML = '';

    pointConfigs.forEach((config, index) => {
        const pointDiv = document.createElement('div');
        pointDiv.className = 'point-config';

        pointDiv.innerHTML = `
            <div class="point-header">
                <h3>Point ${config.id}</h3>
            </div>
            <div class="column-selector">
                <div>
                    <label>Latitude Column</label>
                    <select onchange="updatePointConfig(${index}, 'lat', this.value)">
                        <option value="">Select latitude column</option>
                        ${excelColumns.map(col => 
                            `<option value="${col}" ${config.latColumn === col ? 'selected' : ''}>${col}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label>Longitude Column</label>
                    <select onchange="updatePointConfig(${index}, 'lng', this.value)">
                        <option value="">Select longitude column</option>
                        ${excelColumns.map(col => 
                            `<option value="${col}" ${config.lngColumn === col ? 'selected' : ''}>${col}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
        `;

        container.appendChild(pointDiv);
    });
}

// Update point configuration
function updatePointConfig(index, type, value) {
    if (type === 'lat') {
        pointConfigs[index].latColumn = value;
    } else if (type === 'lng') {
        pointConfigs[index].lngColumn = value;
    }
}

// Save state for undo/redo
function saveState() {
    const state = {
        plottedAreas: JSON.parse(JSON.stringify(plottedAreas.map(area => ({
            id: area.id,
            points: area.points,
            area: area.area,
            hectares: area.hectares,
            sqKm: area.sqKm,
            attributes: area.attributes,
            type: area.type
        }))))
    };
    undoStack.push(state);
    if (undoStack.length > 20) {
        undoStack.shift();
    }
    redoStack = [];
}

// Undo function
function undo() {
    if (undoStack.length === 0) {
        alert('Nothing to undo');
        return;
    }

    const currentState = {
        plottedAreas: JSON.parse(JSON.stringify(plottedAreas.map(area => ({
            id: area.id,
            points: area.points,
            area: area.area,
            hectares: area.hectares,
            sqKm: area.sqKm,
            attributes: area.attributes,
            type: area.type
        }))))
    };
    redoStack.push(currentState);

    const previousState = undoStack.pop();
    restoreState(previousState);
}

// Redo function
function redo() {
    if (redoStack.length === 0) {
        alert('Nothing to redo');
        return;
    }

    const currentState = {
        plottedAreas: JSON.parse(JSON.stringify(plottedAreas.map(area => ({
            id: area.id,
            points: area.points,
            area: area.area,
            hectares: area.hectares,
            sqKm: area.sqKm,
            attributes: area.attributes,
            type: area.type
        }))))
    };
    undoStack.push(currentState);

    const nextState = redoStack.pop();
    restoreState(nextState);
}

// Restore state
function restoreState(state) {
    // Clear existing areas from map
    plottedAreas.forEach(area => {
        if (area.layer && area.layer._map) {
            map.removeLayer(area.layer);
        }
    });

    plottedAreas = [];

    // Restore areas
    state.plottedAreas.forEach(areaData => {
        if (areaData.type === 'area' && areaData.points.length >= 3) {
            const latLngs = areaData.points.map(p => L.latLng(p[0], p[1]));
            const polygon = L.polygon(latLngs, {
                color: '#3498db',
                fillOpacity: 0.5,
                weight: 2
            }).addTo(map);

            polygon.bindPopup(createPopupContent(areaData));
            areaData.layer = polygon;
            plottedAreas.push(areaData);
        }
    });

    updateAreasList();
}

// Plot data from Excel
function plotData() {
    // Validate point configurations
    const isValid = pointConfigs.every(config => config.latColumn && config.lngColumn);
    if (!isValid) {
        alert('Please select latitude and longitude columns for all points');
        return;
    }

    saveState();

    let plotCount = 0;
    let skippedCount = 0;

    excelData.forEach((row, rowIndex) => {
        const points = [];

        // Extract coordinates for each configured point
        pointConfigs.forEach(config => {
            const lat = parseFloat(row[config.latColumn]);
            const lng = parseFloat(row[config.lngColumn]);

            // Only add valid coordinates (ignore empty cells)
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                points.push([lat, lng]);
            }
        });

        // Plot area if we have at least 3 points
        if (plotType === 'area' && points.length >= 3) {
            plotArea(points, row, rowIndex + 1);
            plotCount++;
        } else if (plotType === 'distance' && points.length >= 2) {
            calculateRowDistances(points, row, rowIndex + 1);
            plotCount++;
        } else {
            skippedCount++;
        }
    });

    document.getElementById('plot-status').innerHTML = `
        Plotted: ${plotCount} rows<br>
        Skipped: ${skippedCount} rows (insufficient points)<br>
        Total areas: ${plottedAreas.length}
    `;

    updateAreasList();

    // Zoom to fit all plotted areas
    if (plottedAreas.length > 0) {
        const group = new L.featureGroup(plottedAreas.map(area => area.layer).filter(layer => layer));
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Plot individual area
function plotArea(points, attributes, rowId) {
    const latLngs = points.map(p => L.latLng(p[0], p[1]));
    const area = calculateGeodesicArea(latLngs);
    const hectares = area / 10000;
    const sqKm = area / 1000000;

    const polygon = L.polygon(latLngs, {
        color: '#3498db',
        fillOpacity: 0.5,
        weight: 2
    }).addTo(map);

    const areaData = {
        id: rowId,
        points: points,
        area: area,
        hectares: hectares,
        sqKm: sqKm,
        attributes: attributes,
        layer: polygon,
        type: 'area'
    };

    polygon.bindPopup(createPopupContent(areaData));
    plottedAreas.push(areaData);
}

// Calculate distances for a row
function calculateRowDistances(points, attributes, rowId) {
    let totalDistance = 0;
    const distances = [];

    for (let i = 0; i < points.length - 1; i++) {
        const dist = calculateDistance(
            points[i][0], points[i][1],
            points[i + 1][0], points[i + 1][1]
        );
        distances.push(dist);
        totalDistance += dist;
    }

    // Create a polyline for visualization
    const polyline = L.polyline(points, {
        color: '#e74c3c',
        weight: 3
    }).addTo(map);

    const distanceData = {
        id: rowId,
        points: points,
        distances: distances,
        totalDistance: totalDistance,
        attributes: attributes,
        layer: polyline,
        type: 'distance'
    };

    polyline.bindPopup(createDistancePopupContent(distanceData));
    plottedAreas.push(distanceData);
}

// Create popup content for areas
function createPopupContent(areaData) {
    let content = `
        <strong>Area ${areaData.id}</strong><br>
        Points: ${areaData.points.length}<br>
        Area: ${areaData.area.toFixed(2)} m²<br>
        Hectares: ${areaData.hectares.toFixed(4)} ha<br>
        Sq Km: ${areaData.sqKm.toFixed(6)} sq km<br><br>
        <strong>Attributes:</strong><br>
    `;

    Object.entries(areaData.attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            content += `${key}: ${value}<br>`;
        }
    });

    return content;
}

// Create popup content for distances
function createDistancePopupContent(distanceData) {
    let content = `
        <strong>Distance Analysis ${distanceData.id}</strong><br>
        Points: ${distanceData.points.length}<br>
        Total Distance: ${(distanceData.totalDistance / 1000).toFixed(3)} km<br><br>
        <strong>Segment Distances:</strong><br>
    `;

    distanceData.distances.forEach((dist, index) => {
        content += `Segment ${index + 1}: ${dist.toFixed(2)} m<br>`;
    });

    content += '<br><strong>Attributes:</strong><br>';
    Object.entries(distanceData.attributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            content += `${key}: ${value}<br>`;
        }
    });

    return content;
}

// Update areas list
function updateAreasList() {
    const container = document.getElementById('areas-list');
    container.innerHTML = '';

    plottedAreas.forEach(area => {
        const areaDiv = document.createElement('div');
        areaDiv.className = 'area-item';

        if (area.type === 'area') {
            areaDiv.innerHTML = `
                <strong>Area ${area.id}</strong><br>
                ${area.points.length} points, ${area.area.toFixed(2)} m²<br>
                ${area.hectares.toFixed(4)} ha, ${area.sqKm.toFixed(6)} sq km
            `;
        } else {
            areaDiv.innerHTML = `
                <strong>Distance ${area.id}</strong><br>
                ${area.points.length} points, ${(area.totalDistance / 1000).toFixed(3)} km total
            `;
        }

        container.appendChild(areaDiv);
    });
}

// Clear all plotted data
function clearAll() {
    if (!confirm('Are you sure you want to clear all plotted data?')) return;

    plottedAreas.forEach(area => {
        if (area.layer && area.layer._map) {
            map.removeLayer(area.layer);
        }
    });

    plottedAreas = [];
    undoStack = [];
    redoStack = [];

    updateAreasList();
    document.getElementById('plot-status').textContent = 'All data cleared';
}

// Export as KMZ
function exportKMZ() {
    if (plottedAreas.length === 0) {
        alert('No data to export');
        return;
    }

    function escapeXml(unsafe) {
        if (unsafe === undefined || unsafe === null) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }

    let kmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    kmlContent += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
    kmlContent += '  <Document>\n';
    kmlContent += '    <name>RessComm Excel Plotter Results</name>\n';
    kmlContent += '    <description>Land area analysis from RessComm Plotter</description>\n';
    kmlContent += '    <Style id="areaStyle">\n';
    kmlContent += '      <PolyStyle>\n';
    kmlContent += '        <color>7f52b788</color>\n';
    kmlContent += '        <fill>1</fill>\n';
    kmlContent += '        <outline>1</outline>\n';
    kmlContent += '      </PolyStyle>\n';
    kmlContent += '      <LineStyle>\n';
    kmlContent += '        <color>ff40916c</color>\n';
    kmlContent += '        <width>2</width>\n';
    kmlContent += '      </LineStyle>\n';
    kmlContent += '    </Style>\n';
    kmlContent += '    <Style id="distanceStyle">\n';
    kmlContent += '      <LineStyle>\n';
    kmlContent += '        <color>ffe74c3c</color>\n';
    kmlContent += '        <width>3</width>\n';
    kmlContent += '      </LineStyle>\n';
    kmlContent += '    </Style>\n';

    plottedAreas.forEach(item => {
        if (item.type === 'area') {
            let description = 'Area: ' + item.area.toFixed(2) + ' m², ' + item.hectares.toFixed(4) + ' ha, ' + item.sqKm.toFixed(6) + ' sq km | Points: ' + item.points.length;

            if (item.attributes && Object.keys(item.attributes).length > 0) {
                Object.entries(item.attributes).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        description += ' | ' + escapeXml(key) + ': ' + escapeXml(value);
                    }
                });
            }

            const coords = item.points.map(p => parseFloat(p[1]).toFixed(6) + ',' + parseFloat(p[0]).toFixed(6) + ',0');
            coords.push(coords[0]);

            kmlContent += '    <Placemark>\n';
            kmlContent += '      <name>Area ' + item.id + '</name>\n';
            kmlContent += '      <description>' + escapeXml(description) + '</description>\n';
            kmlContent += '      <styleUrl>#areaStyle</styleUrl>\n';
            kmlContent += '      <Polygon>\n';
            kmlContent += '        <outerBoundaryIs>\n';
            kmlContent += '          <LinearRing>\n';
            kmlContent += '            <coordinates>\n';
            coords.forEach(coord => {
                kmlContent += '              ' + coord + '\n';
            });
            kmlContent += '            </coordinates>\n';
            kmlContent += '          </LinearRing>\n';
            kmlContent += '        </outerBoundaryIs>\n';
            kmlContent += '      </Polygon>\n';
            kmlContent += '    </Placemark>\n';
        } else {
            let description = 'Distance: ' + (item.totalDistance / 1000).toFixed(3) + ' km | Points: ' + item.points.length;

            if (item.attributes && Object.keys(item.attributes).length > 0) {
                Object.entries(item.attributes).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        description += ' | ' + escapeXml(key) + ': ' + escapeXml(value);
                    }
                });
            }

            const coords = item.points.map(p => parseFloat(p[1]).toFixed(6) + ',' + parseFloat(p[0]).toFixed(6) + ',0');

            kmlContent += '    <Placemark>\n';
            kmlContent += '      <name>Distance ' + item.id + '</name>\n';
            kmlContent += '      <description>' + escapeXml(description) + '</description>\n';
            kmlContent += '      <styleUrl>#distanceStyle</styleUrl>\n';
            kmlContent += '      <LineString>\n';
            kmlContent += '        <coordinates>\n';
            coords.forEach(coord => {
                kmlContent += '          ' + coord + '\n';
            });
            kmlContent += '        </coordinates>\n';
            kmlContent += '      </LineString>\n';
            kmlContent += '    </Placemark>\n';
        }
    });

    kmlContent += '  </Document>\n';
    kmlContent += '</kml>';

    const zip = new JSZip();
    zip.file("doc.kml", kmlContent);

    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, 'resscomm_excel_results.kmz');
    }).catch(function(error) {
        alert('Error creating KMZ: ' + error.message);
    });
}

// Export as Shapefile
function exportShapefile() {
    if (plottedAreas.length === 0) {
        alert('No data to export');
        return;
    }

    try {
        // Create GeoJSON with proper structure
        const geojson = {
            type: "FeatureCollection",
            features: plottedAreas.map(item => {
                const properties = {
                    id: parseInt(item.id) || item.id,
                    name: `${item.type}_${item.id}`,
                    type: item.type
                };

                // Add area-specific properties
                if (item.type === 'area') {
                    properties.area_m2 = parseFloat(item.area.toFixed(2));
                    properties.area_ha = parseFloat(item.hectares.toFixed(4));
                    properties.area_sqkm = parseFloat(item.sqKm.toFixed(6));
                    properties.points = item.points.length;
                } else {
                    properties.total_dist_m = parseFloat(item.totalDistance.toFixed(2));
                    properties.total_dist_km = parseFloat((item.totalDistance / 1000).toFixed(3));
                    properties.points = item.points.length;
                }

                // Add Excel attributes with proper data types
                if (item.attributes && Object.keys(item.attributes).length > 0) {
                    Object.entries(item.attributes).forEach(([key, value]) => {
                        if (value !== undefined && value !== null && value !== '') {
                            // Clean column names for shapefile compatibility
                            const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 10);

                            // Handle data types properly
                            if (typeof value === 'number' || !isNaN(parseFloat(value))) {
                                properties[cleanKey] = parseFloat(value) || 0;
                            } else {
                                properties[cleanKey] = value.toString().substring(0, 254); // DBF field limit
                            }
                        }
                    });
                }

                // Create geometry with proper coordinate order (longitude, latitude)
                const geometry = item.type === 'area' ? {
                    type: "Polygon",
                    coordinates: [item.points.map(p => [parseFloat(p[1]), parseFloat(p[0])])]
                } : {
                    type: "LineString",
                    coordinates: item.points.map(p => [parseFloat(p[1]), parseFloat(p[0])])
                };

                return {
                    type: "Feature",
                    properties,
                    geometry
                };
            })
        };

        const zip = new JSZip();

        // Add GeoJSON (most reliable format)
        zip.file("data.geojson", JSON.stringify(geojson, null, 2));

        // Create proper CSV for Excel/attribute compatibility
        const csvHeaders = ['id', 'name', 'type'];

        // Add measurement headers
        if (plottedAreas.some(a => a.type === 'area')) {
            csvHeaders.push('area_m2', 'area_hectares', 'area_sqkm');
        }
        if (plottedAreas.some(a => a.type === 'distance')) {
            csvHeaders.push('total_distance_m', 'total_distance_km');
        }
        csvHeaders.push('points_count');

        // Add Excel column headers (clean names)
        const excelHeadersClean = [];
        if (excelColumns.length > 0) {
            excelColumns.forEach(col => {
                const cleanHeader = col.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50);
                excelHeadersClean.push(cleanHeader);
                csvHeaders.push(cleanHeader);
            });
        }

        let csvContent = csvHeaders.join(',') + '\n';

        plottedAreas.forEach(item => {
            const row = [];

            // Basic properties
            row.push(item.id);
            row.push(`"${item.type}_${item.id}"`);
            row.push(item.type);

            // Measurement data
            if (plottedAreas.some(a => a.type === 'area')) {
                if (item.type === 'area') {
                    row.push(item.area.toFixed(2));
                    row.push(item.hectares.toFixed(4));
                    row.push(item.sqKm.toFixed(6));
                } else {
                    row.push('', '', '');
                }
            }

            if (plottedAreas.some(a => a.type === 'distance')) {
                if (item.type === 'distance') {
                    row.push(item.totalDistance.toFixed(2));
                    row.push((item.totalDistance / 1000).toFixed(3));
                } else {
                    row.push('', '');
                }
            }

            row.push(item.points.length);

            // Excel attributes
            excelColumns.forEach(column => {
                const value = item.attributes[column];
                if (value !== undefined && value !== null && value !== '') {
                    if (typeof value === 'string' && value.includes(',')) {
                        row.push(`"${value.replace(/"/g, '""')}"`);
                    } else {
                        row.push(value);
                    }
                } else {
                    row.push('');
                }
            });

            csvContent += row.join(',') + '\n';
        });

        zip.file("attributes.csv", csvContent);

        // Create projection file
        const prjContent = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';
        zip.file("projection.prj", prjContent);

        // Create README with instructions
        const readmeContent = `RessComm Excel Plotter Export Package
=====================================

This package contains:

1. data.geojson - Main data file compatible with QGIS, ArcGIS, and web mapping
2. attributes.csv - Attribute data with all Excel columns preserved
3. projection.prj - WGS84 coordinate system definition

For ArcGIS:
- Import the GeoJSON file directly
- Use "Add Data" -> "data.geojson"
- All attributes from Excel will be preserved

For QGIS:
- Drag and drop the GeoJSON file
- Attributes will be automatically joined

Data Summary:
- Total features: ${plottedAreas.length}
- Areas: ${plottedAreas.filter(a => a.type === 'area').length}
- Distances: ${plottedAreas.filter(a => a.type === 'distance').length}
- Excel columns preserved: ${excelColumns.length}

Generated by RessComm Plotter
Contact: afrimics@gmail.com`;

        zip.file("README.txt", readmeContent);

        // Generate and download
        zip.generateAsync({type:"blob"}).then(function(content) {
            saveAs(content, "resscomm_excel_export.zip");
        });

        console.log('Shapefile export completed with', plottedAreas.length, 'features');

    } catch (error) {
        console.error('Error creating shapefile:', error);
        alert('Error creating shapefile: ' + error.message);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set initial state
    document.getElementById('plot-config').classList.add('disabled');
    document.getElementById('points-config').classList.add('disabled');
    document.getElementById('plot-controls').classList.add('disabled');

    // Add event listener for contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            fetch('https://api.formspree.io/f/xzzwyzed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: json
            })
            .then(response => response.json())
            .then(data => {
                alert('Message sent successfully!');
                form.reset();
            })
            .catch(error => {
                console.error('Error sending message:', error);
                alert('Error sending message. Please try again later.');
            });
        });
    }

    // Toggle dev login visibility
    const devLoginButton = document.getElementById('dev-login-button');
    const devLoginSection = document.getElementById('dev-login-section');
    if (devLoginButton && devLoginSection) {
        devLoginSection.style.display = 'none'; // Initially hidden
        devLoginButton.addEventListener('click', function() {
            if (devLoginSection.style.display === 'none') {
                devLoginSection.style.display = 'block';
            } else {
                devLoginSection.style.display = 'none';
            }
        });
    }
});