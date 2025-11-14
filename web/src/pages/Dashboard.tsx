import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { name: 'Total Products', value: '0', icon: Package, color: 'bg-blue-500' },
    { name: 'Total Orders', value: '0', icon: ShoppingCart, color: 'bg-green-500' },
    { name: 'Total Customers', value: '0', icon: Users, color: 'bg-purple-500' },
    { name: 'Revenue', value: '$0', icon: TrendingUp, color: 'bg-yellow-500' },
  ];

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          <p className="text-gray-500">No orders yet</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Low Stock Alerts</h2>
          <p className="text-gray-500">No low stock products</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
