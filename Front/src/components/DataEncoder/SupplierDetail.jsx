import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Grid, Avatar, Divider,
  Chip, List, ListItem, ListItemIcon, ListItemText,
  Paper, IconButton
} from '@mui/material';
import {
  Close, Business, Person, Phone, LocationOn,
  AccountBalance, Edit
} from '@mui/icons-material';

const SupplierDetail = ({ open, onClose, supplier }) => {
  if (!supplier) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Business />
            </Avatar>
            <Typography variant="h6">{supplier.company_name}</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Basic Information
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Person color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Contact Person"
                    secondary={supplier.contact_person}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Phone color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Phone Number"
                    secondary={supplier.phone}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={supplier.location}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Business color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Region"
                    secondary={
                      <Chip
                        label={supplier.region_name}
                        size="small"
                        sx={{
                          backgroundColor: 'secondary.light',
                          color: 'common.white'
                        }}
                      />
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Janitors ({supplier.janitors.length})
              </Typography>
              
              {supplier.janitors.length === 0 ? (
                <Typography color="textSecondary">No janitors assigned</Typography>
              ) : (
                <List dense>
                  {supplier.janitors.map((janitor, index) => (
                    <ListItem key={index} sx={{ py: 1 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                          <Person fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={janitor.name}
                        secondary={
                          <Box component="span" sx={{ display: 'block' }}>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone fontSize="small" color="action" />
                              {janitor.phone}
                            </Box>
                            {janitor.account && (
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalance fontSize="small" color="action" />
                                {janitor.account}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Additional Information
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Created: {new Date(supplier.created_at).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Last Updated: {new Date(supplier.updated_at).toLocaleString()}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierDetail;