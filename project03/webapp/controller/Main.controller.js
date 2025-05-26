sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/date/UI5Date"
], (Controller, JSONModel, UI5Date) => {
    "use strict";

    return Controller.extend("sync.dc.sd.project03.controller.Main", {
        onInit() {
            // OData 모델 가져오기
            const oModel = this.getOwnerComponent().getModel();
            
            // 데이터 바인딩 설정
            this.getView().setModel(oModel);

            // 환율 정보 설정
            const oExchangeModel = new JSONModel({
                exchangeRates: {
                    USD: 1350,  // 1 USD = 1350 KRW
                    EUR: 1450,  // 1 EUR = 1450 KRW
                    JPY: 9.0,   // 1 JPY = 9 KRW
                    CNY: 185    // 1 CNY = 185 KRW
                }
            });
            this.getView().setModel(oExchangeModel, "exchangeModel");

            // 년도와 월 선택을 위한 JSON 모델 생성
            const currentDate = new Date();
            const oViewModel = new JSONModel({
                years: this._createYearItems(),
                months: this._createMonthItems(),
                selectedYear: currentDate.getFullYear(),
                selectedMonth: currentDate.getMonth() + 1
            });
            this.getView().setModel(oViewModel, "viewModel");
            
            // 초기 데이터 로드
            this._loadData();
            this._loadAllData();
            // 차트 타이틀 설정
            this._setChartTitles();
        },

        _setChartTitles() {
            const oView = this.getView();
            // 고객별 판매 실적 차트
            const oCustomerChart = oView.byId("customerChart");
            if (oCustomerChart) {
                oCustomerChart.setVizProperties({
                    title: {
                        visible: true,
                        text: "고객별 판매 실적 (원화 기준)"
                    }
                });
            }
            // 판매 지사별 실적 차트
            const oOrgChart = oView.byId("orgChart");
            if (oOrgChart) {
                oOrgChart.setVizProperties({
                    title: {
                        visible: true,
                        text: "판매 지사별 실적 (원화 기준)"
                    }
                });
            }
            // Fragment의 매출 변화율 차트 - Fragment가 있으면 제목 설정
            try {
                console.log("Fragment 차트 제목 설정 시작");
                console.log("_oDecreaseChartFragment 존재:", !!this._oDecreaseChartFragment);
                
                const oDecreaseChart = this._oDecreaseChartFragment ? 
                    sap.ui.core.Fragment.byId(this._oDecreaseChartFragment.getId(), "decreaseChart") : null;
                
                console.log("oDecreaseChart 찾음:", !!oDecreaseChart);
                
                if (oDecreaseChart) {
                    console.log("차트 제목 설정 중...");
                    oDecreaseChart.setVizProperties({
                        title: {
                            text: "매출 변화율 (이번 달 vs 저번 달)",
                            visible: true
                        },
                        plotArea: {
                            colorPalette: d3.scale.category20().range(),
                            drawingEffect: "normal",
                            dataLabel: {
                                visible: true
                            }
                        }
                    });
                    console.log("차트 제목 설정 완료");
                } else {
                    console.log("모든 방법으로 차트를 찾을 수 없음");
                    console.log("Fragment 내용:", this._oDecreaseChartFragment.getContent());
                }
            } catch (e) {
                // Fragment가 없거나 에러가 발생해도 무시
                console.log("Fragment 차트 제목 설정 중 에러:", e);
            }
        },

        _createYearItems() {
            const years = [];
            const currentYear = new Date().getFullYear();
            // 현재 년도부터 5년 전까지
            for (let i = currentYear; i >= currentYear - 5; i--) {
                years.push({
                    key: i,
                    text: `${i}년`
                });
            }
            return years;
        },

        _createMonthItems() {
            const months = [];
            for (let i = 1; i <= 12; i++) {
                months.push({
                    key: i,
                    text: `${i}월`
                });
            }
            return months;
        },

        _loadData() {
            const oModel = this.getOwnerComponent().getModel();
            const oViewModel = this.getView().getModel("viewModel");
            const selectedYear = oViewModel.getProperty("/selectedYear");
            const selectedMonth = oViewModel.getProperty("/selectedMonth");

            console.log("선택된 기간:", selectedYear + "년 " + selectedMonth + "월");

            // 데이터 로드 - 필터 없이 전체 데이터 가져오기
            oModel.read("/ZDCC_SalesOrder_Customer", {
                filters: [], // 필터 제거
                success: (oData) => {
                    console.log("원본 데이터 로드 성공:", oData);
                    if (oData && oData.results) {
                        console.log("전체 데이터 건수:", oData.results.length);
                        
                        // 날짜 필터링
                        const filteredData = this._filterDataByDate(oData.results, selectedYear, selectedMonth);
                        console.log("필터링된 데이터 건수:", filteredData.length);
                        
                        if (filteredData.length === 0) {
                            console.warn("선택한 기간에 데이터가 없습니다.");
                            const oAggregatedModel = new JSONModel({
                                results: []
                            });
                            this.getView().setModel(oAggregatedModel, "aggregatedData");
                            // 차트 타이틀 재설정
                            this._setChartTitles();
                            return;
                        }
                        
                        // 데이터 집계
                        const aggregatedData = this._aggregateData(filteredData);
                        console.log("집계된 데이터:", aggregatedData);

                        // 집계된 데이터를 모델에 설정
                        const oAggregatedModel = new JSONModel({
                            results: aggregatedData
                        });
                        this.getView().setModel(oAggregatedModel, "aggregatedData");
                        // 차트 타이틀 재설정
                        this._setChartTitles();
                    } else {
                        console.warn("데이터가 없거나 예상치 못한 형식입니다.");
                        const oAggregatedModel = new JSONModel({
                            results: []
                        });
                        this.getView().setModel(oAggregatedModel, "aggregatedData");
                        // 차트 타이틀 재설정
                        this._setChartTitles();
                    }
                },
                error: (oError) => {
                    console.error("데이터 로드 실패:", oError);
                    console.error("상세 에러 정보:", {
                        message: oError.message,
                        statusCode: oError.statusCode,
                        statusText: oError.statusText,
                        responseText: oError.responseText
                    });
                    const oAggregatedModel = new JSONModel({
                        results: []
                    });
                    this.getView().setModel(oAggregatedModel, "aggregatedData");
                    // 차트 타이틀 재설정
                    this._setChartTitles();
                }
            });
        },

        _filterDataByDate(data, year, month) {
            return data.filter(item => {
                if (!item.Order_Date) return false;
                
                // Order_Date가 문자열인 경우 (YYYYMMDD 형식)
                let orderDate;
                if (typeof item.Order_Date === 'string') {
                    const dateStr = item.Order_Date;
                    const year = parseInt(dateStr.substring(0, 4));
                    const month = parseInt(dateStr.substring(4, 6));
                    const day = parseInt(dateStr.substring(6, 8));
                    orderDate = new Date(year, month - 1, day);
                } else {
                    orderDate = new Date(item.Order_Date);
                }
                
                const itemYear = orderDate.getFullYear();
                const itemMonth = orderDate.getMonth() + 1;
                
                console.log("주문일자:", orderDate.toISOString(), 
                          "데이터 년도:", itemYear, "데이터 월:", itemMonth,
                          "선택년도:", year, "선택월:", month);
                
                return itemYear === parseInt(year) && itemMonth === parseInt(month);
            });
        },

        _aggregateData(data) {
            console.log("집계 시작 데이터:", data);
            
            // 고객별 데이터 집계
            const customerMap = new Map();
            const oExchangeModel = this.getView().getModel("exchangeModel");
            const exchangeRates = oExchangeModel.getProperty("/exchangeRates");
            
            data.forEach(item => {
                const customerKey = item.Cust_Name;
                if (!customerKey) {
                    console.warn("고객명이 없는 데이터 발견:", item);
                    return;
                }

                if (!customerMap.has(customerKey)) {
                    customerMap.set(customerKey, {
                        Cust_Name: customerKey,
                        Total_Price: 0,
                        Total_Price_KRW: 0,
                        Sales_Organization: item.Sales_Organization || '미지정',
                        Order_Date: item.Order_Date
                    });
                }
                
                const customerData = customerMap.get(customerKey);
                const amount = parseFloat(item.Total_Price || 0);
                const currency = item.Currency || 'KRW';
                
                if (isNaN(amount)) {
                    console.warn("잘못된 금액 데이터 발견:", item);
                    return;
                }

                // 환율 적용
                let amountInKRW = amount;
                if (currency !== 'KRW') {
                    const rate = exchangeRates[currency];
                    if (rate) {
                        amountInKRW = amount * rate;
                    } else {
                        console.warn("알 수 없는 통화:", currency);
                    }
                }

                customerData.Total_Price += amount;
                customerData.Total_Price_KRW += amountInKRW;
            });

            const result = Array.from(customerMap.values())
                .sort((a, b) => b.Total_Price_KRW - a.Total_Price_KRW);

            console.log("집계 결과:", result);
            return result;
        },

        onYearChange(oEvent) {
            this._loadData();
        },

        onMonthChange(oEvent) {
            this._loadData();
        },

        onShowDecreaseChart(oEvent) {
            const sCustomer = oEvent.getSource().getCustomData()[0].getValue();
            // 감소율 데이터 계산 및 Fragment 오픈
            this._openDecreaseChartFragment(sCustomer);
        },

        async _openDecreaseChartFragment(sCustomer) {
            if (!this._oDecreaseChartFragment) {
                this._oDecreaseChartFragment = await sap.ui.core.Fragment.load({
                    name: "sync.dc.sd.project03.view.DecreaseChartFragment",
                    controller: this
                });
                this.getView().addDependent(this._oDecreaseChartFragment);
            }
            
            // 데이터 준비 및 모델 세팅
            const oModel = this._calcDecreaseRateForCustomer(sCustomer);
            console.log("decreaseModel 데이터:", oModel.getData());
            
            // Fragment는 Dialog이므로 직접 모델 설정
            this._oDecreaseChartFragment.setModel(oModel, "decreaseModel");
            
            // Dialog 열기
            this._oDecreaseChartFragment.open();
            
            // Dialog가 열린 후 차트 제목 설정
            setTimeout(() => {
                console.log("Dialog 열린 후 차트 제목 설정 시작");
                console.log("Fragment ID:", this._oDecreaseChartFragment.getId());
                
                // 방법 1: Fragment.byId로 찾기
                const oDecreaseChart1 = sap.ui.core.Fragment.byId(this._oDecreaseChartFragment.getId(), "decreaseChart");
                console.log("방법1 - Fragment.byId로 차트 찾음:", !!oDecreaseChart1);
                
                // 방법 2: Dialog 내부에서 찾기
                const oDecreaseChart2 = this._oDecreaseChartFragment.getContent()[0].getItems()[0];
                console.log("방법2 - Dialog 내부에서 차트 찾음:", !!oDecreaseChart2);
                console.log("방법2 - 차트 타입:", oDecreaseChart2 ? oDecreaseChart2.getMetadata().getName() : "없음");
                
                // 방법 3: sap.ui.getCore().byId로 찾기
                const fragmentId = this._oDecreaseChartFragment.getId();
                const chartId = fragmentId + "--decreaseChart";
                const oDecreaseChart3 = sap.ui.getCore().byId(chartId);
                console.log("방법3 - Core.byId로 차트 찾음:", !!oDecreaseChart3);
                console.log("방법3 - 시도한 ID:", chartId);
                
                const oDecreaseChart = oDecreaseChart1 || oDecreaseChart2 || oDecreaseChart3;
                
                if (oDecreaseChart && oDecreaseChart.setVizProperties) {
                    console.log("차트 찾음! 제목 설정 중...");
                    oDecreaseChart.setVizProperties({
                        title: {
                            text: "매출 변화율 (이번 달 vs 저번 달)",
                            visible: true
                        },
                        plotArea: {
                            colorPalette: d3.scale.category20().range(),
                            drawingEffect: "normal",
                            dataLabel: {
                                visible: true
                            }
                        }
                    });
                    console.log("차트 제목 설정 완료");
                } else {
                    console.log("모든 방법으로 차트를 찾을 수 없음");
                    console.log("Fragment 내용:", this._oDecreaseChartFragment.getContent());
                }
            }, 500);
        },

        _calcDecreaseRateForCustomer(sCustomer) {
            function parseOrderDate(orderDateRaw) {
                if (orderDateRaw instanceof Date) {
                    return orderDateRaw;
                }
                if (typeof orderDateRaw === 'string') {
                    if (/^\d{4}\.\d{2}\.\d{2}$/.test(orderDateRaw)) {
                        const [y, m, d] = orderDateRaw.split('.').map(s => parseInt(s, 10));
                        return new Date(y, m - 1, d);
                    }
                    if (/^\d{8}$/.test(orderDateRaw)) {
                        const y = parseInt(orderDateRaw.substring(0, 4));
                        const m = parseInt(orderDateRaw.substring(4, 6));
                        const d = parseInt(orderDateRaw.substring(6, 8));
                        return new Date(y, m - 1, d);
                    }
                    const d = new Date(orderDateRaw);
                    if (!isNaN(d)) return d;
                }
                return null;
            }

            // allSalesData 모델에서 전체 데이터 사용
            const oAllDataModel = this.getView().getModel("allSalesData");
            const allData = oAllDataModel ? oAllDataModel.getData() : [];
            
            // 환율 정보 가져오기
            const oExchangeModel = this.getView().getModel("exchangeModel");
            const exchangeRates = oExchangeModel.getProperty("/exchangeRates");

            // 오늘 기준 현재 달과 이전 달 계산
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            function normalize(str) {
                return (str || '').replace(/\s/g, '').toLowerCase();
            }

            function sumFor(year, month) {
                const filtered = allData
                    .filter(item => {
                        const orderDate = parseOrderDate(item.Order_Date);
                        const isCustomer = normalize(item.Cust_Name) === normalize(sCustomer);
                        const isYear = orderDate && orderDate.getFullYear() === year;
                        const isMonth = orderDate && (orderDate.getMonth() + 1) === month;
                        if (isCustomer && isYear && isMonth) {
                            console.log('집계 포함:', item.Cust_Name, orderDate, item.Total_Price, item.Currency);
                        }
                        return isCustomer && isYear && isMonth;
                    });
                console.log(`[${sCustomer}] ${year}년 ${month}월 데이터:`, filtered);
                
                // 환율 적용하여 KRW로 변환
                return filtered.reduce((sum, item) => {
                    const amount = parseFloat(item.Total_Price || 0);
                    const currency = item.Currency || 'KRW';
                    
                    let amountInKRW = amount;
                    if (currency !== 'KRW') {
                        const rate = exchangeRates[currency];
                        if (rate) {
                            amountInKRW = amount * rate;
                        }
                    }
                    
                    return sum + amountInKRW;
                }, 0);
            }

            const currentSum = sumFor(currentYear, currentMonth);
            const prevSum = sumFor(prevYear, prevMonth);
            
            console.log(`[${sCustomer}] 이번 달(${currentYear}년 ${currentMonth}월): ${currentSum}`);
            console.log(`[${sCustomer}] 저번 달(${prevYear}년 ${prevMonth}월): ${prevSum}`);
            
            let decreaseRate = 0;
            if (prevSum > 0) {
                decreaseRate = ((currentSum - prevSum) / prevSum) * 100;
                decreaseRate = Math.round(decreaseRate * 10) / 10; // 소수점 1자리
            } else if (currentSum > 0) {
                decreaseRate = 100;
            } else {
                decreaseRate = 0;
            }

            const modelData = {
                customer: sCustomer,
                data: [
                    { period: "이번 달", amount: Number(currentSum) || 0 },
                    { period: "저번 달", amount: Number(prevSum) || 0 }
                ],
                decreaseRate: decreaseRate
            };
            
            console.log("최종 모델 데이터:", modelData);
            return new sap.ui.model.json.JSONModel(modelData);
        },

        onCloseDecreaseChart: function() {
            if (this._oDecreaseChartFragment) {
                this._oDecreaseChartFragment.close();
            }
        },

        _loadAllData() {
            const oModel = this.getOwnerComponent().getModel();
            oModel.read("/ZDCC_SalesOrder_Customer", {
                success: (oData) => {
                    if (oData && oData.results) {
                        const oAllDataModel = new sap.ui.model.json.JSONModel(oData.results);
                        this.getView().setModel(oAllDataModel, "allSalesData");
                    }
                }
            });
        }
    });
});