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

      var customerId = this.getView().byId("app_input1").getValue();
      var oModel1 = this.getView().getModel();

      oModel1.read("/ZDCC_InquiryForm", {
    filters: [
      new sap.ui.model.Filter("cust_id", sap.ui.model.FilterOperator.EQ, customerId)
    ],
    success: function (oData) {
      if (oData.results.length > 0) {
        // 고객 존재 시 라우팅
        var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
        oRouter.navTo("RouteSelect", {
          customerId: encodeURIComponent(customerId)
        });
      } else {
        // 존재하지 않음
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

