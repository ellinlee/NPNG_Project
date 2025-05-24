sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
  "use strict";

  return {
    formatDate(sDate) {
      // sDate -> 날짜 또는 날짜 문자열 값이 들어오게 됨

      var oDateFormat = DateFormat.getDateInstance({
        pattern: "yyyy년 MM월 dd일",
      });
      // 위에서 받은 날짜를 해당 pattern으로 변환
      // 이때, DataFormat은 날짜를 특정 패턴으로 변환해주는 클래스를 이용
      // getDateInstance라는 메서드를 이용하여 해당 클래스의 인스턴스를 생성
      // -> DateFormat 인스턴스를 생성하는 역할

      return oDateFormat.format(new Date(sDate));
      // format 메서드를 사용하여 날짜를 변환
    },

    getOrderIcon: function (deliveryCompleted) {
      return deliveryCompleted
        ? "sap-icon://status-completed"
        : "sap-icon://status-in-process";
    },
    getOrderHighlight: function (deliveryCompleted) {
      return deliveryCompleted ? "Success" : "Information";
    },
  };
});
