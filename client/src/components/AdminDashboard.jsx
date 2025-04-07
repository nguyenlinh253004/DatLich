import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = ({ token }) => {
  // State management
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [heroImage, setHeroImage] = useState('');
  
  const [newService, setNewService] = useState({ 
    name: '', 
    Description: '', 
    price: '',
    image: null,
    imagePreview: null 
  });
  
  const [newTestimonial, setNewTestimonial] = useState({ 
    quote: '', 
    author: '' 
  });
  
  const [editService, setEditService] = useState(null);
  const [editTestimonial, setEditTestimonial] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState({
    service: '',
    testimonial: ''
  });
  
  const [pagination, setPagination] = useState({
    service: { page: 1, perPage: 5 },
    testimonial: { page: 1, perPage: 5 }
  });
  
  const [sortConfig, setSortConfig] = useState({
    service: { field: 'name', direction: 'asc' },
    testimonial: { field: 'quote', direction: 'asc' }
  });
  
  const [selectedItems, setSelectedItems] = useState({
    services: [],
    testimonials: []
  });
  
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState({
    service: [],
    testimonial: []
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [servicesRes, testimonialsRes, heroRes] = await Promise.all([
          axios.get('http://localhost:5000/api/services', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get('http://localhost:5000/api/testimonials', { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          axios.get('http://localhost:5000/api/hero-image')
        ]);
        
        setServices(servicesRes.data);
        setTestimonials(testimonialsRes.data);
        setHeroImage(heroRes.data.heroImage);
      } catch (err) {
        toast.error(`Error loading data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Validation functions
  const validateService = (data, isEdit = false) => {
    const errors = {};
    if (!data.name.trim()) errors.name = 'Service name is required';
    if (!data.price) errors.price = 'Price is required';
    if (isNaN(data.price)) errors.price = 'Price must be a number';
    
    if (!isEdit && services.some(s => 
      s.name.toLowerCase() === data.name.toLowerCase()
    )) {
      errors.name = 'Service name already exists';
    }
    
    return errors;
  };

  const validateTestimonial = (data, isEdit = false) => {
    const errors = {};
    if (!data.quote.trim()) errors.quote = 'Quote is required';
    if (!data.author.trim()) errors.author = 'Author is required';
    
    if (!isEdit && testimonials.some(t => 
      t.quote.toLowerCase() === data.quote.toLowerCase()
    )) {
      errors.quote = 'Quote already exists';
    }
    
    return errors;
  };

  // Debounced suggestion functions
  const getSuggestions = useCallback(debounce((type, value) => {
    const source = type === 'service' ? services : testimonials;
    const field = type === 'service' ? 'name' : 'quote';
    
    const results = source
      .filter(item => 
        item[field].toLowerCase().includes(value.toLowerCase()) &&
        item[field].toLowerCase() !== value.toLowerCase()
      )
      .map(item => item[field])
      .slice(0, 5);
    
    setSuggestions(prev => ({ ...prev, [type]: results }));
  }, 300), [services, testimonials]);

  // Handlers
  const handleInputChange = (type, field, value) => {
    if (type === 'service') {
      if (editService) {
        setEditService({ ...editService, [field]: value });
      } else {
        setNewService({ ...newService, [field]: value });
      }
      
      if (field === 'name') {
        getSuggestions('service', value);
      }
    } else {
      if (editTestimonial) {
        setEditTestimonial({ ...editTestimonial, [field]: value });
      } else {
        setNewTestimonial({ ...newTestimonial, [field]: value });
      }
      
      if (field === 'quote') {
        getSuggestions('testimonial', value);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (editService) {
        setEditService({ 
          ...editService, 
          image: file,
          imagePreview: previewUrl 
        });
      } else {
        setNewService({ 
          ...newService, 
          image: file,
          imagePreview: previewUrl 
        });
      }
    }
  };

  const handleSubmit = async (type, e) => {
    e.preventDefault();
    
    const isEdit = type === 'service' ? !!editService : !!editTestimonial;
    const data = type === 'service' 
      ? (editService || newService)
      : (editTestimonial || newTestimonial);
    
    const validationErrors = type === 'service'
      ? validateService(data, isEdit)
      : validateTestimonial(data, isEdit);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      if (type === 'service') {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('Description', data.Description);
        formData.append('price', data.price);
        if (data.image) formData.append('image', data.image);

        const res = isEdit
          ? await axios.put(
              `http://localhost:5000/api/services/${editService._id}`,
              formData,
              { headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }}
            )
          : await axios.post(
              'http://localhost:5000/api/services',
              formData,
              { headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }}
            );

        setServices(prev => 
          isEdit
            ? prev.map(s => s._id === editService._id ? res.data.service : s)
            : [...prev, res.data.service]
        );
        
        toast.success(`Service ${isEdit ? 'updated' : 'added'} successfully`);
        setNewService({ name: '', Description: '', price: '', image: null, imagePreview: null });
        setEditService(null);
      } else {
        const res = isEdit
          ? await axios.put(
              `http://localhost:5000/api/testimonials/${editTestimonial._id}`,
              data,
              { headers: { Authorization: `Bearer ${token}` }}
            )
          : await axios.post(
              'http://localhost:5000/api/testimonials',
              data,
              { headers: { Authorization: `Bearer ${token}` }}
            );

        setTestimonials(prev => 
          isEdit
            ? prev.map(t => t._id === editTestimonial._id ? res.data.testimonial : t)
            : [...prev, res.data.testimonial]
        );
        
        toast.success(`Testimonial ${isEdit ? 'updated' : 'added'} successfully`);
        setNewTestimonial({ quote: '', author: '' });
        setEditTestimonial(null);
      }
      
      setErrors({});
      setSuggestions({ service: [], testimonial: [] });
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/${type}s/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (type === 'service') {
        setServices(prev => prev.filter(s => s._id !== id));
        setSelectedItems(prev => ({
          ...prev,
          services: prev.services.filter(itemId => itemId !== id)
        }));
      } else {
        setTestimonials(prev => prev.filter(t => t._id !== id));
        setSelectedItems(prev => ({
          ...prev,
          testimonials: prev.testimonials.filter(itemId => itemId !== id)
        }));
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
    } catch (err) {
      toast.error(`Error deleting ${type}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (type) => {
    const items = type === 'service' ? selectedItems.services : selectedItems.testimonials;
    if (items.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${items.length} ${type}s?`)) return;
    
    setLoading(true);
    try {
      await Promise.all(
        items.map(id => 
          axios.delete(`http://localhost:5000/api/${type}s/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      
      if (type === 'service') {
        setServices(prev => prev.filter(s => !items.includes(s._id)));
      } else {
        setTestimonials(prev => prev.filter(t => !items.includes(t._id)));
      }
      
      setSelectedItems(prev => ({ ...prev, [type + 's']: [] }));
      toast.success(`Deleted ${items.length} ${type}s successfully`);
    } catch (err) {
      toast.error(`Error deleting ${type}s: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('heroImage', e.target.heroImage.files[0]);
    
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/upload-hero',
        formData,
        { headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }}
      );
      
      setHeroImage(res.data.heroImage);
      toast.success('Hero image uploaded successfully');
    } catch (err) {
      toast.error(`Error uploading hero image: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    const data = type === 'service' ? services : testimonials;
    const headers = type === 'service' 
      ? ['Name', 'Description', 'Price'] 
      : ['Quote', 'Author'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => 
        type === 'service'
          ? `"${item.name}","${item.Description}","${item.price}"`
          : `"${item.quote}","${item.author}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}s.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)}s exported successfully`);
  };

  const handleSort = (type, field) => {
    setSortConfig(prev => ({
      ...prev,
      [type]: {
        field,
        direction: 
          prev[type].field === field && prev[type].direction === 'asc'
            ? 'desc'
            : 'asc'
      }
    }));
  };

  const handleSelectItem = (type, id) => {
    setSelectedItems(prev => {
      const items = prev[type + 's'];
      return {
        ...prev,
        [type + 's']: items.includes(id)
          ? items.filter(itemId => itemId !== id)
          : [...items, id]
      };
    });
  };

  const handleSelectAll = (type) => {
    const currentItems = type === 'service' 
      ? filteredServices 
      : filteredTestimonials;
    
    if (selectedItems[type + 's'].length === currentItems.length) {
      setSelectedItems(prev => ({ ...prev, [type + 's']: [] }));
    } else {
      setSelectedItems(prev => ({
        ...prev,
        [type + 's']: currentItems.map(item => item._id)
      }));
    }
  };

  // Filter and sort data
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.service.toLowerCase())
  ).sort((a, b) => {
    const field = sortConfig.service.field;
    const modifier = sortConfig.service.direction === 'asc' ? 1 : -1;
    
    if (field === 'price') {
      return (a.price - b.price) * modifier;
    }
    return a[field].localeCompare(b[field]) * modifier;
  });

  const filteredTestimonials = testimonials.filter(testimonial =>
    testimonial.quote.toLowerCase().includes(searchTerm.testimonial.toLowerCase()) ||
    testimonial.author.toLowerCase().includes(searchTerm.testimonial.toLowerCase())
  ).sort((a, b) => {
    const field = sortConfig.testimonial.field;
    const modifier = sortConfig.testimonial.direction === 'asc' ? 1 : -1;
    return a[field].localeCompare(b[field]) * modifier;
  });

  // Pagination
  const paginatedServices = filteredServices.slice(
    (pagination.service.page - 1) * pagination.service.perPage,
    pagination.service.page * pagination.service.perPage
  );

  const paginatedTestimonials = filteredTestimonials.slice(
    (pagination.testimonial.page - 1) * pagination.testimonial.perPage,
    pagination.testimonial.page * pagination.testimonial.perPage
  );

  const serviceTotalPages = Math.ceil(filteredServices.length / pagination.service.perPage);
  const testimonialTotalPages = Math.ceil(filteredTestimonials.length / pagination.testimonial.perPage);

  // Cleanup
  useEffect(() => {
    return () => {
      if (newService.imagePreview) URL.revokeObjectURL(newService.imagePreview);
      if (editService?.imagePreview) URL.revokeObjectURL(editService.imagePreview);
    };
  }, [newService.imagePreview, editService?.imagePreview]);

  return (
    <div className="container mx-auto p-4 mt-10">
     

      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8 text-center">Quản lý danh sách dịch vụ</h1>
      
      {/* Hero Image Upload */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Hero Image</h2>
        <form onSubmit={handleHeroUpload} className="space-y-4">
          {heroImage && (
            <img 
              src={heroImage} 
              alt="Current Hero" 
              className="max-w-full h-64 object-cover rounded"
            />
          )}
          <input 
            type="file" 
            name="heroImage"
            className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Upload Hero Image
          </button>
        </form>
      </section>

      {/* Services Management */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Services Management</h2>
          <button 
            onClick={() => handleExport('service')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Export to CSV
          </button>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm.service}
            onChange={(e) => setSearchTerm(prev => ({ ...prev, service: e.target.value }))}
            className="flex-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={`${sortConfig.service.field}-${sortConfig.service.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortConfig(prev => ({
                  ...prev,
                  service: { field, direction }
                }));
              }}
              className="p-2 border rounded"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
            </select>
          </div>
        </div>

        {/* Service Form */}
        <form 
          onSubmit={(e) => handleSubmit('service', e)}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <h3 className="text-xl font-medium mb-4">
            {editService ? 'Edit Service' : 'Add New Service'}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={editService ? editService.name : newService.name}
                  onChange={(e) => handleInputChange('service', 'name', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter service name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                {suggestions.service.length > 0 && (
                  <div className="mt-1 border rounded bg-white shadow-lg">
                    {suggestions.service.map((suggestion, i) => (
                      <div
                        key={i}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          handleInputChange('service', 'name', suggestion);
                          setSuggestions(prev => ({ ...prev, service: [] }));
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editService ? editService.Description : newService.Description}
                  onChange={(e) => handleInputChange('service', 'Description', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Service Description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="text"
                  value={editService ? editService.price : newService.price}
                  onChange={(e) => handleInputChange('service', 'price', e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Service price"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Image
                </label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {(editService?.imagePreview || editService?.image || newService.imagePreview) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Preview
                  </label>
                  <img
                    src={editService?.imagePreview || editService?.image || newService.imagePreview}
                    alt="Service preview"
                    className="max-w-full h-48 object-contain rounded border"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {editService ? 'Update Service' : 'Add Service'}
            </button>
            
            {editService && (
              <button
                type="button"
                onClick={() => {
                  setEditService(null);
                  setNewService({ name: '', Description: '', price: '', image: null, imagePreview: null });
                  setErrors({});
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Services List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {selectedItems.services.length > 0 && (
            <div className="p-4 bg-gray-50 border-b">
              <button
                onClick={() => handleBulkDelete('service')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete Selected ({selectedItems.services.length})
              </button>
            </div>
          )}

          {filteredServices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No services found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedItems.services.length === filteredServices.length && filteredServices.length > 0}
                      onChange={() => handleSelectAll('service')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedServices.map((service) => (
                  <tr key={service._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.services.includes(service._id)}
                        onChange={() => handleSelectItem('service', service._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">{service.Description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${service.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {service.image && (
                        <img 
                          src={service.image } 
                          alt={service.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditService({
                            ...service,
                            imagePreview: service.image
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('service', service._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {filteredServices.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.service.page - 1) * pagination.service.perPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.service.page * pagination.service.perPage, filteredServices.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredServices.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination(prev => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          page: Math.max(prev.service.page - 1, 1)
                        }
                      }))}
                      disabled={pagination.service.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;\\\\\\\\\\
                    </button>
                    {Array.from({ length: serviceTotalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({
                          ...prev,
                          service: {
                            ...prev.service,
                            page
                          }
                        }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.service.page === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setPagination(prev => ({
                        ...prev,
                        service: {
                          ...prev.service,
                          page: Math.min(prev.service.page + 1, serviceTotalPages)
                        }
                      }))}
                      disabled={pagination.service.page === serviceTotalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Management */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Testimonials Management</h2>
          <button 
            onClick={() => handleExport('testimonial')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Export to CSV
          </button>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search testimonials..."
            value={searchTerm.testimonial}
            onChange={(e) => setSearchTerm(prev => ({ ...prev, testimonial: e.target.value }))}
            className="flex-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={`${sortConfig.testimonial.field}-${sortConfig.testimonial.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortConfig(prev => ({
                  ...prev,
                  testimonial: { field, direction }
                }));
              }}
              className="p-2 border rounded"
            >
              <option value="quote-asc">Quote (A-Z)</option>
              <option value="quote-desc">Quote (Z-A)</option>
              <option value="author-asc">Author (A-Z)</option>
              <option value="author-desc">Author (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Testimonial Form */}
        <form 
          onSubmit={(e) => handleSubmit('testimonial', e)}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <h3 className="text-xl font-medium mb-4">
            {editTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote *
              </label>
              <input
                type="text"
                value={editTestimonial ? editTestimonial.quote : newTestimonial.quote}
                onChange={(e) => handleInputChange('testimonial', 'quote', e.target.value)}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter testimonial quote"
              />
              {errors.quote && <p className="text-red-500 text-sm mt-1">{errors.quote}</p>}
              {suggestions.testimonial.length > 0 && (
                <div className="mt-1 border rounded bg-white shadow-lg">
                  {suggestions.testimonial.map((suggestion, i) => (
                    <div
                      key={i}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        handleInputChange('testimonial', 'quote', suggestion);
                        setSuggestions(prev => ({ ...prev, testimonial: [] }));
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author *
              </label>
              <input
                type="text"
                value={editTestimonial ? editTestimonial.author : newTestimonial.author}
                onChange={(e) => handleInputChange('testimonial', 'author', e.target.value)}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter author name"
              />
              {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author}</p>}
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {editTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
            </button>
            
            {editTestimonial && (
              <button
                type="button"
                onClick={() => {
                  setEditTestimonial(null);
                  setNewTestimonial({ quote: '', author: '' });
                  setErrors({});
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Testimonials List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {selectedItems.testimonials.length > 0 && (
            <div className="p-4 bg-gray-50 border-b">
              <button
                onClick={() => handleBulkDelete('testimonial')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete Selected ({selectedItems.testimonials.length})
              </button>
            </div>
          )}

          {filteredTestimonials.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No testimonials found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedItems.testimonials.length === filteredTestimonials.length && filteredTestimonials.length > 0}
                      onChange={() => handleSelectAll('testimonial')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTestimonials.map((testimonial) => (
                  <tr key={testimonial._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.testimonials.includes(testimonial._id)}
                        onChange={() => handleSelectItem('testimonial', testimonial._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 italic">"{testimonial.quote}"</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">- {testimonial.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditTestimonial(testimonial);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete('testimonial', testimonial._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {filteredTestimonials.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.testimonial.page - 1) * pagination.testimonial.perPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.testimonial.page * pagination.testimonial.perPage, filteredTestimonials.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredTestimonials.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination(prev => ({
                        ...prev,
                        testimonial: {
                          ...prev.testimonial,
                          page: Math.max(prev.testimonial.page - 1, 1)
                        }
                      }))}
                      disabled={pagination.testimonial.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {Array.from({ length: testimonialTotalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({
                          ...prev,
                          testimonial: {
                            ...prev.testimonial,
                            page
                          }
                        }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.testimonial.page === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setPagination(prev => ({
                        ...prev,
                        testimonial: {
                          ...prev.testimonial,
                          page: Math.min(prev.testimonial.page + 1, testimonialTotalPages)
                        }
                      }))}
                      disabled={pagination.testimonial.page === testimonialTotalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Link to="/" className="text-blue-600 hover:underline">
        ← Back to Home
      </Link>
    </div>
  );
};

export default AdminDashboard;