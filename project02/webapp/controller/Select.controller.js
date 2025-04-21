sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
  ], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";
  
    return Controller.extend("sync.dc.sd.project02.controller.Select", {
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
              category: "paint1", // 건설용 - paint1과 매핑
              ColorCode: "#FFECB3" // 연노랑
            },
            {
              MatID: "3000000001",
              MatName: "자동차용 실보보 페인트(완)",
              category: "paint2", // 자동차용 - paint2와 매핑
              ColorCode: "#616161" // 회색
            },
            {
              MatID: "3000000002",
              MatName: "자동차용 친환경 실버 페인트(완)",
              category: "paint2", // 자동차용 - paint2와 매핑
              ColorCode: "#616161" // 회색
            },
            {
              MatID: "3000000003", 
              MatName: "조선용 빨강 페인트(완)",
              category: "paint3", // 조선용 - paint3와 매핑
              ColorCode: "#E53935" 
            },
            {
              MatID: "3000000004",
              MatName: "항공용 회색 페인트(완)",
              category: "paint4", // 항공용 - paint4와 매핑
              ColorCode: "#9E9E9E" 
            }
          ]
        });
        
        console.log("자재 데이터 초기화 완료:", oMaterialModel.getProperty("/materials"));
        
        this.getView().setModel(oMaterialModel, "materials");
        
        // 뷰 모델 초기화
        var oViewModel = new JSONModel({
          selectedCategory: "paint1" // 기본 선택된 카테고리는 paint1(건설용)
        });
        this.getView().setModel(oViewModel, "view");
        
        console.log("기본 선택 카테고리:", oViewModel.getProperty("/selectedCategory"));
      },
      
      // 색상 코드와 카테고리에 따라 자재 정보 찾기
      _findMaterialByColorAndCategory: function(sColorCode, sCategory) {
        var oMaterialsModel = this.getView().getModel("materials");
        var aMaterials = oMaterialsModel.getProperty("/materials") || [];
        
        console.log("자재 찾기 - 색상:", sColorCode, "카테고리:", sCategory);
        console.log("사용 가능한 자재 목록:", aMaterials);
        
        // 선택된 카테고리와 색상에 맞는 자재 찾기
        var foundMaterial = aMaterials.find(function(oMaterial) {
          return oMaterial.ColorCode === sColorCode && oMaterial.category === sCategory;
        });
        
        console.log("찾은 자재:", foundMaterial || "없음");
        return foundMaterial;
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
        
        console.log("색상 선택:", selectedColor);
        
        // 현재 선택된 카테고리 가져오기
        var sSelectedCategory = null;
        
        // 드롭다운에서 선택된 카테고리 가져오기
        var oSelect = this.byId("select_Select_category");
        if (oSelect) {
          var oSelectedItem = oSelect.getSelectedItem();
          if (oSelectedItem) {
            sSelectedCategory = oSelectedItem.getKey();
          }
        }
        
        console.log("선택된 카테고리:", sSelectedCategory);
        
        // 선택된 카테고리와 색상에 따라 자재 정보 찾기
        var oMaterial = null;
        if (sSelectedCategory) {
          oMaterial = this._findMaterialByColorAndCategory(selectedColor, sSelectedCategory);
        }
        
        console.log("찾은 자재 정보:", oMaterial);
        
        // 선택된 색상 정보 객체 생성
        var colorInfo = {
          colorCode: selectedColor,
          colorName: this._getColorName(selectedColor),
          timestamp: new Date().toISOString(),
          colorStyle: "background-color: " + selectedColor + ";",
          materialId: oMaterial ? oMaterial.MatID : null,
          materialName: oMaterial ? oMaterial.MatName : "연결된 자재 없음",
          description: "" // 색상별 문의사항 필드 추가
        };
        
        console.log("생성된 색상 정보:", colorInfo);
        
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
      
      /**
       * 타임스탬프를 사용자 친화적인 형식으로 포맷합니다.
       * @param {string} timestamp ISO 형식의 타임스탬프
       * @returns {string} 포맷된 날짜/시간 문자열
       * @private
       */
      _formatTimestamp: function(timestamp) {
        if (!timestamp) return "";
        
        var date = new Date(timestamp);
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        var hours = date.getHours().toString().padStart(2, '0');
        var minutes = date.getMinutes().toString().padStart(2, '0');
        
        return year + "-" + month + "-" + day + " " + hours + ":" + minutes;
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
        this.byId("select_SearchField_color").setValue("");
        this._resetColorVisibility();
      },
      
      _filterColorsBySearchTerm: function(sSearchTerm) {
        if (!sSearchTerm) {
          this._resetColorVisibility();
          return;
        }
        
        var aColors = this.byId("select_HBox_colorContainer").getItems();
        
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
        var aColors = this.byId("select_HBox_colorContainer").getItems();
        
        aColors.forEach(function(oColorContainer) {
          oColorContainer.setVisible(true);
          oColorContainer.removeStyleClass("searchMatch");
        });
      },
      
      _highlightSelectedColor: function(selectedColor, isMaterialConnected) {
        var aColors = this.byId("select_HBox_colorContainer").getItems();
        
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
        
        // 인덱스 정보 추가 및 타임스탬프 포맷팅
        aSelectedColors.forEach(function(color, index) {
          color.index = index;
          // 타임스탬프 포맷팅
          color.formattedTimestamp = this._formatTimestamp(color.timestamp);
        }.bind(this));
        
        oColorsModel.setProperty("/selectedColors", aSelectedColors);
        
        // 선택된 색상 목록 대화상자 표시
        if (!this._oSelectedColorsDialog) {
          this._oSelectedColorsDialog = sap.ui.xmlfragment(
            "sync.dc.sd.project02.view.SelectedColorsDialog", 
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
        var aColors = this.byId("select_HBox_colorContainer").getItems();
        
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
      
      // 고객 요청사항 저장 및 선택된 색상 데이터 저장 버튼 클릭 시
      onSaveCustomerRequest: function() {
        var that = this;
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
        
        // 저장 확인 다이얼로그 열기
        this._openSaveConfirmDialog();
      },
      
      /**
       * 저장 확인 다이얼로그를 엽니다.
       * @private
       */
      _openSaveConfirmDialog: function() {
        // 다이얼로그가 없는 경우 생성
        if (!this._oSaveConfirmDialog) {
          this._oSaveConfirmDialog = sap.ui.xmlfragment(
            "sync.dc.sd.project02.view.SaveConfirmDialog", 
            this
          );
          this.getView().addDependent(this._oSaveConfirmDialog);
        }
        
        // 다이얼로그 열기
        this._oSaveConfirmDialog.open();
      },
      
      /**
       * 저장 확인 다이얼로그에서 취소 버튼 클릭 시
       */
      onCancelSave: function() {
        // 다이얼로그 닫기
        this._oSaveConfirmDialog.close();
      },
      
      /**
       * 저장 확인 다이얼로그에서 저장 버튼 클릭 시
       */
      onConfirmSave: function() {
        var that = this;
        var oModel = this.getView().getModel();
        var oColorsModel = this.getView().getModel("colors");
        
        // 저장에 필요한 데이터 복사
        var sCustomerRequest = oModel.getProperty("/CustomerRequest");
        var aSelectedColors = JSON.parse(JSON.stringify(oColorsModel.getProperty("/selectedColors")));
        var sCustomerId = oModel.getProperty("/SelectedCustomer/CustomerID");
        var sCustomerName = oModel.getProperty("/SelectedCustomer/CustomerName");
        
        // 디버깅: 저장 전 색상 정보 확인
        console.log("저장 전 색상 정보:", aSelectedColors);
        console.log("색상별 material ID 확인:", aSelectedColors.map(function(color) {
          return {
            colorCode: color.colorCode,
            materialId: color.materialId || "없음",
            description: color.description || "없음"
          };
        }));
        
        // 다이얼로그 닫기
        this._oSaveConfirmDialog.close();
        
        // UI 초기화 실행
        this._resetAfterSave();
        
        // 선택된 색상이 없는 경우 처리
        if (!aSelectedColors || aSelectedColors.length === 0) {
          sap.m.MessageToast.show("선택된 색상이 없습니다. 색상을 선택한 후 저장해주세요.");
          return;
        }
        
        // materialId가 있는 색상이 하나라도 있는지 확인
        var aValidItems = aSelectedColors.filter(function(item) {
          return item.materialId; // materialId가 있는 항목
        });
        
        // 요청사항과 선택된 색상 정보를 저장할 데이터 객체
        var oData = {
          customerRequest: sCustomerRequest,  // 복사한 고객 요청사항 사용
          selectedColors: aSelectedColors,    // 복사한 선택된 색상 사용
          customerId: sCustomerId,
          customerName: sCustomerName,
          timestamp: new Date().toISOString()
        };
        
        // ZDCT_SD040에서 최신 문서번호 가져오기
        this._getLatestDocumentNumber().then(function(sDocumentNumber) {
          // 다음 문서번호 생성
          var newDocNumber = that._generateNextDocumentNumber(sDocumentNumber);
          
          // material ID 연결된 색상이 없는 경우, 저장 시늉만 하고 UI는 초기화
          if (aValidItems.length === 0) {
            sap.m.MessageToast.show("문의서 " + newDocNumber + " 저장되었습니다.");
            return;
          }
          
          // 저장할 문서 번호 기억
          that._documentNumber = newDocNumber;
          
          // 비지 인디케이터 표시 - 저장 중임을 알림
          that.getView().setBusy(true);
          
          // 데이터 저장 처리 - 메시지는 모든 아이템이 저장된 후에만 표시
          that._saveDataToBackend(oData, newDocNumber);
          
        }).catch(function(error) {
          sap.m.MessageToast.show("문서 번호 생성 중 오류가 발생했습니다: " + error);
        });
      },
      
      /**
       * ZDCT_SD040 테이블에서 최신 문서번호를 가져옵니다.
       * @returns {Promise<string>} 최신 문서번호를 포함하는 Promise
       * @private
       */
      _getLatestDocumentNumber: function() {
        var that = this;
        return new Promise(function(resolve, reject) {
          // ZDCT_SD040 테이블에서 최대 문서번호를 조회하는 OData 호출
          var oModel = that.getOwnerComponent().getModel(); // 기본 OData 모델
          
          if (!oModel) {
            // OData 모델이 없는 경우 (개발 환경 등)
            console.warn("OData 모델이 없습니다. 임시 문서번호를 사용합니다.");
            resolve("SD10000000"); // 형식에 맞는 기본값
            return;
          }
          
          // "/ZDCT_SD040Set" 엔티티 세트에 대한 쿼리 준비
          // 모든 항목을 가져와서 JavaScript에서 직접 최대 문서번호 찾기
          var sPath = "/ZDCT_SD040Set";
          
          console.log("최신 문서번호 조회 시작");
          
          // 데이터 조회 - 모든 항목 가져오기
          oModel.read(sPath, {
            success: function(oData) {
              console.log("문서번호 조회 응답:", oData);
              
              if (oData && oData.results && oData.results.length > 0) {
                // 결과가 있는 경우, 모든 결과를 확인하여 최대 문서번호 찾기
                var maxDocNo = "SD10000000"; // 기본값 설정
                
                // JavaScript에서 직접 최대 문서번호 찾기
                oData.results.forEach(function(item) {
                  if (item.InqrDocuId && item.InqrDocuId !== "NaN") {
                    // 숫자 부분만 추출해서 비교
                    var currentMatches = item.InqrDocuId.match(/^SD(\d+)$/);
                    var maxMatches = maxDocNo.match(/^SD(\d+)$/);
                    
                    if (currentMatches && currentMatches.length > 1 && 
                        maxMatches && maxMatches.length > 1) {
                      var currentNum = parseInt(currentMatches[1], 10);
                      var maxNum = parseInt(maxMatches[1], 10);
                      
                      if (currentNum > maxNum) {
                        maxDocNo = item.InqrDocuId;
                      }
                    }
                  }
                });
                
                console.log("최대 문서번호 찾음:", maxDocNo);
                resolve(maxDocNo);
              } else {
                // 결과가 없는 경우 기본값 사용
                console.log("문서번호 조회 결과가 없습니다. 기본값 사용");
                resolve("SD10000000"); // 형식에 맞는 기본값
              }
            },
            error: function(oError) {
              // 오류 발생 시 로그 출력 후 기본값 사용
              console.error("문서번호 조회 중 오류 발생:", oError);
              
              // 상세 오류 정보 출력
              if (oError.responseText) {
                try {
                  var errorDetails = JSON.parse(oError.responseText);
                  console.error("상세 오류:", errorDetails);
                } catch (e) {
                  console.error("오류 응답:", oError.responseText);
                }
              }
              
              resolve("SD10000000"); // 형식에 맞는 기본값
            }
          });
        });
      },
      
      /**
       * 기존 문서번호를 기반으로 다음 문서번호를 생성합니다.
       * @param {string} sCurrentDocNumber 현재 문서번호
       * @returns {string} 다음 문서번호
       * @private
       */
      _generateNextDocumentNumber: function(sCurrentDocNumber) {
        console.log("입력된 현재 문서번호:", sCurrentDocNumber);
        
        if (!sCurrentDocNumber) {
          console.warn("문서번호가 없습니다. 기본값 사용");
          return "SD10000000"; // 기본값
        }
        
        // 문서번호 형식 검증: "SD" 접두사 다음에 숫자
        var matches = sCurrentDocNumber.match(/^SD(\d+)$/);
        if (!matches || matches.length < 2) {
          console.warn("잘못된 문서번호 형식: " + sCurrentDocNumber);
          return "SD10000000"; // 형식이 맞지 않으면 기본값 반환
        }
        
        // 숫자 부분 추출
        var numericPart = matches[1];
        var currentNumber = parseInt(numericPart, 10);
        console.log("추출된 숫자 부분:", numericPart, "현재 번호:", currentNumber);
        
        // 단순히 1 증가
        var nextNumber = currentNumber + 1;
        console.log("다음 번호:", nextNumber);
        
        // 원래 자릿수 유지
        var paddedNextNumber = nextNumber.toString().padStart(numericPart.length, '0');
        var nextDocNumber = "SD" + paddedNextNumber;
        
        console.log("생성된 다음 문서번호:", nextDocNumber);
        return nextDocNumber;
      },
      
      /**
       * 백엔드에 데이터 저장
       * @private
       */
      _saveDataToBackend: function(oData, sDocumentNumber) {
        var that = this;
        console.log("저장할 데이터:", oData);
        console.log("문서번호:", sDocumentNumber);
        
        // 저장에 사용할 선택된 색상 정보 저장 (초기화 후에도 사용하기 위함)
        var aSelectedColors = oData.selectedColors;
        
        // OData 모델 가져오기
        var oModel = this.getOwnerComponent().getModel();
        
        if (!oModel) {
          console.error("OData 모델이 없습니다.");
          sap.m.MessageToast.show("데이터를 저장할 수 없습니다: OData 모델을 찾을 수 없습니다.");
          return;
        }
        
        // 뷰가 이미 busy 상태가 아니라면 설정
        if (!this.getView().getBusy()) {
          this.getView().setBusy(true);
        }
        
        // 현재 날짜와 시간
        var oNow = new Date();
        
        // 1. 헤더 데이터 생성
        var oHeaderData = {
          InqrDocuId: sDocumentNumber,
          CustId: oData.customerId,
          SalesOrg: "S100",  
          DistCha: "10",    
          Division: "10",    
          CreatedBy: "", // 현재 SAP 사용자 또는 시스템 ID
          CreatedDate: this._formatSAPDate(oNow), // 현재 날짜 - SAP 형식으로 변환
          CreatedTime: this._formatTime(oNow), // 현재 시간
          ChangedBy: "", // 현재 SAP 사용자 또는 시스템 ID
          ChangedDate: this._formatSAPDate(oNow), // 현재 날짜 - SAP 형식으로 변환
          ChangedTime: this._formatTime(oNow) // 현재 시간
        };
        
        // 고객 ID에 따라 SalesOrg, DistCha, Division 설정
        switch(oData.customerId) {
          case "5000000000": // 현대 중공업
            oHeaderData.SalesOrg = "S100";
            oHeaderData.DistCha = "10";
            oHeaderData.Division = "10";
            break;
          case "6000000000": // TOYOTA
            oHeaderData.SalesOrg = "S200";
            oHeaderData.DistCha = "10";
            oHeaderData.Division = "20";
            break;
          case "7000000000": // CPID
            oHeaderData.SalesOrg = "S300";
            oHeaderData.DistCha = "10";
            oHeaderData.Division = "30";
            break;
          case "7000000001": // COMAC
            oHeaderData.SalesOrg = "S300";
            oHeaderData.DistCha = "10";
            oHeaderData.Division = "40";
            break;
        }
        
        console.log("전송할 헤더 데이터:", JSON.stringify(oHeaderData));
        
        // 2. 헤더 데이터 저장
        oModel.create("/ZDCT_SD040Set", oHeaderData, {
          success: function() {
            console.log("헤더 데이터 저장 성공");
            
            // 3. 아이템 데이터 저장 - 성공 메시지는 아이템 저장 후에 표시
            that._saveItemData(sDocumentNumber, aSelectedColors, oData.customerRequest);
          },
          error: function(oError) {
            console.error("헤더 데이터 저장 실패:", oError);
            that.getView().setBusy(false);
            
            // 상세 오류 정보 출력
            if (oError.responseText) {
              try {
                var errorDetails = JSON.parse(oError.responseText);
                console.error("상세 오류:", errorDetails);
              } catch (e) {
                console.error("오류 응답:", oError.responseText);
              }
            }
            
            sap.m.MessageToast.show("데이터 저장 중 오류가 발생했습니다.");
          }
        });
      },
      
      /**
       * 날짜를 SAP OData 서비스 형식으로 변환합니다. (/Date(timestamp)/)
       * @param {Date} oDate 날짜 객체
       * @returns {string} SAP OData 날짜 형식
       * @private 
       */
      _formatSAPDate: function(oDate) {
        return "/Date(" + oDate.getTime() + ")/";
      },
      
      /**
       * 시간을 SAP OData 서비스 형식으로 변환합니다. (PT12H15M25S)
       * @param {Date} oDate 날짜 객체
       * @returns {string} SAP OData 시간 형식
       * @private 
       */
      _formatTime: function(oDate) {
        var hours = oDate.getHours();
        var minutes = oDate.getMinutes();
        var seconds = oDate.getSeconds();
        
        return "PT" + hours + "H" + minutes + "M" + seconds + "S";
      },
      
      /**
       * 문서의 아이템 데이터 저장
       * @param {string} sDocumentNumber - 저장할 문서 번호
       * @param {Array} aSelectedColors - 저장할 선택된 색상 목록
       * @param {string} sCustomerRequest - 공통 문의사항
       * @private
       */
      _saveItemData: function(sDocumentNumber, aSelectedColors, sCustomerRequest) {
        this._documentNumber = sDocumentNumber;
        this._customerRequest = sCustomerRequest;
        
        // 모델에서 데이터를 가져오는 대신 파라미터로 전달받은 색상 목록 사용
        console.log("저장할 모든 아이템:", aSelectedColors);
        
        // material ID가 있는 아이템만 필터링하여 실제 저장
        var aSelectedItems = aSelectedColors.filter(function(item) {
          return item.materialId; // materialId가 있는 항목만 저장
        });
        
        console.log("필터링 후 실제 저장할 아이템:", aSelectedItems);
        console.log("저장 시늉만 하는 아이템:", aSelectedColors.filter(function(item) { 
          return !item.materialId; 
        }));
        
        this._totalItems = aSelectedItems.length;
        this._savedItems = 0;
        
        // 아이템이 없는 경우
        if (this._totalItems === 0) {
          // 뷰 busy 상태 해제
          this.getView().setBusy(false);
          console.log("저장할 아이템이 없습니다.");
          return;
        }
        
        // 재귀적으로 아이템 저장
        this._currentItems = aSelectedItems;
        this._saveNextItem(0);
      },
      
      /**
       * 다음 아이템 저장 (재귀 호출)
       * @param {int} iIndex - 현재 저장할 아이템 인덱스
       * @private
       */
      _saveNextItem: function(iIndex) {
        var that = this;
        
        // 모든 아이템을 저장한 경우
        if (iIndex >= this._currentItems.length) {
          console.log("모든 아이템 저장 완료");
          this.getView().setBusy(false);
          // 문서번호가 있는 경우에만 성공 메시지 표시 - 모든 아이템 저장 완료 후에 표시
          if (this._documentNumber) {
            sap.m.MessageToast.show("문의서 " + this._documentNumber + " 저장이 완료되었습니다.");
            // 이미 초기화되었으므로 다시 초기화하지 않음
          }
          return;
        }
        
        var oItem = this._currentItems[iIndex];
        var oModel = this.getOwnerComponent().getModel();
        var oNow = new Date();
        
        // 아이템 데이터 생성 - ItemID를 1씩 증가하도록 수정
        var oItemData = {
          InqrDocuId: this._documentNumber,
          InqrItemId: (iIndex + 1).toString().padStart(6, '0'), // 000001, 000002, ... (1씩 증가)
          MatId: oItem.materialId || "",
          Descr: oItem.description || this._customerRequest || "", // 색상별 문의사항 우선, 없으면 공통 문의사항 사용
          CreatedBy: "", // 현재 SAP 사용자 또는 시스템 ID
          CreatedDate: this._formatSAPDate(oNow), // 현재 날짜 - SAP 형식으로 변환
          CreatedTime: this._formatTime(oNow), // 현재 시간
          ChangedBy: "", // 현재 SAP 사용자 또는 시스템 ID
          ChangedDate: this._formatSAPDate(oNow), // 현재 날짜 - SAP 형식으로 변환
          ChangedTime: this._formatTime(oNow) // 현재 시간
        };
        
        console.log("저장할 아이템 데이터:", oItemData);
        
        // 아이템 데이터 저장
        oModel.create("/ZDCT_SD041Set", oItemData, {
          success: function() {
            console.log("아이템 데이터 저장 성공:", iIndex+1);
            that._savedItems++;
            
            // 다음 아이템 저장 - 마지막 항목에서만 성공 메시지 표시
            that._saveNextItem(iIndex + 1);
            // 성공 메시지는 모든 항목 저장 후 한 번만 표시하도록 수정함
          },
          error: function(oError) {
            console.error("아이템 데이터 저장 실패:", oError);
            
            // 상세 오류 정보 출력
            if (oError.responseText) {
              try {
                var errorDetails = JSON.parse(oError.responseText);
                console.error("상세 오류:", errorDetails);
              } catch (e) {
                console.error("오류 응답:", oError.responseText);
              }
            }
            
            // 계속해서 다음 아이템 저장 시도
            that._saveNextItem(iIndex + 1);
          }
        });
      },
      
      /**
       * 저장 성공 후 선택된 색상과 문의 사항 초기화
       * @private
       */
      _resetAfterSave: function() {
        // 텍스트 영역 초기화
        var oInput = this.byId("select_TextArea_request");
        oInput.setValue("");
        
        // 모델에서 요청사항 초기화
        var oModel = this.getView().getModel();
        if (oModel) {
          oModel.setProperty("/CustomerRequest", "");
        }
        
        // 색상 모델에서 선택된 색상 목록 초기화
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        
        // 모든 선택된 색상의 하이라이트 제거
        aSelectedColors.forEach(function(oColor) {
          this._removeColorHighlight(oColor.colorCode);
        }.bind(this));
        
        // 선택된 색상 배열 초기화
        oColorsModel.setProperty("/selectedColors", []);
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
      
      // 요청사항 초기화
      onResetCustomerRequest: function() {
        // 입력 필드 초기화
        var oInput = this.byId("select_TextArea_request");
        oInput.setValue("");
        
        // 모델 초기화
        var oModel = this.getView().getModel("view");
        oModel.setProperty("/customerRequest", "");
        
        // 선택된 색상들의 하이라이트 제거
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        
        aSelectedColors.forEach(function(oColor) {
          this._removeColorHighlight(oColor.colorCode);
        }.bind(this));
        
        // 선택된 색상 배열 초기화
        oColorsModel.setProperty("/selectedColors", []);
        
        sap.m.MessageToast.show("요청사항과 선택된 색상이 초기화되었습니다.");
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
      },
      
      // 색상별 설명 변경 처리
      onColorDescriptionChange: function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();
        
        // 해당 색상 항목의 description 속성 업데이트
        var oColorsModel = this.getView().getModel("colors");
        oColorsModel.setProperty(sPath + "/description", sValue);
      }
    });
  });
