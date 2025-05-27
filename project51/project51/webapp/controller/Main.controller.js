sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/data/DimensionDefinition",
    "sap/viz/ui5/data/MeasureDefinition"
  ], function(
    Controller,
    Filter,
    FilterOperator,
    JSONModel,
    ODataModel,
    FlattenedDataset,
    DimensionDefinition,
    MeasureDefinition
  ) {
    "use strict";
  
    return Controller.extend("project51.controller.Main", {
  
      onInit: function() {
        var oTabBar = this.getView().byId("tabBar");
        if (oTabBar) {
          oTabBar.attachSelect(this._loadAllData.bind(this));
        }
        this._recreateODataModel();
        this._loadDropdownValues();
        this._loadAllData();
      },
  
      onSearch: function() {
        this._loadAllData();
      },
  
      _recreateODataModel: function() {
        var oComp = this.getOwnerComponent();
        oComp.setModel(null, "test");
        var oNew = new ODataModel("/sap/opu/odata/sap/ZDCC_TEST_RESULT_CDS/", {
          defaultBindingMode: "TwoWay",
          refreshAfterChange: true,
          metadataUrlParams: { noCache: true }
        });
        oComp.setModel(oNew, "test");
      },
  
      _loadDropdownValues: function() {
        var oModel = this.getOwnerComponent().getModel("test");
        oModel.read("/ZDCC_TEST_RESULT", {
          success: function(oData) {
            // 1) Set 으로 중복 제거
            var plantSet = new Set(),
                routeSet = new Set();
            oData.results.forEach(function(r) {
              if (r.plant_id) plantSet.add(r.plant_id);
              if (r.route_id)  routeSet.add(r.route_id);
            });
      
            // 2) 배열로 변환 후 정렬
            var plantArray = Array.from(plantSet).sort(function(a, b){
              return a.localeCompare(b);
            });
            var routeArray = Array.from(routeSet).sort(function(a, b){
              return a.localeCompare(b);
            });
      
            // 3) “전체” 옵션을 앞에 붙이기
            var plants = [{ id: "", name: "전체" }]
              .concat(plantArray.map(function(id){ return { id: id, name: id }; }));
            var routes = [{ id: "", name: "전체" }]
              .concat(routeArray.map(function(id){ return { id: id, name: id }; }));
      
            // 4) 뷰에 세팅
            this.getView().setModel(new JSONModel({ plants: plants, routes: routes }));
          }.bind(this),
          error: function() {
            console.error("❌ 드롭다운 로드 실패");
          },
          urlParameters: { _: Date.now().toString() }
        });
      },
      
  
      _getDateFilters: function(sId) {
        var oDR = this.getView().byId(sId),
            d1  = oDR.getDateValue(),
            d2  = oDR.getSecondDateValue(),
            aF  = [];
        if (d1 && d2) {
          aF.push(new Filter("changed_date", FilterOperator.BT, d1, d2));
        }
        return aF;
      },
  
      _loadAllData: function() {
        var oView   = this.getView(),
            oModel  = this.getOwnerComponent().getModel("test"),
            sTab    = oView.byId("tabBar").getSelectedKey(),
            dateId  = (sTab==="plant" ? "dateRange1" : "dateRange2"),
            aDateF  = this._getDateFilters(dateId);
  
        oModel.read("/ZDCC_TEST_RESULT", {
          filters: aDateF,
          success: function(oData) {
            var raw    = oData.results,
                sPlant = oView.byId("plantFilter").getSelectedKey(),
                sRoute = oView.byId("routeFilter").getSelectedKey();
  
            // Plant
            var plantData    = sPlant ? raw.filter(r=>r.plant_id===sPlant) : raw,
                plantSummary = this._calcSummary(plantData),
                plantViol    = this._calcViolations(plantData);
            oView.setModel(new JSONModel({ results:plantSummary }), "plantSummary");
            oView.setModel(new JSONModel({ results:plantViol    }), "plantViol");
            this._initPlantPie(plantSummary);
            this._initPlantBar(plantViol);
  
            // Route
            var routeData    = sRoute ? raw.filter(r=>r.route_id===sRoute) : raw,
                routeSummary = this._calcSummary(routeData),
                routeViol    = this._calcViolations(routeData);
            oView.setModel(new JSONModel({ results:routeSummary }), "routeSummary");
            oView.setModel(new JSONModel({ results:routeViol    }), "routeViol");
            this._initRoutePie(routeSummary);
            this._initRouteBar(routeViol);
          }.bind(this),
          error: function() { console.error("❌ 데이터 로드 실패"); },
          urlParameters: { _: Date.now().toString() }
        });
      },
  
      _calcSummary: function(aRaw) {
        var total = aRaw.length,
            ng    = aRaw.filter(r=>Number(r.qc_status)===1).length,
            ok    = total-ng;
        return [
          { state:"정상", ratio: total?parseFloat((ok/total*100).toFixed(2)):0, count:ok },
          { state:"불량", ratio: total?parseFloat((ng/total*100).toFixed(2)):0, count:ng }
        ];
      },
  
      _calcViolations: function(aRaw) {
        var labelMap = { VI:"점도", SC:"고형분", GL:"광택도", CD:"색차" },
            thresholds = {
              QC_VI:[80,120], QC_SC:[45,65],
              QC_GL:[80,0],   QC_CD:[0,1]
            },
            counts = { QC_VI:0, QC_SC:0, QC_GL:0, QC_CD:0 };
  
        aRaw.forEach(function(r) {
          if (Number(r.qc_status)!==1) return;
          Object.keys(thresholds).forEach(function(key) {
            var rawVal = r[key]!==undefined? r[key]: r[key.toLowerCase()],
                val    = parseFloat(rawVal)||0,
                min    = thresholds[key][0],
                max    = thresholds[key][1],
                isDefect = (min<=max)
                  ? (val<min||val>max)
                  : !(val>=min||val<=max);
            if (isDefect) counts[key]++;
          });
        });
  
        return Object.keys(counts).map(function(key) {
          var code = key.replace("QC_","");
          return { type:labelMap[code]||code, count:counts[key] };
        });
      },
  
      // Plant Pie
      _initPlantPie: function(aData) {
        var oViz  = this.getView().byId("plantPieChart"),
            key   = this.getView().byId("plantFilter").getSelectedKey(),
            map   = { P100:"평택공장", P101:"청두공장" },
            lbl   = key? map[key]||key : "전체",
            title = lbl + " 불량률";
        if (!oViz) return;
  
        // → 문자열 대신 생성자 활용
        oViz.setDataset(new FlattenedDataset({
          dimensions: [
            new DimensionDefinition({ name:"상태", value:"{state}" })
          ],
          measures: [
            new MeasureDefinition({ name:"건수",     value:"{count}" }),
            new MeasureDefinition({ name:"비율(%)",  value:"{ratio}" })
          ],
          data: { path:"/results" }
        }));
        oViz.setModel(new JSONModel({ results:aData }));
        oViz.setVizType("pie");
        oViz.setVizProperties({
          plotArea:{ showLabel:false, dataLabel:{ visible:true, hideWhenOverlap:false } },
          title:{ visible:true, text:title }
        });
      },
  
      // Route Pie
      _initRoutePie: function(aData) {
        var oViz  = this.getView().byId("routePieChart"),
            key   = this.getView().byId("routeFilter").getSelectedKey(),
            lbl   = key||"전체",
            title = lbl + " 불량률";
        if (!oViz) return;
        oViz.setDataset(new FlattenedDataset({
          dimensions: [
            new DimensionDefinition({ name:"상태", value:"{state}" })
          ],
          measures: [
            new MeasureDefinition({ name:"건수",    value:"{count}" }),
            new MeasureDefinition({ name:"비율(%)", value:"{ratio}" })
          ],
          data:{ path:"/results" }
        }));
        oViz.setModel(new JSONModel({ results:aData }));
        oViz.setVizType("pie");
        oViz.setVizProperties({
          plotArea:{ showLabel:false, dataLabel:{ visible:true, hideWhenOverlap:false } },
          title:{ visible:true, text:title }
        });
      },
  
      // Plant Bar
_initPlantBar: function(aData) {
  // ① count > 0 인 항목만 추려냄
  var aFiltered = aData.filter(function(item){
    return item.count > 0;
  });

  var oViz = this.byId("plantBarChart");
  if (!oViz) { return; }

  oViz.setDataset(new FlattenedDataset({
    dimensions: [
      new DimensionDefinition({ name: "QC 항목", value: "{type}" })
    ],
    measures: [
      new MeasureDefinition({ name: "불량건수", value: "{count}" })
    ],
    data: { path: "/results" }
  }));
  // ② 모델에도 필터링된 데이터만
  oViz.setModel(new JSONModel({ results: aFiltered }));
  oViz.setVizType("column");

  oViz.setVizProperties({
    plotArea: {
      dataLabel: { visible: true },
      fixedDataPointSize: { ratio: 0.7 } // 필요에 따라 조절
    },
    categoryAxis: {
      label: { rotation: 0 }
    },
    title: { visible: true, text: "불량 타입별 불량 수" }
  });
},

// Route Bar
_initRouteBar: function(aData) {
  var aFiltered = aData.filter(function(item){
    return item.count > 0;
  });

  var oViz = this.byId("routeBarChart");
  if (!oViz) { return; }

  oViz.setDataset(new FlattenedDataset({
    dimensions: [
      new DimensionDefinition({ name: "QC 항목", value: "{type}" })
    ],
    measures: [
      new MeasureDefinition({ name: "불량건수", value: "{count}" })
    ],
    data: { path: "/results" }
  }));
  oViz.setModel(new JSONModel({ results: aFiltered }));
  oViz.setVizType("column");

  oViz.setVizProperties({
    plotArea: {
      dataLabel: { visible: true },
      fixedDataPointSize: { ratio: 0.7 }
    },
    categoryAxis: {
      label: { rotation: 0 }
    },
    title: { visible: true, text: "불량 타입별 불량 수" }
  });
},
  
    });
  });
