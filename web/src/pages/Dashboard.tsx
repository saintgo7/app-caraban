import { Package, ShoppingCart, Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Badge from '../components/Badge';

const Dashboard = () => {
  // 예시 데이터 (실제로는 API에서 가져와야 합니다)
  const stats = [
    {
      title: '총 상품',
      value: '156',
      icon: <Package size={24} />,
      color: 'blue' as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: '총 주문',
      value: '89',
      icon: <ShoppingCart size={24} />,
      color: 'green' as const,
      trend: { value: 8, isPositive: true },
    },
    {
      title: '고객 수',
      value: '234',
      icon: <Users size={24} />,
      color: 'purple' as const,
      trend: { value: 5, isPositive: false },
    },
    {
      title: '매출',
      value: '₩12.5M',
      icon: <DollarSign size={24} />,
      color: 'yellow' as const,
      trend: { value: 15, isPositive: true },
    },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: '김철수', amount: '₩125,000', status: 'delivered', date: '2024-01-15' },
    { id: 'ORD-002', customer: '이영희', amount: '₩89,000', status: 'processing', date: '2024-01-15' },
    { id: 'ORD-003', customer: '박민수', amount: '₩234,000', status: 'pending', date: '2024-01-14' },
    { id: 'ORD-004', customer: '정수연', amount: '₩156,000', status: 'shipped', date: '2024-01-14' },
    { id: 'ORD-005', customer: '최동욱', amount: '₩78,000', status: 'confirmed', date: '2024-01-13' },
  ];

  const lowStockProducts = [
    { name: '무선 마우스', sku: 'PROD-001', stock: 5, minStock: 10 },
    { name: '기계식 키보드', sku: 'PROD-002', stock: 3, minStock: 10 },
    { name: 'USB 케이블', sku: 'PROD-003', stock: 8, minStock: 15 },
    { name: '노트북 스탠드', sku: 'PROD-004', stock: 2, minStock: 5 },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'primary', label: string }> = {
      delivered: { variant: 'success', label: '배송완료' },
      processing: { variant: 'info', label: '처리중' },
      pending: { variant: 'warning', label: '대기중' },
      shipped: { variant: 'primary', label: '배송중' },
      confirmed: { variant: 'success', label: '확인됨' },
    };

    const config = statusConfig[status] || { variant: 'gray' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-1">Caraban ERP 시스템에 오신 것을 환영합니다</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card
          title="최근 주문"
          subtitle="최근 5개의 주문 내역"
          headerAction={
            <a href="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              전체 보기 →
            </a>
          }
        >
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{order.id}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{order.customer}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{order.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card
          title="재고 부족 알림"
          subtitle="재고가 최소 수량 이하인 상품"
          headerAction={
            <Badge variant="danger">
              <AlertCircle size={14} className="mr-1" />
              {lowStockProducts.length}개
            </Badge>
          }
        >
          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <div
                key={product.sku}
                className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    <span className="font-bold text-red-600">{product.stock}</span>
                    <span className="text-gray-500"> / {product.minStock}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">최소 수량</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="빠른 작업">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <button className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group">
            <Package className="text-primary-600 group-hover:scale-110 transition-transform" size={32} />
            <span className="mt-2 text-sm font-medium text-gray-900">새 상품 추가</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
            <ShoppingCart className="text-green-600 group-hover:scale-110 transition-transform" size={32} />
            <span className="mt-2 text-sm font-medium text-gray-900">주문 생성</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
            <Users className="text-purple-600 group-hover:scale-110 transition-transform" size={32} />
            <span className="mt-2 text-sm font-medium text-gray-900">고객 관리</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors group">
            <TrendingUp className="text-yellow-600 group-hover:scale-110 transition-transform" size={32} />
            <span className="mt-2 text-sm font-medium text-gray-900">리포트 보기</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
