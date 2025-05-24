sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/odata/v2/ODataModel"],
  (Controller, ODataModel) => {
    "use strict";

    return Controller.extend("sync.dc.pp.project33.controller.Main", {
      onInit() {
        var oModel = new ODataModel("/sap/opu/odata/sap/ZDCC_MATFLOW_CDS/");
        oModel.setSizeLimit(20000);
        this.getView().setModel(oModel);

        this.oRouter = this.getOwnerComponent().getRouter();
      },

      onTilePress: function (oEvent) {
        // 타일의 subheader를 customerId로 사용
        var sCustomerId = oEvent.getSource().getSubheader();

        console.log("Customer ID:", sCustomerId);

        this.oRouter.navTo(
          "RouteDetail",
          {
            customerId: sCustomerId,
          },
          true
        );
      },

      // 설명 다이얼로그창 open
      onOpenInfoDialog: function (oEvent) {
        if (!this._oInfoDialog) {
          this._oInfoDialog = sap.ui.xmlfragment(
            "sync.dc.pp.project33.view.InfoDialog",
            this
          );
          this.getView().addDependent(this._oInfoDialog);
        }
        this._oInfoDialog.open();
      },

      onCloseInfoDialog: function () {
        if (this._oInfoDialog) {
          this._oInfoDialog.close();
        }
      },
    });
  }
);
