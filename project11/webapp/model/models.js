sap.ui.define([
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/Device"
], 
function (ODataModel,JSONModel, Device) {
    "use strict";
    return {
      createMainServiceModel: function () {
        return new ODataModel({
          serviceUrl: "/sap/opu/odata/sap/ZDCC_INQUIRYFORM_CDS/",
          useBatch: false,
          defaultBindingMode: "TwoWay"
        });
      }
    };
  });