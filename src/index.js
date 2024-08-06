/*This is the js class extended form leaflet FeatureGroup class
* This supports to produce dynamic grid with custom glyphs
* This idea came from my MSc Software Engineering project's supervisor Dr Aidan Slingsby at City University London
* I would like to thank to leaflet code examples and plugins that I learned a lot from them */
import * as L from 'leaflet';
import * as d3 from 'd3';

class DynamicGridsOnMap extends L.FeatureGroup {
    constructor(options) {
        super(options);
        this.options = {
            gridSize: 80,        //This is the default grid size
            delayRate: 0,        //This can make delay the grid producing rate
            M_data: null,        //Income data
            customIconFun: null, //Function for custom icon creation
            style: {             //This is the default css style options
                color: '#000',
                fillColor: "#fff",
                weight: 1,
                fillOpacity: 0.1,
            }
        };
        //initialize the class
        L.Util.setOptions(this, options);
    }

    //This function produce the first grid cells on the map
    addGrids() {
        this._drawGrids(this._map.getBounds(), this.options.M_data);
    }

    //events for zoom and pan
    onAdd(map) {
        super.onAdd(map);
        this._map = map;
        map.on("moveend", this._moveEvent, this);
        map.on("zoomend", this._zoomEvent, this);
    }

    onRemove(map) {
        super.onRemove(map);
        map.off("movend", this._moveEvent, this);
        map.off("zoomend", this._zoomEvent, this);
    }

    //every time you move, you have to recreate the grid and glyphs to fit with the map
    _moveEvent(e) {
        this.clearLayers();
        this._drawGrids(e.target.getBounds());
    }

    _zoomEvent(e) {
        this.clearLayers();
        this._drawGrids(e.target.getBounds());
    }
    
    //draw the grid and produce the glyphs
    _drawGrids(bounds, markers) {
        this._originalB = this._map.project(bounds.getNorthWest());
        this._gridSize = this.options.gridSize;
        this._setRow_Column();
        this._loadedGridCells = [];
        this.clearLayers();
        this._produceGridCells(bounds);
        this._produceGlyphs(bounds, markers);
    }

    //this function produce grid cells
    _produceGridCells(bounds) {
        const cells = this._cellBoundary(bounds);
        this.fire("newGridCells", cells);
        cells.reverse().forEach((cell, i) => {
            if (this._loadedGridCells.indexOf(cell.id) === -1) {
                setTimeout(() => {
                    this.addLayer(L.rectangle(cell.bounds, this.options.style));
                }, this.options.delayRate * i);
                this._loadedGridCells.push(cell.id);
            }
        });
    }

    //this function produce icons
    _produceGlyphs(bounds) {
        const cells = this._cellBoundary(bounds);
        const mBPoints = this._matchBoundPoints(this.options.M_data);
        const cBPoints = this._matchInCellsPoints(cells, mBPoints);
        const cMapReduce = this._mapreduceMarkers(cBPoints);
        cMapReduce.reverse().forEach((c_Markers, i) => {
            const MarkerInfo = cBPoints.filter(d => c_Markers.id === d.cellID);
            setTimeout(() => {
                this.addLayer(L.marker(c_Markers.position, { icon: this._createIcon(MarkerInfo) }));
            }, this.options.delayRate * i);
        });
    }

    //getting the row and column size, map size of x and y coordinates are divided by the grid size
    _setRow_Column() {
        //width is divided by gridsize
        this._rowSize = Math.ceil(this._map.getSize().x / this._gridSize);
        //height is divided by gridsize
        this._colSize = Math.ceil(this._map.getSize().y / this._gridSize);
    }

    _cellBoundary() {
        const cells = [];
        for (let i = 0; i <= this._rowSize; ++i) {
            for (let j = 0; j <= this._colSize; ++j) {
                const row = i;
                const col = j;
                const cellBounds = this._gridCellArea(row, col);
                const cellId = `${row}:${col}`;
                const Centroid = cellBounds.getCenter();
                cells.push({
                    id: cellId,
                    bounds: cellBounds,
                    centroid: Centroid
                });
                console.log(cellBounds);
            }
        }
        return cells;
    }

    //to add the grid cells of rows and column by adding coordinate points from the left corner
    _setPoints(row, col) {
        const x = this._originalB.x + (row * this._gridSize);
        const y = this._originalB.y + (col * this._gridSize);
        return new L.Point(x, y);
    }

    //this function is to get boundary data of each single grid by edges south west and north east points
    _gridCellArea(row, col) {
        const south_westPoint = this._setPoints(row, col);
        const north_eastPoint = this._setPoints(row - 1, col - 1);
        const s_w = this._map.unproject(south_westPoint);
        const n_e = this._map.unproject(north_eastPoint);
        return new L.LatLngBounds(n_e, s_w);
    }

    //find the points that include in current map boundary
    _matchBoundPoints(markers) {
        const matchPoints = [];
        markers.forEach(d => {
            if (this._map.getBounds().contains(d._latlng)) {
                matchPoints.push([d.options.id, d._latlng]);
            }
        });
        return matchPoints;
    }
    
    //find the points which are in each grid cells
    _matchInCellsPoints(cell, mbPoints) {
        const matchPoints = [];
        mbPoints.forEach(d => {
            const matched = cell.find(element => element.bounds.contains(d[1]));
            matchPoints.push({ id: d[0], cellID: matched.id, centroid: matched.centroid });
        });
        return matchPoints;
    }

    //by using MapReduce method, the points in each cell can be counted
    _mapreduceMarkers(cBpoints) {
        const mapReduceArr = [];
        const output = cBpoints.reduce((item, o) => {
            item[o.cellID] = (item[o.cellID] || 0) + 1;
            return item;
        }, {});
        const obj_array = Object.keys(output).map(key => [key, output[key]]);
        obj_array.forEach(d => {
            const matched = cBpoints.find(element => element.cellID === d[0]);
            mapReduceArr.push({ id: d[0], count: d[1], position: matched.centroid });
        });
        return mapReduceArr;
    }

    //include Icon create Function
    _createIcon(markerInfo) {
        let Icon;
        if (!this.options.customIconFun) {
            Icon = L.icon({
                iconUrl: 'pin.svg',
                iconSize: [40, 40],
            });
        } else {
            Icon = this.options.customIconFun({
                getMarkerInfo: () => markerInfo,
            });
        }
        return Icon;
    }
}

//produce the map
function produceMyMap(varMap) {
    // Check if L (Leaflet) is loaded
    if (typeof L === 'undefined') {
        throw new Error('Leaflet (L) is not loaded');
    }

    return new L.Map(varMap.attribute_id, { center: [varMap.lat, varMap.lon], zoom: varMap.zoom });
};

// Adding leaflet original grid
class LeafletGrid extends L.GridLayer {
    createTile(coords) {
        const tile = document.createElement('grid_tile');
        tile.innerHTML = `x${coords.x}, y${coords.y}, ${coords.z}`;
        tile.style.outline = '1px solid navy';
        return tile;
    }
}

//initializing the original grid
function originalGrid() {
    return new LeafletGrid();
}

// Adding tile layer
function addMyTile(mapData) {
    // Check if L (Leaflet) is loaded
    if (typeof L === 'undefined') {
        throw new Error('Leaflet (L) is not loaded');
    }

    const mapLink = `<a href="${mapData.link}">${mapData.name}</a>`;
    return L.tileLayer(mapData.server_url, {
        attribution: `&copy; ${mapLink} Contributors`,
        maxZoom: mapData.maxZoom,
    });
};

// Adding SVG layer
function addSVGLayer() {
    if (typeof L === 'undefined') {
        throw new Error('Leaflet (L) is not loaded');
    }

    return L.svg();
};

//selection SVG layer
function selectSVGLayer(svgLayer) {
    // Check if d3 is loaded
    if (typeof d3 === 'undefined') {
        throw new Error('d3 is not loaded');
    }

    return d3.select(svgLayer.attribute_id)
        .select(svgLayer.layer)
        .append(svgLayer.new_attribute);
};

//add circles
function addCircles(attr_name, data) {
    // Check if d3 is loaded
    if (typeof d3 === 'undefined') {
        throw new Error('d3 is not loaded');
    }

    return d3.select(attr_name)
        .selectAll('circles')
        .data(data)
        .enter()
        .append("circle")
        .style("fill", "orange")
        .style("fill-opacity", 0.7)
        .attr("r", 5);
};

//update circles
function updateCircles(attr_name) {
    return attr_name.attr("transform", (d) => {
        const { x, y } = map.latLngToLayerPoint(d.LatLng);
        return `translate(${x},${y})`;
    });
};

function addSimpleClusterMarkers(item) {
    // Check if L (Leaflet) is loaded
    if (typeof L === 'undefined') {
        throw new Error('Leaflet (L) is not loaded');
    }

    return L.marker(item.latlon, { title: item.title });
};

//add pie chart
function createPie(mapData) {
    // Check if d3 is loaded
    if (typeof d3 === 'undefined') {
        throw new Error('d3 is not loaded');
    }

    const { dataCol, strokeW = 1, dataset, w = 50, h = 50, pieClass = 'clusterPie' } = mapData;
    const r = w / 2;
    const position = r + strokeW;

    const pie = d3.pie()
        .sort(null)
        .value((d) => d);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(r);

    const svg = document.createElementNS(d3.namespaces, 'svg');

    const pre = d3.select(svg)
        .attr('class', pieClass)
        .attr('width', w)
        .attr('height', h);

    const points = pre.selectAll("g")
        .data(dataCol)
        .enter()
        .append("g")
        .attr("class", pieClass);

    const pies = points.selectAll(pieClass)
        .data(pie(dataset))
        .enter()
        .append('g')
        .attr('class', 'arc')
        .attr('transform', `translate(${position},${position})`);

    pies.append("path")
        .attr('d', arc)
        .attr("fill", (d, i) => color[i + 1]);

    return xmlNode(svg);
};

function xmlNode(node) {
    if (typeof window.XMLSerializer !== "undefined") {
        return (new window.XMLSerializer()).serializeToString(node);
    } else if (typeof node.xml !== "undefined") {
        return node.xml;
    }
    return "";
};

// Remove the extra closing parenthesis
module.exports = { DynamicGridsOnMap, produceMyMap, originalGrid, addMyTile, addSVGLayer, selectSVGLayer, addCircles, updateCircles, addSimpleClusterMarkers, createPie, xmlNode }; 