const Products = () => {
  return (
    <div className="px-4 sm:px-0">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <button className="btn btn-primary">Add Product</button>
      </div>

      <div className="card">
        <p className="text-gray-500">No products yet</p>
      </div>
    </div>
  );
};

export default Products;
