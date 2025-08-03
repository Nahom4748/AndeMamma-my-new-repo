import React, { useState, useEffect } from 'react';

// MUI Components
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, IconButton,
  Select, MenuItem, InputLabel, FormControl, Box,
  Divider, InputAdornment, Snackbar, Alert
} from '@mui/material';

// MUI Icons
import {
  Close,
  Add as AddIcon,
  Person,
  Phone,
  AccountBalance
} from '@mui/icons-material';

// Formik & Yup
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Axios
import axios from 'axios';

const SupplierForm = ({ open, onClose, supplier, regions }) => {
  const [janitors, setJanitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, severity: '', message: '' });

  const validationSchema = Yup.object({
    company_name: Yup.string().required('Company name is required'),
    contact_person: Yup.string().required('Contact person is required'),
    phone: Yup.string().required('Phone number is required'),
    location: Yup.string().required('Location is required'),
    region_id: Yup.number().required('Region is required'),
  });

  const formik = useFormik({
    initialValues: {
      company_name: supplier?.company_name || '',
      contact_person: supplier?.contact_person || '',
      phone: supplier?.phone || '',
      location: supplier?.location || '',
      region_id: supplier?.region_id || '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const payload = { ...values, janitors };
        if (supplier) {
          await axios.put(`/api/suppliers/${supplier.id}`, payload);
          setAlert({ open: true, severity: 'success', message: 'Supplier updated successfully!' });
        } else {
          await axios.post('/api/suppliers', payload);
          setAlert({ open: true, severity: 'success', message: 'Supplier added successfully!' });
        }
        onClose(true); // signal to refresh
      } catch (error) {
        setAlert({ open: true, severity: 'error', message: 'Failed to save supplier' });
        console.error('Save error:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (supplier?.janitors) {
      setJanitors(supplier.janitors);
    } else {
      setJanitors([]);
    }
    if (!open) {
      formik.resetForm();
      setJanitors([]);
    }
  }, [open, supplier]);

  const handleAddJanitor = () => {
    setJanitors([...janitors, { name: '', phone: '', account: '' }]);
  };

  const handleJanitorChange = (index, field, value) => {
    const updated = [...janitors];
    updated[index][field] = value;
    setJanitors(updated);
  };

  const handleRemoveJanitor = (index) => {
    setJanitors(janitors.filter((_, i) => i !== index));
  };

  return (
    <>
      <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {supplier ? 'Edit Supplier' : 'Add New Supplier'}
            </Typography>
            <IconButton onClick={() => onClose()}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="company_name"
                  value={formik.values.company_name}
                  onChange={formik.handleChange}
                  error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                  helperText={formik.touched.company_name && formik.errors.company_name}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  name="contact_person"
                  value={formik.values.contact_person}
                  onChange={formik.handleChange}
                  error={formik.touched.contact_person && Boolean(formik.errors.contact_person)}
                  helperText={formik.touched.contact_person && formik.errors.contact_person}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" error={formik.touched.region_id && Boolean(formik.errors.region_id)}>
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="region_id"
                    value={formik.values.region_id}
                    onChange={formik.handleChange}
                    label="Region"
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  error={formik.touched.location && Boolean(formik.errors.location)}
                  helperText={formik.touched.location && formik.errors.location}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Janitors</Typography>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddJanitor}>
                    Add Janitor
                  </Button>
                </Box>

                {janitors.length === 0 ? (
                  <Typography color="textSecondary" sx={{ mt: 2 }}>
                    No janitors added yet.
                  </Typography>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    {janitors.map((janitor, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 2,
                          mb: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          position: 'relative'
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                          onClick={() => handleRemoveJanitor(index)}
                        >
                          <Close fontSize="small" />
                        </IconButton>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Name"
                              value={janitor.name}
                              onChange={(e) => handleJanitorChange(index, 'name', e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Person />
                                  </InputAdornment>
                                )
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Phone"
                              value={janitor.phone}
                              onChange={(e) => handleJanitorChange(index, 'phone', e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Phone />
                                  </InputAdornment>
                                )
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Account"
                              value={janitor.account}
                              onChange={(e) => handleJanitorChange(index, 'account', e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <AccountBalance />
                                  </InputAdornment>
                                )
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => onClose()} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert({ ...alert, open: false })}
      >
        <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
          {alert.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SupplierForm;
