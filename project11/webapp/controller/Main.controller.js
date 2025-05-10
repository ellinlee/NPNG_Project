sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/m/MessageToast",    
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/ColorPalettePopover",
  "sap/ui/core/HTML"
  ], function (Controller, JSONModel, MessageBox, MessageToast, Filter, FilterOperator, ColorPalettePopover, HTML) {
    "use strict";
  
    return Controller.extend("sync.dc.sd.project11.controller.Main", {

      onInit: function () {
        var oSelectedModel = new JSONModel({});
        this.getView().setModel(oSelectedModel, "selectedModel");
  
        var oHeaderModel = new JSONModel([]);
        this.getView().setModel(oHeaderModel, "headerModel");
  
        // material.json 로드
        var oMaterialModel = new JSONModel();
        oMaterialModel.loadData(
          sap.ui.require.toUrl("sync/dc/sd/project11/model/material.json"),
          null,
          false
        );
        this.getView().setModel(oMaterialModel, "materialModel");
  
        // Color
        this._oColorPopover = new ColorPalettePopover({
          showDefaultColor: false,
          showMoreColors : false,
          colorSelect    : this._onColorSelect.bind(this)
        });
      },
  
      onSearchPress: function () {
        var aFilters = [],
            sInqr   = this.byId("inqrIdInput").getValue(),
            sCust   = this.byId("custIdInput").getValue(),
            sName   = this.byId("custNameInput").getValue(),
            sMat    = this.byId("matIdInput").getValue(),
            sOrg    = this.byId("salesOrgInput").getSelectedKey(),
            dFrom   = this.byId("dateFrom").getDateValue(),
            dTo     = this.byId("dateTo").getDateValue();
  
        if (sInqr) aFilters.push(new Filter("inqr_docu_id", FilterOperator.EQ, sInqr));
        if (sCust) aFilters.push(new Filter("cust_id",        FilterOperator.EQ, sCust));
        if (sName) aFilters.push(new Filter("cust_name",      FilterOperator.Contains, sName));
        if (sMat)  aFilters.push(new Filter("mat_id",         FilterOperator.EQ, sMat));
        if (sOrg)  aFilters.push(new Filter("sales_org",      FilterOperator.EQ, sOrg));

      if (dFrom && dTo) {
        aFilters.push(new Filter("valid_from", FilterOperator.BT, dFrom, dTo));
      } else if (dFrom) {
        aFilters.push(new Filter("valid_from", FilterOperator.GE, dFrom));
      } else if (dTo) {
        aFilters.push(new Filter("valid_from", FilterOperator.LE, dTo));
      }
  
      // OData Read
      this.getView().getModel().read("/ZDCC_InquiryForm", {
        filters: aFilters,
        success: function (oData) {

          var oMap = {};
          oData.results.forEach(function (oRow) {
            if (!oMap[oRow.inqr_docu_id]) {
              oMap[oRow.inqr_docu_id] = {
                inqr_docu_id: oRow.inqr_docu_id,
                cust_id     : oRow.cust_id,
                cust_name   : oRow.cust_name,
                sales_org   : oRow.sales_org,
                country     : oRow.sales_org,
                valid_from  : oRow.valid_from,
                valid_to    : oRow.valid_to,
                hdescr      : oRow.hdescr,
                deliv_day   : oRow.deliv_day,
                items       : []
              };
            }
            oMap[oRow.inqr_docu_id].items.push({
              inqr_item_id: oRow.inqr_item_id,
              mat_id      : oRow.mat_id,
              ivalid_from : oRow.ivalid_from,
              ivalid_to   : oRow.ivalid_to,
              qty         : oRow.qty,
              idescr      : oRow.idescr
            });
          });


          var aHeaders = Object.values(oMap);
          this.getView().getModel("headerModel").setData(aHeaders);

          // 2) 토스트 메시지 (조회 성공 시만!)
          var iCount = aHeaders.length;
          if (iCount > 0) {
            MessageToast.show("✔ " + iCount + "건이 검색되었습니다.");
          } else {
            MessageToast.show("조건에 해당하는 데이터가 없습니다.");
          }
        }.bind(this),

        error: function () {
          MessageBox.error("조회 중 오류가 발생했습니다.");
        }
      });
    },

    onReset: function () {
      MessageBox.confirm("조회 조건과 결과를 초기화하시겠습니까?", {
        title: "초기화 확인",
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.OK) {
            ["inqrIdInput","custIdInput","custNameInput","matIdInput"]
              .forEach(function(id){ this.byId(id).setValue(""); }.bind(this));
            this.byId("salesOrgInput").setSelectedKey("");
            this.byId("dateFrom").setValue("");
            this.byId("dateTo").setValue("");
            this.getView().getModel("headerModel").setData([]);
            this.getView().getModel("selectedModel").setData({});
          }
        }.bind(this)
      });
    },

    onShowInfo: function () {
      MessageBox.information(
        "ℹ️ 조회 조건 안내\n\n" +
        "• 문의서번호\n" +
        "  – 정확히 일치해야 조회됩니다.\n\n" +
        "• 고객 ID\n" +
        "  – 정확히 일치해야 조회됩니다.\n\n" +
        "• 고객명\n" +
        "  – 일부 단어로도 검색 가능합니다.\n\n" +
        "• 자재 ID\n" +
        "  – 정확히 일치해야 조회됩니다.\n\n" +
        "• 국가\n" +
        "  – 콤보박스에서 선택하세요.\n\n" +
        "• 희망계약기간\n" +
        "  – 시작일만 입력하거나, 시작·종료일 모두 입력할 수 있습니다.\n\n" +
        "찾고자 하는 조건을 입력한 뒤 “조회” 버튼을 눌러주세요."
      );
    },

    onSelect: function (oEvt) {
      var oCtx = oEvt.getParameter("listItem")
                     .getBindingContext("headerModel"),
          oHeader = oCtx.getObject();

      this.getView().getModel("selectedModel").setData(oHeader);
      this.byId("detailDialog").open();
    },

    onDialogClose: function () {
      this.byId("detailDialog").close();
    },


    // 국가
    countryFormatter: function (s) {
      return { S100:"한국", S200:"일본", S300:"중국" }[s] || "";
    },
    // 팝업 판매조직
    salesOrgFormatter: function (s) {
      return {
        S100:"이노코팅 한국판매지사",
        S200:"이노코팅 일본판매지사",
        S300:"이노코팅 중국판매지사"
      }[s] || s;
    },
    // 날짜 범위
    rangeFormatter: function (dFrom, dTo) {
      var oDF = sap.ui.core.format.DateFormat.getDateInstance({pattern:"yyyy.MM.dd"});
      if (dFrom && dTo) return oDF.format(dFrom) + " ~ " + oDF.format(dTo);
      if (dFrom) return oDF.format(dFrom);
      if (dTo)   return oDF.format(dTo);
      return "";
    },
    // material.json 조회
    getMaterialName: function(sMatID){
      var o = this.getView().getModel("materialModel").getProperty("/"+sMatID);
      return o?o.name:"";
    },
    getColorByMatID: function(sMatID){
      var o = this.getView().getModel("materialModel").getProperty("/"+sMatID);
      return o?o.color:"#fff";
    },
    buildColorSwatch: function(sMatID){
      var c=this.getColorByMatID(sMatID), n=this.getMaterialName(sMatID);
      return "<div title='"+n+"' style='display:inline-block;width:60px;height:30px;"
           + "background:"+c+";border:1px solid #ccc;border-radius:6px;'></div>";
    },
    onColorPress: function(oEvt){
      var a = this.getView().getModel("selectedModel").getProperty("/items")||[],
          aC = a.map(function(o){return this.getColorByMatID(o.mat_id).slice(1);}.bind(this));
      this._oColorPopover.setColors(aC);
      this._oColorPopover.openBy(oEvt.getSource());
    },
    _onColorSelect: function(oEvt){
      MessageBox.information("선택된 색: #"+oEvt.getParameter("color"));
    }

  });
});