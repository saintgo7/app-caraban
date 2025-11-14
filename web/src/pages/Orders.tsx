const Orders = () => {
  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <button className="btn btn-primary">Create Order</button>
      </div>

      <div className="card">
        <p className="text-gray-500">No orders yet</p>
      </div>
    </div>
  );
};

export default Orders;
