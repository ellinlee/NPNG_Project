sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("sync.dc.sd.project02.controller.Select", {
      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter
          .getRoute("RouteSelect")
          .attachPatternMatched(this._onRouteMatched, this);

        // 새로고침 여부 확인 (로컬 스토리지를 사용)
        try {
          var refreshState = sessionStorage.getItem("pageRefreshed");
          if (!refreshState) {
            // 처음 방문 표시
            sessionStorage.setItem("pageRefreshed", "true");
          }

          // 페이지 로드 시마다 갱신
          window.addEventListener(
            "beforeunload",
            function () {
              // 떠날 때 상태 유지
              var selectedCustomer = this.getView()
                .getModel()
                ?.getProperty("/SelectedCustomer");
              if (selectedCustomer) {
                localStorage.setItem(
                  "selectedCustomer",
                  JSON.stringify(selectedCustomer)
                );
              }
            }.bind(this)
          );
        } catch (e) {
          console.error("세션 스토리지 접근 오류:", e);
        }

        // 선택된 색상들을 관리할 모델 초기화
        var oColorsModel = new JSONModel({
          selectedColors: [],
        });
        this.getView().setModel(oColorsModel, "colors");

        // 자재 ID 매핑 데이터 초기화
        this._initMaterialData();

        // 유효기간 모델 초기화
        var oValidDateModel = new JSONModel({
          validFrom: null,
          validTo: null
        });
        this.getView().setModel(oValidDateModel, "validDate");

        // 저장 버튼 비활성화
        var oViewModel = new JSONModel({
          isContractCheckPassed: false
        });
        this.getView().setModel(oViewModel);
      },

      _initMaterialData: function () {
        var that = this;
        var oModel = this.getOwnerComponent().getModel();

        oModel.read("/ZDCT_MM010Set", {
          success: function(oData) {
            var oMaterialModel = new JSONModel({
              materials: oData.results.map(function(item) {
                var colorMatch = item.MatNm.match(/\(#([0-9A-Fa-f]{6})\)/);
                var colorCode = colorMatch ? "#" + colorMatch[1] : null;
                
                // 자재 번호 범위에 따라 카테고리 결정
                var matId = parseInt(item.MatId);
                var category;
                if (matId >= 3000000001 && matId <= 3000000064) {
                  category = "paint1"; // 건설용
                } else if (matId >= 3000000065 && matId <= 3000000128) {
                  category = "paint2"; // 자동차용
                } else if (matId >= 3000000129 && matId <= 3000000192) {
                  category = "paint3"; // 조선용
                } else if (matId >= 3000000193 && matId <= 3000000256) {
                  category = "paint4"; // 항공용
                }
                
                return {
                  MatID: item.MatId,
                  MatName: item.MatNm,
                  category: category || item.MatTy, // 기존 MatTy를 fallback으로 사용
                  ColorCode: colorCode
                };
              })
            });

            that.getView().setModel(oMaterialModel, "materials");

            var oViewModel = new JSONModel({
              selectedCategory: "paint1"
            });
            that.getView().setModel(oViewModel, "view");

            var availableColors = {};
            oData.results.forEach(function(item) {
              var colorMatch = item.MatNm.match(/\(#([0-9A-Fa-f]{6})\)/);
              if (colorMatch) {
                var colorCode = "#" + colorMatch[1];
                availableColors[colorCode] = {
                  code: colorCode,
                  materialId: item.MatId
                };
              }
            });

            var oColorContainer = that.byId("select_HBox_colorContainer");
            var aColorButtons = oColorContainer.getItems();
            
            aColorButtons.forEach(function(oVBox) {
              var oButton = oVBox.getItems()[0];
              var sColorCode = oButton.data("color");
              
              var colorInfo = availableColors[sColorCode];
              if (colorInfo) {
                oButton.addStyleClass("materialColor");
                oButton.data("materialId", colorInfo.materialId);
              }
            });
          },
          error: function(oError) {
            sap.m.MessageToast.show("자재 데이터를 불러오는 중 오류가 발생했습니다.");
          }
        });
      },

      _findMaterialByColorAndCategory: function (sColorCode, sCategory) {
        var oMaterialsModel = this.getView().getModel("materials");
        var aMaterials = oMaterialsModel.getProperty("/materials") || [];

        var foundMaterial = aMaterials.find(function (oMaterial) {
          return (
            oMaterial.ColorCode === sColorCode &&
            oMaterial.category === sCategory
          );
        });

        return foundMaterial;
      },

      _onRouteMatched: function (oEvent) {
        var oArgs = oEvent.getParameter("arguments");
        var sCustomerName = decodeURIComponent(oArgs.customerName);

        var oComponent = this.getOwnerComponent();
        var oSelectedCustomerModel = oComponent.getModel("selectedCustomerModel");

        if (
          oSelectedCustomerModel &&
          oSelectedCustomerModel.getData() &&
          oSelectedCustomerModel.getData().SelectedCustomer
        ) {
          var oViewModel = new sap.ui.model.json.JSONModel(
            oSelectedCustomerModel.getData()
          );
          this.getView().setModel(oViewModel);
        } else {
          var customerData = null;
          try {
            var storedCustomer = localStorage.getItem("selectedCustomer");
            if (storedCustomer) {
              customerData = JSON.parse(storedCustomer);
            }
          } catch (e) {
            console.error("로컬 스토리지에서 고객 정보 복원 실패:", e);
          }

          if (!customerData && sCustomerName) {
            var customersList = [
              { CustomerID: "5000000000", CustomerName: "현대 중공업" },
              { CustomerID: "6000000000", CustomerName: "TOYOTA" },
              { CustomerID: "7000000000", CustomerName: "CPID" },
              { CustomerID: "7000000001", CustomerName: "COMAC" },
            ];

            var foundCustomer = customersList.find(function (customer) {
              return customer.CustomerName === sCustomerName;
            });

            if (foundCustomer) {
              customerData = foundCustomer;

              try {
                localStorage.setItem(
                  "selectedCustomer",
                  JSON.stringify(customerData)
                );
              } catch (e) {
                console.error("로컬 스토리지 저장 실패:", e);
              }
            }
          }

          if (customerData) {
            var oBackupModel = new sap.ui.model.json.JSONModel({
              SelectedCustomer: customerData,
            });

            this.getView().setModel(oBackupModel);
            oComponent.setModel(oBackupModel, "selectedCustomerModel");
          } else {
            sap.m.MessageToast.show("고객 데이터를 불러오는 데 실패했습니다.");
          }
        }

        var oColorsModel = new sap.ui.model.json.JSONModel({
          selectedColors: [],
        });
        this.getView().setModel(oColorsModel, "colors");
      },

      onColorSelected: function (oEvent) {
        var oButton = oEvent.getSource();
        var sColorCode = oButton.data("color");
        var sMaterialId = oButton.data("materialId");
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];

        // 현재 선택된 카테고리 가져오기
        var sSelectedCategory = this.getView().getModel("view").getProperty("/selectedCategory");

        // 선택된 색상 정보 객체 생성
        var colorInfo = {
          colorCode: sColorCode,
          colorName: this._getColorName(sColorCode),
          timestamp: new Date().toISOString(),
          colorStyle: "background-color: " + sColorCode + ";",
          materialId: sMaterialId,
          description: ""
        };

        // 이미 선택된 색상인지 확인
        var existingIndex = this._findColorIndex(aSelectedColors, sColorCode);

        if (existingIndex !== -1) {
          // 이미 선택된 색상이면 제거
          aSelectedColors.splice(existingIndex, 1);
          this._removeColorHighlight(sColorCode);
          sap.m.MessageToast.show("색상이 선택 해제되었습니다: " + sColorCode);
        } else {
          // 새로운 색상 선택 추가
          aSelectedColors.push(colorInfo);
          this._highlightSelectedColor(sColorCode, !!sMaterialId);
          sap.m.MessageToast.show("색상이 선택되었습니다: " + sColorCode);
        }

        // 모델 업데이트
        oColorsModel.setProperty("/selectedColors", aSelectedColors);

        // 저장 버튼 무조건 비활성화
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      _openIndustrySelectionDialog: function(sColorCode) {
        if (!this._oIndustrySelectionDialog) {
          this._oIndustrySelectionDialog = sap.ui.xmlfragment(
            "sync.dc.sd.project02.view.IndustrySelectionDialog",
            this
          );
          this.getView().addDependent(this._oIndustrySelectionDialog);
        }

        var oModel = new JSONModel({
          colorCode: sColorCode,
          selectedIndustry: "automotive",
          industries: [
            { key: "construction", text: "건설용" },
            { key: "automotive", text: "자동차용" },
            { key: "shipbuilding", text: "조선용" },
            { key: "aerospace", text: "항공용" }
          ]
        });

        this._oIndustrySelectionDialog.setModel(oModel);
        this._oIndustrySelectionDialog.open();
      },

      onIndustrySelected: function(oEvent) {
        var sSelectedIndustry = oEvent.getParameter("selectedItem").getKey();
        var oModel = this._oIndustrySelectionDialog.getModel();
        var sColorCode = oModel.getProperty("/colorCode");
        
        // 산업별 자재 번호 매핑
        var sMaterialId;
        switch(sSelectedIndustry) {
          case "construction":
            sMaterialId = "3000000257";
            break;
          case "automotive":
            sMaterialId = "3000000258";
            break;
          case "shipbuilding":
            sMaterialId = "3000000259";
            break;
          case "aerospace":
            sMaterialId = "3000000260";
            break;
        }

        // 색상 정보 객체 생성
        var colorInfo = {
          colorCode: sColorCode,
          colorName: this._getColorName(sColorCode),
          timestamp: new Date().toISOString(),
          colorStyle: "background-color: " + sColorCode + ";",
          materialId: sMaterialId,
          description: "",
          industry: sSelectedIndustry
        };

        // 선택된 색상 목록에 추가
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        aSelectedColors.push(colorInfo);
        oColorsModel.setProperty("/selectedColors", aSelectedColors);

        // 색상 하이라이트
        this._highlightSelectedColor(sColorCode, true);

        // 다이얼로그 닫기
        this._oIndustrySelectionDialog.close();

        // 저장 버튼 비활성화
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      onCancelIndustrySelection: function() {
        this._oIndustrySelectionDialog.close();
      },

      // 색상 코드로 색상 인덱스 찾기
      _findColorIndex: function (aColors, colorCode) {
        for (var i = 0; i < aColors.length; i++) {
          if (aColors[i].colorCode === colorCode) {
            return i;
          }
        }
        return -1;
      },

      // 색상 코드로 색상 이름 찾기
      _getColorName: function (colorCode) {
        return colorCode;
      },

      onColorSearch: function (oEvent) {
        var sSearchTerm = oEvent
          .getParameter("query")
          .toUpperCase()
          .replace(/\s/g, "");
        this._filterColorsBySearchTerm(sSearchTerm);
      },

      onColorLiveSearch: function (oEvent) {
        var sSearchTerm = oEvent
          .getParameter("newValue")
          .toUpperCase()
          .replace(/\s/g, "");
        this._filterColorsBySearchTerm(sSearchTerm);
      },

      onColorSearchReset: function () {
        this.byId("select_SearchField_color").setValue("");
        this._resetColorVisibility();
      },

      _filterColorsBySearchTerm: function (sSearchTerm) {
        if (!sSearchTerm) {
          this._resetColorVisibility();
          return;
        }

        var aColors = this.byId("select_HBox_colorContainer").getItems();

        aColors.forEach(function (oColorContainer) {
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

      _resetColorVisibility: function () {
        var aColors = this.byId("select_HBox_colorContainer").getItems();

        aColors.forEach(function (oColorContainer) {
          oColorContainer.setVisible(true);
          oColorContainer.removeStyleClass("searchMatch");
        });
      },

      _highlightSelectedColor: function (selectedColor, isMaterialConnected) {
        var aColors = this.byId("select_HBox_colorContainer").getItems();

        aColors.forEach(function (oColorContainer) {
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

      // 색상 강조 표시 제거
      _removeColorHighlight: function (selectedColor) {
        var aColors = this.byId("select_HBox_colorContainer").getItems();

        aColors.forEach(function (oColorContainer) {
          var oColorButton = oColorContainer.getItems()[0];
          if (oColorButton.data("color") === selectedColor) {
            oColorContainer.removeStyleClass("selectedColor");
            oColorContainer.removeStyleClass("materialColor");
            oColorContainer.removeStyleClass("noMaterialColor");
          }
        });
      },

      // 타임스탬프 포맷팅
      _formatTimestamp: function (sTimestamp) {
        if (!sTimestamp) return "";
        
        var oDate = new Date(sTimestamp);
        var sYear = oDate.getFullYear();
        var sMonth = (oDate.getMonth() + 1).toString().padStart(2, "0");
        var sDay = oDate.getDate().toString().padStart(2, "0");
        var sHours = oDate.getHours().toString().padStart(2, "0");
        var sMinutes = oDate.getMinutes().toString().padStart(2, "0");
        
        return sYear + "-" + sMonth + "-" + sDay + " " + sHours + ":" + sMinutes;
      },

      // 선택된 색상 목록 표시
      onShowSelectedColors: function () {
        var oValidDateModel = this.getView().getModel("validDate");
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        var oValidTo = oValidDateModel.getProperty("/validTo");
        var oModel = this.getView().getModel();
        var sDeliveryDay = oModel.getProperty("/DeliveryDay");
        if (!oValidFrom && !oValidTo && (!sDeliveryDay || sDeliveryDay.trim() === "")) {
          sap.m.MessageToast.show("계약기간과 납품희망일을 모두 입력해주세요.");
          return;
        } else if (!oValidFrom || !oValidTo) {
          sap.m.MessageToast.show("전체 계약기간을 먼저 입력해주세요.");
          return;
        } else if (!sDeliveryDay || sDeliveryDay.trim() === "") {
          sap.m.MessageToast.show("납품 희망일을 입력해주세요.");
          return;
        }
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        if (aSelectedColors.length === 0) {
          sap.m.MessageToast.show("선택된 색상이 없습니다.");
          return;
        }

        // 날짜를 yyyy-MM-dd 형식으로 변환하는 함수
        function formatDateToYYYYMMDD(date) {
          if (!date) return null;
          if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
          var dateObj = (typeof date === 'string') ? new Date(date) : date;
          var year = dateObj.getFullYear();
          var month = String(dateObj.getMonth() + 1).padStart(2, '0');
          var day = String(dateObj.getDate()).padStart(2, '0');
          return year + '-' + month + '-' + day;
        }

        // 인덱스 정보 추가 및 날짜 포맷팅
        aSelectedColors.forEach(
          function (color, index) {
            color.index = index;
            // 날짜 형식 변환
            if (color.itemValidFrom) {
              color.itemValidFrom = formatDateToYYYYMMDD(color.itemValidFrom);
            }
            if (color.itemValidTo) {
              color.itemValidTo = formatDateToYYYYMMDD(color.itemValidTo);
            }
            // 수량 초기화
            if (!color.quantity) {
              color.quantity = "";
            }
          }.bind(this)
        );

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

      // 수량 변경 처리
      onQuantityChange: function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();
        var oColorsModel = this.getView().getModel("colors");
        
        // 수량이 비어있는 경우
        if (!sValue) {
          oColorsModel.setProperty(sPath + "/quantity", "");
          return;
        }
        
        // 숫자로 변환
        var iQuantity = parseInt(sValue);
        
        // 최소 주문량 체크
        if (iQuantity < 10000) {
          sap.m.MessageToast.show("최소 주문량은 10,000L 입니다.");
          oSource.setValue("");
          oColorsModel.setProperty(sPath + "/quantity", "");
          return;
        }
        
        // 200L 단위 체크
        if (iQuantity % 200 !== 0) {
          sap.m.MessageToast.show("주문량은 200L 단위로 입력해주세요.");
          oSource.setValue("");
          oColorsModel.setProperty(sPath + "/quantity", "");
          return;
        }
        
        // 유효한 수량인 경우 저장
        oColorsModel.setProperty(sPath + "/quantity", iQuantity);
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 선택된 색상 제거
      onRemoveSelectedColor: function (oEvent) {
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
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 다이얼로그 닫기
      onCloseSelectedColorsDialog: function () {
        this._oSelectedColorsDialog.close();
      },

      // 고객 요청사항 변경 처리
      onCustomerRequestChange: function (oEvent) {
        var sText = oEvent.getParameter("value");
        var oModel = this.getView().getModel();

        // 모델에 요청사항 저장
        if (oModel) {
          oModel.setProperty("/CustomerRequest", sText);
        }
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 고객 요청사항 저장 및 선택된 색상 데이터 저장 버튼 클릭 시
      onSaveCustomerRequest: function () {
        var that = this;
        var oModel = this.getView().getModel();
        var oColorsModel = this.getView().getModel("colors");
        var sCustomerRequest = oModel.getProperty("/CustomerRequest");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors");
        var oValidDateModel = this.getView().getModel("validDate");
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        var oValidTo = oValidDateModel.getProperty("/validTo");
        var sDeliveryDay = oModel.getProperty("/DeliveryDay");

        // 납품 희망일 필수값 체크
        if (!sDeliveryDay || sDeliveryDay.trim() === "") {
          sap.m.MessageToast.show("납품 희망일은 필수 입력값입니다.");
            return;
        }

        // 계약기간 필수값 체크
        if (!oValidFrom || !oValidTo) {
          sap.m.MessageToast.show("계약기간을 입력해주세요.");
          return;
        }

        // 색상이 선택되지 않은 경우 알림
        if (!aSelectedColors || aSelectedColors.length === 0) {
          sap.m.MessageToast.show("하나 이상의 색상을 선택해주세요.");
          return;
        }

        // 아이템별 필수값 체크
        var aMissingItems = [];
        aSelectedColors.forEach(function(oColor, iIndex) {
          var sMissingFields = [];
          
          if (!oColor.quantity) {
            sMissingFields.push("주문 수량");
          }
          
          if (!oColor.itemValidFrom) {
            sMissingFields.push("계약 시작일");
          }
          
          if (!oColor.itemValidTo) {
            sMissingFields.push("계약 종료일");
          }
          
          if (sMissingFields.length > 0) {
            aMissingItems.push({
              colorCode: oColor.colorCode,
              missingFields: sMissingFields
            });
          }
        });

        if (aMissingItems.length > 0) {
          var sMessage = "다음 색상의 필수 정보가 누락되었습니다:\n";
          aMissingItems.forEach(function(oItem) {
            sMessage += "\n- " + oItem.colorCode + ": " + oItem.missingFields.join(", ");
          });
          sap.m.MessageToast.show(sMessage);
          return;
        }

        // 저장할 데이터 준비
        var oData = {
          customerRequest: sCustomerRequest,
          selectedColors: aSelectedColors,
          customerId: oModel.getProperty("/SelectedCustomer/CustomerID"),
          customerName: oModel.getProperty("/SelectedCustomer/CustomerName"),
          deliveryDay: sDeliveryDay,
          validFrom: oValidFrom,
          validTo: oValidTo
        };

        // [추가] SaveConfirmDialog 열기 직전, itemValidFrom/itemValidTo를 Date 객체 또는 null로 보정
        var changed = false;
        aSelectedColors.forEach(function(item) {
          // 시작일
          if (item.itemValidFrom) {
            if (typeof item.itemValidFrom === "string") {
              var d = new Date(item.itemValidFrom);
              item.itemValidFrom = (d instanceof Date && !isNaN(d.getTime())) ? d : null;
              changed = true;
            }
            if (!(item.itemValidFrom instanceof Date) || isNaN(item.itemValidFrom.getTime())) {
              item.itemValidFrom = null;
              changed = true;
            }
          } else {
            item.itemValidFrom = null;
            changed = true;
          }
          // 종료일
          if (item.itemValidTo) {
            if (typeof item.itemValidTo === "string") {
              var d = new Date(item.itemValidTo);
              item.itemValidTo = (d instanceof Date && !isNaN(d.getTime())) ? d : null;
              changed = true;
            }
            if (!(item.itemValidTo instanceof Date) || isNaN(item.itemValidTo.getTime())) {
              item.itemValidTo = null;
              changed = true;
            }
          } else {
            item.itemValidTo = null;
            changed = true;
          }
        });
        if (changed) {
          oColorsModel.setProperty("/selectedColors", aSelectedColors);
        }

        // 저장 확인 다이얼로그 열기
        this._openSaveConfirmDialog(oData);
      },

      /**
       * 저장 확인 다이얼로그를 엽니다.
       * @private
       */
      _openSaveConfirmDialog: function (oData) {
        if (!this._oSaveConfirmDialog) {
          this._oSaveConfirmDialog = sap.ui.xmlfragment(
            "sync.dc.sd.project02.view.SaveConfirmDialog",
            this
          );
          this.getView().addDependent(this._oSaveConfirmDialog);
        }
        this._oSaveConfirmDialog.open();
      },

      /**
       * 저장 확인 다이얼로그에서 취소 버튼 클릭 시
       */
      onCancelSave: function () {
        // 다이얼로그 닫기
        this._oSaveConfirmDialog.close();
      },

      /**
       * 저장 확인 다이얼로그에서 저장 버튼 클릭 시
       */
      onConfirmSave: function () {
        var that = this;
        var oModel = this.getOwnerComponent().getModel();
        var oColorsModel = this.getView().getModel("colors");
        var oValidDateModel = this.getView().getModel("validDate");
        
        // 고객 정보 가져오기
        var oViewModel = this.getView().getModel();
        var oSelectedCustomer = oViewModel.getProperty("/SelectedCustomer");
        var sCustomerId = oSelectedCustomer ? oSelectedCustomer.CustomerID : "";
        var sCustomerName = oSelectedCustomer ? oSelectedCustomer.CustomerName : "";
        
        var sCustomerRequest = oViewModel.getProperty("/CustomerRequest");
        var aSelectedColors = JSON.parse(JSON.stringify(oColorsModel.getProperty("/selectedColors")));
        
        // 납기일 가져오기
        var sDeliveryDay = oViewModel.getProperty("/DeliveryDay");
        console.log("입력된 납기일:", sDeliveryDay);
        console.log("입력된 고객 요청사항:", sCustomerRequest);
        
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        var oValidTo = oValidDateModel.getProperty("/validTo");

        // 고객 ID가 없는 경우 처리
        if (!sCustomerId) {
            sap.m.MessageToast.show("고객 정보가 없습니다. 다시 시도해주세요.");
          return;
        }

        // 납기일이 없는 경우 처리
        if (!sDeliveryDay || sDeliveryDay.trim() === "") {
            sap.m.MessageToast.show("납품 희망일은 필수 입력값입니다.");
              return;
            }

        // 문서 번호 생성
        this._getLatestDocumentNumber()
            .then(function(sDocumentNumber) {
                var newDocNumber = that._generateNextDocumentNumber(sDocumentNumber);
            that._documentNumber = newDocNumber;

                // 헤더 데이터 생성
        var oHeaderData = {
                    InqrDocuId: newDocNumber,
                    CustId: sCustomerId,
          SalesOrg: "S100",
          DistCha: "10",
          Division: "10",
                    ValidFrom: that._formatSAPDate(oValidFrom),
                    ValidTo: that._formatSAPDate(oValidTo),
                    Descr: sCustomerRequest || "",
                    DelivDay: sDeliveryDay,
                    CreatedBy: "FIORI",
                    CreatedDate: that._formatSAPDate(new Date()),
                    CreatedTime: that._formatTime(new Date()),
                    ChangedBy: "FIORI",
                    ChangedDate: that._formatSAPDate(new Date()),
                    ChangedTime: that._formatTime(new Date())
        };

        // 고객 ID에 따라 SalesOrg, DistCha, Division 설정
                switch (sCustomerId) {
          case "5000000000": // 현대 중공업
            oHeaderData.SalesOrg = "S100";
            oHeaderData.DistCha = "10";
            oHeaderData.Division = "10";
            break;
          case "6000000000": // TOYOTA
            oHeaderData.SalesOrg = "S200";
            oHeaderData.DistCha = "20";
            oHeaderData.Division = "20";
            break;
          case "7000000000": // CPID
            oHeaderData.SalesOrg = "S300";
            oHeaderData.DistCha = "20";
            oHeaderData.Division = "30";
            break;
          case "7000000001": // COMAC
            oHeaderData.SalesOrg = "S300";
            oHeaderData.DistCha = "20";
            oHeaderData.Division = "40";
            break;
        }

                console.log("저장할 헤더 데이터:", oHeaderData);

                // 헤더 데이터 저장
        oModel.create("/ZDCT_SD040Set", oHeaderData, {
                    success: function() {
            console.log("헤더 데이터 저장 성공");
                        that._saveItemData(newDocNumber, aSelectedColors, sCustomerRequest);
                        // 저장 성공 후 화면 초기화 및 다이얼로그 닫기
                        if (that._oSaveConfirmDialog) {
                          that._oSaveConfirmDialog.close();
                        }
                        that._resetAfterSave();
                    },
                    error: function(oError) {
            console.error("헤더 데이터 저장 실패:", oError);
            that.getView().setBusy(false);
            sap.m.MessageToast.show("데이터 저장 중 오류가 발생했습니다.");
                    }
                });
            })
            .catch(function(error) {
                sap.m.MessageToast.show("문서 번호 생성 중 오류가 발생했습니다: " + error);
        });
      },

      /**
       * 날짜를 SAP OData 서비스 형식으로 변환합니다. (/Date(timestamp)/)
       * @param {Date} oDate 날짜 객체
       * @returns {string} SAP OData 날짜 형식
       * @private
       */
      _formatSAPDate: function (oDate) {
        if (!oDate) return null;
        // 날짜를 UTC 기준으로 변환하여 시간대 차이 보정
        var utcDate = new Date(Date.UTC(
          oDate.getFullYear(),
          oDate.getMonth(),
          oDate.getDate(),
          0, 0, 0, 0
        ));
        return "/Date(" + utcDate.getTime() + ")/";
      },

      /**
       * 시간을 SAP OData 서비스 형식으로 변환합니다. (PT12H15M25S)
       * @param {Date} oDate 날짜 객체
       * @returns {string} SAP OData 시간 형식
       * @private
       */
      _formatTime: function (oDate) {
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
      _saveItemData: function (sDocumentNumber, aSelectedColors, sCustomerRequest) {
        var that = this;
        var oModel = this.getOwnerComponent().getModel();
        var oMaterialsModel = this.getView().getModel("materials");
        var aMaterials = oMaterialsModel.getProperty("/materials") || [];
        var now = new Date();

        // 날짜 포맷 함수
        function toODataDate(date) {
          if (!date) return null;
          if (typeof date === "string") date = new Date(date);
          return date.toISOString().split("T")[0] + "T00:00:00";
        }
        // 시간 포맷 함수
        function toODataTime(date) {
          if (!date) return null;
          return "PT" + date.getHours() + "H" + date.getMinutes() + "M" + date.getSeconds() + "S";
        }

        // 산업별 자재 번호 범위 정의
        var MATERIAL_RANGES = {
          construction: { start: 3000000001, end: 3000000064 },  // 건설용
          automotive: { start: 3000000065, end: 3000000128 },    // 자동차용
          shipbuilding: { start: 3000000129, end: 3000000192 },  // 조선용
          aerospace: { start: 3000000193, end: 3000000256 }      // 항공용
        };

        // TOYOTA의 FFD54F 색상에 대한 산업별 자재 매핑
        function getToyotaFFD54FMaterialId(category) {
          var range;
          switch(category) {
            case "paint1": // 건설용
              range = MATERIAL_RANGES.construction;
              break;
            case "paint2": // 자동차용
              range = MATERIAL_RANGES.automotive;
              break;
            case "paint3": // 조선용
              range = MATERIAL_RANGES.shipbuilding;
              break;
            case "paint4": // 항공용
              range = MATERIAL_RANGES.aerospace;
              break;
            default:
              return null;
          }

          // 해당 범위 내에서 적절한 자재 번호 선택
          return range.start.toString();
        }

        // 선택된 색상에 해당하는 자재 찾기 및 OData 구조에 맞게 매핑
        var aItemsToSave = aSelectedColors.map(function(oColor, iIndex) {
          // 자재명에서 색상 코드 추출
          var colorMatch = oColor.colorCode.match(/#([0-9A-Fa-f]{6})/);
          if (!colorMatch) return null;

          // 해당 색상 코드를 가진 자재 찾기
          var oMaterial = aMaterials.find(function(oMat) {
            var matColorMatch = oMat.MatName.match(/\(#([0-9A-Fa-f]{6})\)/);
            return matColorMatch && "#" + matColorMatch[1] === oColor.colorCode;
          });

          if (!oMaterial) return null;

          // 현재 선택된 카테고리(산업)에 따라 자재 번호 매핑
          var sCustomerId = that.getView().getModel().getProperty("/SelectedCustomer/CustomerID");
          var sSelectedCategory = that.getView().getModel("view").getProperty("/selectedCategory");
          
          console.log("현재 선택된 카테고리:", sSelectedCategory);
          console.log("고객 ID:", sCustomerId);
          console.log("색상 코드:", oColor.colorCode);
          console.log("원래 자재 번호:", oMaterial.MatID);

          // 카테고리에 따른 자재 번호 범위 결정
          var range;
          switch(sSelectedCategory) {
            case "paint1": // 건설용
              range = MATERIAL_RANGES.construction;
              break;
            case "paint2": // 자동차용
              range = MATERIAL_RANGES.automotive;
              break;
            case "paint3": // 조선용
              range = MATERIAL_RANGES.shipbuilding;
              break;
            case "paint4": // 항공용
              range = MATERIAL_RANGES.aerospace;
              break;
            default:
              range = MATERIAL_RANGES.automotive; // 기본값
          }

          // 원래 자재 번호를 해당 범위 내의 순차적인 번호로 매핑
          var originalMatId = parseInt(oMaterial.MatID);
          var baseNumber = 3000000000; // 기본 번호
          var sequenceNumber = originalMatId - baseNumber; // 1~260 사이의 순서 번호
          var sMaterialId;

          // TOYOTA의 FFD54F 색상인 경우 카테고리별 대체 자재 매핑
          if (sCustomerId === "6000000000" && oColor.colorCode === "#FFD54F") {
            switch(sSelectedCategory) {
              case "paint1": // 건설용
                sMaterialId = "3000000257";
                break;
              case "paint2": // 자동차용
                sMaterialId = "3000000258";
                break;
              case "paint3": // 조선용
                sMaterialId = "3000000259";
                break;
              case "paint4": // 항공용
                sMaterialId = "3000000260";
                break;
              default:
                sMaterialId = (range.start + sequenceNumber - 1).toString();
            }
          } else {
            sMaterialId = (range.start + sequenceNumber - 1).toString();
          }
          console.log("매핑된 자재 ID:", sMaterialId);

          return {
            InqrDocuId: sDocumentNumber,
            InqrItemId: ((iIndex + 1) * 10).toString().padStart(6, "0"),
            MatId: sMaterialId,
            Uom: "L",
            Qty: Number(oColor.quantity).toFixed(3),
            ValidFrom: toODataDate(oColor.itemValidFrom),
            ValidTo: toODataDate(oColor.itemValidTo),
            Descr: oColor.description || sCustomerRequest || "",
            CreatedBy: "FIORI",
            CreatedDate: toODataDate(now),
            CreatedTime: toODataTime(now),
            ChangedBy: "FIORI",
            ChangedDate: toODataDate(now),
            ChangedTime: toODataTime(now)
          };
        }).filter(function(item) { return item !== null; });

        if (aItemsToSave.length === 0) {
          this.getView().setBusy(false);
          sap.m.MessageToast.show("저장할 자재가 없습니다.");
          return;
        }

        // 아이템 저장 시작
        this._totalItems = aItemsToSave.length;
        this._savedItems = 0;
        this._currentItems = aItemsToSave;
        this._saveNextItem(0);
      },

      _saveNextItem: function (iIndex) {
        var that = this;

        if (iIndex >= this._currentItems.length) {
          console.log("모든 아이템 저장 완료");
          this.getView().setBusy(false);
          if (this._documentNumber) {
            sap.m.MessageToast.show("문의서 " + this._documentNumber + " 저장이 완료되었습니다.");
          }
          return;
        }

        var oItem = this._currentItems[iIndex];
        var oModel = this.getOwnerComponent().getModel();

        oModel.create("/ZDCT_SD041Set", oItem, {
          success: function() {
            console.log("아이템 데이터 저장 성공:", iIndex + 1);
            that._savedItems++;
            that._saveNextItem(iIndex + 1);
          },
          error: function(oError) {
            console.error("아이템 데이터 저장 실패:", oError);
            if (oError.responseText) {
              try {
                var errorDetails = JSON.parse(oError.responseText);
                console.error("상세 오류:", errorDetails);
              } catch (e) {
                console.error("오류 응답:", oError.responseText);
              }
            }
            that._saveNextItem(iIndex + 1);
          }
        });
      },

      /**
       * 저장 성공 후 선택된 색상과 문의 사항 초기화
       * @private
       */
      _resetAfterSave: function () {
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
        aSelectedColors.forEach(
          function (oColor) {
            this._removeColorHighlight(oColor.colorCode);
          }.bind(this)
        );

        // 선택된 색상 배열 초기화
        oColorsModel.setProperty("/selectedColors", []);

        // 계약기간(모델 및 DatePicker) 초기화
        var oValidDateModel = this.getView().getModel("validDate");
        oValidDateModel.setProperty("/validFrom", null);
        oValidDateModel.setProperty("/validTo", null);
        this.byId("select_DatePicker_validFrom_new").setValue(null);
        this.byId("select_DatePicker_validTo_new").setValue(null);

        // 납품희망일 초기화
        oModel.setProperty("/DeliveryDay", "");
        this.byId("input_deliveryDay").setValue("");

        //sap.m.MessageToast.show("입력 내용이 초기화되었습니다.");
      },

      // 요청사항 초기화
      onResetCustomerRequest: function () {
        // 입력 필드 초기화
        var oInput = this.byId("select_TextArea_request");
        oInput.setValue("");

        // 모델 초기화
        var oModel = this.getView().getModel("view");
        oModel.setProperty("/customerRequest", "");

        // 계약기간 및 납품희망일 초기화
        var oValidDateModel = this.getView().getModel("validDate");
        oValidDateModel.setProperty("/validFrom", null);
        oValidDateModel.setProperty("/validTo", null);
        var oMainModel = this.getView().getModel();
        oMainModel.setProperty("/DeliveryDay", "");

        // DatePicker UI 값도 직접 초기화
        this.byId("select_DatePicker_validFrom_new").setValue(null);
        this.byId("select_DatePicker_validTo_new").setValue(null);

        // 선택된 색상들의 하이라이트 제거
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];

        aSelectedColors.forEach(
          function (oColor) {
            this._removeColorHighlight(oColor.colorCode);
          }.bind(this)
        );

        // 선택된 색상 배열 초기화
        oColorsModel.setProperty("/selectedColors", []);

        sap.m.MessageToast.show("입력 내용이 초기화되었습니다.");
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 드롭다운에서 카테고리 선택 시 호출되는 함수
      onCategoryChange: function (oEvent) {
        var sSelectedCategory = oEvent.getParameter("selectedItem").getKey();
        this.getView()
          .getModel("view")
          .setProperty("/selectedCategory", sSelectedCategory);

        // 선택된 색상과 수량 데이터 초기화
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        
        // 선택된 색상이 있는 경우에만 초기화
        if (aSelectedColors.length > 0) {
          // 모든 선택된 색상의 하이라이트 제거
          aSelectedColors.forEach(
            function (oColor) {
              this._removeColorHighlight(oColor.colorCode);
            }.bind(this)
          );

          // 선택된 색상 배열 초기화
          oColorsModel.setProperty("/selectedColors", []);
          
          // 전체 계약 기간 초기화
          var oValidDateModel = this.getView().getModel("validDate");
          oValidDateModel.setProperty("/validFrom", null);
          oValidDateModel.setProperty("/validTo", null);
          
          // DatePicker 값 초기화
          this.byId("select_DatePicker_validFrom_new").setValue(null);
          this.byId("select_DatePicker_validTo_new").setValue(null);
          
          sap.m.MessageToast.show("카테고리가 변경되어 모든 입력 데이터가 초기화되었습니다.");
        }
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 색상별 설명 변경 처리
      onColorDescriptionChange: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();

        // 해당 색상 항목의 description 속성 업데이트
        var oColorsModel = this.getView().getModel("colors");
        oColorsModel.setProperty(sPath + "/description", sValue);
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 유효기간 시작일 변경 처리
      onValidFromChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oValidDateModel = this.getView().getModel("validDate");
        var oDatePicker = oEvent.getSource();
        
        // 현재 날짜
        var oCurrentDate = new Date();
        oCurrentDate.setHours(0, 0, 0, 0);
        
        // 최소 시작일 계산 (현재로부터 2개월 후)
        var oMinDate = new Date();
        oMinDate.setMonth(oMinDate.getMonth() + 2);
        oMinDate.setHours(0, 0, 0, 0);
        
        if (oDate) {
          // Date 객체로 변환 시도
          try {
            if (typeof oDate === 'string') {
              // 문자열이면 Date 객체로 변환 시도
              oDate = new Date(oDate);
              if (isNaN(oDate.getTime())) {
                throw new Error("유효하지 않은 날짜 형식입니다.");
              }
            }
            
            // 날짜 비교를 위해 시간 정보 제거
            oDate = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
            
            // 과거 날짜 체크
            if (oDate < oCurrentDate) {
              sap.m.MessageToast.show("과거 날짜는 입력할 수 없습니다.");
              oDatePicker.setValue(null);
              oValidDateModel.setProperty("/validFrom", null);
              this.getView().getModel().setProperty("/isContractCheckPassed", false);
              return;
            }
            
            // 2개월 이후 체크
            if (oDate < oMinDate) {
              sap.m.MessageToast.show("계약 시작일은 최소 2개월 이후로 설정해야 합니다.");
              oDatePicker.setValue(null);
              oValidDateModel.setProperty("/validFrom", null);
              this.getView().getModel().setProperty("/isContractCheckPassed", false);
              return;
            }
          } catch (error) {
            sap.m.MessageToast.show("유효하지 않은 날짜 형식입니다. 올바른 날짜를 입력해주세요.");
            oDatePicker.setValue(null);
            oValidDateModel.setProperty("/validFrom", null);
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
            return;
          }
        }
        
        oValidDateModel.setProperty("/validFrom", oDate);
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 유효기간 종료일 변경 처리
      onValidToChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oValidDateModel = this.getView().getModel("validDate");
        var oDatePicker = oEvent.getSource();
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        
        // 현재 날짜
        var oCurrentDate = new Date();
        oCurrentDate.setHours(0, 0, 0, 0);
        
        if (oDate) {
          // Date 객체로 변환 시도
          try {
            if (typeof oDate === 'string') {
              // 문자열이면 Date 객체로 변환 시도
              oDate = new Date(oDate);
              if (isNaN(oDate.getTime())) {
                throw new Error("유효하지 않은 날짜 형식입니다.");
              }
            }
            
            // 날짜 비교를 위해 시간 정보 제거
            oDate = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
            
            // 2029년 12월 31일 이후 체크
            var maxDate = new Date(2029, 11, 31); // 11은 12월을 의미 (월은 0부터 시작)
            if (oDate > maxDate) {
              sap.m.MessageToast.show("문의는 2029년 12월 31일까지의 기간만 가능합니다.");
              oDatePicker.setValue(null);
              oValidDateModel.setProperty("/validTo", null);
              this.getView().getModel().setProperty("/isContractCheckPassed", false);
              return;
            }
            
            // 과거 날짜 체크
            if (oDate < oCurrentDate) {
              sap.m.MessageToast.show("과거 날짜는 입력할 수 없습니다.");
              oDatePicker.setValue(null);
              oValidDateModel.setProperty("/validTo", null);
              this.getView().getModel().setProperty("/isContractCheckPassed", false);
              return;
            }
            
            if (oValidFrom) {
              if (typeof oValidFrom === 'string') {
                oValidFrom = new Date(oValidFrom);
              }
              oValidFrom = new Date(oValidFrom.getFullYear(), oValidFrom.getMonth(), oValidFrom.getDate());
              
              if (oDate < oValidFrom) {
                sap.m.MessageToast.show("계약 종료일은 시작일보다 이후여야 합니다.");
                oDatePicker.setValue(null);
                oValidDateModel.setProperty("/validTo", null);
                this.getView().getModel().setProperty("/isContractCheckPassed", false);
                return;
              }

              // 하루짜리 계약인 경우(시작일과 종료일이 같은 경우) 한 달 미만 체크를 건너뜁니다.
              if (oDate.getTime() !== oValidFrom.getTime()) {
                // 계약기간이 한 달 미만인 경우 체크
                var startDate = new Date(oValidFrom);
                var endDate = new Date(oDate);
                
                // 시작일의 다음 달 같은 날짜 계산
                var nextMonthDate = new Date(startDate);
                nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                
                // 다음 달에 같은 일자가 없는 경우 (예: 1월 31일, 3월 31일 등)
                // if (nextMonthDate.getDate() !== startDate.getDate()) {
                //   sap.m.MessageToast.show("계약기간이 한 달이 되려면 시작일과 종료일이 같은 일자여야 합니다. (예: 7월 23일부터 8월 23일까지)");
                //   oDatePicker.setValue(null);
                //   oValidDateModel.setProperty("/validTo", null);
                //   this.getView().getModel().setProperty("/isContractCheckPassed", false);
                //   return;
                // }
                
                if (endDate < nextMonthDate) {
                  sap.m.MessageToast.show("계약기간이 한 달 미만입니다. 한 건의 주문만 가능하므로, 계약기간을 희망 납품일에 맞춰 수정해주세요.");
                  oDatePicker.setValue(null);
                  oValidDateModel.setProperty("/validTo", null);
                  this.getView().getModel().setProperty("/isContractCheckPassed", false);
                  return;
                }
              }
            }
          } catch (error) {
            sap.m.MessageToast.show("유효하지 않은 날짜 형식입니다. 올바른 날짜를 입력해주세요.");
            oDatePicker.setValue(null);
            oValidDateModel.setProperty("/validTo", null);
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
            return;
          }
        }
        
        oValidDateModel.setProperty("/validTo", oDate);
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      onOpenDeliveryDayDialog: function(oEvent) {
        this._openDeliveryDayDialog();
      },

      _openDeliveryDayDialog: function() {
        var oValidDateModel = this.getView().getModel("validDate");
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        var oValidTo = oValidDateModel.getProperty("/validTo");

        if (!oValidFrom || !oValidTo) {
          sap.m.MessageToast.show("먼저 계약기간을 입력해주세요.");
          return;
        }
        
        // 날짜 포맷팅
        var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
          pattern: "yyyy-MM-dd"
        });
        var sValidFrom = oFormat.format(oValidFrom);
        var sValidTo = oFormat.format(oValidTo);

        // 선택 가능한 날짜 목록 생성
        var aDays = [];
        
        // 시작일과 종료일이 같은 경우 (하루만 선택 가능)
        if (sValidFrom === sValidTo) {
          var iDay = oValidFrom.getDate();
          aDays.push({
            day: iDay + "일",
            value: iDay,
            selected: false
          });
        } else {
          // 시작일과 종료일이 다른 경우 (기간 내의 모든 날짜 선택 가능)
          var iStartDay = oValidFrom.getDate();
          var iEndDay = oValidTo.getDate();
          
          for (var i = iStartDay; i <= iEndDay; i++) {
            aDays.push({
              day: i + "일",
              value: i,
              selected: false
            });
          }
        }

        // 현재 선택된 날짜들 가져오기
        var oViewModel = this.getView().getModel();
        var sCurrentValue = oViewModel.getProperty("/DeliveryDay");
        if (sCurrentValue) {
          var aCurrentDays = sCurrentValue.split(",").map(function(s) {
            return parseInt(s.trim());
          });
          
          aDays.forEach(function(oDay) {
            if (aCurrentDays.includes(oDay.value)) {
              oDay.selected = true;
            }
          });
        }

        // 다이얼로그 모델 생성
        var oDialogModel = new JSONModel({
          validFrom: sValidFrom,
          validTo: sValidTo,
          days: aDays,
          selectedDays: sCurrentValue || ""
        });

        if (!this._oDeliveryDayDialog) {
          this._oDeliveryDayDialog = sap.ui.xmlfragment(
            "sync.dc.sd.project02.view.fragments.DeliveryDayDialog",
            this
          );
          this.getView().addDependent(this._oDeliveryDayDialog);
        }

        // 모델 이름을 'validDate'로 설정
        this._oDeliveryDayDialog.setModel(oDialogModel, "validDate");
        this._oDeliveryDayDialog.open();
      },

      onDaySelect: function(oEvent) {
        var oButton = oEvent.getSource();
        var sDay = oButton.getText().replace("일", "");
        
        var oModel = this._oDeliveryDayDialog.getModel("validDate");
        var aDays = oModel.getProperty("/days");
        
        // 선택된 날짜 업데이트
        aDays.forEach(function(oDay) {
          if (oDay.day === sDay + "일") {
            oDay.selected = !oDay.selected; // 토글 방식으로 선택/해제
          }
        });
        
        // 선택된 날짜들을 문자열로 변환
        var aSelectedDays = aDays
          .filter(function(oDay) { return oDay.selected; })
          .map(function(oDay) { return oDay.value; })
          .sort(function(a, b) { return a - b; });
        
        var sSelectedDays = aSelectedDays.join(", ");
        
        // 모델 업데이트
        oModel.setProperty("/days", aDays);
        oModel.setProperty("/selectedDays", sSelectedDays);
      },

      onConfirm: function() {
        var oModel = this._oDeliveryDayDialog.getModel("validDate");
        var sSelectedDays = oModel.getProperty("/selectedDays");
        
        // 메인 모델에 선택된 날짜들 저장
        var oViewModel = this.getView().getModel();
        oViewModel.setProperty("/DeliveryDay", sSelectedDays);
        
        this._oDeliveryDayDialog.close();
      },

      onCancel: function() {
        this._oDeliveryDayDialog.close();
      },

      /**
       * ZDCT_SD040 테이블에서 최신 문서번호를 가져옵니다.
       * @returns {Promise<string>} 최신 문서번호를 포함하는 Promise
       * @private
       */
      _getLatestDocumentNumber: function () {
        var that = this;
        return new Promise(function (resolve, reject) {
            // ZDCT_SD040 테이블에서 최대 문서번호를 조회하는 OData 호출
            var oModel = that.getOwnerComponent().getModel(); // 기본 OData 모델

            if (!oModel) {
                // OData 모델이 없는 경우 (개발 환경 등)
                console.warn("OData 모델이 없습니다. 임시 문서번호를 사용합니다.");
                resolve("SD10000000"); // 형식에 맞는 기본값
            return;
          }

            // "/ZDCT_SD040Set" 엔티티 세트에 대한 쿼리 준비
            var sPath = "/ZDCT_SD040Set";

            console.log("최신 문서번호 조회 시작");

            // 데이터 조회 - 모든 항목 가져오기
            oModel.read(sPath, {
                success: function (oData) {
                    console.log("문서번호 조회 응답:", oData);

                    if (oData && oData.results && oData.results.length > 0) {
                        // 결과가 있는 경우, 모든 결과를 확인하여 최대 문서번호 찾기
                        var maxDocNo = "SD10000000"; // 기본값 설정

                        // JavaScript에서 직접 최대 문서번호 찾기
                        oData.results.forEach(function (item) {
                            if (item.InqrDocuId && item.InqrDocuId !== "NaN") {
                                // 숫자 부분만 추출해서 비교
                                var currentMatches = item.InqrDocuId.match(/^SD(\d+)$/);
                                var maxMatches = maxDocNo.match(/^SD(\d+)$/);

                                if (
                                    currentMatches &&
                                    currentMatches.length > 1 &&
                                    maxMatches &&
                                    maxMatches.length > 1
                                ) {
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
                error: function (oError) {
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
      _generateNextDocumentNumber: function (sCurrentDocNumber) {
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
        var paddedNextNumber = nextNumber.toString().padStart(numericPart.length, "0");
        var nextDocNumber = "SD" + paddedNextNumber;

        console.log("생성된 다음 문서번호:", nextDocNumber);
        return nextDocNumber;
      },

      onDeliveryDayChange: function(oEvent) {
        var oDatePicker = oEvent.getSource();
        var oDate = oDatePicker.getDateValue();
        var oModel = this.getView().getModel();
        
        if (oDate) {
          // yyyy-MM-dd 형식으로 변환
          var yyyy = oDate.getFullYear();
          var mm = (oDate.getMonth() + 1).toString().padStart(2, '0');
          var dd = oDate.getDate().toString().padStart(2, '0');
          var sDate = yyyy + '-' + mm + '-' + dd;
          oModel.setProperty("/DeliveryDay", sDate);
        } else {
            oModel.setProperty("/DeliveryDay", "");
          }
      },

      onDeliveryDayInputChange: function(oEvent) {
        var sValue = oEvent.getSource().getValue().trim();
        var oModel = this.getView().getModel();
        var oValidDateModel = this.getView().getModel("validDate");
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        var oValidTo = oValidDateModel.getProperty("/validTo");

        // 납품요청일 변경 시 저장 버튼 무조건 비활성화
        this.getView().getModel().setProperty("/isContractCheckPassed", false);

        // 숫자만 허용
        if (!/^[0-9]+$/.test(sValue)) {
          sap.m.MessageToast.show("1~31 사이의 숫자만 입력하세요.");
          oEvent.getSource().setValue("");
          oModel.setProperty("/DeliveryDay", "");
            return;
          }

        var nDay = parseInt(sValue, 10);
        if (isNaN(nDay) || nDay < 1 || nDay > 31) {
          sap.m.MessageToast.show("1~31 사이의 숫자만 입력하세요.");
          oEvent.getSource().setValue("");
          oModel.setProperty("/DeliveryDay", "");
            return;
          }

        // 계약기간 내의 모든 달에 대해 입력한 day가 실제로 존재하는지 확인
        if (oValidFrom && oValidTo) {
          var dFrom = (typeof oValidFrom === "string") ? new Date(oValidFrom) : oValidFrom;
          var dTo = (typeof oValidTo === "string") ? new Date(oValidTo) : oValidTo;

          // [추가] 두 달에 걸쳐 있지만 실제로 한 번의 주문만 발생하는 경우(시작일이 1일이 아니거나, 종료일이 마지막 날이 아닌 경우)
          var isOneOrderCase = false;
          if (
            (dFrom.getFullYear() !== dTo.getFullYear() || dFrom.getMonth() !== dTo.getMonth())
          ) {
            var fromIsFirst = dFrom.getDate() === 1;
            var toIsLast = dTo.getDate() === new Date(dTo.getFullYear(), dTo.getMonth() + 1, 0).getDate();
            if (!fromIsFirst || !toIsLast) {
              isOneOrderCase = true;
            }
          }
          var diffDays = Math.floor((dTo - dFrom) / (1000 * 60 * 60 * 24));

          // [개선] 한 번의 주문만 가능한 구간이더라도, 입력한 day가 계약기간 내에 두 번 이상 존재하면 허용
          var dayCount = 0;
          if (isOneOrderCase) {
            var d = new Date(dFrom);
            while (d <= dTo) {
              if (d.getDate() === nDay) {
                dayCount++;
              }
              d.setDate(d.getDate() + 1);
            }
          }

          if (
            (
              (diffDays < 31 && (
                dFrom.getFullYear() !== dTo.getFullYear() ||
                dFrom.getMonth() !== dTo.getMonth() ||
                dFrom.getDate() !== dTo.getDate()
              )) ||
              (isOneOrderCase && dayCount < 2)
            )
          ) {
            sap.m.MessageToast.show("계약기간이 한 번의 주문만 가능한 구간입니다. 계약 시작일과 종료일을 같게 해주세요.");
            oEvent.getSource().setValue("");
            oModel.setProperty("/DeliveryDay", "");
            return;
          }

          // [추가] 계약기간이 같은 달 내에서 연속된 날짜인 경우
          if (
            dFrom.getFullYear() === dTo.getFullYear() &&
            dFrom.getMonth() === dTo.getMonth() &&
            dFrom.getDate() !== dTo.getDate()
          ) {
            var startDay = dFrom.getDate();
            var endDay = dTo.getDate();
            if (nDay < startDay || nDay > endDay) {
              sap.m.MessageToast.show(
                "계약기간(" + startDay + "일 ~ " + endDay + "일) 내의 날짜만 입력할 수 있습니다."
              );
              oEvent.getSource().setValue("");
              oModel.setProperty("/DeliveryDay", "");
              return;
            }
          }

          // [추가] 계약기간이 하루만인 경우
          if (
            dFrom.getFullYear() === dTo.getFullYear() &&
            dFrom.getMonth() === dTo.getMonth() &&
            dFrom.getDate() === dTo.getDate()
          ) {
            var onlyDay = dFrom.getDate();
            if (nDay !== onlyDay) {
              sap.m.MessageToast.show("계약기간이 하루인 경우 " + onlyDay + "일만 입력할 수 있습니다.");
              oEvent.getSource().setValue("");
              oModel.setProperty("/DeliveryDay", "");
              return;
            }
          } else {
            var yearMonthSet = new Set();
            var d = new Date(dFrom);
            while (d <= dTo) {
              yearMonthSet.add(d.getFullYear() + '-' + (d.getMonth() + 1));
              d.setMonth(d.getMonth() + 1);
              d.setDate(1);
            }
            var invalidMonth = false;
            yearMonthSet.forEach(function(ym) {
              var parts = ym.split('-');
              var year = parseInt(parts[0], 10);
              var month = parseInt(parts[1], 10);
              var lastDay = new Date(year, month, 0).getDate();
              if (nDay > lastDay) {
                invalidMonth = true;
              }
            });
            if (invalidMonth) {
              sap.m.MessageToast.show("계약기간 내의 모든 달에 해당 일자가 존재해야 합니다.");
              oEvent.getSource().setValue("");
            oModel.setProperty("/DeliveryDay", "");
              return;
          }
        }
        }

        // 정상 입력이면 모델에 저장
        oModel.setProperty("/DeliveryDay", nDay.toString());
      },

      onCheckContractAvailable: function() {
        // [1] 메인 모델(뷰 전체 데이터)와 색상별 선택 정보 모델을 가져옵니다.
        var oModel = this.getView().getModel();
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];
        var sDeliveryDay = oModel.getProperty("/DeliveryDay");
        var nDeliveryDay = parseInt(sDeliveryDay, 10);

        // [2] 전체 계약기간(시작일/종료일) 정보 가져오기
        var oValidDateModel = this.getView().getModel("validDate");
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        var oValidTo = oValidDateModel.getProperty("/validTo");

        // [3] 색상별로 필수 정보(수량, 계약기간)가 모두 입력되었는지 체크
        //    - 누락된 경우 어떤 색상에 어떤 정보가 빠졌는지 안내
        var missingItems = [];
        aSelectedColors.forEach(function(item) {
          var missingFields = [];
          if (!item.quantity) missingFields.push("수량");
          if (!item.itemValidFrom) missingFields.push("계약 시작일");
          if (!item.itemValidTo) missingFields.push("계약 종료일");
          if (missingFields.length > 0) {
            missingItems.push({ colorCode: item.colorCode, missingFields: missingFields });
          }
        });
        if (missingItems.length > 0) {
          // 누락된 정보가 있으면 메시지 표시 후 함수 종료
          this.getView().getModel().setProperty("/isContractCheckPassed", false);
          var sMessage = "다음 색상의 필수 정보가 누락되었습니다:\n";
          missingItems.forEach(function(item) {
            sMessage += "\n- " + item.colorCode + ": " + item.missingFields.join(", ");
          });
          sMessage += "\n\n선택 색상 보기 버튼을 클릭하여 누락된 정보를 입력해주세요.";
          sap.m.MessageToast.show(sMessage);
          return;
        }

        // 날짜를 yyyy-MM-dd 문자열로 변환하는 유틸리티 함수
        function toYMDstr(d) {
          if (!d) return "";
          if (typeof d === "string" && d.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          var dateObj = (typeof d === "string") ? new Date(d) : d;
          return dateObj.getFullYear() + '-' + String(dateObj.getMonth()+1).padStart(2,'0') + '-' + String(dateObj.getDate()).padStart(2,'0');
        }

        // [4] 전체 계약기간 내에 납품희망일이 한 번만 존재하는지 체크
        //    - 예: 2025-07-24 ~ 2025-08-24, 23일 입력 시 8월 23일만 포함 → 한 번만 주문 가능
        if (oValidFrom && oValidTo && sDeliveryDay) {
          var dFrom = new Date(oValidFrom);
          var dTo = new Date(oValidTo);
          var nDeliveryDay = parseInt(sDeliveryDay, 10);
          dFrom = new Date(dFrom.getFullYear(), dFrom.getMonth(), dFrom.getDate());
          dTo = new Date(dTo.getFullYear(), dTo.getMonth(), dTo.getDate());

          // === 하루짜리 계약(시작일=종료일)인 경우는 예외로 통과 ===
          if (dFrom.getTime() !== dTo.getTime()) {
            var deliveryDayCount = 0;
          var d = new Date(dFrom);
          while (d <= dTo) {
              if (d.getDate() === nDeliveryDay) deliveryDayCount++;
              d.setDate(d.getDate() + 1);
            }
            if (deliveryDayCount === 1) {
              this.getView().getModel().setProperty("/isContractCheckPassed", false);
              sap.m.MessageToast.show("전체 계약기간 내에 납품희망일이 한 번만 존재합니다. 한 건의 주문만 가능하므로, 계약기간을 수정해주세요.");
              return;
            }
          }
        }

        // [5] 계약기간 내 납품희망일이 실제로 몇 달에 존재하는지 체크
        //    - 계약기간이 두 달 이상이어도 실제로 한 달에만 존재하면 한 번만 주문 가능
        if (oValidFrom && oValidTo && sDeliveryDay) {
          var dFrom = new Date(oValidFrom);
          var dTo = new Date(oValidTo);
          var nDeliveryDay = parseInt(sDeliveryDay, 10);

          // === 하루짜리 계약(시작일=종료일)인 경우는 예외로 통과 ===
          if (dFrom.getTime() !== dTo.getTime()) {
            var monthsWithDeliveryDay = 0;
            var d = new Date(dFrom.getFullYear(), dFrom.getMonth(), 1);
            while (d <= dTo) {
              var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
              if (nDeliveryDay <= lastDay) {
                var deliveryDate = new Date(d.getFullYear(), d.getMonth(), nDeliveryDay);
                if (deliveryDate >= dFrom && deliveryDate <= dTo) {
                  monthsWithDeliveryDay++;
              }
            }
            d.setMonth(d.getMonth() + 1);
            }
            if (monthsWithDeliveryDay < 2) {
              this.getView().getModel().setProperty("/isContractCheckPassed", false);
              sap.m.MessageToast.show("계약기간 내에 납품희망일이 한 달에만 존재합니다. 한 건의 주문만 가능하므로, 계약기간을 수정해주세요.");
              return;
            }
          }
        }

        // [6] 아이템이 1개인 경우: 아이템별 계약기간이 전체 계약기간과 완전히 일치해야 함
        if (aSelectedColors.length === 1) {
          // ==========================================
          // 케이스 1: 하나의 아이템만 선택한 경우
          // ==========================================
          
          // 아이템별 계약기간이 전체 계약기간과 완전히 일치하는지만 체크
          var item = aSelectedColors[0];
          var itemFromStr = toYMDstr(item.itemValidFrom);
          var itemToStr = toYMDstr(item.itemValidTo);
          var globalFromStr = toYMDstr(oValidFrom);
          var globalToStr = toYMDstr(oValidTo);
          
          if (itemFromStr !== globalFromStr || itemToStr !== globalToStr) {
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
            sap.m.MessageToast.show("전체 계약기간과 아이템별 계약기간이 일치해야 합니다. 선택한 색상 보기 버튼을 눌러 다시 한 번 입력해주세요.");
            return;
          }
          
          // 계약기간이 일치하면 성공
          this.getView().getModel().setProperty("/isContractCheckPassed", true);
          sap.m.MessageToast.show("계약 체결이 가능한 조건입니다!");
          
        } else {
          // ==========================================
          // 케이스 2: 여러 아이템이 선택된 경우
          // ==========================================

          // [우선순위] 전체 계약기간과 모든 아이템별 계약기간이 완전히 일치(시작일=종료일=같은 날짜)하면 바로 성공 처리
          function toDateOnly(d) {
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
          }
          var dFrom = toDateOnly(new Date(oValidFrom));
          var dTo = toDateOnly(new Date(oValidTo));
          var allItemsMatch = aSelectedColors.length > 0 && aSelectedColors.every(function(item) {
            if (!item.itemValidFrom || !item.itemValidTo) return false;
            var iFrom = toDateOnly(new Date(item.itemValidFrom));
            var iTo = toDateOnly(new Date(item.itemValidTo));
            return iFrom.getTime() === iTo.getTime() && iFrom.getTime() === dFrom.getTime();
          });
          if (dFrom.getTime() === dTo.getTime() && allItemsMatch) {
            this.getView().getModel().setProperty("/isContractCheckPassed", true);
            sap.m.MessageToast.show("계약 체결이 가능한 조건입니다!");
            return;
          }

          // [2.1] 적어도 하나의 아이템이 전체 계약기간과 일치하는지 체크
          var hasItemCoveringFullPeriod = false;
          aSelectedColors.forEach(function(item) {
            var fromStr = toYMDstr(item.itemValidFrom);
            var toStr = toYMDstr(item.itemValidTo);
            var globalFromStr = toYMDstr(oValidFrom);
            var globalToStr = toYMDstr(oValidTo);
            
            if (fromStr === globalFromStr && toStr === globalToStr) {
              hasItemCoveringFullPeriod = true;
            }
          });
          
          if (!hasItemCoveringFullPeriod) {
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
            sap.m.MessageToast.show("적어도 한 개의 아이템의 계약기간이 전체 계약기간과 완전히 일치해야 합니다. 아이템별 계약기간을 다시 확인해주세요.");
            return;
          }

          // [2.2] 아이템별 계약기간이 전체 계약기간을 벗어나는지 체크
          var invalidPeriodItems = []; // 전체 계약기간을 벗어난 색상 저장 배열
          aSelectedColors.forEach(function(item) {
            var itemFrom = new Date(item.itemValidFrom); // 아이템별 시작일
            var itemTo = new Date(item.itemValidTo);     // 아이템별 종료일
            var globalFrom = new Date(oValidFrom);       // 전체 시작일
            var globalTo = new Date(oValidTo);           // 전체 종료일
            
            // 시간 정보 제거(날짜만 비교)
            itemFrom = new Date(itemFrom.getFullYear(), itemFrom.getMonth(), itemFrom.getDate());
            itemTo = new Date(itemTo.getFullYear(), itemTo.getMonth(), itemTo.getDate());
            globalFrom = new Date(globalFrom.getFullYear(), globalFrom.getMonth(), globalFrom.getDate());
            globalTo = new Date(globalTo.getFullYear(), globalTo.getMonth(), globalTo.getDate());
            
            // 시작일이 전체 시작일보다 이전이거나, 종료일이 전체 종료일보다 이후면 배열에 추가
            if (itemFrom < globalFrom || itemTo > globalTo) {
              invalidPeriodItems.push({
                colorCode: item.colorCode,
                isBefore: itemFrom < globalFrom,
                isAfter: itemTo > globalTo
              });
            }
          });
          
          // 벗어난 색상이 있으면 메시지 표시 후 함수 종료
          if (invalidPeriodItems.length > 0) {
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
            var sMessage = "다음 색상의 계약기간이 전체 계약기간을 벗어납니다:\n";
            invalidPeriodItems.forEach(function(item) {
              if (item.isBefore && item.isAfter) {
                sMessage += "\n- " + item.colorCode + ": 시작일과 종료일 모두 전체 계약기간을 벗어납니다.";
              } else if (item.isBefore) {
                sMessage += "\n- " + item.colorCode + ": 시작일이 전체 계약기간보다 이전입니다.";
              } else if (item.isAfter) {
                sMessage += "\n- " + item.colorCode + ": 종료일이 전체 계약기간보다 이후입니다.";
              }
            });
            sap.m.MessageToast.show(sMessage);
            return;
          }

          // [2.3] 전체 계약기간과 납품희망일을 고려하여 한 번의 오더만 가능한 상황 체크
          if (oValidFrom && oValidTo && sDeliveryDay) {
            var dFrom = new Date(oValidFrom); // 전체 계약 시작일
            var dTo = new Date(oValidTo);     // 전체 계약 종료일
            var nDeliveryDay = parseInt(sDeliveryDay, 10); // 납품희망일 숫자
           
            // 시간 정보 제거
            dFrom = new Date(dFrom.getFullYear(), dFrom.getMonth(), dFrom.getDate());
            dTo = new Date(dTo.getFullYear(), dTo.getMonth(), dTo.getDate());
            
            // 계약기간이 하루인 경우(시작일과 종료일이 같은 경우) 특별 처리
            if (dFrom.getTime() === dTo.getTime()) {
              // 계약기간이 하루인 경우, 납품희망일이 그 날짜와 일치하는지만 확인
              if (dFrom.getDate() !== nDeliveryDay) {
                sap.m.MessageToast.show("계약기간이 하루인 경우 납품희망일은 계약일과 같아야 합니다.");
                this.getView().getModel().setProperty("/isContractCheckPassed", false);
                return;
              }
              // 납품희망일이 계약일과 일치하면 이 검사는 통과
            } else {
              // 계약기간이 하루보다 긴 경우 기존 로직 적용
              // 시작일의 다음 달 같은 날짜 계산
              var nextMonthDate = new Date(dFrom);
              nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
           
              // 다음 달에 같은 일자가 없는 경우(예: 1월 31일, 3월 31일 등)
              if (nextMonthDate.getDate() !== dFrom.getDate()) {
                sap.m.MessageToast.show("계약기간이 한 달이 되려면 시작일과 종료일이 같은 일자여야 합니다. (예: 7월 23일부터 8월 23일까지)");
                this.getView().getModel().setProperty("/isContractCheckPassed", false);
                return;
              }
           
              // 계약기간이 한 달 미만인 경우
              if (dTo < nextMonthDate) {
                // 계약기간 내에 납품희망일이 존재하는지 확인
                var hasDeliveryDay = false;
                var d = new Date(dFrom);
                while (d <= dTo) {
                  if (d.getDate() === nDeliveryDay) {
                    hasDeliveryDay = true;
                    break;
                  }
                  d.setDate(d.getDate() + 1);
                }
             
                // 납품희망일이 존재하면 안내 메시지 표시
                if (hasDeliveryDay) {
                  sap.m.MessageToast.show("계약기간이 한 달 미만입니다. 한 건의 주문만 가능하므로, 계약기간을 희망 납품일에 맞춰 수정해주세요.");
                  this.getView().getModel().setProperty("/isContractCheckPassed", false);
                  return;
                }
              }
            }
          }

          // [2.4] 계약기간 내에 납품희망일이 한 번만 존재하는 아이템이 있는지 체크
          if (oValidFrom && oValidTo && sDeliveryDay) {
            var oneOrderColorCodes = [];
            aSelectedColors.forEach(function(item) {
              var from = item.itemValidFrom;
              var to = item.itemValidTo;
              if (from && to) {
                var dItemFrom = (typeof from === "string") ? new Date(from) : from;
                var dItemTo = (typeof to === "string") ? new Date(to) : to;
                
                dItemFrom = new Date(dItemFrom.getFullYear(), dItemFrom.getMonth(), dItemFrom.getDate());
                dItemTo = new Date(dItemTo.getFullYear(), dItemTo.getMonth(), dItemTo.getDate());
                
                // === 하루짜리 계약(시작일=종료일)인 경우는 예외로 통과 ===
                if (dItemFrom.getTime() !== dItemTo.getTime()) {
                  var count = 0;
                  var dd = new Date(dItemFrom);
                  while (dd <= dItemTo) {
                    if (dd.getDate() === nDeliveryDay) {
                      count++;
                    }
                    dd.setDate(dd.getDate() + 1);
                  }
                  if (count === 1) {
                    oneOrderColorCodes.push(item.colorCode);
                  }
                }
              }
            });
            
            if (oneOrderColorCodes.length > 0) {
              sap.m.MessageToast.show("다음 색상(들)의 계약기간 내에 납품희망일이 한 번만 존재합니다: " + oneOrderColorCodes.join(", ") + "\n한 건의 주문만 가능하므로, 계약기간을 희망 납품일과 동일하게 설정해주세요.");
              this.getView().getModel().setProperty("/isContractCheckPassed", false);
              return;
            }
          }

          // [2.5] 납품희망일이 계약기간의 모든 달에 존재하는지 체크
        var hasValidDeliveryDay = true;
          var invalidItems = [];
        aSelectedColors.forEach(function(item) {
          var from = item.itemValidFrom;
          var to = item.itemValidTo;
          if (from && to) {
            var dFrom = (typeof from === "string") ? new Date(from) : from;
            var dTo = (typeof to === "string") ? new Date(to) : to;
            
            // 계약기간 내의 모든 날짜를 체크
            var d = new Date(dFrom);
            var found = false;
            while (d <= dTo) {
              if (d.getDate() === nDeliveryDay) {
                found = true;
                break;
              }
              d.setDate(d.getDate() + 1);
            }
            
            if (!found) {
              hasValidDeliveryDay = false;
                invalidItems.push(item.colorCode);
            }
          }
        });
        
        if (!hasValidDeliveryDay) {
          this.getView().getModel().setProperty("/isContractCheckPassed", false);
            sap.m.MessageToast.show("다음 색상의 계약기간 내에 선택한 납품 희망일이 존재하지 않습니다: " + invalidItems.join(", ") + ". 아이템별 계약기간을 다시 확인해주세요.");
          return;
        }

          // [2.6] 희망 납품일이 아이템별 계약기간 내에서 두 번 이상 발생할 수 있는지 체크
        var hasItemWithTwoOrders = false;
        aSelectedColors.forEach(function(item) {
          var from = item.itemValidFrom;
          var to = item.itemValidTo;
          if (from && to) {
            var dFrom = (typeof from === "string") ? new Date(from) : from;
            var dTo = (typeof to === "string") ? new Date(to) : to;
            var count = 0;
            var d = new Date(dFrom);
            while (d <= dTo) {
              if (d.getDate() === nDeliveryDay) {
                count++;
              }
              d.setDate(d.getDate() + 1);
            }
            if (count >= 2) {
              hasItemWithTwoOrders = true;
            }
          }
        });
          
        if (!hasItemWithTwoOrders) {
          this.getView().getModel().setProperty("/isContractCheckPassed", false);
          sap.m.MessageToast.show("선택한 희망 납품일이 아이템별 계약기간 내에서 두 번 이상 발생할 수 있도록 아이템별 계약기간을 다시 확인해주세요.");
          return;
        }

          // [2.7] 계약기간 내에 납품희망일이 한 번만 존재하는지 체크
          if (oValidFrom && oValidTo && sDeliveryDay) {
            var dFrom = new Date(oValidFrom);
            var dTo = new Date(oValidTo);
            var nDeliveryDay = parseInt(sDeliveryDay, 10);
            
            dFrom = new Date(dFrom.getFullYear(), dFrom.getMonth(), dFrom.getDate());
            dTo = new Date(dTo.getFullYear(), dTo.getMonth(), dTo.getDate());

            var deliveryDayCount = 0;
            var d = new Date(dFrom);
            while (d <= dTo) {
              if (d.getDate() === nDeliveryDay) {
                deliveryDayCount++;
              }
              d.setDate(d.getDate() + 1);
            }

            if (deliveryDayCount === 1) {
              sap.m.MessageToast.show("계약기간 내에 납품희망일이 한 번만 존재합니다. 한 건의 주문만 가능하므로, 계약기간을 희망 납품일과 동일하게 설정해주세요.");
          this.getView().getModel().setProperty("/isContractCheckPassed", false);
          return;
            }
        }
        
          // 모든 검사를 통과하면 계약 체결 가능
        this.getView().getModel().setProperty("/isContractCheckPassed", true);
        sap.m.MessageToast.show("계약 체결이 가능한 조건입니다!");
        }

        // 날짜 비교를 위한 유틸리티 함수
        function toDateOnly(d) {
          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }

        // [NEW] 전체/아이템별 계약기간이 모두 하루짜리인지 체크 (가장 먼저 분기)
        if (oValidFrom && oValidTo && sDeliveryDay) {
          var dFrom = toDateOnly(new Date(oValidFrom));
          var dTo = toDateOnly(new Date(oValidTo));
          var allItemsMatch = aSelectedColors.length > 0 && aSelectedColors.every(function(item) {
            if (!item.itemValidFrom || !item.itemValidTo) return false;
            var iFrom = toDateOnly(new Date(item.itemValidFrom));
            var iTo = toDateOnly(new Date(item.itemValidTo));
            return iFrom.getTime() === iTo.getTime() && iFrom.getTime() === dFrom.getTime();
          });
          if (dFrom.getTime() === dTo.getTime() && allItemsMatch) {
            this.getView().getModel().setProperty("/isContractCheckPassed", true);
            sap.m.MessageToast.show("계약 체결이 가능한 조건입니다!");
            return;
          }
        }

        // [추가] 아이템별 계약기간을 Date 객체로 변환해서 모델에 저장
        var changed = false;
        aSelectedColors.forEach(function(item) {
          if (item.itemValidFrom && typeof item.itemValidFrom === "string") {
            var d = new Date(item.itemValidFrom);
            if (d instanceof Date && !isNaN(d.getTime())) {
              item.itemValidFrom = d;
              changed = true;
            }
          }
          if (item.itemValidTo && typeof item.itemValidTo === "string") {
            var d = new Date(item.itemValidTo);
            if (d instanceof Date && !isNaN(d.getTime())) {
              item.itemValidTo = d;
              changed = true;
            }
          }
        });
        if (changed) {
          oColorsModel.setProperty("/selectedColors", aSelectedColors);
        }
      },

      // 아이템별 계약 시작일 변경 처리
      onItemValidFromChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();
        var oColorsModel = this.getView().getModel("colors");
        var oValidDateModel = this.getView().getModel("validDate");
        var oGlobalValidFrom = oValidDateModel.getProperty("/validFrom");
        var oGlobalValidTo = oValidDateModel.getProperty("/validTo");

        function toDateOnly(d) {
          var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          date.setHours(0,0,0,0);
          return date;
        }

        function formatDateToYYYYMMDD(date) {
          if (!date) return null;
          var year = date.getFullYear();
          var month = String(date.getMonth() + 1).padStart(2, '0');
          var day = String(date.getDate()).padStart(2, '0');
          return year + '-' + month + '-' + day;
        }

        // yyyy-mm-dd 형식 허용
        if (typeof oDate === 'string') {
          // yyyy-mm-dd 형식만 허용
          if (/^\d{4}-\d{2}-\d{2}$/.test(oDate)) {
            oDate = new Date(oDate);
          } else {
            sap.m.MessageToast.show("유효하지 않은 날짜입니다. 다시 입력해주세요.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidFrom", null);
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
            return;
          }
        }

        if (!(oDate instanceof Date) || isNaN(oDate.getTime())) {
          sap.m.MessageToast.show("유효하지 않은 날짜입니다. 다시 입력해주세요.");
          oSource.setValue(null);
          oColorsModel.setProperty(sPath + "/itemValidFrom", null);
          this.getView().getModel().setProperty("/isContractCheckPassed", false);
          return;
        }

        // 날짜만 남기고 시간 00:00:00으로 고정
        oDate = toDateOnly(oDate);

        // [기존 로직]
        if (oDate) {
          if (oDate < oGlobalValidFrom) {
            sap.m.MessageToast.show("아이템별 계약 시작일은 전체 계약기간 내에 있어야 합니다.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidFrom", null);
            return;
          }
        }

        // yyyy-MM-dd 형식으로 변환하여 저장
        var formattedDate = formatDateToYYYYMMDD(oDate);
        oColorsModel.setProperty(sPath + "/itemValidFrom", formattedDate);
        this.getView().getModel().setProperty("/isContractCheckPassed", false);
      },

      // 아이템별 계약 종료일 변경 처리
      onItemValidToChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();
        var oColorsModel = this.getView().getModel("colors");
        var oValidDateModel = this.getView().getModel("validDate");
        var oGlobalValidFrom = oValidDateModel.getProperty("/validFrom");
        var oGlobalValidTo = oValidDateModel.getProperty("/validTo");

        function toDateOnly(d) {
          var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          date.setHours(0,0,0,0);
          return date;
        }

        function formatDateToYYYYMMDD(date) {
          if (!date) return null;
          var year = date.getFullYear();
          var month = String(date.getMonth() + 1).padStart(2, '0');
          var day = String(date.getDate()).padStart(2, '0');
          return year + '-' + month + '-' + day;
        }

        // yyyy-mm-dd 형식 허용
        if (typeof oDate === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(oDate)) {
            oDate = new Date(oDate);
          } else {
            sap.m.MessageToast.show("유효하지 않은 날짜입니다. 다시 입력해주세요.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidTo", null);
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
            return;
          }
        }

        if (!(oDate instanceof Date) || isNaN(oDate.getTime())) {
          sap.m.MessageToast.show("유효하지 않은 날짜입니다. 다시 입력해주세요.");
          oSource.setValue(null);
          oColorsModel.setProperty(sPath + "/itemValidTo", null);
          this.getView().getModel().setProperty("/isContractCheckPassed", false);
          return;
        }

        // 날짜만 남기고 시간 00:00:00으로 고정
        oDate = toDateOnly(oDate);

        // [기존 로직]
        if (oDate) {
          try {
            if (oDate < toDateOnly(oGlobalValidFrom)) {
              sap.m.MessageToast.show("아이템별 계약 종료일은 전체 계약기간 내에 있어야 합니다.");
              oSource.setValue(null);
              oColorsModel.setProperty(sPath + "/itemValidTo", null);
              return;
            }
            if (oDate > toDateOnly(oGlobalValidTo)) {
              sap.m.MessageToast.show("아이템별 계약 종료일은 전체 계약기간을 벗어날 수 없습니다.");
              oSource.setValue(null);
              oColorsModel.setProperty(sPath + "/itemValidTo", null);
              return;
            }
            var oItemValidFrom = oColorsModel.getProperty(sPath + "/itemValidFrom");
            if (oItemValidFrom) {
              if (typeof oItemValidFrom === 'string') {
                oItemValidFrom = new Date(oItemValidFrom);
              }
              oItemValidFrom = toDateOnly(oItemValidFrom);
              if (oDate < oItemValidFrom) {
                sap.m.MessageToast.show("아이템별 계약 종료일은 시작일보다 이후여야 합니다.");
                oSource.setValue(null);
                oColorsModel.setProperty(sPath + "/itemValidTo", null);
                return;
              }
              if (oDate.getTime() === oItemValidFrom.getTime()) {
                var formattedDate = formatDateToYYYYMMDD(oDate);
                oColorsModel.setProperty(sPath + "/itemValidTo", formattedDate);
                this.getView().getModel().setProperty("/isContractCheckPassed", false);
                return;
              }
              var startDate = oItemValidFrom;
              var endDate = oDate;
              var nextMonthDate = new Date(startDate);
              nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
              if (nextMonthDate.getDate() !== startDate.getDate()) {
                sap.m.MessageToast.show("계약기간이 한 달이 되려면 시작일과 종료일이 같은 일자여야 합니다. (예: 7월 23일부터 8월 23일까지)");
                oSource.setValue(null);
                oColorsModel.setProperty(sPath + "/itemValidTo", null);
                return;
              }
              if (endDate < nextMonthDate) {
                sap.m.MessageToast.show("계약기간이 한 달 미만입니다. 한 건의 주문만 가능하므로, 계약기간을 납품일과 동일하게 설정해주세요.");
                oSource.setValue(null);
                oColorsModel.setProperty(sPath + "/itemValidTo", null);
                return;
              }
            }
            // yyyy-MM-dd 형식으로 변환하여 저장
            var formattedDate = formatDateToYYYYMMDD(oDate);
            oColorsModel.setProperty(sPath + "/itemValidTo", formattedDate);
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
          } catch (error) {
            sap.m.MessageToast.show("유효하지 않은 날짜입니다. 다시 입력해주세요.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidTo", null);
            this.getView().getModel().setProperty("/isContractCheckPassed", false);
          }
        } else {
          oColorsModel.setProperty(sPath + "/itemValidTo", null);
          this.getView().getModel().setProperty("/isContractCheckPassed", false);
        }
      },

      /**
       * 문의 기반 계약 주문 프로세스 안내 다이얼로그 오픈
       */
      onOpenContractGuideDialog: function() {
        if (!this._oContractGuideDialog) {
          this._oContractGuideDialog = sap.ui.xmlfragment(
            "sync.dc.sd.project02.view.ContractGuideDialog",
            this
          );
          this.getView().addDependent(this._oContractGuideDialog);
        }
        this._oContractGuideDialog.open();
      },

      /**
       * 문의 기반 계약 주문 프로세스 안내 다이얼로그 닫기
       */
      onCloseContractGuideDialog: function() {
        if (this._oContractGuideDialog) {
          this._oContractGuideDialog.close();
        }
      },
    });
  }
);