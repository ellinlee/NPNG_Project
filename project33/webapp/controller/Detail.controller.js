sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
  ],
  (Controller, Filter, FilterOperator, History, Fragment) => {
    "use strict";

    return Controller.extend("sync.dc.pp.project33.controller.Detail", {
      onInit() {
        this.oViewModel = new sap.ui.model.json.JSONModel({ customerName: "" });
        this.getView().setModel(this.oViewModel, "view");

        // ProcessFlow 컨트롤 인스턴스 저장
        this.oProcessFlow = this.byId("processflow2");

        this.oRouter = this.getOwnerComponent().getRouter();
        this.oRouter
          .getRoute("RouteDetail")
          .attachPatternMatched(this._onPatternMatched, this);

        var oPf2Model = new sap.ui.model.json.JSONModel({
          nodes: [
            {
              id: "1",
              lane: "0",
              title: "고객주문",
              // state: "Positive",
              // stateText: "접수완료",
              state: "Planned",
              stateText: "미수립",
              children: ["2"],
              texts: ["고객이 요청한 제품 주문 접수 현황"],
              focused: true,
            },
            {
              id: "2",
              lane: "1",
              title: "생산운영계획",
              state: "Planned",
              stateText: "미수립",
              children: ["3"],
              texts: ["고객 주문을 기반으로 한 생산 일정 계획"],
            },
            {
              id: "3",
              lane: "2",
              title: "계획주문",
              state: "Planned",
              stateText: "미생성",
              children: ["4"],
              texts: ["수립된 계획에 따른 내부 계획 주문 생성"],
            },
            {
              id: "4",
              lane: "3",
              title: "생산오더",
              state: "Planned",
              stateText: "미생성",
              children: ["5"],
              texts: ["작업 지시가 내려진 실질적인 생산 오더"],
            },
            {
              id: "5",
              lane: "4",
              title: "납품",
              state: "Planned",
              stateText: "출고 전",
              texts: ["생산 완료 후 고객에게 납품되는 단계"],
            },
          ],
          lanes: [
            {
              id: "0",
              icon: "sap-icon://sales-order",
              label: "고객주문",
              position: 0,
              state: [
                {
                  // state: "Positive",
                  // value: 100,
                  state: "Planned",
                  value: 100,
                },
              ],
            },
            {
              id: "1",
              icon: "sap-icon://activity-items",
              label: "생산계획",
              position: 1,
              state: [
                {
                  state: "Planned",
                  value: 100,
                },
              ],
            },
            {
              id: "2",
              icon: "sap-icon://create-form",
              label: "계획주문",
              position: 2,
              state: [
                {
                  state: "Planned",
                  value: 100,
                },
              ],
            },
            {
              id: "3",
              icon: "sap-icon://factory",
              label: "생산오더",
              position: 3,
              state: [
                {
                  state: "Planned",
                  value: 100,
                },
              ],
            },
            {
              id: "4",
              icon: "sap-icon://outbox",
              label: "출고상태",
              position: 4,
              state: [
                {
                  state: "Planned",
                  value: 100,
                },
              ],
            },
          ],
        });

        this.getView().setModel(oPf2Model, "pf2");
      },

      _onPatternMatched: function (oEvent) {
        // SearchField 값 초기화
        var oSearchField = this.byId("orderSearchField");
        if (oSearchField) {
          oSearchField.setValue("");
        }

        // pf2 모델 초기화 (onInit과 동일)
        var oPf2Model = this.getView().getModel("pf2");
        if (oPf2Model) {
          oPf2Model.setData({
            nodes: [
              {
                id: "1",
                lane: "0",
                title: "고객주문",
                state: "Positive",
                stateText: "접수완료",
                children: ["2"],
                texts: ["고객이 요청한 제품 주문 접수 현황"],
                focused: true,
              },
              {
                id: "2",
                lane: "1",
                title: "생산운영계획",
                state: "Planned",
                stateText: "미수립",
                children: ["3"],
                texts: ["고객 주문을 기반으로 한 생산 일정 계획"],
              },
              {
                id: "3",
                lane: "2",
                title: "계획주문",
                state: "Planned",
                stateText: "미생성",
                children: ["4"],
                texts: ["수립된 계획에 따른 내부 계획 주문 생성"],
              },
              {
                id: "4",
                lane: "3",
                title: "생산오더",
                state: "Planned",
                stateText: "미생성",
                children: ["5"],
                texts: ["작업 지시가 내려진 실질적인 생산 오더"],
              },
              {
                id: "5",
                lane: "4",
                title: "납품",
                state: "Planned",
                stateText: "출고 전",
                texts: ["생산 완료 후 고객에게 납품되는 단계"],
              },
            ],
            lanes: [
              {
                id: "0",
                icon: "sap-icon://sales-order",
                label: "고객주문",
                position: 0,
                state: [
                  {
                    state: "Positive",
                    value: 100,
                  },
                ],
              },
              {
                id: "1",
                icon: "sap-icon://activity-items",
                label: "생산계획",
                position: 1,
                state: [
                  {
                    state: "Planned",
                    value: 100,
                  },
                ],
              },
              {
                id: "2",
                icon: "sap-icon://create-form",
                label: "계획주문",
                position: 2,
                state: [
                  {
                    state: "Planned",
                    value: 100,
                  },
                ],
              },
              {
                id: "3",
                icon: "sap-icon://factory",
                label: "생산오더",
                position: 3,
                state: [
                  {
                    state: "Planned",
                    value: 100,
                  },
                ],
              },
              {
                id: "4",
                icon: "sap-icon://outbox",
                label: "출고상태",
                position: 4,
                state: [
                  {
                    state: "Planned",
                    value: 100,
                  },
                ],
              },
            ],
          });
        }

        // 선택된 주문, 테이블 초기화
        this.getView().setModel(
          new sap.ui.model.json.JSONModel({ items: [] }),
          "selectedOrder"
        );
        this.getView().getModel("view").setProperty("/customerName", "");

        // URL에서 customerId를 가져옴
        var sCustId = oEvent.getParameter("arguments").customerId;
        this._filterByCustId(sCustId);
      },

      _filterByCustId: function (sCustId) {
        var oODataModel = this.getView().getModel(); // ODataModel
        var that = this;

        // ODataModel에서 데이터 읽기 (필터 적용)
        oODataModel.read("/ZDCC_MATFLOW", {
          filters: [new Filter("cust_id", FilterOperator.EQ, sCustId)],
          success: function (oData) {
            // 중복 없는 so_docu_id만 추출
            var aResults = oData.results;

            // 고객명 추출 (첫 번째 결과의 cust_name 사용)
            var sCustName = aResults.length > 0 ? aResults[0].cust_name : "";
            that
              .getView()
              .getModel("view")
              .setProperty("/customerName", sCustName);

            var aUnique = [];
            var oSeen = {};

            // 오늘 날짜 구하기 (yyyy-mm-dd)
            var oToday = new Date();
            oToday.setHours(0, 0, 0, 0);

            // 날짜형식 변환하는 함수
            function formatDateToYMD(date) {
              if (!date) return "";
              var d = new Date(date);
              if (isNaN(d.getTime())) return "";
              var year = d.getFullYear();
              var month = String(d.getMonth() + 1).padStart(2, "0");
              var day = String(d.getDate()).padStart(2, "0");
              return year + "년 " + month + "월 " + day + "일";
            }

            aResults.forEach(function (item) {
              // req_deli_date가 오늘 이후인지 체크
              var oReqDate = new Date(item.req_deli_date);
              oReqDate.setHours(0, 0, 0, 0);

              // if (!oSeen[item.so_docu_id]) {
              //   oSeen[item.so_docu_id] = true;
              //   aUnique.push(item);
              // }

              if (!oSeen[item.so_docu_id]) {
                oSeen[item.so_docu_id] = true;

                // 출고 완료 여부 계산
                var isCompleted = item.deli_status === "2";
                // 새로운 필드 추가
                item.deliveryCompleted = isCompleted;

                aUnique.push(item);
              }

              // 추가 //
              // so_created_time 변환 추가
              if (
                item.so_created_time &&
                typeof item.so_created_time.ms === "number"
              ) {
                var ms = item.so_created_time.ms;
                var hours = Math.floor(ms / (1000 * 60 * 60));
                var minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((ms % (1000 * 60)) / 1000);
                var ampm = hours < 12 ? "오전" : "오후";

                item.so_created_time_str =
                  ampm +
                  " " +
                  String(hours).padStart(2, "0") +
                  ":" +
                  String(minutes).padStart(2, "0") +
                  ":" +
                  String(seconds).padStart(2, "0");
              } else {
                item.so_created_time_str = "";
              }

              // 날짜 포맷 추가
              item.req_deli_date_str = formatDateToYMD(item.req_deli_date);
              item.so_created_date_str = formatDateToYMD(item.so_created_date);
              item.deli_date_str = formatDateToYMD(item.deli_date);
            });

            // req_deli_date가 가까운 순으로 오름차순 정렬
            aUnique.sort(function (a, b) {
              var dateA = new Date(a.req_deli_date);
              var dateB = new Date(b.req_deli_date);
              return dateA - dateB;
            });

            // 리스트 개수 출력
            sap.m.MessageToast.show("조회된 주문 건수: " + aUnique.length);

            // 중복 제거된 데이터로 JSONModel 생성
            var oJsonModel = new sap.ui.model.json.JSONModel({
              items: aUnique,
            });
            that.getView().setModel(oJsonModel, "uniqueOrders");
          },
        });
      },

      onOrderSearch: function (oEvent) {
        var sQuery =
          oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
        var oList = this.byId("orderList");
        var oBinding = oList.getBinding("items");

        if (sQuery) {
          var aFilters = [
            new sap.ui.model.Filter(
              "so_docu_id",
              sap.ui.model.FilterOperator.Contains,
              sQuery
            ),
          ];
          oBinding.filter(
            new sap.ui.model.Filter({ filters: aFilters, and: false })
          );
        } else {
          oBinding.filter([]);
        }
      },

      onOrderSelect: function (oEvent) {
        // 추가
        var oListItem = oEvent.getParameter("listItem");
        // uniqueOrders 모델의 해당 아이템 바인딩 컨텍스트 저장
        this._selectedOrderContext =
          oListItem.getBindingContext("uniqueOrders");
        // ---------

        var oSelected = oEvent
          .getParameter("listItem")
          .getBindingContext("uniqueOrders")
          .getObject();
        var sSoDocuId = oSelected.so_docu_id;
        var that = this;

        var oODataModel = this.getView().getModel();

        oODataModel.read("/ZDCC_MATFLOW", {
          filters: [new Filter("so_docu_id", FilterOperator.EQ, sSoDocuId)],
          success: function (oData) {
            var aResults = oData.results;

            var oStatusMap = {
              sop: false,
              op_status: "0",
              po_status: "0",
              delivery_status: "0",
            };

            var aPoStatus = []; // 생산오더 상태 배열

            // aResults  출력
            // console.log("aResults:", aResults);

            // === 여기서 중복 제거 ===
            var seenMat = {};
            var uniqueItems = [];
            aResults.forEach(function (item) {
              if (!seenMat[item.mat_id]) {
                seenMat[item.mat_id] = true;
                uniqueItems.push(item);
              }
            });

            aResults.forEach(function (item) {
              if (item.op_id) {
                oStatusMap.sop = true;
              }

              if (item.op_status === "1") {
                oStatusMap.op_status = "1";
              }

              aPoStatus.push(item.po_status); // 생산오더 상태 배열에 추가

              // 생산오더 상태 판별
              if (aPoStatus.includes("1")) {
                oStatusMap.po_status = "1";
              } else if (aPoStatus.includes("2")) {
                oStatusMap.po_status = "2";
              } else if (
                aPoStatus.length > 0 &&
                aPoStatus.every(function (s) {
                  return s === "3";
                })
              ) {
                oStatusMap.po_status = "3";
              } else {
                oStatusMap.po_status = "0";
              }

              // 납품 상태 갱신
              if (item.deli_status === "2") {
                oStatusMap.delivery_status = "2";
              } else if (
                item.deli_status === "1" &&
                oStatusMap.delivery_status === "0"
              ) {
                oStatusMap.delivery_status = "1";
              }
            });

            // pf2 모델 복사 및 상태 갱신
            var oPf2Model = that.getView().getModel("pf2");
            var oClonedData = JSON.parse(JSON.stringify(oPf2Model.getData()));

            oClonedData.nodes.forEach(function (node) {
              switch (node.id) {
                case "2": // 생산운영계획
                  if (oStatusMap.sop) {
                    node.state = "Positive";
                    node.stateText = "계획수립";
                    node.focused = true;
                  } else {
                    node.state = "Planned";
                    node.stateText = "미수립";
                    node.focused = false;
                  }
                  break;
                case "3": // 계획주문
                  if (oStatusMap.op_status === "1") {
                    node.state = "Positive";
                    node.stateText = "생성";
                    node.focused = true;
                  } else {
                    node.state = "Planned";
                    node.stateText = "미생성";
                    node.focused = false;
                  }
                  break;
                case "4": // 생산오더
                  if (oStatusMap.po_status === "3") {
                    node.state = "Positive";
                    node.stateText = "생산완료";
                    node.focused = true;
                  } else if (oStatusMap.po_status === "2") {
                    node.state = "Critical";
                    node.stateText = "생산전";
                    node.focused = true;
                  } else if (oStatusMap.po_status === "1") {
                    node.state = "Negative";
                    node.stateText = "원자재 출고 전";
                    node.focused = true;
                  } else {
                    node.state = "Planned";
                    node.focused = false;
                  }
                  break;
                case "5": // 납품
                  if (oStatusMap.delivery_status === "2") {
                    node.state = "Positive";
                    node.stateText = "출고 완료";
                    node.focused = true;
                  } else if (oStatusMap.delivery_status === "1") {
                    node.state = "Negative";
                    node.stateText = "출고 전";
                    node.focused = true;
                  } else {
                    node.state = "Planned";
                    node.stateText = "출고 문서 없음";
                    node.focused = false;
                  }
                  break;
              }
            });

            oClonedData.lanes.forEach(function (lane) {
              switch (lane.id) {
                case "1": // 생산계획
                  if (oStatusMap.sop) {
                    lane.state = {
                      state: "Positive",
                      value: 100,
                    };
                  } else {
                    lane.state = {
                      state: "Planned",
                      value: 100,
                    };
                  }
                  break;

                case "2": // 계획주문
                  if (oStatusMap.op_status === "1") {
                    lane.state = {
                      state: "Positive",
                      value: 100,
                    };
                  } else {
                    lane.state = {
                      state: "Planned",
                      value: 100,
                    };
                  }
                  break;
                case "3": // 생산오더
                  if (oStatusMap.po_status === "3") {
                    lane.state = { state: "Positive", value: 100 };
                  } else if (oStatusMap.po_status === "2") {
                    lane.state = { state: "Critical", value: 100 };
                  } else if (oStatusMap.po_status === "1") {
                    lane.state = { state: "Negative", value: 100 };
                  } else {
                    lane.state = { state: "Planned", value: 100 };
                  }
                  break;
                case "4": // 납품
                  if (oStatusMap.delivery_status === "2") {
                    lane.state = { state: "Positive", value: 100 };
                  } else if (oStatusMap.delivery_status === "1") {
                    lane.state = { state: "Negative", value: 100 };
                  } else {
                    lane.state = { state: "Planned", value: 100 };
                  }
                  break;
              }
            });

            // UI 강제 반영
            oPf2Model.setData(oClonedData);

            if (that.oProcessFlow) {
              that.oProcessFlow.rerender();
            }

            // 테이블 데이터 갱신 (중복 제거된 데이터로)
            var oTableModel = new sap.ui.model.json.JSONModel({
              items: uniqueItems,
            });
            that.getView().setModel(oTableModel, "selectedOrder");
          },
        });
      },

      onGoBack() {
        console.log("onGoBack");

        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1); // 브라우저 히스토리 뒤로가기
        } else {
          this.oRouter.navTo("RouteMain", {}, true); // 없으면 메인으로
        }
      },

      onZoomIn: function () {
        this.oProcessFlow.zoomIn();

        MessageToast.show(
          "Zoom level changed to: " + this.oProcessFlow.getZoomLevel()
        );
      },

      onZoomOut: function () {
        this.oProcessFlow.zoomOut();

        MessageToast.show(
          "Zoom level changed to: " + this.oProcessFlow.getZoomLevel()
        );
      },

      onNodePress: function (oEvent) {
        var oNode = oEvent.getParameters();
        var oNodeData = oNode.getBindingContext("pf2").getObject();

        // 클릭한 노드의 상태가 Focused가 아닐 경우 클릭 무시하기
        if (!oNodeData.focused) {
          return;
        }

        // uniqueOrders에서 선택된 아이템의 컨텍스트 사용
        var oBindingContext = this._selectedOrderContext;
        if (!oBindingContext) {
          return;
        }

        var sNodeId = oNodeData.id; // 노드 id로 분기
        var sFragmentName;

        switch (sNodeId) {
          case "1": // 고객주문
            sFragmentName = "sync.dc.pp.project33.view.QuickViewCustomerOrder";
            break;
          case "5": // 납품
            sFragmentName = "sync.dc.pp.project33.view.QuickViewDelivery";
            break;
        }

        if (
          !this.oQuickView ||
          this.oQuickView.sFragmentName !== sFragmentName
        ) {
          Fragment.load({
            id: this.getView().getId(),
            name: sFragmentName,
            type: "XML",
          }).then(
            function (oFragment) {
              this.oQuickView = oFragment;
              this.oQuickView.sFragmentName = sFragmentName;
              this.getView().addDependent(this.oQuickView);
              this.oQuickView.setBindingContext(
                oBindingContext,
                "uniqueOrders"
              );
              this.oQuickView.openBy(oNode);
            }.bind(this)
          );
        } else {
          this.oQuickView.setBindingContext(oBindingContext, "uniqueOrders");
          this.oQuickView.openBy(oNode);
        }
      },

      onExit: function () {
        if (this.oQuickView) {
          this.oQuickView.destroy();
        }
      },

      // 설명 다이얼로그창 open
      onOpenInfoDialog: function (oEvent) {
        if (!this._oInfoDialog) {
          this._oInfoDialog = sap.ui.xmlfragment(
            "sync.dc.pp.project33.view.InfoDialog",
            this
          );
          this.getView().addDependent(this._oInfoDialog);
        }
        this._oInfoDialog.open();
      },

      onCloseInfoDialog: function () {
        if (this._oInfoDialog) {
          this._oInfoDialog.close();
        }
      },
    });
  }
);
