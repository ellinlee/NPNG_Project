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
                
                return {
                  MatID: item.MatId,
                  MatName: item.MatNm,
                  category: item.MatTy,
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
        var oColorsModel = this.getView().getModel("colors");
        var aSelectedColors = oColorsModel.getProperty("/selectedColors") || [];

        if (aSelectedColors.length === 0) {
          sap.m.MessageToast.show("선택된 색상이 없습니다.");
          return;
        }

        // 인덱스 정보 추가 및 타임스탬프 포맷팅
        aSelectedColors.forEach(
          function (color, index) {
            color.index = index;
            color.formattedTimestamp = this._formatTimestamp(color.timestamp);
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

        // 납품 희망일 유효성 검사
        var sDeliveryDay = oModel.getProperty("/DeliveryDay");
        if (sDeliveryDay) {
          var aDays = sDeliveryDay.split(",").map(function(day) {
            return day.trim();
          });
          var isValid = aDays.every(function(day) {
            var n = Number(day);
            return (
              /^\d+$/.test(day) && // 정수
              n >= 1 && n <= 31 && // 1~31
              Number.isInteger(n)
            );
          });
          var hasDuplicate = (new Set(aDays)).size !== aDays.length;
          if (!isValid || hasDuplicate) {
            sap.m.MessageToast.show("납품 희망일은 1~31 사이의 정수만, 중복 없이 입력하세요.");
            try {
              this.byId("input_deliveryDay").setValue("");
            } catch (e) {
              oModel.setProperty("/DeliveryDay", "");
            }
            return;
          }
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

        // 저장 확인 다이얼로그 열기
        this._openSaveConfirmDialog();
      },

      /**
       * 저장 확인 다이얼로그를 엽니다.
       * @private
       */
      _openSaveConfirmDialog: function () {
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
      onCancelSave: function () {
        // 다이얼로그 닫기
        this._oSaveConfirmDialog.close();
      },

      /**
       * 저장 확인 다이얼로그에서 저장 버튼 클릭 시
       */
      onConfirmSave: function () {
        var that = this;
        var oModel = this.getView().getModel();
        var oColorsModel = this.getView().getModel("colors");

        // 저장에 필요한 데이터 복사
        var sCustomerRequest = oModel.getProperty("/CustomerRequest");
        var aSelectedColors = JSON.parse(
          JSON.stringify(oColorsModel.getProperty("/selectedColors"))
        );
        var sCustomerId = oModel.getProperty("/SelectedCustomer/CustomerID");
        var sCustomerName = oModel.getProperty(
          "/SelectedCustomer/CustomerName"
        );

        // 디버깅: 저장 전 색상 정보 확인
        console.log("저장 전 색상 정보:", aSelectedColors);
        console.log(
          "색상별 material ID 확인:",
          aSelectedColors.map(function (color) {
            return {
              colorCode: color.colorCode,
              materialId: color.materialId || "없음",
              description: color.description || "없음",
            };
          })
        );

        // 다이얼로그 닫기
        this._oSaveConfirmDialog.close();

        // UI 초기화 실행
        this._resetAfterSave();

        // 전체 계약 기간 초기화
        var oValidDateModel = this.getView().getModel("validDate");
        oValidDateModel.setProperty("/validFrom", null);
        oValidDateModel.setProperty("/validTo", null);

        // 선택된 색상이 없는 경우 처리
        if (!aSelectedColors || aSelectedColors.length === 0) {
          sap.m.MessageToast.show(
            "선택된 색상이 없습니다. 색상을 선택한 후 저장해주세요."
          );
          return;
        }

        // materialId가 있는 색상이 하나라도 있는지 확인
        var aValidItems = aSelectedColors.filter(function (item) {
          return item.materialId; // materialId가 있는 항목
        });

        // 요청사항과 선택된 색상 정보를 저장할 데이터 객체
        var oData = {
          customerRequest: sCustomerRequest, // 복사한 고객 요청사항 사용
          selectedColors: aSelectedColors, // 복사한 선택된 색상 사용
          customerId: sCustomerId,
          customerName: sCustomerName,
          timestamp: new Date().toISOString(),
        };

        // ZDCT_SD040에서 최신 문서번호 가져오기
        this._getLatestDocumentNumber()
          .then(function (sDocumentNumber) {
            // 다음 문서번호 생성
            var newDocNumber =
              that._generateNextDocumentNumber(sDocumentNumber);

            // material ID 연결된 색상이 없는 경우, 저장 시늉만 하고 UI는 초기화
            if (aValidItems.length === 0) {
              sap.m.MessageToast.show(
                "문의서 " + newDocNumber + " 저장되었습니다."
              );
              return;
            }

            // 저장할 문서 번호 기억
            that._documentNumber = newDocNumber;

            // 비지 인디케이터 표시 - 저장 중임을 알림
            that.getView().setBusy(true);

            // 데이터 저장 처리 - 메시지는 모든 아이템이 저장된 후에만 표시
            that._saveDataToBackend(oData, newDocNumber);
          })
          .catch(function (error) {
            sap.m.MessageToast.show(
              "문서 번호 생성 중 오류가 발생했습니다: " + error
            );
          });
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
          // 모든 항목을 가져와서 JavaScript에서 직접 최대 문서번호 찾기
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
            },
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
        console.log(
          "추출된 숫자 부분:",
          numericPart,
          "현재 번호:",
          currentNumber
        );

        // 단순히 1 증가
        var nextNumber = currentNumber + 1;
        console.log("다음 번호:", nextNumber);

        // 원래 자릿수 유지
        var paddedNextNumber = nextNumber
          .toString()
          .padStart(numericPart.length, "0");
        var nextDocNumber = "SD" + paddedNextNumber;

        console.log("생성된 다음 문서번호:", nextDocNumber);
        return nextDocNumber;
      },

      /**
       * 백엔드에 데이터 저장
       * @private
       */
      _saveDataToBackend: function (oData, sDocumentNumber) {
        var that = this;
        console.log("저장할 데이터:", oData);
        console.log("문서번호:", sDocumentNumber);

        // 저장에 사용할 선택된 색상 정보 저장 (초기화 후에도 사용하기 위함)
        var aSelectedColors = oData.selectedColors;

        // OData 모델 가져오기
        var oModel = this.getOwnerComponent().getModel();

        if (!oModel) {
          console.error("OData 모델이 없습니다.");
          sap.m.MessageToast.show(
            "데이터를 저장할 수 없습니다: OData 모델을 찾을 수 없습니다."
          );
          return;
        }

        // 뷰가 이미 busy 상태가 아니라면 설정
        if (!this.getView().getBusy()) {
          this.getView().setBusy(true);
        }

        // 현재 날짜와 시간
        var oNow = new Date();

        // 유효기간 가져오기
        var oValidDateModel = this.getView().getModel("validDate");
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        var oValidTo = oValidDateModel.getProperty("/validTo");

        // 1. 헤더 데이터 생성
        var oHeaderData = {
          InqrDocuId: sDocumentNumber,
          CustId: oData.customerId,
          SalesOrg: "S100",
          DistCha: "10",
          Division: "10",
          ValidFrom: this._formatSAPDate(oValidFrom),
          ValidTo: this._formatSAPDate(oValidTo),
          Descr: oData.customerRequest,
          CreatedBy: "", // 현재 SAP 사용자 또는 시스템 ID
          CreatedDate: this._formatSAPDate(oNow), // 현재 날짜 - SAP 형식으로 변환
          CreatedTime: this._formatTime(oNow), // 현재 시간
          ChangedBy: "", // 현재 SAP 사용자 또는 시스템 ID
          ChangedDate: this._formatSAPDate(oNow), // 현재 날짜 - SAP 형식으로 변환
          ChangedTime: this._formatTime(oNow), // 현재 시간
        };

        // 고객 ID에 따라 SalesOrg, DistCha, Division 설정
        switch (oData.customerId) {
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
          success: function () {
            console.log("헤더 데이터 저장 성공");

            // 3. 아이템 데이터 저장 - 성공 메시지는 아이템 저장 후에 표시
            that._saveItemData(
              sDocumentNumber,
              aSelectedColors,
              oData.customerRequest
            );
          },
          error: function (oError) {
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
          },
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
        return "/Date(" + oDate.getTime() + ")/";
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

          return {
            InqrDocuId: sDocumentNumber,
            InqrItemId: ((iIndex + 1) * 10).toString().padStart(6, "0"),
            MatId: oMaterial.MatID,
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
      },

      // 요청사항 초기화
      onResetCustomerRequest: function () {
        // 입력 필드 초기화
        var oInput = this.byId("select_TextArea_request");
        oInput.setValue("");

        // 모델 초기화
        var oModel = this.getView().getModel("view");
        oModel.setProperty("/customerRequest", "");

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

        sap.m.MessageToast.show("요청사항과 선택된 색상이 초기화되었습니다.");
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
      },

      // 색상별 설명 변경 처리
      onColorDescriptionChange: function (oEvent) {
        var sValue = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();

        // 해당 색상 항목의 description 속성 업데이트
        var oColorsModel = this.getView().getModel("colors");
        oColorsModel.setProperty(sPath + "/description", sValue);
      },

      // 유효기간 시작일 변경 처리
      onValidFromChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oValidDateModel = this.getView().getModel("validDate");
        
        // 현재 날짜
        var oCurrentDate = new Date();
        oCurrentDate.setHours(0, 0, 0, 0);
        
        // 최소 시작일 계산 (현재로부터 2개월 후)
        var oMinDate = new Date();
        oMinDate.setMonth(oMinDate.getMonth() + 2);
        oMinDate.setHours(0, 0, 0, 0);
        
        if (oDate) {
          // Date 객체로 변환
          if (typeof oDate === 'string') {
            oDate = new Date(oDate);
          }
          
          // 날짜 비교를 위해 시간 정보 제거
          oDate = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
          
          // 과거 날짜 체크
          if (oDate < oCurrentDate) {
            sap.m.MessageToast.show("과거 날짜는 입력할 수 없습니다.");
            oEvent.getSource().setValue(null);
            oValidDateModel.setProperty("/validFrom", null);
            return;
          }
          
          // 2개월 이후 체크
          if (oDate < oMinDate) {
            sap.m.MessageToast.show("계약 시작일은 최소 2개월 이후로 설정해야 합니다.");
            oEvent.getSource().setValue(null);
            oValidDateModel.setProperty("/validFrom", null);
            return;
          }
        }
        
        oValidDateModel.setProperty("/validFrom", oDate);
        
        // 종료일이 시작일보다 이전이면 종료일 초기화
        var oValidTo = oValidDateModel.getProperty("/validTo");
        if (oValidTo) {
          if (typeof oValidTo === 'string') {
            oValidTo = new Date(oValidTo);
          }
          oValidTo = new Date(oValidTo.getFullYear(), oValidTo.getMonth(), oValidTo.getDate());
          
          if (oValidTo < oDate) {
            this.byId("select_DatePicker_validTo_new").setValue(null);
            oValidDateModel.setProperty("/validTo", null);
          }
        }
      },

      // 유효기간 종료일 변경 처리
      onValidToChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oValidDateModel = this.getView().getModel("validDate");
        var oValidFrom = oValidDateModel.getProperty("/validFrom");
        
        // 현재 날짜
        var oCurrentDate = new Date();
        oCurrentDate.setHours(0, 0, 0, 0);
        
        if (oDate) {
          // Date 객체로 변환
          if (typeof oDate === 'string') {
            oDate = new Date(oDate);
          }
          
          // 날짜 비교를 위해 시간 정보 제거
          oDate = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
          
          // 과거 날짜 체크
          if (oDate < oCurrentDate) {
            sap.m.MessageToast.show("과거 날짜는 입력할 수 없습니다.");
            oEvent.getSource().setValue(null);
            oValidDateModel.setProperty("/validTo", null);
            return;
          }
          
          if (oValidFrom) {
            if (typeof oValidFrom === 'string') {
              oValidFrom = new Date(oValidFrom);
            }
            oValidFrom = new Date(oValidFrom.getFullYear(), oValidFrom.getMonth(), oValidFrom.getDate());
            
            if (oDate < oValidFrom) {
              sap.m.MessageToast.show("계약 종료일은 시작일보다 이후여야 합니다.");
              oEvent.getSource().setValue(null);
              oValidDateModel.setProperty("/validTo", null);
              return;
            }
          }
        }
        
        oValidDateModel.setProperty("/validTo", oDate);
      },

      // 아이템별 계약 시작일 변경 처리
      onItemValidFromChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();
        var oColorsModel = this.getView().getModel("colors");
        var oValidDateModel = this.getView().getModel("validDate");
        
        // 전체 계약 기간 체크
        var oGlobalValidFrom = oValidDateModel.getProperty("/validFrom");
        var oGlobalValidTo = oValidDateModel.getProperty("/validTo");
        
        if (!oGlobalValidFrom || !oGlobalValidTo) {
          sap.m.MessageToast.show("먼저 전체 계약 기간을 입력해주세요.");
          oSource.setValue(null);
          oColorsModel.setProperty(sPath + "/itemValidFrom", null);
          return;
        }
        
        // 현재 날짜
        var oCurrentDate = new Date();
        oCurrentDate.setHours(0, 0, 0, 0);
        
        if (oDate) {
          // DatePicker에서 value는 Date 객체로 들어옴, 혹시 문자열이면 변환
          if (typeof oDate === 'string') {
            oDate = new Date(oDate);
          }
          if (!(oDate instanceof Date) || isNaN(oDate)) {
            oColorsModel.setProperty(sPath + "/itemValidFrom", null);
            return;
          }
          // 날짜 비교를 위해 시간 정보 제거
          oDate = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
          // 과거 날짜 체크
          if (oDate < oCurrentDate) {
            sap.m.MessageToast.show("과거 날짜는 입력할 수 없습니다.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidFrom", null);
            return;
          }
          // 전체 계약 기간 체크
          if (oDate < oGlobalValidFrom || oDate > oGlobalValidTo) {
            sap.m.MessageToast.show("아이템 계약 시작일은 전체 계약 기간 내에 있어야 합니다.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidFrom", null);
            return;
          }
          // 종료일이 시작일보다 이전이면 종료일 초기화
          var oItemValidTo = oColorsModel.getProperty(sPath + "/itemValidTo");
          if (oItemValidTo) {
            if (typeof oItemValidTo === 'string') {
              oItemValidTo = new Date(oItemValidTo);
            }
            oItemValidTo = new Date(oItemValidTo.getFullYear(), oItemValidTo.getMonth(), oItemValidTo.getDate());
            if (oItemValidTo < oDate) {
              oColorsModel.setProperty(sPath + "/itemValidTo", null);
            }
          }
        }
        // 반드시 Date 객체로 저장
        oColorsModel.setProperty(sPath + "/itemValidFrom", oDate instanceof Date ? oDate : null);
      },

      // 아이템별 계약 종료일 변경 처리
      onItemValidToChange: function(oEvent) {
        var oDate = oEvent.getParameter("value");
        var oSource = oEvent.getSource();
        var sPath = oSource.getBindingContext("colors").getPath();
        var oColorsModel = this.getView().getModel("colors");
        var oValidDateModel = this.getView().getModel("validDate");
        
        // 전체 계약 기간 체크
        var oGlobalValidFrom = oValidDateModel.getProperty("/validFrom");
        var oGlobalValidTo = oValidDateModel.getProperty("/validTo");
        
        if (!oGlobalValidFrom || !oGlobalValidTo) {
          sap.m.MessageToast.show("먼저 전체 계약 기간을 입력해주세요.");
          oSource.setValue(null);
          oColorsModel.setProperty(sPath + "/itemValidTo", null);
          return;
        }
        
        // 현재 날짜
        var oCurrentDate = new Date();
        oCurrentDate.setHours(0, 0, 0, 0);
        
        if (oDate) {
          // DatePicker에서 value는 Date 객체로 들어옴, 혹시 문자열이면 변환
          if (typeof oDate === 'string') {
            oDate = new Date(oDate);
          }
          if (!(oDate instanceof Date) || isNaN(oDate)) {
            oColorsModel.setProperty(sPath + "/itemValidTo", null);
            return;
          }
          // 날짜 비교를 위해 시간 정보 제거
          oDate = new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
          // 과거 날짜 체크
          if (oDate < oCurrentDate) {
            sap.m.MessageToast.show("과거 날짜는 입력할 수 없습니다.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidTo", null);
            return;
          }
          // 전체 계약 기간 체크
          if (oDate < oGlobalValidFrom || oDate > oGlobalValidTo) {
            sap.m.MessageToast.show("아이템 계약 종료일은 전체 계약 기간 내에 있어야 합니다.");
            oSource.setValue(null);
            oColorsModel.setProperty(sPath + "/itemValidTo", null);
            return;
          }
          // 시작일 체크
          var oItemValidFrom = oColorsModel.getProperty(sPath + "/itemValidFrom");
          if (oItemValidFrom) {
            if (typeof oItemValidFrom === 'string') {
              oItemValidFrom = new Date(oItemValidFrom);
            }
            oItemValidFrom = new Date(oItemValidFrom.getFullYear(), oItemValidFrom.getMonth(), oItemValidFrom.getDate());
            if (oDate < oItemValidFrom) {
              sap.m.MessageToast.show("계약 종료일은 시작일보다 이후여야 합니다.");
              oSource.setValue(null);
              oColorsModel.setProperty(sPath + "/itemValidTo", null);
              return;
            }
          }
        }
        // 반드시 Date 객체로 저장
        oColorsModel.setProperty(sPath + "/itemValidTo", oDate instanceof Date ? oDate : null);
      },

      onDeliveryDayChange: function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oInput = oEvent.getSource();
        var oModel = this.getView().getModel();

        if (sValue) {
          var aDays = sValue.split(",").map(function(day) {
            return day.trim();
          });
          var isValid = aDays.every(function(day) {
            var n = Number(day);
            return (
              /^\d+$/.test(day) && // 정수
              n >= 1 && n <= 31 && // 1~31
              Number.isInteger(n)
            );
          });
          var hasDuplicate = (new Set(aDays)).size !== aDays.length;
          if (!isValid || hasDuplicate) {
            sap.m.MessageToast.show("납품 희망일은 1~31 사이의 정수만, 중복 없이 입력하세요.");
            oInput.setValue("");
            oModel.setProperty("/DeliveryDay", "");
          }
        }
      },
    });
  }
);
