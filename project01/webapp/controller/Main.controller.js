sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/odata/v2/ODataModel"], 
  (Controller, ODataModel) => {
  "use strict";

  return Controller.extend("sync.dc.sd.project01.controller.Main", {
    onInit() {
      var oModel = new ODataModel("/sap/opu/odata/sap/ZDCC_INQUIRYFORM_CDS/");

      this.getView().setModel(oModel);

      oModel.read("/ZDCC_InquiryForm", {
        success: (oData) => {
          console.log("Success", oData);
        },
        error: (oError) => {
          console.error("Error", oError);
        }
      });
    },
    onPress(){
      var that = this;

      var customerName = this.getView().byId("app_input1").getValue().trim()
      var oModel1 = this.getView().getModel();

      oModel1.read("/ZDCC_InquiryForm", {
    filters: [
      new sap.ui.model.Filter("cust_name", sap.ui.model.FilterOperator.EQ, customerName)
    ],
    success: function (oData) {
      if (oData.results.length > 0) {
        // 고객 존재 시 라우팅`
        var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
        oRouter.navTo("RouteSelect", {
          customerName: encodeURIComponent(customerName)
        });
      } else {
        // 존재하지 않을 떄 에러
        var oBundle = that.getView().getModel("i18n").getResourceBundle();
        var sErrorMessage = oBundle.getText("error");
        sap.m.MessageToast.show(sErrorMessage);
      }
    },
    error: function () {
      var oBundle = that.getView().getModel("i18n").getResourceBundle();
      var sErrorMessage = oBundle.getText("error");
      sap.m.MessageToast.show(sErrorMessage);
    }
  });
    
    }
  });
});

