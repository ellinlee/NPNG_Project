sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("sync.dc.sd.project01.controller.App", {
      onInit() {
        // 라우터 초기화
        this.getOwnerComponent().getRouter().initialize();
      }
  });
});