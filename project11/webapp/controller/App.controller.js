sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("sync.dc.sd.project11.controller.App", {
    onInit: function () {
      // 라우터 초기화: manifest.json 에 정의된 route 대로 Main 뷰를 App 컨테이너에 로드합니다.
      this.getOwnerComponent().getRouter().initialize();
    }
  });
});