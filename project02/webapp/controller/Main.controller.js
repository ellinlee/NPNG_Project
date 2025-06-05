sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
  ], (Controller, JSONModel) => {
    "use strict";
  
    return Controller.extend("sync.dc.sd.project02.controller.Main", {
      // 컨트롤러 초기화 함수
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
              CustomerName: "COLI" 
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
      
      // 조회 버튼 클릭 시 호출되는 함수
      onPress() {
        this._navigateToSelect();
      },

      // 엔터키 입력 시 호출되는 함수
      onEnterPress: function() {
        this._navigateToSelect();
      },

      // 고객명 입력 후 화면 전환 및 고객 정보 저장 함수
      _navigateToSelect: function() {
        var that = this;
        // 입력된 고객명 가져오기
        var customerName = this.getView().byId("main_Input_customerName").getValue().trim();
        // 고객 목록 모델 가져오기
        var customersModel = this.getView().getModel("customers");
        // 고객 배열 가져오기
        var customersList = customersModel.getProperty("/customers");
        
        // 입력값과 일치하는 고객 찾기
        var foundCustomer = customersList.find(function(customer) {
          return customer.CustomerName === customerName;
        });
        
        if (foundCustomer) {
          // 라우터 가져오기
          var oRouter = this.getOwnerComponent().getRouter();
          
          // 선택된 고객 정보를 모델로 저장
          var oComponent = this.getOwnerComponent();
          var oSelectedCustomerModel = new JSONModel({
            SelectedCustomer: foundCustomer
          });
          
          oComponent.setModel(oSelectedCustomerModel, "selectedCustomerModel");
          
          try {
            // 로컬 스토리지에 고객 정보 저장
            localStorage.setItem("selectedCustomer", JSON.stringify(foundCustomer));
          } catch (e) {
            // 로컬 스토리지 저장 실패 시 에러(콘솔 출력은 제거)
          }
          
          // Select 화면으로 이동
          oRouter.navTo("RouteSelect", {
            customerName: encodeURIComponent(foundCustomer.CustomerName)
          });
        } else {
          // 고객이 없을 때 에러 메시지 표시
          var oBundle = that.getView().getModel("i18n").getResourceBundle();
          var sErrorMessage = oBundle ? oBundle.getText("error") : "고객을 찾을 수 없습니다.";
          sap.m.MessageToast.show(sErrorMessage);
        }
      }
    });
  });
  
  