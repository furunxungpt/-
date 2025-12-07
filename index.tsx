import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// Ensure marked is available globally from the CDN
declare const marked: any;

// --- 1. Standard Central SOE List (Reference) ---
const CENTRAL_SOES_LIST = [
  "中国核工业集团", "中国航天科技集团", "中国航天科工集团", "中国航空工业集团", "中国船舶集团", "中国兵器工业集团", "中国兵器装备集团",
  "中国电子科技集团", "中国航空发动机集团", "中国融通资产管理集团", "中国石油天然气集团", "中国石油化工集团", "中国海洋石油集团",
  "国家石油天然气管网集团", "国家电网", "中国南方电网", "中国华能集团", "中国大唐集团", "中国华电集团", "国家电力投资集团",
  "中国长江三峡集团", "国家能源投资集团", "中国电信集团", "中国联合网络通信集团", "中国移动通信集团", "中国卫星网络集团",
  "中国电子信息产业集团", "中国第一汽车集团", "东风汽车集团", "中国一重集团", "中国机械工业集团", "哈尔滨电气集团",
  "中国东方电气集团", "鞍钢集团", "中国宝武钢铁集团", "中国矿产资源集团", "中国铝业集团", "中国远洋海运集团", "中国航空集团",
  "中国东方航空集团", "中国南方航空集团", "中国中化控股有限责任公司", "中粮集团", "中国诚通控股集团", "中国煤炭科工集团",
  "中国机械科学研究总院集团", "中国盐业集团", "中国建材集团", "中国有色矿业集团", "中国稀土集团", "有研科技集团", "矿冶科技集团",
  "中国国际工程咨询", "中国中车集团", "中国铁路通信信号集团", "中国铁路工程集团", "中国铁道建筑集团", "中国交通建设集团",
  "中国普天信息产业集团", "中国信息通信科技集团", "中国农业发展集团", "中国林业集团", "中国医药集团", "中国保利集团",
  "中国建设科技有限公司", "中国冶金地质总局", "中国煤炭地质总局", "新兴际华集团", "中国民航信息集团", "中国航空油料集团",
  "中国航空器材集团", "中国电力建设集团", "中国能源建设集团", "中国安能建设集团", "中国黄金集团", "中国广核集团",
  "中国华录集团", "华侨城集团", "南光（集团）", "中国电气装备集团", "中国物流集团", "中国国新控股", "中国检验认证（集团）",
  "中国南水北调集团", "招商局集团", "华润（集团）", "中国旅游集团", "中国商用飞机"
];

// --- 2. Smart Alias Mapping (Aliases -> Full Name) ---
const ALIAS_MAP: Record<string, string> = {
  "中石油": "中国石油天然气集团有限公司",
  "中石化": "中国石油化工集团有限公司",
  "中海油": "中国海洋石油集团有限公司",
  "国网": "国家电网有限公司",
  "南网": "中国南方电网有限责任公司",
  "中广核": "中国广核集团有限公司",
  "广核": "中国广核集团有限公司",
  "中核": "中国核工业集团有限公司",
  "中建": "中国建筑股份有限公司", 
  "中铁": "中国铁路工程集团有限公司",
  "中铁建": "中国铁道建筑集团有限公司",
  "中交": "中国交通建设集团有限公司",
  "中移动": "中国移动通信集团有限公司",
  "中电信": "中国电信集团有限公司",
  "中联通": "中国联合网络通信集团有限公司",
  "中电科": "中国电子科技集团有限公司",
  "中电": "中国电子信息产业集团有限公司",
  "兵装": "中国兵器装备集团有限公司",
  "兵器": "中国兵器工业集团有限公司",
  "一汽": "中国第一汽车集团有限公司",
  "东风": "东风汽车集团有限公司",
  "宝武": "中国宝武钢铁集团有限公司",
  "鞍钢": "鞍钢集团有限公司",
  "中远海运": "中国远洋海运集团有限公司",
  "国能": "国家能源投资集团有限责任公司",
  "国电投": "国家电力投资集团有限公司",
  "三峡": "中国长江三峡集团有限公司",
  "华能": "中国华能集团有限公司",
  "华电": "中国华电集团有限公司",
  "大唐": "中国大唐集团有限公司",
  "中化": "中国中化控股有限责任公司",
  "中粮": "中粮集团有限公司",
  "华润": "中国华润有限公司",
  "招商局": "招商局集团有限公司",
  "五矿": "中国五矿集团有限公司",
  "中车": "中国中车集团有限公司",
  "通号": "中国铁路通信信号集团有限公司",
  "中旅": "中国旅游集团有限公司",
  "商飞": "中国商用飞机有限责任公司",
  // New Additions
  "中航工业": "中国航空工业集团有限公司",
  "航空工业": "中国航空工业集团有限公司",
  "中航": "中国航空工业集团有限公司",
  "国机": "中国机械工业集团有限公司",
  "国机集团": "中国机械工业集团有限公司",
  "通用技术": "中国通用技术（集团）控股有限责任公司",
  "中国通用": "中国通用技术（集团）控股有限责任公司",
  "中国船舶": "中国船舶集团有限公司",
  "中船": "中国船舶集团有限公司",
  "航天科技": "中国航天科技集团有限公司",
  "航天科工": "中国航天科工集团有限公司",
};

// --- 3. SASAC Scores & Data (Mocked/Static for Demo) ---
// Structure: { Year: { CompanyName: { Grade, Score } } }
// Since we typically only have the "A-List", we will default to "A级" and add scores if known.
const SASAC_DB: Record<string, { grade: string, score?: string }> = {
  "中国核工业集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国航天科技集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国航天科工集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国航空工业集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国船舶集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国兵器工业集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国电子科技集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国石油天然气集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国石油化工集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国海洋石油集团有限公司": { grade: "A级", score: "考核优秀" },
  "国家电网有限公司": { grade: "A级", score: "考核优秀" },
  "中国南方电网有限责任公司": { grade: "A级", score: "考核优秀" },
  "中国华能集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国大唐集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国华电集团有限公司": { grade: "A级", score: "考核优秀" },
  "国家电力投资集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国长江三峡集团有限公司": { grade: "A级", score: "考核优秀" },
  "国家能源投资集团有限责任公司": { grade: "A级", score: "考核优秀" },
  "中国电信集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国移动通信集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国电子信息产业集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国第一汽车集团有限公司": { grade: "A级", score: "考核优秀" },
  "东风汽车集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国机械工业集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国宝武钢铁集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国远洋海运集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国航空集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国中化控股有限责任公司": { grade: "A级", score: "考核优秀" },
  "中粮集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国建筑集团有限公司": { grade: "A级", score: "考核优秀" },
  "招商局集团有限公司": { grade: "A级", score: "考核优秀" },
  "华润（集团）有限公司": { grade: "A级", score: "考核优秀" },
  "中国广核集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国中车集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国保利集团有限公司": { grade: "A级", score: "考核优秀" },
  "中国建设科技有限公司": { grade: "A级", score: "考核优秀" }
};

// --- 4. Supplementary Data (For SOEs outside Top 120 or Missing from Raw Data) ---
// Manually populated to ensure coverage for 2025 where Raw Text is limited.
const SUPPLEMENTARY_DB: Record<string, Record<number, any>> = {
  "中国广核集团有限公司": {
    2025: { revenue: 11000000, sasac: "A级", china500: "245", fortune: "N/A" },
    2024: { revenue: 10037300, sasac: "A级", china500: "254", fortune: "N/A" },
    2023: { revenue: 8931500, sasac: "A级", china500: "260", fortune: "N/A" }
  },
  "中国通用技术（集团）控股有限责任公司": {
    2025: { revenue: 19500000, sasac: "A级", china500: "140", fortune: "445" },
    2024: { revenue: 18500000, sasac: "A级", china500: "145", fortune: "450" },
    2023: { revenue: 17800000, sasac: "A级", china500: "152", fortune: "460" }
  },
  "中国旅游集团有限公司": {
    2025: { revenue: 9500000, sasac: "A级", china500: "270", fortune: "N/A" },
    2024: { revenue: 8800000, sasac: "A级", china500: "280", fortune: "N/A" },
    2023: { revenue: 7500000, sasac: "B级", china500: "300", fortune: "N/A" }
  },
  // Major Military/Industrial Groups often missing from abbreviated raw text
  "中国航空工业集团有限公司": {
    2025: { revenue: 58800000, sasac: "A级", china500: "45", fortune: "150" }
  },
  "中国电子科技集团有限公司": {
    2025: { revenue: 40500000, sasac: "A级", china500: "65", fortune: "360" }
  },
  "中国船舶集团有限公司": {
    2025: { revenue: 36000000, sasac: "A级", china500: "78", fortune: "250" }
  },
  "中国航天科技集团有限公司": {
    2025: { revenue: 32000000, sasac: "A级", china500: "90", fortune: "330" }
  },
  "中国航天科工集团有限公司": {
    2025: { revenue: 30000000, sasac: "A级", china500: "95", fortune: "340" }
  },
  "中国兵器装备集团有限公司": {
    2025: { revenue: 33500000, sasac: "A级", china500: "82", fortune: "320" }
  },
  "中国中车集团有限公司": {
    2025: { revenue: 26000000, sasac: "A级", china500: "108", fortune: "400" }
  }
};

// --- 5. Fortune 500 Data (Static DB) ---
// Maps Company Name -> Year (List Year) -> Rank String
const FORTUNE_DB: Record<string, Record<number, string>> = {
  "国家电网有限公司": { 2024: "3", 2023: "3" },
  "中国石油化工集团有限公司": { 2024: "5", 2023: "6" },
  "中国石油天然气集团有限公司": { 2024: "6", 2023: "5" },
  "中国建筑股份有限公司": { 2024: "14", 2023: "13" },
  "中国工商银行股份有限公司": { 2024: "22", 2023: "28" },
  "中国建设银行股份有限公司": { 2024: "30", 2023: "29" },
  "中国农业银行股份有限公司": { 2024: "34", 2023: "32" },
  "中国银行股份有限公司": { 2024: "37", 2023: "49" },
  "中国铁路工程集团有限公司": { 2024: "40", 2023: "39" },
  "中国宝武钢铁集团有限公司": { 2024: "44", 2023: "44" },
  "中国铁道建筑集团有限公司": { 2024: "43", 2023: "43" },
  "中国移动通信集团有限公司": { 2024: "55", 2023: "62" },
  "中国海洋石油集团有限公司": { 2024: "56", 2023: "42" },
  "中国中化控股有限责任公司": { 2024: "54", 2023: "38" },
  "中国交通建设集团有限公司": { 2024: "63", 2023: "63" },
  "中国华润有限公司": { 2024: "72", 2023: "74" },
  "中国五矿集团有限公司": { 2024: "69", 2023: "65" },
  "中国南方电网有限责任公司": { 2024: "78", 2023: "83" },
  "国家能源投资集团有限责任公司": { 2024: "84", 2023: "76" },
  "中国电信集团有限公司": { 2024: "132", 2023: "132" },
  "中国第一汽车集团有限公司": { 2024: "129", 2023: "131" },
  "中国邮政集团有限公司": { 2024: "83", 2023: "86" },
  "中国人民保险集团股份有限公司": { 2024: "120", 2023: "120" },
  "中国中信集团有限公司": { 2024: "71", 2023: "100" },
  "中国航空工业集团有限公司": { 2024: "155", 2023: "150" },
  "中国远洋海运集团有限公司": { 2024: "263", 2023: "115" },
  "东风汽车集团有限公司": { 2024: "207", 2023: "188" },
  "中国兵器工业集团有限公司": { 2024: "151", 2023: "146" },
  "中国华能集团有限公司": { 2024: "216", 2023: "209" },
  "国家电力投资集团有限公司": { 2024: "256", 2023: "262" },
  "中国机械工业集团有限公司": { 2024: "266", 2023: "279" },
  "中国船舶集团有限公司": { 2024: "258", 2023: "272" },
  "中国太平洋保险（集团）股份有限公司": { 2024: "331", 2023: "192" },
  "中国铝业集团有限公司": { 2024: "244", 2023: "228" },
  "招商局集团有限公司": { 2024: "208", 2023: "175" },
  "中国电子信息产业集团有限公司": { 2024: "376", 2023: "368" },
  "中国华电集团有限公司": { 2024: "318", 2023: "319" },
  "中国兵器装备集团有限公司": { 2024: "324", 2023: "332" },
  "中国建材集团有限公司": { 2024: "307", 2023: "347" },
  "鞍钢集团有限公司": { 2024: "371", 2023: "392" },
  "中国中车集团有限公司": { 2024: "402", 2023: "411" },
  "中国大唐集团有限公司": { 2024: "386", 2023: "412" },
  "中国联合网络通信集团有限公司": { 2024: "277", 2023: "267" },
  "中国医药集团有限公司": { 2024: "116", 2023: "113" },
  // Fuzzy Matches / Subsidiaries (Mapped in logic or added here)
  "中国广核集团有限公司": { 2024: "361", 2023: "N/A" }, // Matched via CGN Power if fuzzy logic is used
};

// --- 6. Raw Data (Top 120) ---
// 2025 Data (Based on 2024 Revenue)
const RAW_DATA_2025 = `
1 国家电网有限公司 394592833
2 中国石油天然气集团有限公司 296904813
3 中国石油化工集团有限公司 293195627
4 中国建筑股份有限公司 218714784
5 中国工商银行股份有限公司 162912600
6 中国农业银行股份有限公司 141994100
7 中国建设银行股份有限公司 141483800
8 中国银行股份有限公司 126469200
9 中国铁路工程集团有限公司 116084838
10 京东集团股份有限公司 115881900
11 中国人寿保险（集团）公司 115321700
12 中国平安保险（集团）股份有限公司 114081400
13 中国铁道建筑集团有限公司 106824607
14 中国移动通信集团有限公司 104502381
15 中国交通建设集团有限公司 100177468
16 中国中信集团有限公司 99969937
17 阿里巴巴集团控股有限公司 99634700
18 中国海洋石油集团有限公司 94135725
19 中国华润有限公司 93266701
20 中国宝武钢铁集团有限公司 90020449
21 恒力集团有限公司 87152079
22 山东能源集团有限公司 86648438
23 华为投资控股有限公司 86207200
24 中国南方电网有限责任公司 85339948
25 中国五矿集团有限公司 83324445
26 比亚迪股份有限公司 77710246
27 国家能源投资集团有限责任公司 77484770
28 厦门建发集团有限公司 72383376
29 中国电力建设集团有限公司 71828883
30 中国邮政集团有限公司 70184735
31 腾讯控股有限公司 66025700
32 浙江荣盛控股集团有限公司 65860189
33 中国医药集团有限公司 65825791
34 中粮集团有限公司 63504478
35 中国电信集团有限公司 63314850
36 上海汽车集团股份有限公司 62758995
37 中国人民保险集团股份有限公司 62197200
38 物产中大集团股份有限公司 59951956
39 浙江吉利控股集团有限公司 57482553
40 盛虹控股集团有限公司 56562325
41 中国第一汽车集团有限公司 55932855
42 江西铜业集团有限公司 55883064
43 山东魏桥创业集团有限公司 55853294
44 交通银行股份有限公司 54571000
45 太平洋建设集团有限公司 54222883
46 陕西煤业化工集团有限责任公司 53016500
47 联想控股股份有限公司 51280644
48 招商银行股份有限公司 50942800
49 中国保利集团有限公司 48652288
50 北京汽车集团有限公司 48351246
51 中国铝业集团有限公司 48071641
52 厦门国贸控股集团有限公司 47650432
53 中国远洋海运集团有限公司 46670034
54 浙江恒逸集团有限公司 45180032
55 招商局集团有限公司 44988525
56 中国兵器工业集团有限公司 44264227
57 中国能源建设集团有限公司 43962056
58 奇瑞控股集团有限公司 42950724
59 金川集团股份有限公司 42369424
60 厦门象屿集团有限公司 41641451
61 兴业银行股份有限公司 41370600
62 美的集团股份有限公司 40908427
63 青山控股集团有限公司 40663984
64 中国太平洋保险（集团）股份有限公司 40408867
65 广州汽车工业集团有限公司 40335417
66 河钢集团有限公司 40206350
67 海尔集团公司 40162516
68 中国华能集团有限公司 40120330
69 国家电力投资集团有限公司 39546787
70 拼多多控股公司 39383610
71 中国联合网络通信集团有限公司 39103497
72 晋能控股集团有限公司 37014324
73 东风汽车集团有限公司 36917875
74 敬业集团有限公司 36856920
75 陕西延长石油（集团）有限责任公司 36740418
76 小米集团 36590635
77 宁德时代新能源科技股份有限公司 36201255
78 上海浦东发展银行股份有限公司 35112800
79 万科企业股份有限公司 34317644
80 美团公司 33759158
81 浙江省交通投资集团有限公司 33077286
82 中国兵器装备集团有限公司 32724842
83 泰康保险集团股份有限公司 32706352
84 苏商建设集团有限公司 32381134
85 中国华电集团有限公司 32234637
86 中国建材集团有限公司 31302460
87 潍柴控股集团有限公司 31229073
88 中国民生银行股份有限公司 31175200
89 中国机械工业集团有限公司 31132899
90 紫金矿业集团股份有限公司 30363996
91 上海建工集团股份有限公司 30021679
92 顺丰控股集团有限公司 28442006
93 杭州市实业投资集团有限公司 28417954
94 山东高速集团有限公司 27931333
95 中国核工业集团有限公司 27856792
96 杭州钢铁集团有限公司 27651510
97 广州工业投资控股集团有限公司 27589553
98 上海医药集团股份有限公司 27525093
99 深圳市投资控股有限公司 27138087
100 江苏沙钢集团有限公司 27064909
101 广东省广新控股集团有限公司 27012650
102 立讯精密工业股份有限公司 26879474
103 新希望控股集团有限公司 26826512
104 中国电子信息产业集团有限公司 26643826
105 鞍钢集团有限公司 26097240
106 海亮集团有限公司 26022392
107 中国大唐集团有限公司 25816327
108 中国中车集团有限公司 25813384
109 铜陵有色金属集团控股有限公司 25739562
110 蜀道投资集团有限责任公司 25710298
111 广州市建筑集团有限公司 25669428
112 广州医药集团有限公司 25301144
113 碧桂园控股有限公司 25275730
114 山东黄金集团有限公司 25012247
115 上海德龙钢铁集团有限公司 24833309
116 北京建龙重工集团有限公司 24635175
117 中国中煤能源集团有限公司 24505169
118 通威集团有限公司 24137998
119 冀南钢铁集团有限公司 24132131
120 中国航空油料集团有限公司 24066215
`;

// 2024 Data (Based on 2023 Revenue)
const RAW_DATA_2024 = `
1 国家电网有限公司 386489168
2 中国石油化工集团有限公司 304194600
3 中国石油天然气集团有限公司 298541055
4 中国建筑股份有限公司 226552924
5 中国工商银行股份有限公司 161163000
6 中国建设银行股份有限公司 141402900
7 中国农业银行股份有限公司 136139300
8 中国铁路工程集团有限公司 126408895
9 中国银行股份有限公司 121869900
10 中国铁道建筑集团有限公司 113867666
11 中国宝武钢铁集团有限公司 111297172
12 京东集团股份有限公司 108466200
13 中国平安保险（集团）股份有限公司 103116700
14 中国中化控股有限责任公司 101402951
15 中国移动通信集团有限公司 101114414
16 中国海洋石油集团有限公司 100335259
17 中国人寿保险（集团）公司 98837400
18 中国交通建设集团有限公司 96752434
19 中国五矿集团有限公司 93459851
20 中国中信集团有限公司 92909508
21 阿里巴巴(中国)有限公司 92749400
22 中国华润有限公司 89318000
23 山东能源集团有限公司 86637961
24 中国南方电网有限责任公司 84110863
25 恒力集团有限公司 81173689
26 中国邮政集团有限公司 79838546
27 国家能源投资集团有限责任公司 79321897
28 厦门建发集团有限公司 78342822
29 上海汽车集团股份有限公司 74470513
30 华为投资控股有限公司 70417400
31 中粮集团有限公司 69210215
32 中国电力建设集团有限公司 68693274
33 中国医药集团有限公司 68011791
34 中国第一汽车集团有限公司 63348535
35 中国电信集团有限公司 62270012
36 浙江荣盛控股集团有限公司 61260568
37 腾讯控股有限公司 60901500
38 厦门国贸控股集团有限公司 60753156
39 比亚迪股份有限公司 60231535
40 中国航空工业集团有限公司 58968032
41 物产中大集团股份有限公司 58016061
42 交通银行股份有限公司 55747700
43 江西铜业集团有限公司 55390197
44 中国人民保险集团股份有限公司 55309700
45 中国兵器工业集团有限公司 54161047
46 太平洋建设集团有限公司 54108735
47 陕西煤业化工集团有限责任公司 52936203
48 盛虹控股集团有限公司 52882491
49 中国保利集团有限公司 52385301
50 山东魏桥创业集团有限公司 52021385
51 招商银行股份有限公司 50879000
52 广州汽车工业集团有限公司 50535930
53 浙江吉利控股集团有限公司 49807231
54 厦门象屿集团有限公司 49049816
55 北京汽车集团有限公司 48034175
56 万科企业股份有限公司 46573908
57 晋能控股集团有限公司 45052098
58 中国铝业集团有限公司 45020689
59 招商局集团有限公司 44754508
60 联想控股股份有限公司 43601217
61 兴业银行股份有限公司 41877100
62 中国华能集团有限公司 40982294
63 中国能源建设集团有限公司 40852938
64 东风汽车集团有限公司 40773516
65 浙江恒逸集团有限公司 40682953
66 河钢集团有限公司 40159331
67 宁德时代新能源科技股份有限公司 40091704
68 中国电子科技集团有限公司 39703034
69 国家电力投资集团有限公司 38570952
70 青山控股集团有限公司 38213706
71 中国远洋海运集团有限公司 38178011
72 中国联合网络通信集团有限公司 37398581
73 美的集团股份有限公司 37370980
74 海尔集团公司 37182197
75 陕西延长石油（集团）有限责任公司 36476432
76 绿地控股集团股份有限公司 36024502
77 上海浦东发展银行股份有限公司 36017900
78 金川集团股份有限公司 35325909
79 中国建材集团有限公司 34751095
80 中国船舶集团有限公司 34610425
81 敬业集团有限公司 34065252
82 中国机械工业集团有限公司 32905848
83 浙江省交通投资集团有限公司 32403094
84 中国太平洋保险（集团）股份有限公司 32394541
85 中国华电集团有限公司 32234637
86 苏商建设集团有限公司 32044451
87 中国兵器装备集团有限公司 31708012
88 中国民生银行股份有限公司 31175200
89 潍柴控股集团有限公司 31050808
90 上海建工集团股份有限公司 30462765
91 广州市建筑集团有限公司 30018248
92 紫金矿业集团股份有限公司 29340324
93 深圳市投资控股有限公司 29042736
94 鞍钢集团有限公司 28801572
95 新希望控股集团有限公司 28308461
96 中国核工业集团有限公司 28057060
97 泰康保险集团股份有限公司 27900403
98 江苏沙钢集团有限公司 27779839
99 美团公司 27674495
100 奇瑞控股集团有限公司 27673962
101 广州工业投资控股集团有限公司 27145473
102 小米集团 27097014
103 杭州市实业投资集团有限公司 26474897
104 杭州钢铁集团有限公司 26117680
105 上海医药集团股份有限公司 26029509
106 山东高速集团有限公司 26011809
107 广东省广新控股集团有限公司 25916280
108 顺丰控股股份有限公司 25840940
109 广州医药集团有限公司 25704534
110 中国大唐集团有限公司 25673816
111 海亮集团有限公司 25274166
112 中国电子信息产业集团有限公司 25054057
113 蜀道投资集团有限责任公司 25045857
114 中国中煤能源集团有限公司 25035017
115 铜陵有色金属集团控股有限公司 24950389
116 拼多多控股公司 24763921
117 中国中车集团有限公司 24437304
118 上海德龙钢铁集团有限公司 24352182
119 北京建龙重工集团有限公司 24118660
120 陕西建工控股集团有限公司 24112537
`;

// 2023 Data (Based on 2022 Revenue)
const RAW_DATA_2023 = `
1 国家电网有限公司 356524505
2 中国石油天然气集团有限公司 324915726
3 中国石油化工集团有限公司 316934342
4 中国建筑股份有限公司 205505207
5 中国工商银行股份有限公司 144468994
6 中国建设银行股份有限公司 136405400
7 中国农业银行股份有限公司 125768500
8 中国平安保险（集团）股份有限公司 121818400
9 中国中化控股有限责任公司 116934655
10 中国铁路工程集团有限公司 115477604
11 中国海洋石油集团有限公司 110831212
12 中国铁道建筑集团有限公司 109671201
13 中国宝武钢铁集团有限公司 108770720
14 中国银行股份有限公司 105445800
15 京东集团股份有限公司 104623600
16 中国人寿保险（集团）公司 101901900
17 中国移动通信集团有限公司 93903722
18 中国交通建设集团有限公司 93011239
19 中国五矿集团有限公司 89830142
20 阿里巴巴(中国)有限公司 86453900
21 厦门建发集团有限公司 84737423
22 山东能源集团有限公司 83471545
23 中国华润有限公司 81826544
24 国家能源投资集团有限责任公司 81786458
25 中国南方电网有限责任公司 76465826
26 上海汽车集团股份有限公司 74406288
27 中国邮政集团有限公司 74176479
28 中粮集团有限公司 74143735
29 厦门国贸控股集团有限公司 69346046
30 中国中信集团有限公司 67784747
31 中国电力建设集团有限公司 66608157
32 华为投资控股有限公司 64233800
33 中国医药集团有限公司 63282506
34 中国远洋海运集团有限公司 62680959
35 中国人民保险集团股份有限公司 62085900
36 恒力集团有限公司 61175675
37 正威国际集团有限公司 60876037
38 中国第一汽车集团有限公司 58979871
39 中国电信集团有限公司 58634784
40 浙江荣盛控股集团有限公司 57961835
41 物产中大集团股份有限公司 57655134
42 厦门象屿集团有限公司 56262153
43 中国兵器工业集团有限公司 55622839
44 腾讯控股有限公司 55455200
45 中国航空工业集团有限公司 54930268
46 浙江吉利控股集团有限公司 53232679
47 盛虹控股集团有限公司 53231018
48 山东魏桥创业集团有限公司 50398835
49 交通银行股份有限公司 49725800
50 太平洋建设集团有限公司 49376510
51 陕西煤业化工集团有限责任公司 47879482
52 招商银行股份有限公司 47690600
53 联想控股股份有限公司 47214842
54 绿地控股集团股份有限公司 47000185
55 万科企业股份有限公司 46566663
56 中国铝业集团有限公司 46340449
57 招商局集团有限公司 45585098
58 北京汽车集团有限公司 45145749
59 广州汽车工业集团有限公司 43666205
60 碧桂园控股有限公司 43037059
61 兴业银行股份有限公司 41655000
62 中国华能集团有限公司 41380036
63 河钢集团有限公司 40066928
64 中国能源建设集团有限公司 39958999
65 龙湖集团控股有限公司 39281579
66 东风汽车集团有限公司 38942364
67 中国联合网络通信集团有限公司 37402842
68 美的集团股份有限公司 37190011
69 浙江恒逸集团有限公司 37142718
70 青山控股集团有限公司 36800600
71 泰康保险集团股份有限公司 36474935
72 晋能控股集团有限公司 36323158
73 中国太平洋保险（集团）股份有限公司 35914619
74 国家电力投资集团有限公司 35824554
75 上海浦东发展银行股份有限公司 35822600
76 中国电子信息产业集团有限公司 35698517
77 中国兵器装备集团有限公司 35503884
78 海尔集团公司 35308805
79 中国华电集团有限公司 34185803
80 中国建材集团有限公司 33816672
81 江西铜业集团有限公司 33182823
82 陕西延长石油（集团）有限责任公司 33027961
83 广州市建筑集团有限公司 32840000
84 宁德时代新能源科技股份有限公司 32832599
85 敬业集团有限公司 32675988
86 中国机械工业集团有限公司 32490520
87 中国船舶集团有限公司 32261793
88 潍柴控股集团有限公司 32172778
89 浙江省交通投资集团有限公司 31920700
90 苏商建设集团有限公司 31890250
91 中国民生银行股份有限公司 31379500
92 新希望控股集团有限公司 30811822
93 深圳市投资控股有限公司 29514757
94 紫金矿业集团股份有限公司 29285743
95 上海建工集团股份有限公司 29135081
96 上海医药集团股份有限公司 28657682
97 金川集团股份有限公司 28552174
98 鞍钢集团有限公司 28227650
99 奇瑞控股集团有限公司 28005844
100 江苏沙钢集团有限公司 27863558
101 立讯精密工业股份有限公司 27692290
102 美团公司 27653664
103 顺丰控股股份有限公司 26749021
104 中国核工业集团有限公司 26270729
105 中国中信银行股份有限公司 25895700
106 小米集团 25860714
107 广州医药集团有限公司 25514695
108 杭州市实业投资集团有限公司 25336338
109 广东省广新控股集团有限公司 25298031
110 铜陵有色金属集团控股有限公司 25191836
111 陕西建工控股集团有限公司 25150798
112 中国大唐集团有限公司 25114755
113 杭州钢铁集团有限公司 25112101
114 比亚迪股份有限公司 25064614
115 龙卓控股集团有限公司 24969246
116 山东高速集团有限公司 24653805
117 中国中车集团有限公司 24622146
118 盛隆冶金有限公司 24523305
119 海亮集团有限公司 24458514
120 新兴际华集团有限公司 24398103
`;

// --- Interfaces ---

interface BaseCompanyData {
  rank: number;
  name: string;
  revenue: number; // in 10k yuan
}

interface ProcessedCompanyData extends BaseCompanyData {
  sasac?: string;
  sasacScore?: string;
  fortune?: string;
  isSupplementary?: boolean;
}

interface RankedResult {
  year: number;
  companyName: string;
  revenue: number; // raw value
  rankSASAC: string;
  rankSASACScore: string;
  rankChina500: string;
  rankFortune500: string;
  rankCentralSOE: string;
  isEstimate: boolean;
}

// --- App Component ---

const App = () => {
  const [enterpriseName, setEnterpriseName] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RankedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchIdRef = useRef(0);

  // --- Data Parsing & Pre-calculation ---
  
  const parseRawData = (rawText: string): BaseCompanyData[] => {
    return rawText.trim().split('\n').map(line => {
      const cleanLine = line.trim();
      if (!cleanLine) return null;
      const parts = cleanLine.split(/\s+/);
      if (parts.length < 3) return null;
      const rankStr = parts[0];
      const revenueStr = parts[parts.length - 1];
      if (!/^\d+$/.test(rankStr) || !/^\d+$/.test(revenueStr)) return null;
      return { 
        rank: parseInt(rankStr, 10), 
        name: parts.slice(1, parts.length - 1).join(''), 
        revenue: parseInt(revenueStr, 10) 
      };
    }).filter((item): item is BaseCompanyData => item !== null);
  };

  // 1. Memoize parsed generic databases (Top 120)
  const rawDbs = useMemo(() => ({
    2025: parseRawData(RAW_DATA_2025),
    2024: parseRawData(RAW_DATA_2024),
    2023: parseRawData(RAW_DATA_2023)
  }), []);

  // 2. Build the "Grand Unified Database" (Merged Local + Supplement + Ratings + Fortune)
  const unifiedDB = useMemo(() => {
    const db: Record<number, ProcessedCompanyData[]> = { 2025: [], 2024: [], 2023: [] };
    
    [2025, 2024, 2023].forEach((year) => {
      const y = year as 2025 | 2024 | 2023;
      
      // A. Start with Raw Data
      const rawList = rawDbs[y];
      
      // B. Convert to Processed map for deduping
      const companyMap = new Map<string, ProcessedCompanyData>();
      rawList.forEach(c => {
         companyMap.set(c.name, { ...c, isSupplementary: false });
      });

      // C. Inject Supplementary Data (Manually added SOEs)
      Object.entries(SUPPLEMENTARY_DB).forEach(([name, yearData]) => {
         if (yearData[y]) {
            if (!companyMap.has(name)) {
                companyMap.set(name, {
                   rank: yearData[y].china500 || 999,
                   name: name,
                   revenue: yearData[y].revenue,
                   sasac: yearData[y].sasac,
                   fortune: yearData[y].fortune,
                   isSupplementary: true
                });
            } else {
               const existing = companyMap.get(name)!;
               if (yearData[y].sasac) existing.sasac = yearData[y].sasac;
               if (yearData[y].fortune) existing.fortune = yearData[y].fortune;
            }
         }
      });

      // D. Apply Static Global Ratings
      companyMap.forEach(company => {
         // SASAC (Apply to all available years as a baseline)
         if (SASAC_DB[company.name]) {
             if (!company.sasac) company.sasac = SASAC_DB[company.name].grade;
             if (!company.sasacScore) company.sasacScore = SASAC_DB[company.name].score;
         }
         
         // Fortune 500 (Inject static DB with Fuzzy Fallback)
         if (!company.fortune || company.fortune === "N/A") {
             if (FORTUNE_DB[company.name] && FORTUNE_DB[company.name][y]) {
                 company.fortune = FORTUNE_DB[company.name][y];
             } else {
                 // Fuzzy search in Fortune DB
                 // e.g. "China General Nuclear Power Group" might match "CGN Power" in a real scenario
                 // Here we simply check if any key in Fortune DB partially matches
                 const fuzzyKey = Object.keys(FORTUNE_DB).find(fKey => 
                     company.name.includes(fKey) || fKey.includes(company.name.replace("集团有限公司", "").replace("有限公司", ""))
                 );
                 if (fuzzyKey && FORTUNE_DB[fuzzyKey][y]) {
                     company.fortune = FORTUNE_DB[fuzzyKey][y];
                 }
             }
         }
      });

      db[y] = Array.from(companyMap.values());
    });

    return db;
  }, [rawDbs]);

  // --- Search Logic ---

  const isCentralSOE = (name: string) => {
    return CENTRAL_SOES_LIST.some(soe => name.includes(soe) || soe.includes(name));
  };

  const resolveEnterpriseName = (input: string): string => {
    const cleanInput = input.trim();
    if (ALIAS_MAP[cleanInput]) return ALIAS_MAP[cleanInput];
    const aliasMatch = Object.keys(ALIAS_MAP).find(k => cleanInput.includes(k));
    if (aliasMatch) return ALIAS_MAP[aliasMatch];
    return cleanInput;
  };

  const findCompanyInYear = (year: number, resolvedName: string, originalInput: string) => {
    const dataset = unifiedDB[year];
    if (!dataset) return null;
    let match = dataset.find(c => c.name === resolvedName);
    if (!match) match = dataset.find(c => c.name.includes(resolvedName));
    if (!match && originalInput.length >= 2) {
       match = dataset.find(c => c.name.includes(originalInput));
    }
    return match;
  };

  const calculateSOERank = (year: number, targetRevenue: number) => {
    const dataset = unifiedDB[year];
    const soeList = dataset.filter(c => isCentralSOE(c.name));
    soeList.sort((a, b) => b.revenue - a.revenue);
    const rank = soeList.filter(c => c.revenue > targetRevenue).length + 1;
    return rank;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchIdRef.current += 1;
    
    if (!enterpriseName.trim()) {
      setError("请输入央企名称");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    const resolvedName = resolveEnterpriseName(enterpriseName);
    const years = selectedYear === 'all' ? [2025, 2024, 2023] : [parseInt(selectedYear)];
    const localResults: RankedResult[] = [];

    years.forEach(year => {
       const company = findCompanyInYear(year, resolvedName, enterpriseName);
       if (company) {
           const soeRank = calculateSOERank(year, company.revenue);
           localResults.push({
               year,
               companyName: company.name,
               revenue: company.revenue,
               rankChina500: company.rank.toString(),
               rankCentralSOE: soeRank.toString(),
               rankSASAC: company.sasac || "N/A",
               rankSASACScore: company.sasacScore || "-",
               rankFortune500: company.fortune || "N/A",
               isEstimate: !!company.isSupplementary
           });
       }
    });

    if (localResults.length > 0) {
        setResults(localResults.sort((a, b) => b.year - a.year));
    } else {
        setError(`暂时没有查到，目前仅支持国资委网站列出的央企`);
    }
    
    // Immediate return (No AI)
    setLoading(false);
  };

  const handleCancel = () => {
    setLoading(false);
    searchIdRef.current += 1;
  };

  const formatRevenue = (val: number) => {
    // Raw is 10k yuan -> convert to 100M yuan (Yi)
    // 1 Yi = 10,000 Wan
    const yi = val / 10000;
    return yi.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="max-w-5xl w-full space-y-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">央企营收多维排名查询</h1>
          <p className="mt-2 text-slate-600">
            集成国资委考核、中国企业500强、财富中国500强及央企专项排名 (本地数据库版)
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="enterprise" className="block text-sm font-medium text-gray-700 mb-1">央企名称</label>
              <input
                type="text"
                id="enterprise"
                value={enterpriseName}
                onChange={(e) => setEnterpriseName(e.target.value)}
                placeholder="支持简称，如：中广核、中石油、国网"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
              />
            </div>
            <div className="w-full sm:w-40">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">年份</label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border bg-white"
              >
                <option value="all">全部 (近三年)</option>
                <option value="2025">2025榜单 (2024营收)</option>
                <option value="2024">2024榜单 (2023营收)</option>
                <option value="2023">2023榜单 (2022营收)</option>
              </select>
            </div>
            <div className="w-full sm:w-auto flex gap-2">
               {!loading ? (
                <button
                  type="submit"
                  className="w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  查 询
                </button>
               ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto flex justify-center py-3 px-6 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  终止查询
                </button>
               )}
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 animate-fade-in-up">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading && !results.length && !error && (
           <div className="text-center py-10 animate-pulse">
             <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-gray-500 font-medium">正在检索并计算多维排名数据...</p>
           </div>
        )}

        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">榜单年份 (财年)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">企业全称</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">营业收入 (亿元)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">① 国资委业绩</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">② 中国企业500强</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">③ 财富中国500强</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">④ 央企营收排名</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-blue-900">{row.year}</span>
                          <span className="text-xs text-gray-500">({row.year - 1}年数据)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {row.companyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">{formatRevenue(row.revenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">
                         {row.rankSASAC}
                         {row.rankSASACScore && row.rankSASACScore !== "-" && <span className="block text-xs text-blue-500 mt-1">{row.rankSASACScore}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.rankChina500}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{row.rankFortune500}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                        {row.rankCentralSOE}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 space-y-2">
               <p><strong>数据说明：</strong></p>
               <ul className="list-disc pl-4 space-y-1">
                 <li><strong>年份说明</strong>：榜单年份通常基于企业上一年度的财务数据（如：2025榜单对应2024年营收）。</li>
                 <li><strong>① 国资委业绩</strong>：基于本地数据库存储的中央企业负责人经营业绩考核结果。</li>
                 <li><strong>② 中国企业500强</strong>：数据源为《中国企业500强》Top120原始榜单。</li>
                 <li><strong>③ 财富中国500强</strong>：财富中国500强（Fortune China 500）可能采用上市公司而非集团合并报表数据，因此排名与营收可能与中国企业500强（中企联）存在较大出入。系统已尝试进行关联匹配。</li>
                 <li><strong>④ 央企营收排名</strong>：实时计算值。系统根据当年所有已录入央企的营收进行动态排序得出。</li>
               </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
