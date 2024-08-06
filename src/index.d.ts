/*This is the ts class extended form leaflet FeatureGroup class
* This supports to produce dynamic grid with custom glyphs
* This idea came from my MSc Software Engineering project's supervisor Dr Aidan Slingsby at City University London
* I would like to thank to leaflet code examples and plugins that I learned a lot from them */

declare module 'dynamic-grids-on-map' {
    import * as L from 'leaflet';
    import * as d3 from 'd3';
    
    interface DynamicGridsOnMapOptions extends L.LayerOptions {
        map?: L.Map | null;
        gridSize?: number;
        delayRate?: number;
        M_data?: any;
        customIconFun?: ((data: any) => L.Icon) | null;
        style?: L.PathOptions;
    }

    export class DynamicGridsOnMap extends L.FeatureGroup {
        options: DynamicGridsOnMapOptions;
        _map: L.Map;
        _originalB: L.Point;
        _gridSize: number;
        _rowSize: number;
        _colSize: number;
        _loadedGridCells: string[];
    
        constructor(options: DynamicGridsOnMapOptions);
        
        //add the grids
        addGrids(): void;

        //inherent method from L.Layer
        onAdd(map: L.Map): this;
        onRemove(map: L.Map): this;
        produceMyMap(): void;
        originalGrid(): void;
        addMyTile(): void;
        mySVG(): void;


        //private methods for drawing grids and mapping icons
        private _moveEvent(e: L.LeafletEvent): void;
        private _zoomEvent(e: L.LeafletEvent): void;
        private _drawGrids(bounds: L.LatLngBounds, markers: any): void;
        private _produceGridCells(bounds: L.LatLngBounds): void;
        private _produceGlyphs(bounds: L.LatLngBounds): void;
        private _setRow_Column(): void;
        private _cellBoundary(bounds: L.LatLngBounds): Array<{ id: string, bounds: L.LatLngBounds, centroid: L.LatLng }>;
        private _setPoints(row: number, col: number): L.Point;
        private _gridCellArea(row: number, col: number): L.LatLngBounds;
        private _matchBoundPoints(markers: any[]): Array<[string, L.LatLng]>;
        private _matchInCellsPoints(cell: Array<{ id: string, bounds: L.LatLngBounds, centroid: L.LatLng }>, mbPoints: Array<[string, L.LatLng]>): Array<{ id: string, cellID: string, centroid: L.LatLng }>;
        private _mapreduceMarkers(cBpoints: Array<{ id: string, cellID: string, centroid: L.LatLng }>): Array<{ id: string, count: number, position: L.LatLng }>;
        private _createIcon(markerInfo: any): L.Icon;
    }

    namespace L {
        function DynamicGridsOnMap(options: DynamicGridsOnMapOptions): DynamicGridsOnMap;
    }

    export = L.DynamicGridsOnMap;
    export function produceMyMap(option: any): L.Map;
    export function originalGrid(): L.Layer;
    export function addMyTile(option: any): L.TileLayer;
    export function addSVGLayer(): L.SVG;
    export function selectSVGLayer(option: any): d3.Selection<SVGSVGElement, any | null, HTMLElement | null, any | null>;
    export function addCircles(): d3.Selection<SVGSVGElement, any | null, HTMLElement | null, any | null>;
    export function updateCircles(): any;
    export function addSimpleClusterMarkers(): L.Marker<any>;
    export function createPie(): d3.Selection<SVGSVGElement, any | null, HTMLElement | null, any | null>;
    export function xmlNode(): Document;
}