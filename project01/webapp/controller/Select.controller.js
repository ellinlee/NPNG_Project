sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
  ], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";
  
    return Controller.extend("sync.dc.sd.project01.controller.Select", {
      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("RouteSelect").attachPatternMatched(this._onRouteMatched, this);
        
        // 선택된 색상들을 관리할 모델 초기화
        var oColorsModel = new JSONModel({
          selectedColors: []
        });
        this.getView().setModel(oColorsModel, "colors");
      },
  
      _onRouteMatched: function (oEvent) {
        var that = this;
        var oArgs = oEvent.getParameter("arguments");
        var sCustomerName = decodeURIComponent(oArgs.customerName);
  
        var oModel = this.getView().getModel(); 
  
        oModel.read("/ZDCC_InquiryForm", {
          filters: [
            new Filter("cust_name", FilterOperator.EQ, sCustomerName)
          ],
          success: function (oData) {
            if (oData.results.length > 0) {
              // 첫 번째 결과만 사용
              var oEntry = oData.results[0];
  
              var oJsonData = {
                SelectedCustomer: {
                  CustomerID: oEntry.cust_id,
                  CustomerName: sCustomerName
                }
              };
  
              var oJsonModel = new JSONModel(oJsonData);
              that.getView().setModel(oJsonModel);
            } else {
              sap.m.MessageToast.show("해당 고객명이 존재하지 않습니다.");
            }
          },
          error: function () {
            sap.m.MessageToast.show("고객 데이터를 불러오는 데 실패했습니다.");
          }
        });
      },
      
      onColorSelected: function (oEvent) {
        var selectedColor = oEvent.getSource().data("color");
        var oButton = oEvent.getSource();
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        
        // 선택된 색상 정보 객체 생성
        var colorInfo = {
          colorCode: selectedColor,
          colorName: this._getColorName(selectedColor),
          timestamp: new Date().toISOString()
        };
        
        // 이미 선택된 색상인지 확인
        var existingIndex = this._findColorIndex(aSelectedColors, selectedColor);
        
        if (existingIndex !== -1) {
          // 이미 선택된 색상이면 제거
          aSelectedColors.splice(existingIndex, 1);
          // 색상의 하이라이트 제거
          this._removeColorHighlight(selectedColor);
          sap.m.MessageToast.show("색상이 선택 해제되었습니다: " + selectedColor);
        } else {
          // 새로운 색상 선택 추가
          aSelectedColors.push(colorInfo);
          this._highlightSelectedColor(selectedColor);
          sap.m.MessageToast.show("색상이 선택되었습니다: " + selectedColor);
        }
        
        // 모델 업데이트
        oColorsModel.setProperty("/selectedColors", aSelectedColors);
        
        // 기존 모델에도 현재 선택된 색상 기록 (단일 색상 선택 호환성 유지)
        var oModel = this.getView().getModel();
        if (oModel) {
          oModel.setProperty("/SelectedColor", selectedColor);
        }
        
        console.log("선택된 색상 목록:", aSelectedColors);
      },
      
      // 색상 코드로 색상 인덱스 찾기
      _findColorIndex: function(aColors, colorCode) {
        for (var i = 0; i < aColors.length; i++) {
          if (aColors[i].colorCode === colorCode) {
            return i;
          }
        }
        return -1;
      },
      
      // 색상 코드로 색상 이름 찾기 (샘플)
      _getColorName: function(colorCode) {
        // 실제로는 색상 코드와 이름을 매핑하는 로직 필요
        // 여기서는 간단히 코드를 반환
        return colorCode;
      },
      
      onColorSearch: function(oEvent) {
        var sSearchTerm = oEvent.getParameter("query").toUpperCase().replace(/\s/g, "");
        this._filterColorsBySearchTerm(sSearchTerm);
      },
      
      onColorLiveSearch: function(oEvent) {
        var sSearchTerm = oEvent.getParameter("newValue").toUpperCase().replace(/\s/g, "");
        this._filterColorsBySearchTerm(sSearchTerm);
      },
      
      onColorSearchReset: function() {
        this.byId("colorSearchField").setValue("");
        this._resetColorVisibility();
      },
      
      _filterColorsBySearchTerm: function(sSearchTerm) {
        if (!sSearchTerm) {
          this._resetColorVisibility();
          return;
        }
        
        var aColors = this.byId("colorFlexBox").getItems();
        
        aColors.forEach(function(oColorContainer) {
          var oButton = oColorContainer.getItems()[0];
          var oText = oColorContainer.getItems()[1];
          
          var sColorCode = oText.getText().toUpperCase();
          
          if (sSearchTerm.startsWith("#")) {
            sSearchTerm = sSearchTerm.substring(1);
          }
          
          var sColorCodeWithoutHash = sColorCode.replace("#", "");
          
          if (sColorCodeWithoutHash.includes(sSearchTerm)) {
            oColorContainer.setVisible(true);
            oColorContainer.addStyleClass("searchMatch");
          } else {
            oColorContainer.setVisible(false);
            oColorContainer.removeStyleClass("searchMatch");
          }
        });
      },
      
      _resetColorVisibility: function() {
        var aColors = this.byId("colorFlexBox").getItems();
        
        aColors.forEach(function(oColorContainer) {
          oColorContainer.setVisible(true);
          oColorContainer.removeStyleClass("searchMatch");
        });
      },
      
      _highlightSelectedColor: function(selectedColor) {
        var aColors = this.byId("colorFlexBox").getItems();
        
        aColors.forEach(function(oColorContainer) {
          var oButton = oColorContainer.getItems()[0];
          var sColorCode = oButton.data("color");
          
          if (sColorCode === selectedColor) {
            oColorContainer.addStyleClass("selectedColor");
          }
        });
      },
      
      // 선택된 색상 목록 표시
      onShowSelectedColors: function() {
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        
        if (aSelectedColors.length === 0) {
          sap.m.MessageToast.show("선택된 색상이 없습니다.");
          return;
        }
        
        // 인덱스 정보 추가
        aSelectedColors.forEach(function(color, index) {
          color.index = index;
        });
        oColorsModel.setProperty("/selectedColors", aSelectedColors);
        
        // 선택된 색상 목록 대화상자 표시
        if (!this._oSelectedColorsDialog) {
          this._oSelectedColorsDialog = sap.ui.xmlfragment(
            "sync.dc.sd.project01.view.SelectedColorsDialog", 
            this
          );
          this.getView().addDependent(this._oSelectedColorsDialog);
        }
        
        this._oSelectedColorsDialog.open();
      },
      
      // 선택된 색상 제거
      onRemoveSelectedColor: function(oEvent) {
        var oItem = oEvent.getParameter("listItem");
        var sPath = oItem.getBindingContext("colors").getPath();
        var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));
        
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors");
        
        // 해당 색상의 하이라이트 제거
        var removedColor = aSelectedColors[iIndex].colorCode;
        this._removeColorHighlight(removedColor);
        
        // 선택된 색상 목록에서 제거
        aSelectedColors.splice(iIndex, 1);
        oColorsModel.setProperty("/selectedColors", aSelectedColors);
        
        sap.m.MessageToast.show("색상이 제거되었습니다: " + removedColor);
      },
      
      // 색상 강조 표시 제거
      _removeColorHighlight: function(colorCode) {
        var aColors = this.byId("colorFlexBox").getItems();
        
        aColors.forEach(function(oColorContainer) {
          var oButton = oColorContainer.getItems()[0];
          var sColorCode = oButton.data("color");
          
          if (sColorCode === colorCode) {
            oColorContainer.removeStyleClass("selectedColor");
          }
        });
      },
      
      // 다이얼로그 닫기
      onCloseSelectedColorsDialog: function() {
        this._oSelectedColorsDialog.close();
      },
      
      // 고객 요청사항 변경 처리
      onCustomerRequestChange: function(oEvent) {
        var sText = oEvent.getParameter("value");
        var oModel = this.getView().getModel();
        
        // 모델에 요청사항 저장
        if (oModel) {
          oModel.setProperty("/CustomerRequest", sText);
        }
      },
      
      // 고객 요청사항 저장 및 선택된 색상 데이터 저장
      onSaveCustomerRequest: function() {
        var oModel = this.getView().getModel();
        var oColorsModel = this.getView().getModel("colors");
        var sCustomerRequest = oModel.getProperty("/CustomerRequest");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors");
        
        // 요청사항이나 색상이 선택되지 않은 경우 알림
        if (!sCustomerRequest) {
          sap.m.MessageToast.show("요청사항을 입력해주세요.");
          return;
        }
        
        if (!aSelectedColors || aSelectedColors.length === 0) {
          sap.m.MessageToast.show("하나 이상의 색상을 선택해주세요.");
          return;
        }
        
        // 요청사항과 선택된 색상 정보를 저장할 데이터 객체
        var oData = {
          customerRequest: sCustomerRequest,
          selectedColors: aSelectedColors,
          customerId: oModel.getProperty("/SelectedCustomer/CustomerID"),
          customerName: oModel.getProperty("/SelectedCustomer/CustomerName"),
          timestamp: new Date().toISOString()
        };
        
        // OData 서비스 호출하여 CDS 뷰에 데이터 저장
        this._saveDataToCDS(oData);
      },
      
      // CDS 뷰에 데이터 저장 (백엔드 호출)
      _saveDataToCDS: function(oData) {
        var oModel = this.getView().getModel();
        
        // CDS 뷰에 데이터를 저장하기 위한 엔티티 생성
        var oEntry = {
          CustomerId: oData.customerId,
          CustomerName: oData.customerName,
          CustomerRequest: oData.customerRequest,
          RequestTimestamp: oData.timestamp
        };
        
        // 각 색상에 대한 항목 생성
        var aColorEntries = [];
        oData.selectedColors.forEach(function(color, index) {
          aColorEntries.push({
            CustomerId: oData.customerId,
            ColorCode: color.colorCode,
            ColorIndex: index,
            SelectionTimestamp: color.timestamp
          });
        });
        
        // 개발 중에는 콘솔에 로그만 출력
        console.log("저장할 요청 데이터:", oEntry);
        console.log("저장할 색상 데이터:", aColorEntries);
        
        // 백엔드 호출 예시 (실제 구현 필요)
        // oModel.create("/CustomerRequests", oEntry, {
        //   success: function() {
        //     // 색상 데이터 연결하여 저장
        //     this._saveColorsToCDS(aColorEntries);
        //     sap.m.MessageToast.show("고객 요청사항이 저장되었습니다.");
        //   }.bind(this),
        //   error: function() {
        //     sap.m.MessageToast.show("데이터 저장 중 오류가 발생했습니다.");
        //   }
        // });
        
        // 개발 중에는 성공 메시지 표시
        sap.m.MessageToast.show("고객 요청사항과 선택한 색상이 저장되었습니다.");
      },
      
      // 요청사항 초기화
      onResetCustomerRequest: function() {
        // 입력 필드 초기화
        this.byId("customerRequestInput").setValue("");
        
        // 모델에서 요청사항 데이터 삭제
        var oModel = this.getView().getModel();
        if (oModel) {
          oModel.setProperty("/CustomerRequest", "");
        }
        
        sap.m.MessageToast.show("요청사항이 초기화되었습니다.");
      },
      
      // 타임스탬프 포맷팅 (다이얼로그에서 사용)
      formatTimestamp: function(timestamp) {
        if (!timestamp) {
          return "";
        }
        
        var oDate = new Date(timestamp);
        var options = { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit'
        };
        
        return oDate.toLocaleString('ko-KR', options);
      },
      
      // 선택된 색상 개수 포맷팅
      formatSelectedColorsCount: function(aSelectedColors) {
        if (!aSelectedColors) {
          return "0";
        }
        return aSelectedColors.length;
      },
      
      // 다이얼로그에서 색상 제거
      onRemoveColorFromDialog: function(oEvent) {
        var oButton = oEvent.getSource();
        var sColorCode = oButton.data("colorCode");
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors");
        
        // 색상 목록에서 해당 색상 찾기
        var nIndex = this._findColorIndex(aSelectedColors, sColorCode);
        
        if (nIndex !== -1) {
          // 색상의 하이라이트 제거
          this._removeColorHighlight(sColorCode);
          
          // 색상 목록에서 제거
          aSelectedColors.splice(nIndex, 1);
          oColorsModel.setProperty("/selectedColors", aSelectedColors);
          
          sap.m.MessageToast.show("색상이 제거되었습니다: " + sColorCode);
        }
      }
    });
  });
