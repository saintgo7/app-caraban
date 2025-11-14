import { useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Select from '../components/Select';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
}

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const orders: Order[] = [
    { id: '1', orderNumber: 'ORD-2024-001', customer: '김철수', date: '2024-01-15', amount: 125000, status: 'delivered', items: 3 },
    { id: '2', orderNumber: 'ORD-2024-002', customer: '이영희', date: '2024-01-15', amount: 89000, status: 'processing', items: 2 },
    { id: '3', orderNumber: 'ORD-2024-003', customer: '박민수', date: '2024-01-14', amount: 234000, status: 'pending', items: 5 },
    { id: '4', orderNumber: 'ORD-2024-004', customer: '정수연', date: '2024-01-14', amount: 156000, status: 'shipped', items: 4 },
    { id: '5', orderNumber: 'ORD-2024-005', customer: '최동욱', date: '2024-01-13', amount: 78000, status: 'confirmed', items: 1 },
    { id: '6', orderNumber: 'ORD-2024-006', customer: '강민지', date: '2024-01-13', amount: 342000, status: 'delivered', items: 6 },
    { id: '7', orderNumber: 'ORD-2024-007', customer: '윤서준', date: '2024-01-12', amount: 95000, status: 'cancelled', items: 2 },
  ];

  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'pending', label: '대기중' },
    { value: 'confirmed', label: '확인됨' },
    { value: 'processing', label: '처리중' },
    { value: 'shipped', label: '배송중' },
    { value: 'delivered', label: '배송완료' },
    { value: 'cancelled', label: '취소됨' },
  ];

  const getStatusBadge = (status: Order['status']) => {
    const config: Record<Order['status'], { variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'gray', label: string }> = {
      pending: { variant: 'warning', label: '대기중' },
      confirmed: { variant: 'info', label: '확인됨' },
      processing: { variant: 'info', label: '처리중' },
      shipped: { variant: 'primary', label: '배송중' },
      delivered: { variant: 'success', label: '배송완료' },
      cancelled: { variant: 'danger', label: '취소됨' },
    };

    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const columns = [
    {
      key: 'orderNumber',
      header: '주문번호',
      render: (order: Order) => (
        <span className="font-mono font-medium text-primary-600">{order.orderNumber}</span>
      ),
    },
    {
      key: 'customer',
      header: '고객명',
      render: (order: Order) => <span className="font-medium">{order.customer}</span>,
    },
    {
      key: 'date',
      header: '주문일',
    },
    {
      key: 'items',
      header: '상품 수',
      render: (order: Order) => <span>{order.items}개</span>,
    },
    {
      key: 'amount',
      header: '금액',
      render: (order: Order) => <span className="font-semibold">₩{order.amount.toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: '상태',
      render: (order: Order) => getStatusBadge(order.status),
    },
    {
      key: 'actions',
      header: '작업',
      render: (order: Order) => (
        <Button variant="outline" size="sm" icon={<Eye size={14} />}>
          상세
        </Button>
      ),
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">주문 관리</h1>
          <p className="text-gray-600 mt-1">
            전체 {filteredOrders.length}개 주문 · 총액 ₩{totalAmount.toLocaleString()}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={18} />}>
          새 주문 생성
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="주문번호 또는 고객명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card padding={false}>
        <Table
          data={filteredOrders}
          columns={columns}
          emptyMessage="주문이 없습니다"
        />
      </Card>
    </div>
  );
};

export default Orders;
