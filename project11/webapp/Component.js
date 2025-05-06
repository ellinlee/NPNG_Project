sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/odata/v2/ODataModel"
], function (UIComponent, ODataModel) {
  "use strict";

  return UIComponent.extend("sync.dc.sd.project11.Component", {
    metadata: { manifest: "json" },

    init: function () {
      // 1) 기본 UIComponent 초기화 (manifest.json 기반 라우팅 등)
      UIComponent.prototype.init.apply(this, arguments);

      // 2) manifest.json 의 mock 메타데이터를 무시하고
      //    실제 백엔드 OData 서비스로 ODataModel 생성·등록
      var oServiceModel = new ODataModel({
        serviceUrl: "/sap/opu/odata/sap/ZDCC_INQUIRYFORM_CDS/",
        useBatch: false,
        defaultBindingMode: "TwoWay"
      });
      // unnamed(default) 모델로 덮어쓰기
      this.setModel(oServiceModel);
    }
  });
});
