import type { AMCProject, KnowledgeItem, MarketObject } from '../src/types';

export const seedProjects: AMCProject[] = [
  {
    id: 'proj-1',
    name: '上海闵行商业广场不良贷款包收购评估项目',
    customerName: '上海申华资产经营管理有限公司',
    projectType: 'NPA_ACQUISITION',
    debtorName: '上海中合实业有限公司',
    totalDebt: 12500,
    collateralType: '商业地下建筑及写字楼底商（5500㎡）',
    collateralEstValue: 9800,
    status: 'Active',
    description: '受让行于2022年放贷的抵押经营性物业不良资产组合，因借款人中合实业涉及关联交易抽逃，商铺大部分空置。本次对资产池债权与抵质押物追偿可能性作全面法律、价值与风险重估。',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    files: [
      {
        id: 'file-1',
        name: '尽调大纲与抵押明细.txt',
        size: 15420,
        type: 'DD_Report',
        uploadedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        contentSnippet: '该不良债权对应的抵押房地产位于上海市闵行区。抵押物包括地上1-3层底商商铺、地下停车场，共计5536.4平方米。目前租户5家，空置率接近72%。租金流水断缴4个月，属于失联运营状态。',
      },
      {
        id: 'file-2',
        name: '借款主体财务报表及负债穿透.txt',
        size: 32400,
        type: 'Financial',
        uploadedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        contentSnippet: '中合实业合并报表显示资产负债率达112%，严重资不抵债。控股股东涉嫌诉讼纠纷12起，股权已被多家地方法院司法限高、轮候冻结。经营性现金流为负数。',
      },
    ],
    evaluations: {},
    businessFields: {
      debtorName: '上海中合实业有限公司',
      totalDebt: 12500,
      interestAndPenalty: 1250,
      collateralType: '商业地下建筑及写字楼底商（5500㎡）',
      collateralEstValue: 9800,
      guarantorDetails: '上海中合实业控股股东赵中合及申弘置业提供个人或关联方连带保证担保以提供反担保增信',
    },
  },
  {
    id: 'proj-2',
    name: '常州荣盛重工债权性重组及资产核估项目',
    customerName: '江苏致远工业设备投资行',
    projectType: 'DEBT_RESTRUCTURE',
    debtorName: '荣盛重工机电设备工程（常州）有限公司',
    totalDebt: 8900,
    collateralType: '核心制造车间土地使用权与重置行吊设备',
    collateralEstValue: 7100,
    status: 'Draft',
    description: '债务人因现金流断裂导致的重型行吊及特种机电设备抵押贷款实质违约。拟引入外部工业转型基金共同承接不良，在原址升级。',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    files: [],
    evaluations: {},
    businessFields: {
      debtorName: '荣盛重工机电设备工程（常州）有限公司',
      originalDebt: 8900,
      exemptAmount: 800,
      newInterestRate: 4.25,
      repaymentInstalments: '分3期，自重组基准日起第6、12、18个月等额偿还',
      newGuarantees: '常州工业发展投资补强担保并对在建车间进行工程确权审核',
    },
  },
];

export const seedKnowledgeBase: KnowledgeItem[] = [
  {
    id: 'kn-1',
    category: 'policies',
    title: '金融不良债权转让司法解释汇编',
    content: '不良资产打包转让需确保公开竞价流程合法，防止国有资产流失，并核验地方融资平台等主体限制。',
    tags: ['司法解释', '不良转让', '国资管理'],
    source: '最高人民法院 / 银保监会',
  },
  {
    id: 'kn-2',
    category: 'legal',
    title: '工业出让土地与地上在建工程抵押优先权顺位',
    content: '在建工程承建商享有建设工程价款优先受偿权时，该顺位可能强于一般金融抵押债权。',
    tags: ['物权登记', '在建工程', '优先顺位'],
    source: '民法典适用指南',
  },
  {
    id: 'kn-3',
    category: 'market',
    title: '三四线城市及远郊写字楼重置折扣水平监测',
    content: '司法拍卖一级折扣率区间常见于45%-60%，空置商办资产需额外考虑周转损耗。',
    tags: ['折扣系数', '评估变现率', '商办行情'],
    source: '不动产登记研究学会',
  },
  {
    id: 'kn-4',
    category: 'cases',
    title: '太仓某制造厂划拨土地盘活暨债务平移整合重组案',
    content: '通过工业平台代建、股权置换和平移出让完成划拨工业用地重组盘活。',
    tags: ['重组案例', '出让平移', '债务平移'],
    source: '东海资产典型案例库',
  },
  {
    id: 'kn-5',
    category: 'methodology',
    title: '不动产收益法与租金覆盖比测算导则',
    content: '空置期测算应不少于18个月，未交付期房和在建工程应结合重置成本法与现金折扣评估。',
    tags: ['收益还原', '折现率测算', '现金流折现'],
    source: 'AMC资产估值准则',
  },
  {
    id: 'kn-6',
    category: 'internal_policies',
    title: 'AMCAgents 风险敞口极值与准入门槛制度',
    content: 'LTV未达内部准入标准且无强保增信的项目，原则上不予单独承接收购重组。',
    tags: ['极值审批', '风控极值', '准入限制'],
    source: 'AMCAgents 风险合规部',
  },
  {
    id: 'kn-7',
    category: 'industry',
    title: '先进机械制造与特种机电产业周期研究',
    content: '专用设备折旧和环保排放标准会影响工业资产清算流动性。',
    tags: ['核心机电', '装备制造', '流动性变化'],
    source: '长江机械精工研究院',
  },
];

export const seedMarketObjects: MarketObject[] = [
  {
    id: 'prop_depreciation_index',
    name: '大宗工业不动产析权与折旧指标表',
    description: '长三角及大湾区典型大宗工业物理资产司法扣减率、折余残值及成交均价走势系数',
    fields: [
      { key: 'city', label: '城市地区', type: 'string' },
      { key: 'district', label: '核心片区', type: 'string' },
      { key: 'assetType', label: '厂房类别', type: 'string' },
      { key: 'dealPrice', label: '司法评估均价 (元/㎡)', type: 'number' },
      { key: 'depreciationRate', label: '年均折旧扣除率 (%)', type: 'number' },
      { key: 'lastChecked', label: '最新精算复核日', type: 'date' },
    ],
    rows: [
      { id: 'row_1', city: '上海', district: '闵行莘庄装备园', assetType: '特大型机械装配气垫车间', dealPrice: 13500, depreciationRate: 4.2, lastChecked: '2026-05-10' },
      { id: 'row_2', city: '苏州', district: '昆山极速先进工业区', assetType: '十万级精密半导体高洁无尘车间', dealPrice: 18900, depreciationRate: 6.5, lastChecked: '2026-05-18' },
      { id: 'row_3', city: '深圳', district: '宝安空港智能拼装港', assetType: '钢混重承载高层工业冷链供应链仓', dealPrice: 15200, depreciationRate: 3.8, lastChecked: '2026-05-24' },
      { id: 'row_4', city: '东莞', district: '松山湖前沿科技孵化带', assetType: '防静电锂电隔断特殊防爆生产线房', dealPrice: 11200, depreciationRate: 5.1, lastChecked: '2026-05-26' },
    ],
  },
  {
    id: 'amc_ltv_lines',
    name: '金融资产重组 LTV 风险准入红线库',
    description: '持牌 AMC 涉案重组非标抵质押资产的最高准入额度、强审配额及首封司法扣减限额表',
    fields: [
      { key: 'assetCategory', label: '抵质押押品细分类别', type: 'string' },
      { key: 'maxLtv', label: '准入折价 LTV 上限 (%)', type: 'number' },
      { key: 'riskBuffer', label: '强制性追索与缓释措施', type: 'string' },
      { key: 'approvalAuthority', label: '最高审批审议决策会级别', type: 'string' },
      { key: 'effectiveDate', label: '政策文号规范生效日期', type: 'date' },
    ],
    rows: [
      { id: 'row_2_1', assetCategory: '特种出让工业土地（含附着建筑物）', maxLtv: 65, riskBuffer: '大债权人首封保护 + 土地剩余寿命检测 > 20年', approvalAuthority: '总部非标风控审议委员会', effectiveDate: '2025-10-12' },
      { id: 'row_2_2', assetCategory: '地方在营及带核心租约高档写字楼', maxLtv: 55, riskBuffer: '流水分共管共处专户（AMC特权共管公章）', approvalAuthority: '各省级分公司决策常委会', effectiveDate: '2026-01-08' },
      { id: 'row_2_3', assetCategory: '限制性涉诉在建普通住宅工程', maxLtv: 35, riskBuffer: '需地方党委防烂尾协调函 + AMC派驻共管监督章', approvalAuthority: '总部董事会特别质询委员会', effectiveDate: '2026-03-20' },
    ],
  },
];

export const qccDatabase: Record<string, unknown> = {
  上海中合实业有限公司: {
    companyName: '上海中合实业有限公司',
    legalPerson: '赵中合',
    regStatus: '在营（开业）',
    regCapital: '5000.00 万元人民币',
    establishDate: '2013年09月11日',
    address: '上海市闵行区莘松路1088号5楼',
    shareholders: [{ name: '赵中合', ratio: '65.0%' }, { name: '上海申弘置业有限公司', ratio: '35.0%' }],
    risks: [{ id: 'risk-q-1', title: '限制消费令 (2025)', type: 'HIGH', date: '2025-11-12', desc: '闵行区人民法院对该主体和法人下达限制消费令。' }],
  },
};

export const stockDatabase: Record<string, unknown> = {
  上海中合: {
    code: '600XXX.SH',
    name: '中合实业 (模拟退市风险股)',
    price: 1.42,
    change: -4.8,
    volume: '1,245,600 手',
    marketCap: '7.1 亿元人民币',
    peRatio: -12.4,
  },
};
