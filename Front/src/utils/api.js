import axios from 'axios';

const API_BASE_URL ='http://localhost:5000';

export const fetchSuppliers = async () => {
  const response = await axios.get(`${API_BASE_URL}/suppliers`);
  return response.data;
};

export const fetchRegions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/regions`);
    if (response.data && Array.isArray(response.data.data)) {
      console.log("Fetched regions:", response.data); // For debug
      return response.data.data;
    } else {
      throw new Error("Invalid region data format");
    }
  } catch (error) {
    console.error("Error in fetchRegions:", error);
    return [];
  }
};

export const createSupplier = async (supplierData) => {
  const response = await axios.post(`${API_BASE_URL}/suppliers`, supplierData);
  return response.data;
};

export const updateSupplier = async (id, supplierData) => {
  const response = await axios.put(`${API_BASE_URL}/suppliers/${id}`, supplierData);
  return response.data;
};

export const deleteSupplier = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/suppliers/${id}`);
  return response.data;
}; 