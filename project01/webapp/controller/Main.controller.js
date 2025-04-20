sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
  "use strict";

  return Controller.extend("sync.dc.sd.project01.controller.Main", {
    onInit() {
      // 로컬 고객 데이터 생성
      var customerData = {
        customers: [
          { 
            CustomerID: "5000000000", 
            CustomerName: "현대 중공업" 
          },
          { 
            CustomerID: "6000000000", 
            CustomerName: "TOYOTA" 
          },
          { 
            CustomerID: "7000000000", 
            CustomerName: "CPID" 
          },
          { 
            CustomerID: "7000000001", 
            CustomerName: "COMAC" 
          }
        ]
      };

      // JSON 모델 생성 및 뷰에 설정
      var oModel = new JSONModel(customerData);
      this.getView().setModel(oModel, "customers");
    },
    
    onPress() {
      var that = this;
      var customerName = this.getView().byId("app_input1").getValue().trim();
      var customersModel = this.getView().getModel("customers");
      var customersList = customersModel.getProperty("/customers");
      
      // 입력한 고객명이 리스트에 존재하는지 확인
      var foundCustomer = customersList.find(function(customer) {
        return customer.CustomerName === customerName;
      });
      
      if (foundCustomer) {
        // 고객이 존재하면 다음 페이지로 이동하고 고객 정보 전달
        var oRouter = this.getOwnerComponent().getRouter();
        
        // 컴포넌트의 모델에 선택된 고객 정보 저장
        var oComponent = this.getOwnerComponent();
        var oSelectedCustomerModel = new JSONModel({
          SelectedCustomer: foundCustomer
        });
        
        // 모델에 명확한 이름 부여하여 설정
        oComponent.setModel(oSelectedCustomerModel, "selectedCustomerModel");
        
        // 로컬 스토리지에도 임시 저장 (백업용)
        try {
          localStorage.setItem("selectedCustomer", JSON.stringify(foundCustomer));
        } catch (e) {
          console.error("로컬 스토리지 저장 실패:", e);
        }
        
        console.log("찾은 고객 정보:", foundCustomer);
        console.log("모델에 저장된 고객 정보:", oComponent.getModel("selectedCustomerModel").getData());
        console.log("라우팅 실행:", "RouteSelect", { customerName: encodeURIComponent(foundCustomer.CustomerName) });
        
        // 라우팅 실행
        oRouter.navTo("RouteSelect", {
          customerName: encodeURIComponent(foundCustomer.CustomerName)
        });
      } else {
        // 존재하지 않을 때 에러 메시지 표시
        var oBundle = that.getView().getModel("i18n").getResourceBundle();
        var sErrorMessage = oBundle ? oBundle.getText("error") : "고객을 찾을 수 없습니다.";
        sap.m.MessageToast.show(sErrorMessage);
      }
    }
  });
});

