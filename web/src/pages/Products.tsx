import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import Badge from '../components/Badge';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

const Products = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // 예시 데이터
  const products: Product[] = [
    { id: '1', sku: 'PROD-001', name: '무선 마우스', category: '전자기기', price: 29000, stock: 45, status: 'active' },
    { id: '2', sku: 'PROD-002', name: '기계식 키보드', category: '전자기기', price: 89000, stock: 23, status: 'active' },
    { id: '3', sku: 'PROD-003', name: 'USB 케이블', category: '액세서리', price: 8000, stock: 120, status: 'active' },
    { id: '4', sku: 'PROD-004', name: '노트북 스탠드', category: '액세서리', price: 35000, stock: 15, status: 'active' },
    { id: '5', sku: 'PROD-005', name: '웹캠 HD', category: '전자기기', price: 65000, stock: 8, status: 'inactive' },
  ];

  const categories = [
    { value: '', label: '전체 카테고리' },
    { value: '전자기기', label: '전자기기' },
    { value: '액세서리', label: '액세서리' },
    { value: '가구', label: '가구' },
  ];

  const columns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (product: Product) => (
        <span className="font-mono text-sm">{product.sku}</span>
      ),
    },
    {
      key: 'name',
      header: '상품명',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            <Package size={16} className="text-gray-500" />
          </div>
          <span className="font-medium">{product.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: '카테고리',
    },
    {
      key: 'price',
      header: '가격',
      render: (product: Product) => `₩${product.price.toLocaleString()}`,
    },
    {
      key: 'stock',
      header: '재고',
      render: (product: Product) => (
        <span className={product.stock < 10 ? 'text-red-600 font-semibold' : ''}>
          {product.stock}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (product: Product) => (
        <Badge variant={product.status === 'active' ? 'success' : 'gray'}>
          {product.status === 'active' ? '활성' : '비활성'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '작업',
      render: (product: Product) => (
        <div className="flex gap-2">
          <button
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="수정"
          >
            <Edit size={16} />
          </button>
          <button
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="삭제"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">상품 관리</h1>
          <p className="text-gray-600 mt-1">전체 {products.length}개 상품</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={() => setIsModalOpen(true)}
        >
          새 상품 추가
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="상품명 또는 SKU로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={categories}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
          </div>
          <Button variant="outline" icon={<Filter size={18} />}>
            필터
          </Button>
        </div>
      </Card>

      {/* Products Table */}
      <Card padding={false}>
        <Table
          data={filteredProducts}
          columns={columns}
          emptyMessage="상품이 없습니다"
        />
      </Card>

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="새 상품 추가"
        size="lg"
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU"
              placeholder="PROD-XXX"
              required
            />
            <Input
              label="상품명"
              placeholder="상품명을 입력하세요"
              required
            />
          </div>

          <Select
            label="카테고리"
            options={categories.slice(1)}
            placeholder="카테고리 선택"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="가격"
              type="number"
              placeholder="0"
              required
            />
            <Input
              label="재고"
              type="number"
              placeholder="0"
              required
            />
          </div>

          <Input
            label="단위"
            placeholder="예: 개, EA, 박스"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="상품 설명을 입력하세요"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              type="button"
            >
              취소
            </Button>
            <Button variant="primary" type="submit">
              추가
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
