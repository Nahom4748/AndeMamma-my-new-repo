import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Container, CircularProgress,
  InputAdornment, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography, IconButton, Tooltip
} from '@mui/material';
import {
  Add, Search, FilterList, Edit, Visibility,
  Delete, Person, Business, LocationOn, Phone
} from '@mui/icons-material';
import axios from 'axios';
import SupplierForm from './SupplierForm';
import SupplierDetail from './SupplierDetail';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
    fetchRegions();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm, selectedRegion]);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get('/api/suppliers/regions/all');
      console.log('Regions API response:', response.data);
      if (Array.isArray(response.data)) {
        setRegions(response.data);
      } else if (Array.isArray(response.data.data)) {
        setRegions(response.data.data);
      } else {
        console.warn('Unexpected regions response format, setting empty array');
        setRegions([]);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setRegions([]);
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(s => s.region_code === selectedRegion);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.company_name.toLowerCase().includes(term) ||
        s.contact_person.toLowerCase().includes(term) ||
        s.phone.includes(term) ||
        s.location.toLowerCase().includes(term)
      );
    }
    setFilteredSuppliers(filtered);
  };

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setOpenDetail(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setOpenForm(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`/api/suppliers/${id}`);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const handleFormClose = (refresh = false) => {
    setOpenForm(false);
    setSelectedSupplier(null);
    if (refresh) fetchSuppliers();
  };

  const handleDetailClose = () => {
    setOpenDetail(false);
    setSelectedSupplier(null);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">Supplier Management</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => setOpenForm(true)}
            >
              Add Supplier
            </Button>
          </Box>

          <Box display="flex" gap={2} mb={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              variant="outlined"
              startAdornment={
                <InputAdornment position="start">
                  <FilterList />
                </InputAdornment>
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All Regions</MenuItem>
              {Array.isArray(regions) && regions.map((region) => (
                <MenuItem key={region.id} value={region.code}>
                  {region.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : filteredSuppliers.length === 0 ? (
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                No suppliers found
              </Typography>
              {(searchTerm || selectedRegion !== 'all') ? (
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRegion('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  onClick={() => setOpenForm(true)}
                >
                  Add your first supplier
                </Button>
              )}
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Company</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contact</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Region</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Janitors</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Business color="primary" />
                          <Typography fontWeight="medium">{supplier.company_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{supplier.contact_person}</TableCell>
                      <TableCell>
                        <Tooltip title={supplier.location}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography noWrap sx={{ maxWidth: 150 }}>
                              {supplier.location}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={supplier.region_name}
                          size="small"
                          sx={{
                            backgroundColor: 'secondary.light',
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {supplier.janitors?.length > 0 ? (
                          <Tooltip
                            title={
                              <Box>
                                {supplier.janitors.map((j, i) => (
                                  <div key={i}>{j.name} ({j.phone})</div>
                                ))}
                              </Box>
                            }
                          >
                            <Chip
                              icon={<Person fontSize="small" />}
                              label={`${supplier.janitors.length} janitor(s)`}
                              size="small"
                            />
                          </Tooltip>
                        ) : (
                          <Typography color="textSecondary">None</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Phone fontSize="small" color="action" />
                          {supplier.phone}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View details">
                            <IconButton color="primary" onClick={() => handleViewDetails(supplier)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton color="secondary" onClick={() => handleEditSupplier(supplier)}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton color="error" onClick={() => handleDeleteSupplier(supplier.id)}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Form and Detail Modals */}
      <SupplierForm
        open={openForm}
        onClose={handleFormClose}
        supplier={selectedSupplier}
        regions={regions}
      />
      <SupplierDetail
        open={openDetail}
        onClose={handleDetailClose}
        supplier={selectedSupplier}
      />
    </Container>
  );
};

export default SupplierList;
