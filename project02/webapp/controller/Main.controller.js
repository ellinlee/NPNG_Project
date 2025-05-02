sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
  ], (Controller, JSONModel) => {
    "use strict";
  
    return Controller.extend("sync.dc.sd.project02.controller.Main", {
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
        var customerName = this.getView().byId("main_Input_customerName").getValue().trim();
        var customersModel = this.getView().getModel("customers");
        var customersList = customersModel.getProperty("/customers");
        
        var foundCustomer = customersList.find(function(customer) {
          return customer.CustomerName === customerName;
        });
        
        if (foundCustomer) {
          var oRouter = this.getOwnerComponent().getRouter();
          
          var oComponent = this.getOwnerComponent();
          var oSelectedCustomerModel = new JSONModel({
            SelectedCustomer: foundCustomer
          });
          
          oComponent.setModel(oSelectedCustomerModel, "selectedCustomerModel");
          
          try {
            localStorage.setItem("selectedCustomer", JSON.stringify(foundCustomer));
          } catch (e) {
            console.error("로컬 스토리지 저장 실패:", e);
          }
          
          oRouter.navTo("RouteSelect", {
            customerName: encodeURIComponent(foundCustomer.CustomerName)
          });
        } else {
          var oBundle = that.getView().getModel("i18n").getResourceBundle();
          var sErrorMessage = oBundle ? oBundle.getText("error") : "고객을 찾을 수 없습니다.";
          sap.m.MessageToast.show(sErrorMessage);
        }
      }
    });
  });
  
  