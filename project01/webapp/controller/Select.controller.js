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
        
        // 새로고침 여부 확인 (로컬 스토리지를 사용)
        try {
          var refreshState = sessionStorage.getItem("pageRefreshed");
          if (!refreshState) {
            // 처음 방문 표시
            sessionStorage.setItem("pageRefreshed", "true");
          }
          
          // 페이지 로드 시마다 갱신
          window.addEventListener("beforeunload", function() {
            // 떠날 때 상태 유지
            var selectedCustomer = this.getView().getModel()?.getProperty("/SelectedCustomer");
            if (selectedCustomer) {
              localStorage.setItem("selectedCustomer", JSON.stringify(selectedCustomer));
            }
          }.bind(this));
          
        } catch (e) {
          console.error("세션 스토리지 접근 오류:", e);
        }
        
        // 선택된 색상들을 관리할 모델 초기화
        var oColorsModel = new JSONModel({
          selectedColors: []
        });
        this.getView().setModel(oColorsModel, "colors");
        
        // 자재 ID 매핑 데이터 초기화
        this._initMaterialData();
      },
      
      _initMaterialData: function() {
        // 자재 ID와 색상 코드 매핑 테이블 (1:1 매핑)
        var oMaterialModel = new JSONModel({
          // 자재 목록
          materials: [
            {
              MatID: "3000000000",
              MatName: "건설용 연노랑 페인트(완)",
              Department: "FE",
              category: "paint1", // 건설용 - paint1과 매핑
              ColorCode: "#FFECB3" // 연노랑
            },
            {
              MatID: "3000000001",
              MatName: "자동차용 실보보 페인트(완)",
              Department: "FE",
              category: "paint2", // 자동차용 - paint2와 매핑
              ColorCode: "#616161" // 회색
            },
            {
              MatID: "3000000002",
              MatName: "자동차용 친환경 실버 페인트(완)",
              Department: "FE",
              category: "paint2", // 자동차용 - paint2와 매핑
              ColorCode: "#616161" // 회색
            },
            {
              MatID: "3000000003", 
              MatName: "조선용 빨강 페인트(완)",
              Department: "FE",
              category: "paint3", // 조선용 - paint3와 매핑
              ColorCode: "#E53935" 
            },
            {
              MatID: "3000000004",
              MatName: "항공용 회색 페인트(완)",
              Department: "FE",
              category: "paint4", // 항공용 - paint4와 매핑
              ColorCode: "#9E9E9E" 
            }
          ]
        });
        
        this.getView().setModel(oMaterialModel, "materials");
        
        // 뷰 모델 초기화
        var oViewModel = new JSONModel({
          selectedCategory: "paint1" // 기본 선택된 카테고리는 paint1(건설용)
        });
        this.getView().setModel(oViewModel, "view");
      },
      
      // 색상 코드와 카테고리에 따라 자재 정보 찾기
      _findMaterialByColorAndCategory: function(sColorCode, sCategory) {
        var oMaterialsModel = this.getView().getModel("materials");
        var aMaterials = oMaterialsModel.getProperty("/materials") || [];
        
        // 선택된 카테고리와 색상에 맞는 자재 찾기
        return aMaterials.find(function(oMaterial) {
          return oMaterial.ColorCode === sColorCode && oMaterial.category === sCategory;
        });
      },
  
      _onRouteMatched: function (oEvent) {
        var oArgs = oEvent.getParameter("arguments");
        var sCustomerName = decodeURIComponent(oArgs.customerName);
        
        // 컴포넌트에서 선택된 고객 정보를 가져옴
        var oComponent = this.getOwnerComponent();
        var oSelectedCustomerModel = oComponent.getModel("selectedCustomerModel");
        
        // 컴포넌트 모델에서 고객 정보 확인
        if (oSelectedCustomerModel && 
            oSelectedCustomerModel.getData() && 
            oSelectedCustomerModel.getData().SelectedCustomer) {
          
          // 선택된 고객 정보를 가져와 현재 뷰의 모델로 설정
          var oViewModel = new sap.ui.model.json.JSONModel(oSelectedCustomerModel.getData());
          this.getView().setModel(oViewModel);
        } else {
          // 1. 로컬 스토리지에서 복원 시도
          var customerData = null;
          try {
            var storedCustomer = localStorage.getItem("selectedCustomer");
            if (storedCustomer) {
              customerData = JSON.parse(storedCustomer);
            }
          } catch (e) {
            console.error("로컬 스토리지에서 고객 정보 복원 실패:", e);
          }
          
          // 2. 로컬 스토리지에서 복원 실패 시 URL에서 가져온 고객명으로 목록에서 검색
          if (!customerData && sCustomerName) {
            // 고객 데이터 생성
            var customersList = [
              { CustomerID: "5000000000", CustomerName: "현대 중공업" },
              { CustomerID: "6000000000", CustomerName: "TOYOTA" },
              { CustomerID: "7000000000", CustomerName: "CPID" },
              { CustomerID: "7000000001", CustomerName: "COMAC" }
            ];
            
            // 고객명으로 검색
            var foundCustomer = customersList.find(function(customer) {
              return customer.CustomerName === sCustomerName;
            });
            
            if (foundCustomer) {
              customerData = foundCustomer;
              
              // 로컬 스토리지에 저장
              try {
                localStorage.setItem("selectedCustomer", JSON.stringify(customerData));
              } catch (e) {
                console.error("로컬 스토리지 저장 실패:", e);
              }
            }
          }
          
          // 복원된 데이터로 모델 생성 및 설정
          if (customerData) {
            var oBackupModel = new sap.ui.model.json.JSONModel({
              SelectedCustomer: customerData
            });
            
            // 뷰 및 컴포넌트에 모델 설정
            this.getView().setModel(oBackupModel);
            oComponent.setModel(oBackupModel, "selectedCustomerModel");
          } else {
            sap.m.MessageToast.show("고객 데이터를 불러오는 데 실패했습니다.");
          }
        }
        
        // 색상 정보 초기화를 위해 색상 모델 재설정
        var oColorsModel = new sap.ui.model.json.JSONModel({
          selectedColors: []
        });
        this.getView().setModel(oColorsModel, "colors");
      },
      
      onColorSelected: function (oEvent) {
        var selectedColor = oEvent.getSource().data("color");
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        
        // 현재 선택된 카테고리 가져오기
        var sSelectedCategory = null;
        
        // 드롭다운에서 선택된 카테고리 가져오기
        var oSelect = this.byId("Select_Select");
        if (oSelect) {
          var oSelectedItem = oSelect.getSelectedItem();
          if (oSelectedItem) {
            sSelectedCategory = oSelectedItem.getKey();
          }
        }
        
        // 선택된 카테고리와 색상에 따라 자재 정보 찾기
        var oMaterial = null;
        if (sSelectedCategory) {
          oMaterial = this._findMaterialByColorAndCategory(selectedColor, sSelectedCategory);
        }
        
        // 선택된 색상 정보 객체 생성
        var colorInfo = {
          colorCode: selectedColor,
          colorName: this._getColorName(selectedColor),
          timestamp: new Date().toISOString(),
          colorStyle: "background-color: " + selectedColor + ";",
          materialId: oMaterial ? oMaterial.MatID : null,
          materialName: oMaterial ? oMaterial.MatName : "연결된 자재 없음"
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
          
          // 선택된 카테고리에 해당하는 색상인지에 따라 다른 스타일로 하이라이트
          if (oMaterial) {
            this._highlightSelectedColor(selectedColor, true); // 자재 연결된 색상
          } else {
            this._highlightSelectedColor(selectedColor, false); // 자재 연결 안된 색상
          }
          
          var message = "색상이 선택되었습니다: " + selectedColor;
          sap.m.MessageToast.show(message);
        }
        
        // 모델 업데이트
        oColorsModel.setProperty("/selectedColors", aSelectedColors);
        
        // 기존 모델에도 현재 선택된 색상 기록
        var oModel = this.getView().getModel();
        if (oModel) {
          oModel.setProperty("/SelectedColor", selectedColor);
        }
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
      
      // 색상 코드로 색상 이름 찾기
      _getColorName: function(colorCode) {
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
      
      _highlightSelectedColor: function(selectedColor, isMaterialConnected) {
        var aColors = this.byId("colorFlexBox").getItems();
        
        aColors.forEach(function(oColorContainer) {
          var oButton = oColorContainer.getItems()[0];
          var sColorCode = oButton.data("color");
          
          if (sColorCode === selectedColor) {
            oColorContainer.addStyleClass("selectedColor");
            
            // 자재 연결 여부에 따라 추가 클래스 적용
            if (isMaterialConnected) {
              oColorContainer.addStyleClass("materialColor");
              oColorContainer.removeStyleClass("noMaterialColor");
            } else {
              oColorContainer.addStyleClass("noMaterialColor");
              oColorContainer.removeStyleClass("materialColor");
            }
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
      _removeColorHighlight: function(selectedColor) {
        var aColors = this.byId("colorFlexBox").getItems();
        
        aColors.forEach(function(oColorContainer) {
          var oColorButton = oColorContainer.getItems()[0];
          if (oColorButton.data("color") === selectedColor) {
            oColorContainer.removeStyleClass("selectedColor");
            oColorContainer.removeStyleClass("materialColor");
            oColorContainer.removeStyleClass("noMaterialColor");
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
        var that = this;
        
        // 고객별 영업 조직 정보 가져오기
        var salesOrgInfo = this._getSalesOrgValues(oData.customerId);
        
        // 최신 문서 번호 조회
        this._getLatestDocumentId().then(function(latestDocId) {
          // 새로운 문서 번호 생성 (latestDocId + 1)
          var newDocId = latestDocId + 1;
          
          // CDS 뷰에 데이터를 저장하기 위한 엔티티 생성 (Header)
          var oEntry = {
            InqrDocuId: newDocId.toString(),
            CustId: oData.customerId,
            SalesOrg: salesOrgInfo.salesOrg,
            DistCha: salesOrgInfo.distCha,
            Division: salesOrgInfo.division
          };
          
          // 각 색상에 대한 항목 생성 (Item)
          var aColorEntries = [];
          oData.selectedColors.forEach(function(color, index) {
            // 아이템 라인 번호는 010부터 10씩 증가
            var itemId = ((index + 1) * 10).toString().padStart(3, '0');
            
            // 자재 ID 찾기
            var matId = that._findMaterialIdByColor(color.colorCode);
            
            aColorEntries.push({
              InqrDocuId: newDocId.toString(),
              InqrItemId: itemId,
              MatId: matId || "",
              Descr: color.colorCode + " (" + oData.customerRequest + ")"
            });
          });
          
          // 백엔드 호출: Header 생성 후 Item 생성
          that._createHeaderAndItems(oEntry, aColorEntries);
          
          sap.m.MessageToast.show("고객 요청사항과 선택한 색상이 저장되었습니다. 문서번호: " + newDocId);
        }).catch(function(error) {
          sap.m.MessageToast.show("문서 번호 생성 중 오류가 발생했습니다: " + error);
        });
      },
      
      // 고객 ID에 따른 영업 조직 값 반환
      _getSalesOrgValues: function(customerId) {
        // 고객별 영업 조직 정보 매핑
        var customerSalesOrgMap = {
          // 현대 중공업
          "HHI": {
            salesOrg: "S100",
            distCha: "10",
            division: "10"
          },
          // Toyota
          "TOYOTA": {
            salesOrg: "S200",
            distCha: "10",
            division: "20"
          },
          // CPID
          "CPID": {
            salesOrg: "S300",
            distCha: "10",
            division: "30"
          },
          // Comac
          "COMAC": {
            salesOrg: "S300",
            distCha: "10",
            division: "40"
          }
        };
        
        // 매핑된 값이 있으면 반환, 없으면 기본값 반환
        if (customerSalesOrgMap[customerId]) {
          return customerSalesOrgMap[customerId];
        } else {
          // 기본값
          return {
            salesOrg: "1000",
            distCha: "10",
            division: "00"
          };
        }
      },
      
      // 최신 문서 번호 가져오기
      _getLatestDocumentId: function() {
        return new Promise(function(resolve, reject) {
          // OData 호출 대신 임시로 난수 사용 (1000~9999)
          var randomId = Math.floor(Math.random() * 9000) + 1000;
          setTimeout(function() {
            resolve(randomId);
          }, 500);
        });
      },
      
      // 색상 코드로 자재 ID 찾기
      _findMaterialIdByColor: function(colorCode) {
        var aMaterials = this.getView().getModel("materials").getProperty("/materials") || [];
        for (var i = 0; i < aMaterials.length; i++) {
          if (aMaterials[i].ColorCode === colorCode) {
            return aMaterials[i].MatID;
          }
        }
        return null;
      },
      
      // Header와 Items 생성 (OData 호출)
      _createHeaderAndItems: function(oHeaderEntry, aItemEntries) {
        // 개발 완료 시 실제 OData 호출로 대체
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
      },
      
      // 드롭다운에서 카테고리 선택 시 호출되는 함수
      onCategoryChange: function(oEvent) {
        var sSelectedCategory = oEvent.getParameter("selectedItem").getKey();
        this.getView().getModel("view").setProperty("/selectedCategory", sSelectedCategory);
        
        // 이미 선택된 색상이 있는 경우, 카테고리에 맞게 강조 표시 업데이트
        var aSelectedColors = this.getView().getModel("colors").getProperty("/selectedColors");
        if (aSelectedColors && aSelectedColors.length > 0) {
          // 모든 색상의 강조 표시를 제거합니다
          aSelectedColors.forEach(function(oColor) {
            this._removeColorHighlight(oColor.colorCode);
          }.bind(this));
          
          // 선택된 색상의 강조 표시를 다시 적용합니다
          aSelectedColors.forEach(function(oColor) {
            // 현재 카테고리에 따라 자재 정보를 다시 확인
            var oMaterial = this._findMaterialByColorAndCategory(oColor.colorCode, sSelectedCategory);
            
            // 강조 표시 다시 적용
            this._highlightSelectedColor(oColor.colorCode, !!oMaterial);
            
            // 색상 정보 객체 업데이트
            oColor.materialId = oMaterial ? oMaterial.MatID : null;
            oColor.materialName = oMaterial ? oMaterial.MatName : "연결된 자재 없음";
          }.bind(this));
          
          // 모델 업데이트
          this.getView().getModel("colors").refresh(true);
        }
      }
    });
  });
