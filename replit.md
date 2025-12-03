# RessComm Plotter

## Overview

RessComm Plotter is a web-based land management and spatial analysis platform designed to promote resilient communities through advanced mapping and data visualization tools. The application provides multiple specialized tools for land area analysis, polygon mapping, blog content management, and spatial interpolation (ZULIM). Built as a client-side web application, it leverages modern JavaScript libraries for geospatial operations and data processing without requiring a traditional backend server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Single-Page Application (SPA) Model**
- Each tool operates as an independent HTML page with dedicated JavaScript modules
- No traditional routing framework; navigation occurs through direct page links
- Pure vanilla JavaScript implementation without frameworks like React or Vue
- Responsive CSS with gradient-based design system emphasizing green/nature themes

**Key Pages/Modules:**
1. **Landing/Home Pages** (`index.html`, `landing.html`, `home.html`) - Entry points with navigation
2. **Excel Plotter** (`excel-plotter.html`, `excel-plotter.js`) - CSV/Excel data visualization on maps
3. **Manual Plotter** (`manual-plotter.html`, `script.js`) - Interactive polygon drawing and measurement
4. **ZULIM** (`zulim.html`, `zulim.js`) - Advanced spatial interpolation and machine learning-based land analysis
5. **Blog Manager** (`blog-manager.html`) - Content management interface

**Design Rationale:**
- Chosen for simplicity and GitHub Pages compatibility (static hosting only)
- No build process required; direct browser execution
- Easier maintenance and debugging for non-framework developers
- Limitation: Code reusability across modules is manual (copy-paste patterns)

### Data Processing Architecture

**Client-Side Computation Model**
- All data processing occurs in the browser using JavaScript
- File parsing handled by third-party libraries (XLSX.js for Excel, JSZip for compressed files)
- Geospatial calculations use Leaflet.js ecosystem
- Mathematical operations (area, distance, interpolation) implemented in vanilla JavaScript

**Geodesic Calculations:**
- Custom implementation of Shoelace formula adapted for Earth's curvature
- Haversine distance formula for point-to-point measurements
- Earth radius constant: 6,371,000 meters
- Rationale: Provides accurate measurements for land management without server dependencies

**State Management:**
- Global variables for each module (no shared state management system)
- Undo/redo stacks implemented as arrays storing previous states
- Session persistence not implemented (data lost on page refresh)
- Trade-off: Simplicity vs. data persistence; acceptable for tool-based workflows

### Mapping and Visualization

**Leaflet.js Core Architecture**
- OpenStreetMap as primary tile provider (free, no API key required)
- Optional satellite imagery from Esri ArcGIS services
- Feature groups for layer organization and bulk operations
- Custom marker and polygon rendering with dynamic styling

**Visualization Layers:**
- Drawn polygons with area calculations displayed in popup labels
- Point markers from uploaded datasets
- Interpolated raster surfaces (ZULIM module)
- Classification overlays with user-defined class breaks
- Accuracy/uncertainty visualization layers

**Design Choice:**
- Leaflet chosen over Google Maps or Mapbox for zero-cost operation and open-source alignment
- Alternative: Mapbox GL JS considered but rejected due to API key requirements and pricing

### ZULIM Advanced Features

**Machine Learning Integration (Planned)**
- Client-side ML using TensorFlow.js for lightweight operations
- Server-side processing via Java backend for intensive computations (Random Forest, SVM, XGBoost)
- Hybrid architecture allows progressive enhancement

**Interpolation Algorithms:**
1. **Single-Variable:** IDW (Inverse Distance Weighting), Ordinary Kriging
2. **Multi-Variable:** Random Forest regression, Support Vector Regression, Gradient Boosting
3. **Hybrid:** Regression-Kriging (ML predictions + spatial interpolation of residuals)

**Reliability Assessment:**
- Reliable Prediction Extent (RPE) calculation using convex hull buffering
- Cross-validation with spatial-block CV to prevent spatial autocorrelation bias
- Uncertainty mapping based on prediction variance or residual distribution

**Architecture Rationale:**
- Two-tier processing allows simple operations in-browser, complex jobs on server
- Preserves user experience (no uploads for basic tasks) while enabling advanced analytics
- Potential limitation: Server infrastructure not yet implemented; currently client-only

### Export and Data Persistence

**Export Formats:**
- GeoTIFF rasters for continuous and classified surfaces
- Shapefiles for vector features (polygons, points)
- CSV for tabular data and grid exports
- PDF reports with embedded maps and statistical summaries
- Excel workbooks with calculated measurements

**Implementation:**
- FileSaver.js for client-side file downloads
- JSZip for bundling multi-file formats (Shapefiles)
- Canvas rendering for PDF generation (assumed, not explicitly coded)

**Design Decision:**
- Client-side export eliminates server storage requirements
- User maintains full data ownership (nothing stored remotely)
- Limitation: Large datasets may cause browser memory issues

### Cross-Validation and Accuracy

**Validation Approach:**
- K-fold cross-validation for model assessment
- Spatial-block CV option to account for spatial autocorrelation
- Residual mapping to visualize prediction errors
- Accuracy surfaces showing regional reliability

**Metrics:**
- RMSE (Root Mean Square Error) for regression tasks
- MAE (Mean Absolute Error) as supplementary metric
- R² for model fit assessment
- Spatial autocorrelation of residuals (Moran's I implied)

## External Dependencies

### Mapping and Geospatial
- **Leaflet.js v1.7.1-1.9.4** - Core mapping library for interactive maps and geographic data visualization
- **OpenStreetMap Tiles** - Free base map tiles (primary tile provider)
- **Esri ArcGIS World Imagery** - Satellite imagery tile service (optional layer)

### File Processing
- **XLSX.js v0.18.5** - Excel and CSV file parsing and generation
- **JSZip v3.10.1** - ZIP file creation for bundled exports (Shapefiles)
- **FileSaver.js v2.0.5** - Client-side file download functionality

### UI and Styling
- **Font Awesome v6.4.0** - Icon library for UI elements
- **Custom CSS** - Gradient-based design system with green/nature color palette

### Machine Learning (ZULIM Module - Planned)
- **TensorFlow.js** (referenced but not yet imported) - Client-side neural network operations
- **Java Backend** (planned but not implemented) - Server-side ML for Random Forest, SVM, XGBoost, Kriging
  - Intended libraries: Weka, Smile, or custom implementations
  - Communication protocol: REST API (assumed)

### Data Formats Supported
- **Input:** CSV, GeoJSON, Shapefile (ZIP), Excel (XLSX)
- **Output:** GeoTIFF, Shapefile, CSV, GeoJSON, PDF, Excel

### Third-Party Services
- **Formspree or EmailJS** (referenced in documentation) - Contact form backend for GitHub Pages hosting
  - Rationale: GitHub Pages cannot run server-side code for email processing
  - Alternative considered: Netlify Forms (requires Netlify hosting)

### Hosting Platform
- **GitHub Pages** - Static site hosting (no server-side processing, no databases)
  - Constraint: All logic must execute client-side or via external APIs
  - Benefit: Free hosting with automatic deployment from repository