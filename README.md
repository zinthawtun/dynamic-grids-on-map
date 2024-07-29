# dynamic-grids-on-map
This is a simple project to show dynamic grids on map using leaflet.


### Updated README.md

```markdown
# dynamic-grids-on-map
This is a simple project to show dynamic grids on map using leaflet.

## Installation
To install the package, use [`npm install dynamic-grids-on-map`]

## Example Usage

```javascript
const L = require('leaflet');
const DynamicGrid = require('dynamic-grids-on-map');

const map = L.map('map').setView([51.505, -0.09], 13);

const dynamicGrid = new DynamicGrid({
    gridSize: 100,
    M_data: yourData,
    customIconFun: yourCustomIconFunction
});

dynamicGrid.addTo(map);
dynamicGrid.addGrid();
```
```
